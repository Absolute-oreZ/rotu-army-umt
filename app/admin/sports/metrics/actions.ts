"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cadets, healthRecordMetrics, healthRecords, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import {
  assertIntakeOwnership,
  resolveScopedIntakeId,
  takeNumber,
  takeString,
} from "@/lib/admin/form-helpers";
import { calculateAgeAt, calculateBMI, getBMIClassification } from "@/lib/utils";
import { getMalaysiaDateISO, parseMalaysiaDate } from "@/lib/time/malaysia";

const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 250;
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 200;

function toDateOnly(value: string): Date {
  return parseMalaysiaDate(value)!;
}

function parseMetricValue(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const num = takeNumber(raw);
  if (num === null) {
    return { ok: false, error: `${label} is required.` };
  }
  if (num < min || num > max) {
    return { ok: false, error: `${label} must be between ${min} and ${max}.` };
  }
  return { ok: true, value: (Math.round(num * 100) / 100).toFixed(2) };
}

async function loadOwnedRecord(
  formData: FormData,
  intakeScope: number | null,
): Promise<
  | { ok: true; id: number; intakeId: number; recordDate: string }
  | { ok: false; error: string }
> {
  const rawRecordId = takeString(formData.get("recordId"));
  if (!rawRecordId) return { ok: false, error: "Invalid record." };

  const recordId = Number(rawRecordId);
  if (!Number.isInteger(recordId) || recordId <= 0) {
    return { ok: false, error: "Invalid record." };
  }

  const [record] = await db
    .select({
      id: healthRecords.id,
      intakeId: healthRecords.intakeId,
      recordDate: healthRecords.recordDate,
    })
    .from(healthRecords)
    .where(eq(healthRecords.id, recordId))
    .limit(1);

  if (!record) return { ok: false, error: "Record not found." };

  const ownershipError = assertIntakeOwnership(record.intakeId, intakeScope);
  if (ownershipError) return { ok: false, error: ownershipError };

  return {
    ok: true,
    id: record.id,
    intakeId: record.intakeId,
    recordDate: record.recordDate,
  };
}

export async function createHealthRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "metrics")) {
    return { error: "You do not have permission to manage health metrics." };
  }

  const resolved = resolveScopedIntakeId(formData, intakeScope);
  if (!resolved.ok) return { error: resolved.error };

  const recordDate = getMalaysiaDateISO();

  try {
    const inserted = await db
      .insert(healthRecords)
      .values({ intakeId: resolved.intakeId, recordDate })
      .onConflictDoNothing({
        target: [healthRecords.intakeId, healthRecords.recordDate],
      })
      .returning({ id: healthRecords.id });

    const record = inserted[0];
    if (!record) {
      return {
        error:
          "A health record for this intake has already been created today. Select it from the record list to continue recording metrics.",
      };
    }

    revalidatePath("/admin/sports/metrics");
    return { success: true as const, data: { id: record.id } };
  } catch (err) {
    console.error("createHealthRecord failed", err);
    return { error: "Failed to create health record." };
  }
}

export async function updateCadetMetric(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "metrics")) {
    return { error: "You do not have permission to manage health metrics." };
  }

  const loaded = await loadOwnedRecord(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const rawCadetId = takeString(formData.get("cadetId"));
  if (!rawCadetId) return { error: "Invalid cadet." };

  const cadetId = Number(rawCadetId);
  if (!Number.isInteger(cadetId) || cadetId <= 0) {
    return { error: "Invalid cadet." };
  }

  const height = parseMetricValue(
    formData.get("height"),
    MIN_HEIGHT_CM,
    MAX_HEIGHT_CM,
    "Height",
  );
  if (!height.ok) return { error: height.error };

  const weight = parseMetricValue(
    formData.get("weight"),
    MIN_WEIGHT_KG,
    MAX_WEIGHT_KG,
    "Weight",
  );
  if (!weight.ok) return { error: weight.error };

  const [cadet] = await db
    .select({
      id: cadets.id,
      intakeId: cadets.intakeId,
      isActive: cadets.isActive,
      birthdate: members.birthdate,
    })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .where(eq(cadets.id, cadetId))
    .limit(1);

  if (!cadet || !cadet.isActive) {
    return { error: "Cadet not found." };
  }

  if (cadet.intakeId !== loaded.intakeId) {
    return { error: "This cadet does not belong to the record's intake." };
  }

  const age = calculateAgeAt(toDateOnly(cadet.birthdate), toDateOnly(loaded.recordDate));
  if (age < 0) {
    return { error: "Cadet birthdate is invalid for this record." };
  }

  const bmi = calculateBMI(Number(height.value) / 100, Number(weight.value));
  if (bmi === null) {
    return { error: "Height and weight combination is out of the supported BMI range." };
  }

  const classification = getBMIClassification(bmi);
  if (classification === null) {
    return { error: "Could not determine the BMI classification." };
  }

  try {
    await db
      .insert(healthRecordMetrics)
      .values({
        recordId: loaded.id,
        cadetId: cadet.id,
        age,
        height: height.value,
        weight: weight.value,
        bmi: bmi.toFixed(2),
        bmiClassification: classification,
      })
      .onConflictDoUpdate({
        target: [healthRecordMetrics.recordId, healthRecordMetrics.cadetId],
        set: {
          age,
          height: height.value,
          weight: weight.value,
          bmi: bmi.toFixed(2),
          bmiClassification: classification,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("updateCadetMetric failed", err);
    return { error: "Failed to save cadet metrics." };
  }

  revalidatePath("/admin/sports/metrics");
  return { success: true as const };
}

export async function deleteHealthRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "metrics")) {
    return { error: "You do not have permission to manage health metrics." };
  }

  const loaded = await loadOwnedRecord(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  try {
    await db.delete(healthRecords).where(eq(healthRecords.id, loaded.id));
  } catch (err) {
    console.error("deleteHealthRecord failed", err);
    return { error: "Failed to delete record." };
  }

  revalidatePath("/admin/sports/metrics");
  return { success: true as const };
}