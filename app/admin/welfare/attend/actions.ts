"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attendRecords, cadets } from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { takeNumber, takeString } from "@/lib/admin/form-helpers";
import { getAttendSources } from "@/lib/welfare/attend-sources";

function parseRecordDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : value;
}

function parseAttendType(value: string | null): "B" | "C" | null {
  return value === "B" || value === "C" ? value : null;
}

function resolveSource(value: FormDataEntryValue | null): string | null {
  const source = takeString(value);
  if (source === null) return null;
  return getAttendSources().includes(source) ? source : null;
}

function parseRecordId(formData: FormData): number | null {
  const raw = takeNumber(formData.get("recordId"));
  if (raw === null || !Number.isInteger(raw) || raw <= 0) return null;
  return raw;
}

async function loadOwnedRecord(recordId: number, intakeScope: number | null) {
  const [record] = await db
    .select({ id: attendRecords.id, cadetIntakeId: cadets.intakeId })
    .from(attendRecords)
    .innerJoin(cadets, eq(cadets.id, attendRecords.cadetId))
    .where(eq(attendRecords.id, recordId))
    .limit(1);

  if (!record) return { ok: false as const, error: "Record not found." };

  if (intakeScope !== null && record.cadetIntakeId !== intakeScope) {
    return { ok: false as const, error: "You can only manage records from your intake." };
  }

  return { ok: true as const };
}

export async function createAttendRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "attend")) {
    return { error: "You do not have permission to manage attend records." };
  }

  const cadetId = takeNumber(formData.get("cadetId"));
  if (cadetId === null || !Number.isInteger(cadetId) || cadetId <= 0) {
    return { error: "Valid cadet is required." };
  }

  const recordDate = parseRecordDate(takeString(formData.get("recordDate")));
  if (recordDate === null) return { error: "Valid date is required." };

  const attendType = parseAttendType(takeString(formData.get("attendType")));
  if (attendType === null) return { error: "Valid attend type is required." };

  const source = resolveSource(formData.get("source"));
  if (source === null) return { error: "Valid source is required." };

  const [cadet] = await db
    .select({ id: cadets.id, intakeId: cadets.intakeId, isActive: cadets.isActive })
    .from(cadets)
    .where(eq(cadets.id, cadetId))
    .limit(1);

  if (!cadet || !cadet.isActive) return { error: "Cadet not found." };

  if (intakeScope !== null && cadet.intakeId !== intakeScope) {
    return { error: "You can only manage records from your intake." };
  }

  try {
    await db.insert(attendRecords).values({
      cadetId: cadet.id,
      recordDate,
      attendType,
      source,
    });
  } catch (err) {
    console.error("createAttendRecord failed", err);
    return { error: "Failed to create attend record." };
  }

  revalidatePath("/admin/welfare/attend");
  return { success: true as const };
}

export async function updateAttendRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "attend")) {
    return { error: "You do not have permission to manage attend records." };
  }

  const recordId = parseRecordId(formData);
  if (recordId === null) return { error: "Invalid record." };

  const recordDate = parseRecordDate(takeString(formData.get("recordDate")));
  if (recordDate === null) return { error: "Valid date is required." };

  const attendType = parseAttendType(takeString(formData.get("attendType")));
  if (attendType === null) return { error: "Valid attend type is required." };

  const source = resolveSource(formData.get("source"));
  if (source === null) return { error: "Valid source is required." };

  const loaded = await loadOwnedRecord(recordId, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  try {
    await db
      .update(attendRecords)
      .set({ recordDate, attendType, source })
      .where(eq(attendRecords.id, recordId));
  } catch (err) {
    console.error("updateAttendRecord failed", err);
    return { error: "Failed to update attend record." };
  }

  revalidatePath("/admin/welfare/attend");
  return { success: true as const };
}

export async function deleteAttendRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "attend")) {
    return { error: "You do not have permission to manage attend records." };
  }

  const recordId = parseRecordId(formData);
  if (recordId === null) return { error: "Invalid record." };

  const loaded = await loadOwnedRecord(recordId, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  try {
    await db.delete(attendRecords).where(eq(attendRecords.id, recordId));
  } catch (err) {
    console.error("deleteAttendRecord failed", err);
    return { error: "Failed to delete attend record." };
  }

  revalidatePath("/admin/welfare/attend");
  return { success: true as const };
}