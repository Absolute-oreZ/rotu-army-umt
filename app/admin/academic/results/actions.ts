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
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, signedStorageUrl, uploadToStorage } from "@/lib/supabase/storage";
import { ensureCadetSessionRecords } from "@/lib/academic/sync";
import { takeFile, takeNumber } from "@/lib/admin/form-helpers";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function updateResultScoresAction(input: {
  resultId: number;
  cadetId: number;
  gpa: number | null;
  cgpa: number | null;
}): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return { success: false, error: "Access denied." };
    }

    if (input.gpa !== null && (input.gpa < 0 || input.gpa > 4.0)) {
      return { success: false, error: "GPA must be between 0.00 and 4.00." };
    }
    if (input.cgpa !== null && (input.cgpa < 0 || input.cgpa > 4.0)) {
      return { success: false, error: "CGPA must be between 0.00 and 4.00." };
    }

    if (admin.intakeId) {
      const [cadet] = await db
        .select({ id: cadets.id, intakeId: cadets.intakeId })
        .from(cadets)
        .where(eq(cadets.id, input.cadetId));

      if (!cadet || cadet.intakeId !== admin.intakeId) {
        return { success: false, error: "Cadet not in your intake scope." };
      }
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
      .where(eq(academicResults.id, input.resultId));

    if (cgpaStr !== null) {
      await db
        .update(cadets)
        .set({
          cgpa: cgpaStr,
          updatedAt: new Date(),
        })
        .where(eq(cadets.id, input.cadetId));
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
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "results")) {
      return { success: false, error: "Access denied." };
    }

    const resultId = takeNumber(formData.get("resultId"));
    const sessionId = takeNumber(formData.get("sessionId"));
    const cadetId = takeNumber(formData.get("cadetId"));
    const file = takeFile(formData.get("file"));

    if (!resultId || !sessionId || !cadetId || !file) {
      return { success: false, error: "Missing required upload parameters." };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "Only PDF files are accepted." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "PDF file size must not exceed 5MB." };
    }

    const [sessionRow] = await db
      .select({ intakeId: academicYears.intakeId })
      .from(sessions)
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .where(eq(sessions.id, sessionId));

    if (!sessionRow) {
      return { success: false, error: "Academic session not found." };
    }

    if (admin.intakeId && admin.intakeId !== sessionRow.intakeId) {
      return { success: false, error: "Access denied to other intake." };
    }

    const storagePath = `academic/results/${sessionRow.intakeId}/${sessionId}/${cadetId}.pdf`;
    const supabase = createSupabaseAdminClient();

    const uploaded = await uploadToStorage(supabase, file, storagePath, "application/pdf");
    if (!uploaded) {
      return { success: false, error: "Failed to upload PDF to storage." };
    }

    await db
      .update(academicResults)
      .set({
        resultSlipPath: storagePath,
        updatedAt: new Date(),
      })
      .where(eq(academicResults.id, resultId));

    revalidatePath("/admin/academic/results");
    return { success: true, data: { path: storagePath } };
  } catch (err) {
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

    const [row] = await db
      .select({
        id: academicResults.id,
        resultSlipPath: academicResults.resultSlipPath,
        intakeId: academicYears.intakeId,
      })
      .from(academicResults)
      .innerJoin(sessions, eq(sessions.id, academicResults.sessionId))
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .where(eq(academicResults.id, resultId));

    if (!row) {
      return { success: false, error: "Result record not found." };
    }

    if (admin.intakeId && admin.intakeId !== row.intakeId) {
      return { success: false, error: "Access denied." };
    }

    if (row.resultSlipPath) {
      const supabase = createSupabaseAdminClient();
      await deleteFromStorage(supabase, row.resultSlipPath);
    }

    await db
      .update(academicResults)
      .set({
        resultSlipPath: null,
        updatedAt: new Date(),
      })
      .where(eq(academicResults.id, resultId));

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
  resultSlipPath: string
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    await requireCurrentAdmin();
    const supabase = createSupabaseAdminClient();
    const signedUrl = await signedStorageUrl(supabase, resultSlipPath, 3600);
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

    if (admin.intakeId && admin.intakeId !== input.intakeId) {
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
