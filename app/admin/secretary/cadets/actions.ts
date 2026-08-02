"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cadets, intakes, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { calculateAge, isValidPersonalEmail, isValidEduEmail } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/supabase/storage";
import { takeString, takeNumber, takeFile, getFileExtension } from "@/lib/admin/form-helpers";
import {
  genderEnum,
  memberRankEnum,
  religionEnum,
  raceEnum,
} from "@/db/schema";

export async function toggleCadetActive(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "cadets")) {
    return { error: "You do not have permission to manage cadets." };
  }

  const rawCadetInfoId = formData.get("cadetInfoId");
  const rawIsActive = formData.get("isActive");

  if (typeof rawCadetInfoId !== "string" || !rawCadetInfoId) {
    return { error: "Invalid cadet." };
  }

  const cadetInfoId = Number(rawCadetInfoId);
  if (!Number.isInteger(cadetInfoId) || cadetInfoId <= 0) {
    return { error: "Invalid cadet." };
  }

  if (rawIsActive !== "true" && rawIsActive !== "false") {
    return { error: "Invalid status value." };
  }

  const isActive = rawIsActive === "true";

  const [target] = await db
    .select({ id: cadets.id, intakeId: cadets.intakeId })
    .from(cadets)
    .where(eq(cadets.id, cadetInfoId))
    .limit(1);

  if (!target) {
    return { error: "Cadet not found." };
  }

  if (intakeScope !== null && target.intakeId !== intakeScope) {
    return { error: "You can only manage cadets from your intake." };
  }

  try {
    await db
      .update(cadets)
      .set({ isActive })
      .where(eq(cadets.id, cadetInfoId));
  } catch {
    return { error: "Failed to update status. Please try again." };
  }

  revalidatePath("/admin/secretary/cadets");
  return { success: true };
}

async function uploadImage(
  file: File,
  path: string,
): Promise<string | null> {
  try {
    const supabase = createSupabaseAdminClient();
    return await uploadToStorage(supabase, file, path);
  } catch {
    return null;
  }
}

export async function addCadet(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "cadets")) {
    return { error: "You do not have permission to add cadets." };
  }

  const name = takeString(formData.get("name"));
  const displayName = takeString(formData.get("displayName"));
  const rawArmyNo = takeNumber(formData.get("armyNo"));
  const personalEmail = takeString(formData.get("personalEmail"));
  const eduEmail = takeString(formData.get("eduEmail"));
  const gender = takeString(formData.get("gender"));
  const religion = takeString(formData.get("religion"));
  const race = takeString(formData.get("race"));
  const address = takeString(formData.get("address"));
  const birthdateStr = takeString(formData.get("birthdate"));
  const rank = takeString(formData.get("rank"));
  const matricNo = takeString(formData.get("matricNo"));
  const rawIntakeId = takeNumber(formData.get("intakeId"));
  const quote = takeString(formData.get("quote"));
  const rawIsActive = takeString(formData.get("isActive"));

  if (!name) return { error: "Name is required." };
  if (name.length > 180) return { error: "Name is too long." };
  if (!displayName) return { error: "Display name is required." };
  if (displayName.length > 120) return { error: "Display name is too long." };
  if (rawArmyNo === null || !Number.isInteger(rawArmyNo) || rawArmyNo <= 0) {
    return { error: "Valid army number is required." };
  }
  if (!personalEmail) return { error: "Personal email is required." };
  if (personalEmail.length > 320) return { error: "Personal email is too long." };
  if (!isValidPersonalEmail(personalEmail)) return { error: "Personal email is invalid or cannot be ocean.umt.edu.my." };
  if (eduEmail && eduEmail.length > 320) return { error: "Edu email is too long." };
  if (eduEmail && !isValidEduEmail(eduEmail)) return { error: "Edu email must be from ocean.umt.edu.my." };
  if (!gender || !genderEnum.enumValues.includes(gender as "MALE" | "FEMALE")) {
    return { error: "Valid gender is required." };
  }
  if (!religion || !religionEnum.enumValues.includes(religion as (typeof religionEnum.enumValues)[number])) {
    return { error: "Valid religion is required." };
  }
  if (!race || !raceEnum.enumValues.includes(race as (typeof raceEnum.enumValues)[number])) {
    return { error: "Valid race is required." };
  }
  if (!address) return { error: "Address is required." };
  if (!birthdateStr) return { error: "Birthdate is required." };

  const birthdate = new Date(birthdateStr);
  if (isNaN(birthdate.getTime())) return { error: "Invalid birthdate." };
  const age = calculateAge(birthdate);
  if (age < 18 || age > 24) return { error: "Age must be between 18 and 24." };

  if (!rank || (rank !== "PK" && rank !== "PKW")) {
    return { error: "Valid cadet rank is required (PK or PKW)." };
  }
  if (!matricNo) return { error: "Matric number is required." };
  if (matricNo.length > 80) return { error: "Matric number is too long." };
  if (rawIntakeId === null || !Number.isInteger(rawIntakeId) || rawIntakeId <= 0) {
    return { error: "Valid intake is required." };
  }

  const effectiveIntakeId = intakeScope !== null ? intakeScope : rawIntakeId;

  if (intakeScope !== null && rawIntakeId !== intakeScope) {
    return { error: "You cannot move cadets to a different intake." };
  }

  const isActive = rawIsActive !== "false";

  const redBgFile = takeFile(formData.get("redBgPhoto"));
  const blueBgFile = takeFile(formData.get("blueBgPhoto"));
  const displayFile = takeFile(formData.get("displayPhoto"));

  let redBgPhotoPath: string | null = null;
  let blueBgPhotoPath: string | null = null;
  let displayPhotoPath: string | null = null;

  const storageBase = `intakes/${effectiveIntakeId}/cadets/${rawArmyNo}`;

  try {
    const [memberId] = await db.transaction(async (tx) => {
      const [memberRow] = await tx
        .insert(members)
        .values({
          armyNo: rawArmyNo,
          rank: rank as (typeof memberRankEnum.enumValues)[number],
          name,
          personalEmail,
          eduEmail: eduEmail ?? null,
          displayName,
          gender: gender as "MALE" | "FEMALE",
          role: "CADET",
          religion: religion as (typeof religionEnum.enumValues)[number],
          race: race as (typeof raceEnum.enumValues)[number],
          address,
          birthdate: birthdateStr,
          age,
          kor: "Rejimen Askar Wataniah (RAW)",
          redBgPhotoPath: null,
          blueBgPhotoPath: null,
        })
        .returning({ id: members.id });

      if (!memberRow) throw new Error("Failed to create member.");

      await tx.insert(cadets).values({
        matricNo,
        isActive,
        quote: quote ?? null,
        displayPhotoPath: null,
        cgpa: null,
        height: null,
        weight: null,
        bmi: null,
        studyProgramId: null,
        intakeId: effectiveIntakeId,
        memberId: memberRow.id,
      });

      return [memberRow.id];
    });

    if (redBgFile) {
      const ext = getFileExtension(redBgFile);
      redBgPhotoPath = await uploadImage(redBgFile, `${storageBase}/red-bg.${ext}`);
    }
    if (blueBgFile) {
      const ext = getFileExtension(blueBgFile);
      blueBgPhotoPath = await uploadImage(blueBgFile, `${storageBase}/blue-bg.${ext}`);
    }
    if (displayFile) {
      const ext = getFileExtension(displayFile);
      displayPhotoPath = await uploadImage(displayFile, `${storageBase}/display.${ext}`);
    }

    const memberUpdates: Record<string, string | null> = {};
    if (redBgPhotoPath) memberUpdates.redBgPhotoPath = redBgPhotoPath;
    if (blueBgPhotoPath) memberUpdates.blueBgPhotoPath = blueBgPhotoPath;
    if (Object.keys(memberUpdates).length > 0) {
      await db.update(members).set(memberUpdates).where(eq(members.id, memberId));
    }
    if (displayPhotoPath) {
      await db
        .update(cadets)
        .set({ displayPhotoPath })
        .where(eq(cadets.memberId, memberId));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { error: "A member with this army number or email already exists." };
    }
    if (message.toLowerCase().includes("body size limit")) {
      return { error: "Images are too large. Total size must be under 5 MB." };
    }
    console.error("Error adding cadet:", err);
    return { error: "Failed to add cadet. Please try again." };
  }

  revalidatePath("/admin/secretary/cadets");
  return { success: true };
}

export type CadetDetails = {
  cadetInfoId: number;
  memberId: number;
  name: string;
  displayName: string;
  armyNo: number;
  matricNo: string | null;
  personalEmail: string;
  eduEmail: string | null;
  gender: string;
  religion: string;
  race: string;
  address: string;
  birthdate: string;
  age: number;
  rank: string;
  intakeId: number;
  intakeNo: string;
  quote: string | null;
  isActive: boolean;
  redBgPhotoPath: string | null;
  blueBgPhotoPath: string | null;
  displayPhotoPath: string | null;
};

export async function getCadetDetails(cadetInfoId: number): Promise<{ data: CadetDetails | null; error: string | null }> {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "cadets")) {
    return { data: null, error: "You do not have permission to view cadets." };
  }

  if (!Number.isInteger(cadetInfoId) || cadetInfoId <= 0) {
    return { data: null, error: "Invalid cadet." };
  }

  const [row] = await db
    .select({
      cadetInfoId: cadets.id,
      memberId: members.id,
      name: members.name,
      displayName: members.displayName,
      armyNo: members.armyNo,
      matricNo: cadets.matricNo,
      personalEmail: members.personalEmail,
      eduEmail: members.eduEmail,
      gender: members.gender,
      religion: members.religion,
      race: members.race,
      address: members.address,
      birthdate: members.birthdate,
      age: members.age,
      rank: members.rank,
      intakeId: cadets.intakeId,
      intakeNo: intakes.intakeNo,
      quote: cadets.quote,
      isActive: cadets.isActive,
      redBgPhotoPath: members.redBgPhotoPath,
      blueBgPhotoPath: members.blueBgPhotoPath,
      displayPhotoPath: cadets.displayPhotoPath,
    })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
    .where(eq(cadets.id, cadetInfoId))
    .limit(1);

  if (!row) return { data: null, error: "Cadet not found." };

  if (intakeScope !== null && row.intakeId !== intakeScope) {
    return { data: null, error: "You can only view cadets from your intake." };
  }

  return { data: row, error: null };
}

export async function updateCadet(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "cadets")) {
    return { error: "You do not have permission to edit cadets." };
  }

  const rawCadetInfoId = takeNumber(formData.get("cadetInfoId"));
  const rawMemberId = takeNumber(formData.get("memberId"));

  if (rawCadetInfoId === null || !Number.isInteger(rawCadetInfoId) || rawCadetInfoId <= 0) {
    return { error: "Invalid cadet." };
  }
  if (rawMemberId === null || !Number.isInteger(rawMemberId) || rawMemberId <= 0) {
    return { error: "Invalid member." };
  }

  const [existing] = await db
    .select({ cadetId: cadets.id, memberId: cadets.memberId, intakeId: cadets.intakeId })
    .from(cadets)
    .where(eq(cadets.id, rawCadetInfoId))
    .limit(1);

  if (!existing || existing.memberId !== rawMemberId) {
    return { error: "Cadet not found." };
  }

  if (intakeScope !== null && existing.intakeId !== intakeScope) {
    return { error: "You can only edit cadets from your intake." };
  }

  const name = takeString(formData.get("name"));
  const displayName = takeString(formData.get("displayName"));
  const rawArmyNo = takeNumber(formData.get("armyNo"));
  const personalEmail = takeString(formData.get("personalEmail"));
  const eduEmail = takeString(formData.get("eduEmail"));
  const gender = takeString(formData.get("gender"));
  const religion = takeString(formData.get("religion"));
  const race = takeString(formData.get("race"));
  const address = takeString(formData.get("address"));
  const birthdateStr = takeString(formData.get("birthdate"));
  const rank = takeString(formData.get("rank"));
  const matricNo = takeString(formData.get("matricNo"));
  const rawIntakeId = takeNumber(formData.get("intakeId"));
  const quote = takeString(formData.get("quote"));
  const rawIsActive = takeString(formData.get("isActive"));

  if (!name) return { error: "Name is required." };
  if (name.length > 180) return { error: "Name is too long." };
  if (!displayName) return { error: "Display name is required." };
  if (displayName.length > 120) return { error: "Display name is too long." };
  if (rawArmyNo === null || !Number.isInteger(rawArmyNo) || rawArmyNo <= 0) {
    return { error: "Valid army number is required." };
  }
  if (!personalEmail) return { error: "Personal email is required." };
  if (personalEmail.length > 320) return { error: "Personal email is too long." };
  if (!isValidPersonalEmail(personalEmail)) return { error: "Personal email is invalid or cannot be ocean.umt.edu.my." };
  if (eduEmail && eduEmail.length > 320) return { error: "Edu email is too long." };
  if (eduEmail && !isValidEduEmail(eduEmail)) return { error: "Edu email must be from ocean.umt.edu.my." };
  if (!gender || !genderEnum.enumValues.includes(gender as "MALE" | "FEMALE")) {
    return { error: "Valid gender is required." };
  }
  if (!religion || !religionEnum.enumValues.includes(religion as (typeof religionEnum.enumValues)[number])) {
    return { error: "Valid religion is required." };
  }
  if (!race || !raceEnum.enumValues.includes(race as (typeof raceEnum.enumValues)[number])) {
    return { error: "Valid race is required." };
  }
  if (!address) return { error: "Address is required." };
  if (!birthdateStr) return { error: "Birthdate is required." };

  const birthdate = new Date(birthdateStr);
  if (isNaN(birthdate.getTime())) return { error: "Invalid birthdate." };
  const age = calculateAge(birthdate);
  if (age < 18 || age > 24) return { error: "Age must be between 18 and 24." };

  if (!matricNo) return { error: "Matric number is required." };
  if (matricNo.length > 80) return { error: "Matric number is too long." };
  if (rawIntakeId === null || !Number.isInteger(rawIntakeId) || rawIntakeId <= 0) {
    return { error: "Valid intake is required." };
  }

  const effectiveIntakeId = intakeScope !== null ? intakeScope : rawIntakeId;

  if (intakeScope !== null && rawIntakeId !== intakeScope) {
    return { error: "You cannot move cadets to a different intake." };
  }

  const isActive = rawIsActive !== "false";
  const removeRedBg = formData.get("removeRedBgPhoto") === "true";
  const removeBlueBg = formData.get("removeBlueBgPhoto") === "true";
  const removeDisplay = formData.get("removeDisplayPhoto") === "true";

  const redBgFile = takeFile(formData.get("redBgPhoto"));
  const blueBgFile = takeFile(formData.get("blueBgPhoto"));
  const displayFile = takeFile(formData.get("displayPhoto"));

  const storageBase = `intakes/${effectiveIntakeId}/cadets/${rawArmyNo}`;

  try {
    await db.transaction(async (tx) => {
      const memberUpdates: Record<string, unknown> = {
        name,
        displayName,
        armyNo: rawArmyNo,
        personalEmail,
        eduEmail: eduEmail ?? null,
        gender: gender as "MALE" | "FEMALE",
        religion: religion as (typeof religionEnum.enumValues)[number],
        race: race as (typeof raceEnum.enumValues)[number],
        address,
        birthdate: birthdateStr,
        age,
        rank: rank as (typeof memberRankEnum.enumValues)[number],
      };

      if (removeRedBg) memberUpdates.redBgPhotoPath = null;
      if (removeBlueBg) memberUpdates.blueBgPhotoPath = null;

      await tx.update(members).set(memberUpdates).where(eq(members.id, rawMemberId));

      await tx.update(cadets).set({
        matricNo,
        isActive,
        quote: quote ?? null,
        intakeId: effectiveIntakeId,
        ...(removeDisplay ? { displayPhotoPath: null } : {}),
      }).where(eq(cadets.id, rawCadetInfoId));
    });

    if (redBgFile) {
      const ext = getFileExtension(redBgFile);
      const path = await uploadImage(redBgFile, `${storageBase}/red-bg.${ext}`);
      if (path) await db.update(members).set({ redBgPhotoPath: path }).where(eq(members.id, rawMemberId));
    }
    if (blueBgFile) {
      const ext = getFileExtension(blueBgFile);
      const path = await uploadImage(blueBgFile, `${storageBase}/blue-bg.${ext}`);
      if (path) await db.update(members).set({ blueBgPhotoPath: path }).where(eq(members.id, rawMemberId));
    }
    if (displayFile) {
      const ext = getFileExtension(displayFile);
      const path = await uploadImage(displayFile, `${storageBase}/display.${ext}`);
      if (path) await db.update(cadets).set({ displayPhotoPath: path }).where(eq(cadets.id, rawCadetInfoId));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { error: "A member with this army number or email already exists." };
    }
    if (message.toLowerCase().includes("body size limit")) {
      return { error: "Images are too large. Total size must be under 5 MB." };
    }
    console.error("Error updating cadet:", err);
    return { error: "Failed to update cadet. Please try again." };
  }

  revalidatePath("/admin/secretary/cadets");
  return { success: true };
}
