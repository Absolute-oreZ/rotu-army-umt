"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicTimetables,
  academicYears,
  cadets,
  sessions,
} from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, signedStorageUrl, uploadToStorage } from "@/lib/supabase/storage";
import { parseSlotKey, isLunchBreakSlot } from "@/lib/academic/helpers";
import { takeFile, takeNumber } from "@/lib/admin/form-helpers";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function updateTimetableSlotsAction(input: {
  timetableId: number;
  sessionId: number;
  cadetId: number;
  occupiedSlots: string[];
}): Promise<ActionResult<{ occupiedSlots: string[] }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return { success: false, error: "Access denied." };
    }

    if (!Array.isArray(input.occupiedSlots)) {
      return { success: false, error: "Invalid timetable slots." };
    }

    const seen = new Set<string>();
    const slots: string[] = [];
    for (const slotKey of input.occupiedSlots) {
      const parsed = parseSlotKey(slotKey);
      if (!parsed) {
        // Silently skip invalid slot keys (e.g., from old time formats)
        continue;
      }
      if (isLunchBreakSlot(parsed.time)) {
        return { success: false, error: "The lunch break slot is locked and cannot be occupied." };
      }
      if (seen.has(slotKey)) continue;
      seen.add(slotKey);
      slots.push(slotKey);
    }

    slots.sort();

    if (admin.intakeId) {
      const [cadet] = await db
        .select({ id: cadets.id, intakeId: cadets.intakeId })
        .from(cadets)
        .where(eq(cadets.id, input.cadetId));

      if (!cadet || cadet.intakeId !== admin.intakeId) {
        return { success: false, error: "Cadet not in your intake scope." };
      }
    }

    await db
      .update(academicTimetables)
      .set({
        occupiedSlots: slots,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, input.timetableId));

    revalidatePath("/admin/academic/timetables");
    return { success: true, data: { occupiedSlots: slots } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update timetable slots.",
    };
  }
}


export async function uploadTimetablePdfAction(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return { success: false, error: "Access denied." };
    }

    const timetableId = takeNumber(formData.get("timetableId"));
    const sessionId = takeNumber(formData.get("sessionId"));
    const cadetId = takeNumber(formData.get("cadetId"));
    const file = takeFile(formData.get("file"));

    if (!timetableId || !sessionId || !cadetId || !file) {
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

    const storagePath = `academic/timetables/${sessionRow.intakeId}/${sessionId}/${cadetId}.pdf`;
    const supabase = createSupabaseAdminClient();

    const uploaded = await uploadToStorage(supabase, file, storagePath, "application/pdf");
    if (!uploaded) {
      return { success: false, error: "Failed to upload PDF to storage." };
    }

    await db
      .update(academicTimetables)
      .set({
        timetablePdfPath: storagePath,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, timetableId));

    revalidatePath("/admin/academic/timetables");
    return { success: true, data: { path: storagePath } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload timetable PDF.",
    };
  }
}

export async function deleteTimetablePdfAction(timetableId: number): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return { success: false, error: "Access denied." };
    }

    const [row] = await db
      .select({
        id: academicTimetables.id,
        timetablePdfPath: academicTimetables.timetablePdfPath,
        intakeId: academicYears.intakeId,
      })
      .from(academicTimetables)
      .innerJoin(sessions, eq(sessions.id, academicTimetables.sessionId))
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .where(eq(academicTimetables.id, timetableId));

    if (!row) {
      return { success: false, error: "Timetable record not found." };
    }

    if (admin.intakeId && admin.intakeId !== row.intakeId) {
      return { success: false, error: "Access denied." };
    }

    if (row.timetablePdfPath) {
      const supabase = createSupabaseAdminClient();
      await deleteFromStorage(supabase, row.timetablePdfPath);
    }

    await db
      .update(academicTimetables)
      .set({
        timetablePdfPath: null,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, timetableId));

    revalidatePath("/admin/academic/timetables");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete timetable PDF.",
    };
  }
}

export async function getTimetablePdfSignedUrlAction(
  timetablePdfPath: string
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    await requireCurrentAdmin();
    const supabase = createSupabaseAdminClient();
    const signedUrl = await signedStorageUrl(supabase, timetablePdfPath, 3600);
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
