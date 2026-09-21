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
import { ActionResult, ok, err } from "@/lib/actions/result";

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
      return err("Access denied.");
    }

    if (!Array.isArray(input.occupiedSlots)) {
      return err("Invalid timetable slots.");
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
        return err("The lunch break slot is locked and cannot be occupied.");
      }
      if (seen.has(slotKey)) continue;
      seen.add(slotKey);
      slots.push(slotKey);
    }

    slots.sort();

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), input.timetableId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    await db
      .update(academicTimetables)
      .set({
        occupiedSlots: slots,
        updatedAt: new Date(),
      })
      .where(eq(academicTimetables.id, loaded.row.id));

    revalidatePath("/admin/academic/timetables");
    return ok({ occupiedSlots: slots });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update timetable slots.");
  }
}


export async function uploadTimetablePdfAction(
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  let uploadedPath: string | null = null;

  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return err("Access denied.");
    }

    const timetableId = takeNumber(formData.get("timetableId"));
    const file = takeFile(formData.get("file"));

    if (timetableId === null || !file) {
      return err("Missing required upload parameters.");
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return err("Only PDF files are accepted.");
    }

    if (file.size > 5 * 1024 * 1024) {
      return err("PDF must be under 5 MB.");
    }

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    const saveResult = await saveDocument({
      supabase: createSupabaseAdminClient(),
      file,
      prefix: `academic/timetables/${loaded.row.intakeId}/${loaded.row.sessionId}`,
      stem: `timetable-${loaded.row.id}`,
    });

    if (!saveResult.ok) {
      return err(saveResult.error);
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
    return ok({ path: saveResult.path });
  } catch (e) {
    if (uploadedPath) {
      await deleteFromStorage(createSupabaseAdminClient(), uploadedPath);
    }
    return err(e instanceof Error ? e.message : "Failed to upload timetable PDF.");
  }
}

export async function deleteTimetablePdfAction(timetableId: number): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return err("Access denied.");
    }

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    if (!loaded.row.timetablePdfPath) {
      return err("No timetable PDF uploaded.");
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
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete timetable PDF.");
  }
}

export async function getTimetablePdfSignedUrlAction(
  timetableId: number
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "timetables")) {
      return err("Access denied.");
    }

    const loaded = await loadAuthorizedTimetable(getIntakeScope(admin), timetableId);
    if (!loaded.ok) {
      return err(loaded.error);
    }

    if (!loaded.row.timetablePdfPath) {
      return err("No timetable PDF uploaded.");
    }

    const supabase = createSupabaseAdminClient();
        const signedUrl = await signedStorageUrl(supabase, loaded.row.timetablePdfPath, undefined, "document");
    if (!signedUrl) {
      return err("Could not generate download URL.");
    }
    return ok({ signedUrl });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to generate URL.");
  }
}
