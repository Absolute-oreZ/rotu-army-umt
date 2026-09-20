"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicResults,
  academicYears,
  cadets,
  intakes,
  sessions,
} from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, saveDocument, signedStorageUrl } from "@/lib/supabase/storage";
import { ensureCadetSessionRecords } from "@/lib/academic/sync";
import { takeFile, takeNumber } from "@/lib/admin/form-helpers";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

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
      return { success: false, error: "Access denied." };
    }

    if (input.gpa !== null && (!Number.isFinite(input.gpa) || input.gpa < 0 || input.gpa > 4.0)) {
      return { success: false, error: "GPA must be between 0.00 and 4.00." };
    }
    if (input.cgpa !== null && (!Number.isFinite(input.cgpa) || input.cgpa < 0 || input.cgpa > 4.0)) {
      return { success: false, error: "CGPA must be between 0.00 and 4.00." };
    }

    const [row] = await db
      .select({
        id: academicResults.id,
        cadetId: academicResults.cadetId,
        cadetIntakeId: cadets.intakeId,
      })
      .from(academicResults)
      .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
      .where(eq(academicResults.id, input.resultId))
      .limit(1);

    if (!row) {
      return { success: false, error: "Result record not found." };
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && row.cadetIntakeId !== intakeScope) {
      return { success: false, error: "Access denied to other intake." };
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

    if (cgpaStr !== null) {
      await db
        .update(cadets)
        .set({
          cgpa: cgpaStr,
          updatedAt: new Date(),
        })
        .where(eq(cadets.id, row.cadetId));
    }

    revalidatePath("/admin/academic/results");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update scores.",
    };
  }
}

export async function uploadResultSlipAction(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  let uploadedPath: string | null = null;

  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return { success: false, error: "Access denied." };
    }

    const resultId = takeNumber(formData.get("resultId"));
    const file = takeFile(formData.get("file"));

    if (resultId === null || !file) {
      return { success: false, error: "Missing required upload parameters." };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "Only PDF files are accepted." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "PDF must be under 5 MB." };
    }

    const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    const saveResult = await saveDocument({
      supabase: createSupabaseAdminClient(),
      file,
      prefix: `academic/results/${loaded.row.cadetIntakeId}/${loaded.row.sessionId}`,
      stem: `result-slip-${loaded.row.id}`,
    });

    if (!saveResult.ok) {
      return { success: false, error: saveResult.error };
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
    return { success: true, data: { path: saveResult.path } };
  } catch (err) {
    if (uploadedPath) {
      await deleteFromStorage(createSupabaseAdminClient(), uploadedPath);
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload result slip.",
    };
  }
}

export async function deleteResultSlipAction(resultId: number): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return { success: false, error: "Access denied." };
    }

    const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    if (!loaded.row.resultSlipPath) {
      return { success: false, error: "No result slip uploaded." };
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
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete result slip.",
    };
  }
}

export async function getResultSlipSignedUrlAction(
  resultId: number
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return { success: false, error: "Access denied." };
    }

    const loaded = await loadAuthorizedResult(getIntakeScope(admin), resultId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    if (!loaded.row.resultSlipPath) {
      return { success: false, error: "No result slip uploaded." };
    }

    const supabase = createSupabaseAdminClient();
    const signedUrl = await signedStorageUrl(supabase, loaded.row.resultSlipPath, 3600);
    if (!signedUrl) {
      return { success: false, error: "Could not generate download URL." };
    }
    return { success: true, data: { signedUrl } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate URL.",
    };
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
      return { success: false, error: "Access denied." };
    }

    const intakeScope = getIntakeScope(admin);
    if (intakeScope !== null && intakeScope !== input.intakeId) {
      return { success: false, error: "Access denied to other intakes." };
    }

    const [intake] = await db
      .select({ id: intakes.id, startYear: intakes.startYear })
      .from(intakes)
      .where(eq(intakes.id, input.intakeId));

    if (!intake) {
      return { success: false, error: "Intake not found." };
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

    await ensureCadetSessionRecords(sessionRow.id);

    revalidatePath("/admin/academic/results");
    revalidatePath("/admin/academic/timetables");
    return { success: true, data: { sessionId: sessionRow.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to provision session.",
    };
  }
}
