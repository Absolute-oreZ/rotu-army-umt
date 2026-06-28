"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { assertIntakeOwnership, takeString } from "@/lib/admin/form-helpers";

export async function updateClaimStatus(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "claims")) {
    return { error: "Unauthorized." };
  }

  const rawClaimId = takeString(formData.get("claimId"));
  if (!rawClaimId) return { error: "Invalid claim." };
  const claimId = Number(rawClaimId);
  if (!Number.isInteger(claimId) || claimId <= 0) {
    return { error: "Invalid claim." };
  }

  const rawStatus = takeString(formData.get("status"));
  if (rawStatus !== "FULFILLED" && rawStatus !== "REJECTED") {
    return { error: "Invalid status." };
  }

  const [existing] = await db
    .select({ id: claims.id, status: claims.status, intakeId: claims.intakeId })
    .from(claims)
    .where(eq(claims.id, claimId))
    .limit(1);

  if (!existing) return { error: "Claim not found." };
  if (existing.status !== "PENDING") {
    return { error: "This claim has already been processed." };
  }

  const scopeError = assertIntakeOwnership(existing.intakeId, intakeScope);
  if (scopeError) return { error: scopeError };

  const now = new Date();

  try {
    await db
      .update(claims)
      .set({
        status: rawStatus,
        ...(rawStatus === "FULFILLED" ? { fulfilledAt: now } : {}),
        ...(rawStatus === "REJECTED" ? { rejectedAt: now } : {}),
        updatedAt: now,
      })
      .where(eq(claims.id, claimId));
  } catch (err) {
    console.error("updateClaimStatus failed", err);
    return { error: "Failed to update claim status." };
  }

  revalidatePath("/admin/treasurer/claims");
  return { success: true };
}
