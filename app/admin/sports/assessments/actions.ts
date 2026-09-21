"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, max, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  apfaRecordAssessments,
  apfaRecords,
  cadets,
  members,
  ukaRecordAssessments,
  ukaRecords,
} from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule, type AdminModule } from "@/lib/admin/roles";
import {
  assertIntakeOwnership,
  resolveScopedIntakeId,
  takeNumber,
  takeString,
} from "@/lib/admin/form-helpers";
import { evaluatePass, getAssessmentStandards } from "@/lib/assessment/standards";
import type { AssessmentGender, AssessmentRecordType } from "@/lib/assessment/types";
import { parseDuration } from "@/lib/utils";

const COUNT_MAX = 500;
const SWIMMING_MAX = 5000;

const RECORD_MODULE: Record<AssessmentRecordType, AdminModule> = {
  UKA: "uka",
  APFA: "apfa",
};

function getMalaysiaDateISO(): string {
  const now = new Date();
  // Malaysia is UTC+8
  const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return malaysiaTime.toISOString().slice(0, 10);
}

type ParsedItemResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

function parseRecordType(value: string | null): AssessmentRecordType | null {
  return value === "UKA" || value === "APFA" ? value : null;
}

function parseRecordId(formData: FormData): number | null {
  const raw = takeString(formData.get("recordId"));
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidRecordDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00+08:00`); // Malaysia timezone (UTC+8)
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

function parseCadetId(formData: FormData): number | null {
  const raw = takeString(formData.get("cadetId"));
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseCountItem(
  formData: FormData,
  key: string,
  label: string,
  max: number,
): ParsedItemResult {
  const raw = takeString(formData.get(key));
  if (raw === null) return { ok: true, value: null };
  const num = takeNumber(formData.get(key));
  if (num === null || !Number.isInteger(num) || num < 0 || num > max) {
    return { ok: false, error: `${label} must be a whole number between 0 and ${max}.` };
  }
  return { ok: true, value: num };
}

function parseDurationItem(
  formData: FormData,
  key: string,
  label: string,
): ParsedItemResult {
  const raw = takeString(formData.get(key));
  if (raw === null) return { ok: true, value: null };
  const seconds = parseDuration(raw);
  if (seconds === null) {
    return { ok: false, error: `${label} must use mm:ss format (e.g. 11:30).` };
  }
  return { ok: true, value: seconds };
}

function revalidateSportsPaths() {
  revalidatePath("/admin/sports/assessments");
  revalidatePath("/admin/sports/uka");
  revalidatePath("/admin/sports/apfa");
}

async function getNextSession(
  recordType: AssessmentRecordType,
  intakeId: number,
  year: number,
  excludeRecordId?: number,
): Promise<number> {
  if (recordType === "UKA") {
    const [row] = await db
      .select({ highestSession: max(ukaRecords.session) })
      .from(ukaRecords)
      .where(and(
        eq(ukaRecords.intakeId, intakeId),
        eq(ukaRecords.year, year),
        excludeRecordId === undefined ? undefined : ne(ukaRecords.id, excludeRecordId),
      ));
    return (row?.highestSession ?? 0) + 1;
  }
  const [row] = await db
    .select({ highestSession: max(apfaRecords.session) })
    .from(apfaRecords)
    .where(and(
      eq(apfaRecords.intakeId, intakeId),
      eq(apfaRecords.year, year),
      excludeRecordId === undefined ? undefined : ne(apfaRecords.id, excludeRecordId),
    ));
  return (row?.highestSession ?? 0) + 1;
}

async function getPreviousSessionDate(
  recordType: AssessmentRecordType,
  intakeId: number,
  year: number,
  session?: number,
) {
  if (recordType === "UKA") {
    const [row] = await db
      .select({ recordDate: ukaRecords.recordDate })
      .from(ukaRecords)
      .where(and(
        eq(ukaRecords.intakeId, intakeId),
        eq(ukaRecords.year, year),
        session === undefined ? undefined : sql`${ukaRecords.session} < ${session}`,
      ))
      .orderBy(desc(ukaRecords.session))
      .limit(1);
    return row?.recordDate ?? null;
  }

  const [row] = await db
    .select({ recordDate: apfaRecords.recordDate })
    .from(apfaRecords)
    .where(and(
      eq(apfaRecords.intakeId, intakeId),
      eq(apfaRecords.year, year),
      session === undefined ? undefined : sql`${apfaRecords.session} < ${session}`,
    ))
    .orderBy(desc(apfaRecords.session))
    .limit(1);
  return row?.recordDate ?? null;
}

async function insertRecord(
  recordType: AssessmentRecordType,
  intakeId: number,
  recordDate: string,
  session: number,
  year: number,
): Promise<number | null> {
  if (recordType === "UKA") {
    const inserted = await db
      .insert(ukaRecords)
      .values({ intakeId, recordDate, session, year })
      .onConflictDoNothing({
        target: [ukaRecords.intakeId, ukaRecords.session, ukaRecords.year],
      })
      .returning({ id: ukaRecords.id });
    return inserted[0]?.id ?? null;
  }
  const inserted = await db
    .insert(apfaRecords)
    .values({ intakeId, recordDate, session, year })
    .onConflictDoNothing({
      target: [apfaRecords.intakeId, apfaRecords.session, apfaRecords.year],
    })
    .returning({ id: apfaRecords.id });
  return inserted[0]?.id ?? null;
}

export async function createAssessmentRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  const recordType = parseRecordType(takeString(formData.get("recordType")));
  if (!recordType) return { error: "Invalid record type." };

  if (!canAccessAdminModule(admin.role, RECORD_MODULE[recordType])) {
    return { error: `You do not have permission to manage ${recordType} records.` };
  }

  const resolved = resolveScopedIntakeId(formData, intakeScope);
  if (!resolved.ok) return { error: resolved.error };

  const submittedDate = takeString(formData.get("recordDate"));
  const recordDate = submittedDate || getMalaysiaDateISO();
  if (!isValidRecordDate(recordDate)) {
    return { error: "Record date is invalid." };
  }
  const year = Number(recordDate.slice(0, 4));

  try {
    const previousSessionDate = await getPreviousSessionDate(recordType, resolved.intakeId, year);
    if (previousSessionDate && recordDate <= previousSessionDate) {
      return { error: `Record date must be after the previous session (${previousSessionDate}).` };
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const session = await getNextSession(recordType, resolved.intakeId, year);
      const id = await insertRecord(recordType, resolved.intakeId, recordDate, session, year);

      if (id !== null) {
        revalidateSportsPaths();
        return { success: true as const, data: { id } };
      }
    }

    return { error: "Could not allocate a unique assessment session. Please try again." };
  } catch (err) {
    console.error("createAssessmentRecord failed", err);
    return { error: "Failed to create record." };
  }
}

export async function deleteAssessmentRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  const recordType = parseRecordType(takeString(formData.get("recordType")));
  if (!recordType) return { error: "Invalid record type." };

  if (!canAccessAdminModule(admin.role, RECORD_MODULE[recordType])) {
    return { error: `You do not have permission to manage ${recordType} records.` };
  }

  const recordId = parseRecordId(formData);
  if (recordId === null) return { error: "Invalid record." };

  try {
    const deleted =
      recordType === "UKA"
        ? await db
            .delete(ukaRecords)
            .where(
              and(
                eq(ukaRecords.id, recordId),
                intakeScope !== null ? eq(ukaRecords.intakeId, intakeScope) : undefined,
              ),
            )
            .returning({ id: ukaRecords.id })
        : await db
            .delete(apfaRecords)
            .where(
              and(
                eq(apfaRecords.id, recordId),
                intakeScope !== null ? eq(apfaRecords.intakeId, intakeScope) : undefined,
              ),
            )
            .returning({ id: apfaRecords.id });

    if (!deleted[0]) return { error: "Record not found." };

    revalidateSportsPaths();
    return { success: true as const };
  } catch (err) {
    console.error("deleteAssessmentRecord failed", err);
    return { error: "Failed to delete record." };
  }
}

export async function updateAssessmentRecord(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  const recordType = parseRecordType(takeString(formData.get("recordType")));
  if (!recordType) return { error: "Invalid record type." };

  if (!canAccessAdminModule(admin.role, RECORD_MODULE[recordType])) {
    return { error: `You do not have permission to manage ${recordType} records.` };
  }

  const recordId = parseRecordId(formData);
  if (recordId === null) return { error: "Invalid record." };

  const submittedDate = takeString(formData.get("recordDate"));
  if (!submittedDate || !isValidRecordDate(submittedDate)) {
    return { error: "Valid record date is required." };
  }

  const year = Number(submittedDate.slice(0, 4));

  try {
    const previousSessionDate = await getPreviousSessionDate(recordType, intakeScope!, year);
    if (previousSessionDate && submittedDate <= previousSessionDate) {
      return { error: `Record date must be after the previous session (${previousSessionDate}).` };
    }

    const nextSessionDate = await getPreviousSessionDate(recordType, intakeScope!, year);
    if (nextSessionDate && submittedDate > nextSessionDate) {
      return { error: `Record date cannot be after the next session (${nextSessionDate}).` };
    }

    await db
      .update(recordType === "UKA" ? ukaRecords : apfaRecords)
      .set({ recordDate: submittedDate })
      .where(eq(recordType === "UKA" ? ukaRecords.id : apfaRecords.id, recordId));

    revalidateSportsPaths();
    return { success: true as const };
  } catch (err) {
    console.error("updateAssessmentRecord failed", err);
    return { error: "Failed to update record." };
  }
}

async function loadRecordIntake(
  recordType: AssessmentRecordType,
  recordId: number,
  intakeScope: number | null,
): Promise<{ ok: true; intakeId: number } | { ok: false; error: string }> {
  if (recordType === "UKA") {
    const [record] = await db
      .select({ intakeId: ukaRecords.intakeId })
      .from(ukaRecords)
      .where(eq(ukaRecords.id, recordId))
      .limit(1);
    if (!record) return { ok: false, error: "Record not found." };
    const ownershipError = assertIntakeOwnership(record.intakeId, intakeScope);
    if (ownershipError) return { ok: false, error: ownershipError };
    return { ok: true, intakeId: record.intakeId };
  }
  const [record] = await db
    .select({ intakeId: apfaRecords.intakeId })
    .from(apfaRecords)
    .where(eq(apfaRecords.id, recordId))
    .limit(1);
  if (!record) return { ok: false, error: "Record not found." };
  const ownershipError = assertIntakeOwnership(record.intakeId, intakeScope);
  if (ownershipError) return { ok: false, error: ownershipError };
  return { ok: true, intakeId: record.intakeId };
}

async function loadCadetForRecord(
  cadetId: number,
  recordIntakeId: number,
): Promise<{ ok: true; gender: AssessmentGender } | { ok: false; error: string }> {
  const [cadet] = await db
    .select({
      id: cadets.id,
      intakeId: cadets.intakeId,
      isActive: cadets.isActive,
      gender: members.gender,
    })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .where(eq(cadets.id, cadetId))
    .limit(1);

  if (!cadet || !cadet.isActive) {
    return { ok: false, error: "Cadet not found." };
  }
  if (cadet.intakeId !== recordIntakeId) {
    return { ok: false, error: "This cadet does not belong to the record's intake." };
  }
  return { ok: true, gender: cadet.gender };
}

export async function saveUkaAssessment(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "assessments")) {
    return { error: "You do not have permission to manage assessments." };
  }

  const recordId = parseRecordId(formData);
  const cadetId = parseCadetId(formData);
  if (recordId === null) return { error: "Invalid record." };
  if (cadetId === null) return { error: "Invalid cadet." };

  const loaded = await loadRecordIntake("UKA", recordId, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const pushUp = parseCountItem(formData, "pushUp", "Push-up", COUNT_MAX);
  if (!pushUp.ok) return { error: pushUp.error };
  const sitUp = parseCountItem(formData, "sitUp", "Sit-up", COUNT_MAX);
  if (!sitUp.ok) return { error: sitUp.error };
  const run = parseDurationItem(formData, "run", "2.4km run time");
  if (!run.ok) return { error: run.error };

  if (pushUp.value === null && sitUp.value === null && run.value === null) {
    return { error: "Enter at least one assessment result." };
  }

  const cadet = await loadCadetForRecord(cadetId, loaded.intakeId);
  if (!cadet.ok) return { error: cadet.error };

  const [existing] = await db
    .select({
      pushUp: ukaRecordAssessments.pushUp,
      sitUp: ukaRecordAssessments.sitUp,
      runSeconds: ukaRecordAssessments.runSeconds,
    })
    .from(ukaRecordAssessments)
    .where(
      and(
        eq(ukaRecordAssessments.recordId, recordId),
        eq(ukaRecordAssessments.cadetId, cadetId),
      ),
    )
    .limit(1);

  const mergedPushUp = pushUp.value ?? existing?.pushUp ?? null;
  const mergedSitUp = sitUp.value ?? existing?.sitUp ?? null;
  const mergedRunSeconds = run.value ?? existing?.runSeconds ?? null;

  const standards = getAssessmentStandards("UKA", cadet.gender);
  const pushUpPass = mergedPushUp === null ? null : evaluatePass(mergedPushUp, standards[0]);
  const sitUpPass = mergedSitUp === null ? null : evaluatePass(mergedSitUp, standards[1]);
  const runPass = mergedRunSeconds === null ? null : evaluatePass(mergedRunSeconds, standards[2]);

  const result =
    mergedPushUp !== null && mergedSitUp !== null && mergedRunSeconds !== null
      ? pushUpPass && sitUpPass && runPass
        ? ("PASS" as const)
        : ("FAIL" as const)
      : null;

  try {
    await db
      .insert(ukaRecordAssessments)
      .values({
        recordId,
        cadetId,
        pushUp: mergedPushUp,
        pushUpPass,
        sitUp: mergedSitUp,
        sitUpPass,
        runSeconds: mergedRunSeconds,
        runPass,
        result,
      })
      .onConflictDoUpdate({
        target: [ukaRecordAssessments.recordId, ukaRecordAssessments.cadetId],
        set: {
          pushUp: mergedPushUp,
          pushUpPass,
          sitUp: mergedSitUp,
          sitUpPass,
          runSeconds: mergedRunSeconds,
          runPass,
          result,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("saveUkaAssessment failed", err);
    return { error: "Failed to save assessment." };
  }

  revalidateSportsPaths();
  return { success: true as const };
}

export async function saveApfaAssessment(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "assessments")) {
    return { error: "You do not have permission to manage assessments." };
  }

  const recordId = parseRecordId(formData);
  const cadetId = parseCadetId(formData);
  if (recordId === null) return { error: "Invalid record." };
  if (cadetId === null) return { error: "Invalid cadet." };

  const loaded = await loadRecordIntake("APFA", recordId, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const run = parseDurationItem(formData, "run", "1.6km run time");
  if (!run.ok) return { error: run.error };
  const pullUp = parseCountItem(formData, "pullUp", "Pull-up", COUNT_MAX);
  if (!pullUp.ok) return { error: pullUp.error };
  const swimming = parseCountItem(formData, "swimming", "Swimming distance", SWIMMING_MAX);
  if (!swimming.ok) return { error: swimming.error };
  const floating = parseDurationItem(formData, "floating", "Floating time");
  if (!floating.ok) return { error: floating.error };

  if (
    run.value === null &&
    pullUp.value === null &&
    swimming.value === null &&
    floating.value === null
  ) {
    return { error: "Enter at least one assessment result." };
  }

  const cadet = await loadCadetForRecord(cadetId, loaded.intakeId);
  if (!cadet.ok) return { error: cadet.error };

  const [existing] = await db
    .select({
      runSeconds: apfaRecordAssessments.runSeconds,
      pullUp: apfaRecordAssessments.pullUp,
      swimmingMetres: apfaRecordAssessments.swimmingMetres,
      floatingSeconds: apfaRecordAssessments.floatingSeconds,
    })
    .from(apfaRecordAssessments)
    .where(
      and(
        eq(apfaRecordAssessments.recordId, recordId),
        eq(apfaRecordAssessments.cadetId, cadetId),
      ),
    )
    .limit(1);

  const mergedRunSeconds = run.value ?? existing?.runSeconds ?? null;
  const mergedPullUp = pullUp.value ?? existing?.pullUp ?? null;
  const mergedSwimming = swimming.value ?? existing?.swimmingMetres ?? null;
  const mergedFloating = floating.value ?? existing?.floatingSeconds ?? null;

  const standards = getAssessmentStandards("APFA", cadet.gender);
  const runPass = mergedRunSeconds === null ? null : evaluatePass(mergedRunSeconds, standards[0]);
  const pullUpPass = mergedPullUp === null ? null : evaluatePass(mergedPullUp, standards[1]);
  const swimmingPass = mergedSwimming === null ? null : evaluatePass(mergedSwimming, standards[2]);
  const floatingPass = mergedFloating === null ? null : evaluatePass(mergedFloating, standards[3]);

  const result =
    mergedRunSeconds !== null &&
    mergedPullUp !== null &&
    mergedSwimming !== null &&
    mergedFloating !== null
      ? runPass && pullUpPass && swimmingPass && floatingPass
        ? ("PASS" as const)
        : ("FAIL" as const)
      : null;

  try {
    await db
      .insert(apfaRecordAssessments)
      .values({
        recordId,
        cadetId,
        runSeconds: mergedRunSeconds,
        runPass,
        pullUp: mergedPullUp,
        pullUpPass,
        swimmingMetres: mergedSwimming,
        swimmingPass,
        floatingSeconds: mergedFloating,
        floatingPass,
        result,
      })
      .onConflictDoUpdate({
        target: [apfaRecordAssessments.recordId, apfaRecordAssessments.cadetId],
        set: {
          runSeconds: mergedRunSeconds,
          runPass,
          pullUp: mergedPullUp,
          pullUpPass,
          swimmingMetres: mergedSwimming,
          swimmingPass,
          floatingSeconds: mergedFloating,
          floatingPass,
          result,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("saveApfaAssessment failed", err);
    return { error: "Failed to save assessment." };
  }

  revalidateSportsPaths();
  return { success: true as const };
}