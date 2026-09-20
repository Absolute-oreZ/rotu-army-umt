"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicTimetables,
  academicYears,
  sessions,
} from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, saveDocument, signedStorageUrl } from "@/lib/supabase/storage";
import { parseSlotKey, isLunchBreakSlot } from "@/lib/academic/helpers";
import { takeFile, takeNumber } from "@/lib/admin/form-helpers";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function loadAuthorizedTimetable(
  intakeScope: number | null,
  timetableId: number,
): Promise<
  | {
      ok: true;
      row: {
        id: number;
        sessionId: number;
        timetablePdfPath: string | null;
        intakeId: number;
      };
    }
  | { ok: false; error: string }
> {
  if (!Number.isInteger(timetableId) || timetableId <= 0) {
    return { ok: false, error: "Invalid timetable." };
  }

  const [row] = await db
    .select({
      id: academicTimetables.id,
      sessionId: academicTimetables.sessionId,
      timetablePdfPath: academicTimetables.timetablePdfPath,
      intakeId: academicYears.intakeId,
    })
    .from(academicTimetables)
    .innerJoin(sessions, eq(sessions.id, academicTimetables.sessionId))
    .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
    .where(eq(academicTimetables.id, timetableId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Timetable record not found." };
  }

  if (intakeScope !== null && row.intakeId !== intakeScope) {
    return { ok: false, error: "Access denied to other intake." };
  }

  return { ok: true, row };
}

export async function updateTimetableSlotsAction(input: {
  timetableId: number;
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

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), input.timetableId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    await db
      .update(academicTimetables)
      .set({
        occupiedSlots: slots,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, loaded.row.id));

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
  let uploadedPath: string | null = null;

  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return { success: false, error: "Access denied." };
    }

    const timetableId = takeNumber(formData.get("timetableId"));
    const file = takeFile(formData.get("file"));

    if (timetableId === null || !file) {
      return { success: false, error: "Missing required upload parameters." };
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "Only PDF files are accepted." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "PDF must be under 5 MB." };
    }

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    const saveResult = await saveDocument({
      supabase: createSupabaseAdminClient(),
      file,
      prefix: `academic/timetables/${loaded.row.intakeId}/${loaded.row.sessionId}`,
      stem: `timetable-${loaded.row.id}`,
    });

    if (!saveResult.ok) {
      return { success: false, error: saveResult.error };
    }
    uploadedPath = saveResult.path;

    const oldPath = loaded.row.timetablePdfPath;

    await db
      .update(academicTimetables)
      .set({
        timetablePdfPath: saveResult.path,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, loaded.row.id));

    if (oldPath) {
      await deleteFromStorage(createSupabaseAdminClient(), oldPath);
    }

    revalidatePath("/admin/academic/timetables");
    return { success: true, data: { path: saveResult.path } };
  } catch (err) {
    if (uploadedPath) {
      await deleteFromStorage(createSupabaseAdminClient(), uploadedPath);
    }
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

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    if (!loaded.row.timetablePdfPath) {
      return { success: false, error: "No timetable PDF uploaded." };
    }

    const oldPath = loaded.row.timetablePdfPath;

    await db
      .update(academicTimetables)
      .set({
        timetablePdfPath: null,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, loaded.row.id));

    await deleteFromStorage(createSupabaseAdminClient(), oldPath);

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
  timetableId: number
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return { success: false, error: "Access denied." };
    }

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return { success: false, error: loaded.error };
    }

    if (!loaded.row.timetablePdfPath) {
      return { success: false, error: "No timetable PDF uploaded." };
    }

    const supabase = createSupabaseAdminClient();
    const signedUrl = await signedStorageUrl(supabase, loaded.row.timetablePdfPath, 3600);
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
