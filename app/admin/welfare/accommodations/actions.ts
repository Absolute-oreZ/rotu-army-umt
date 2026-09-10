"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accommodations, cadets, members } from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { takeNumber, takeString } from "@/lib/admin/form-helpers";

const MAX_ADDRESS_LENGTH = 300;

function parseType(value: string | null): "HOSTEL" | "RENTAL" | null {
  return value === "HOSTEL" || value === "RENTAL" ? value : null;
}

function parseCadetId(formData: FormData): number | null {
  const raw = takeNumber(formData.get("cadetId"));
  if (raw === null || !Number.isInteger(raw) || raw <= 0) return null;
  return raw;
}

async function loadOwnedCadet(
  cadetId: number,
  intakeScope: number | null,
  adminGender: "MALE" | "FEMALE",
) {
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
    return { ok: false as const, error: "Cadet not found." };
  }

  if (intakeScope !== null && cadet.intakeId !== intakeScope) {
    return { ok: false as const, error: "You can only manage accommodations from your intake." };
  }

  if (intakeScope !== null && cadet.gender !== adminGender) {
    return {
      ok: false as const,
      error: "You can only manage accommodations of cadets with the same gender as you.",
    };
  }

  return { ok: true as const, cadet };
}

export async function updateAccommodation(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accommodations")) {
    return { error: "You do not have permission to manage accommodations." };
  }

  const cadetId = parseCadetId(formData);
  if (cadetId === null) return { error: "Invalid cadet." };

  const type = parseType(takeString(formData.get("type")));
  if (type === null) return { error: "Valid accommodation type is required." };

  const address = takeString(formData.get("address"));
  if (address !== null && address.length > MAX_ADDRESS_LENGTH) {
    return { error: `Address must be at most ${MAX_ADDRESS_LENGTH} characters.` };
  }

  const loaded = await loadOwnedCadet(cadetId, intakeScope, admin.gender);
  if (!loaded.ok) return { error: loaded.error };

  try {
    await db
      .insert(accommodations)
      .values({ cadetId, type, address: address ?? null })
      .onConflictDoUpdate({
        target: accommodations.cadetId,
        set: { type, address: address ?? null, updatedAt: new Date() },
      });
  } catch (err) {
    console.error("updateAccommodation failed", err);
    return { error: "Failed to save accommodation." };
  }

  revalidatePath("/admin/welfare/accommodations");
  return { success: true as const };
}