"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicResults,
  academicTimetables,
  academicYears,
  cadets,
  intakes,
  sessions,
  studyPrograms,
} from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, saveDocument, signedStorageUrl } from "@/lib/supabase/storage";
import { takeFile, takeNumber } from "@/lib/admin/form-helpers";
import { ActionResult, ok, err } from "@/lib/actions/result";

async function loadAuthorizedResult(
  intakeScope: number | null,
  resultId: number,
): Promise<
  | {
      ok: true;
      row: {
        id: number;
        cadetId: number;
        sessionId: number;
        resultSlipPath: string | null;
        cadetIntakeId: number;
      };
    }
  | { ok: false; error: string }
> {
  if (!Number.isInteger(resultId) || resultId <= 0) {
    return { ok: false, error: "Invalid result." };
  }

  const [row] = await db
    .select({
      id: academicResults.id,
      cadetId: academicResults.cadetId,
      sessionId: academicResults.sessionId,
      resultSlipPath: academicResults.resultSlipPath,
      cadetIntakeId: cadets.intakeId,
    })
    .from(academicResults)
    .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
    .where(eq(academicResults.id, resultId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Result record not found." };
  }

  if (intakeScope !== null && row.cadetIntakeId !== intakeScope) {
    return { ok: false, error: "Access denied to other intake." };
  }

  return { ok: true, row };
}

export async function updateResultScoresAction(input: {
  resultId: number;
  gpa: number | null;
  cgpa: number | null;
}): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return err("Access denied.");
    }

    if (input.gpa !== null && (!Number.isFinite(input.gpa) || input.gpa < 0 || input.gpa > 4.0)) {
      return err("GPA must be between 0.00 and 4.00.");
    }
    if (input.cgpa !== null && (!Number.isFinite(input.cgpa) || input.cgpa < 0 || input.cgpa > 4.0)) {
      return err("CGPA must be between 0.00 and 4.00.");
    }

    const [row] = await db
      .select({
        id: academicResults.id,
        cadetId: academicResults.cadetId,
        sessionId: academicResults.sessionId,
        cadetIntakeId: cadets.intakeId,
      })
      .from(academicResults)
      .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
      .where(eq(academicResults.id, input.resultId))
      .limit(1);

    if (!row) {
      return err("Result record not found.");
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && row.cadetIntakeId !== intakeScope) {
      return err("Access denied to other intake.");
    }

    const gpaStr = input.gpa !== null ? input.gpa.toFixed(2) : null;
    const cgpaStr = input.cgpa !== null ? input.cgpa.toFixed(2) : null;

    await db
      .update(academicResults)
      .set({
        gpa: gpaStr,
        cgpa: cgpaStr,
        updatedAt: new Date(),
      })
      .where(eq(academicResults.id, row.id));

    // Only update cadets.cgpa if this is the latest session for this cadet
    if (cgpaStr !== null) {
      const [latestResult] = await db
        .select({ sessionId: academicResults.sessionId })
        .from(academicResults)
        .where(eq(academicResults.cadetId, row.cadetId))
        .orderBy(desc(academicResults.sessionId))
        .limit(1);

      if (latestResult && latestResult.sessionId === row.sessionId) {
        await db
          .update(cadets)
          .set({
            cgpa: cgpaStr,
            updatedAt: new Date(),
          })
          .where(eq(cadets.id, row.cadetId));
      }
    }

    revalidatePath("/admin/academic/results");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update scores.");
  }
}

export async function uploadResultSlipAction(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  let uploadedPath: string | null = null;

  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return err("Access denied.");
    }

    const resultId = takeNumber(formData.get("resultId"));
    const file = takeFile(formData.get("file"));

    if (resultId === null || !file) {
      return err("Missing required upload parameters.");
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return err("Only PDF files are accepted.");
    }

      if (file.size > 5 * 1024 * 1024) {
        return err("PDF must be under 5 MB.");
      }

      const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
      if (!loaded.ok) {
        return err(loaded.error);
      }

    const saveResult = await saveDocument({
      supabase: createSupabaseAdminClient(),
      file,
      prefix: `academic/results/${loaded.row.cadetIntakeId}/${loaded.row.sessionId}`,
      stem: `result-slip-${loaded.row.id}`,
    });

    if (!saveResult.ok) {
      return err(saveResult.error);
    }
    uploadedPath = saveResult.path;

    const oldPath = loaded.row.resultSlipPath;

    await db
      .update(academicResults)
      .set({
        resultSlipPath: saveResult.path,
        updatedAt: new Date(),
      })
      .where(eq(academicResults.id, loaded.row.id));

    if (oldPath) {
      await deleteFromStorage(createSupabaseAdminClient(), oldPath);
    }

    revalidatePath("/admin/academic/results");
    return ok({ path: saveResult.path });
  } catch (e) {
    if (uploadedPath) {
      await deleteFromStorage(createSupabaseAdminClient(), uploadedPath);
    }
    return err(e instanceof Error ? e.message : "Failed to upload result slip.");
  }
}

export async function deleteResultSlipAction(resultId: number): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return err("Access denied.");
    }

    const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    if (!loaded.row.resultSlipPath) {
      return err("No result slip uploaded.");
    }

    const oldPath = loaded.row.resultSlipPath;

    await db
      .update(academicResults)
      .set({
        resultSlipPath: null,
        updatedAt: new Date(),
      })
      .where(eq(academicResults.id, loaded.row.id));

    await deleteFromStorage(createSupabaseAdminClient(), oldPath);

    revalidatePath("/admin/academic/results");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete result slip.");
  }
}

export async function getResultSlipSignedUrlAction(
  resultId: number
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return err("Access denied.");
    }

    const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    if (!loaded.row.resultSlipPath) {
      return err("No result slip uploaded.");
    }

    const supabase = createSupabaseAdminClient();
        const signedUrl = await signedStorageUrl(supabase, loaded.row.resultSlipPath, undefined, "document");
    if (!signedUrl) {
      return err("Could not generate download URL.");
    }
    return ok({ signedUrl });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to generate URL.");
  }
}

export async function ensureCadetSessionRecordsAction(sessionId: number): Promise<ActionResult<{ created: number }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results") && !canAccessAdminModule(admin.role, "timetables")) {
      return err("Access denied.");
    }

    const [sessionRow] = await db
      .select({
        sessionId: sessions.id,
        calendarYear: academicYears.calendarYear,
        intakeId: academicYears.intakeId,
        startYear: intakes.startYear,
      })
      .from(sessions)
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .innerJoin(intakes, eq(intakes.id, academicYears.intakeId))
      .where(eq(sessions.id, sessionId));

    if (!sessionRow) {
      return ok();
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && intakeScope !== sessionRow.intakeId) {
      return err("Access denied to other intake.");
    }

    const elapsedYears = sessionRow.calendarYear - sessionRow.startYear + 1;

    const eligibleCadets = await db
      .select({
        id: cadets.id,
        completionYear: sql<number>`coalesce(${studyPrograms.completionYear}, 3)`,
      })
      .from(cadets)
      .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
      .where(
        and(
          eq(cadets.intakeId, sessionRow.intakeId),
          eq(cadets.isActive, true)
        )
      );

    const activeUncompletedCadets = eligibleCadets.filter(
      (c) => elapsedYears <= Number(c.completionYear)
    );

    if (activeUncompletedCadets.length === 0) {
      return ok({ created: 0 });
    }

    await db
      .insert(academicResults)
      .values(
        activeUncompletedCadets.map((c) => ({
          sessionId,
          cadetId: c.id,
        }))
      )
      .onConflictDoNothing({
        target: [academicResults.sessionId, academicResults.cadetId],
      });

    await db
      .insert(academicTimetables)
      .values(
        activeUncompletedCadets.map((c) => ({
          sessionId,
          cadetId: c.id,
          occupiedSlots: [],
        }))
      )
      .onConflictDoNothing({
        target: [academicTimetables.sessionId, academicTimetables.cadetId],
      });

    revalidatePath("/admin/academic/results");
    revalidatePath("/admin/academic/timetables");
    return ok({ created: activeUncompletedCadets.length });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to ensure session records.");
  }
}

/**
 * Reconcile academic records for an intake to fix drift.
 * Removes records for inactive cadets or cadets who completed their program.
 * Ensures all active uncompleted cadets have records for all sessions.
 */
export async function reconcileIntakeAcademicRecordsAction(intakeId: number): Promise<ActionResult<{ removed: number; added: number }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results") && !canAccessAdminModule(admin.role, "timetables")) {
      return err("Access denied.");
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && intakeScope !== intakeId) {
      return err("Access denied to other intake.");
    }

    // Get all sessions for this intake
    const intakeSessions = await db
      .select({ sessionId: sessions.id, calendarYear: academicYears.calendarYear })
      .from(sessions)
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .innerJoin(intakes, eq(intakes.id, academicYears.intakeId))
      .where(eq(intakes.id, intakeId));

    if (intakeSessions.length === 0) {
      return ok({ removed: 0, added: 0 });
    }

    const [intake] = await db.select({ startYear: intakes.startYear }).from(intakes).where(eq(intakes.id, intakeId));
    if (!intake) {
      return err("Intake not found.");
    }

    let removed = 0;
    let added = 0;

    for (const session of intakeSessions) {
      const elapsedYears = session.calendarYear - intake.startYear + 1;

      // Get currently eligible cadets for this session
      const eligibleCadets = await db
        .select({
          id: cadets.id,
          isActive: cadets.isActive,
          completionYear: sql<number>`coalesce(${studyPrograms.completionYear}, 3)`,
        })
        .from(cadets)
        .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
        .where(eq(cadets.intakeId, intakeId));

      const shouldHaveRecords = eligibleCadets.filter(
        (c) => c.isActive && elapsedYears <= Number(c.completionYear)
      );

      const shouldHaveIds = new Set(shouldHaveRecords.map(c => c.id));

      // Remove results for cadets who shouldn't have them
      const existingResults = await db
        .select({ cadetId: academicResults.cadetId })
        .from(academicResults)
        .where(eq(academicResults.sessionId, session.sessionId));

      const toRemove = existingResults.filter(r => !shouldHaveIds.has(r.cadetId));
      if (toRemove.length > 0) {
        await db
          .delete(academicResults)
          .where(
            and(
              eq(academicResults.sessionId, session.sessionId),
              inArray(academicResults.cadetId, toRemove.map(r => r.cadetId))
            )
          );
        removed += toRemove.length;
      }

      // Remove timetables for cadets who shouldn't have them
      const existingTimetables = await db
        .select({ cadetId: academicTimetables.cadetId })
        .from(academicTimetables)
        .where(eq(academicTimetables.sessionId, session.sessionId));

      const toRemoveTt = existingTimetables.filter(r => !shouldHaveIds.has(r.cadetId));
      if (toRemoveTt.length > 0) {
        await db
          .delete(academicTimetables)
          .where(
            and(
              eq(academicTimetables.sessionId, session.sessionId),
              inArray(academicTimetables.cadetId, toRemoveTt.map(r => r.cadetId))
            )
          );
        removed += toRemoveTt.length;
      }

      // Add missing records for cadets who should have them
      const existingResultIds = new Set(existingResults.map(r => r.cadetId));
      const existingTimetableIds = new Set(existingTimetables.map(r => r.cadetId));

      const missingResults = shouldHaveRecords.filter(c => !existingResultIds.has(c.id));
      if (missingResults.length > 0) {
        await db
          .insert(academicResults)
          .values(missingResults.map(c => ({ sessionId: session.sessionId, cadetId: c.id })))
          .onConflictDoNothing({ target: [academicResults.sessionId, academicResults.cadetId] });
        added += missingResults.length;
      }

      const missingTimetables = shouldHaveRecords.filter(c => !existingTimetableIds.has(c.id));
      if (missingTimetables.length > 0) {
        await db
          .insert(academicTimetables)
          .values(missingTimetables.map(c => ({ sessionId: session.sessionId, cadetId: c.id, occupiedSlots: [] })))
          .onConflictDoNothing({ target: [academicTimetables.sessionId, academicTimetables.cadetId] });
        added += missingTimetables.length;
      }
    }

    revalidatePath("/admin/academic/results");
    revalidatePath("/admin/academic/timetables");
    return ok({ removed, added });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to reconcile academic records.");
  }
}

export async function provisionSessionAction(input: {
  intakeId: number;
  calendarYear: number;
  sessionNumber: number;
}): Promise<ActionResult<{ sessionId: number }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return err("Access denied.");
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && intakeScope !== input.intakeId) {
      return err("Access denied to other intakes.");
    }

    const [intake] = await db
      .select({ id: intakes.id, startYear: intakes.startYear })
      .from(intakes)
      .where(eq(intakes.id, input.intakeId));

    if (!intake) {
      return err("Intake not found.");
    }

    const yearNumber = Math.max(1, input.calendarYear - intake.startYear + 1);

    let [academicYear] = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.intakeId, input.intakeId),
          eq(academicYears.yearNumber, yearNumber)
        )
      );

    if (!academicYear) {
      const [newYear] = await db
        .insert(academicYears)
        .values({
          intakeId: input.intakeId,
          yearNumber,
          calendarYear: input.calendarYear,
        })
        .returning({ id: academicYears.id });
      academicYear = newYear;
    }

    let [sessionRow] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.academicYearId, academicYear.id),
          eq(sessions.sessionNumber, input.sessionNumber)
        )
      );

    if (!sessionRow) {
      const [newSession] = await db
        .insert(sessions)
        .values({
          academicYearId: academicYear.id,
          sessionNumber: input.sessionNumber,
        })
        .returning({ id: sessions.id });
      sessionRow = newSession;
    }

    await ensureCadetSessionRecordsAction(sessionRow.id);

    revalidatePath("/admin/academic/results");
    revalidatePath("/admin/academic/timetables");
    return ok({ sessionId: sessionRow.id });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to provision session.");
  }
}
