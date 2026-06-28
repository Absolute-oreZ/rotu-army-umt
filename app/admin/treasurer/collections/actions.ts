"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collections, collectionPayments, treasuryAccounts } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { collectionPurposeEnum } from "@/db/schema";
import { slugify } from "@/lib/slugify";
import {
  assertIntakeOwnership,
  resolveScopedIntakeId,
  takeString,
  takeNumber,
} from "@/lib/admin/form-helpers";

async function generateUniqueSlug(title: string): Promise<string> {
  let slug = slugify(title);
  let counter = 1;
  const base = slug;

  while (true) {
    const [existing] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);

    if (!existing) return slug;

    slug = `${base}-${counter}`;
    counter++;
  }
}

export async function createCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const resolved = resolveScopedIntakeId(formData, intakeScope);
  if (!resolved.ok) return { error: resolved.error };
  const effectiveIntakeId = resolved.intakeId;

  const title = takeString(formData.get("title"));
  const purpose = takeString(formData.get("purpose"));
  const description = takeString(formData.get("description"));
  const rawAmount = takeNumber(formData.get("amount"));
  const isFixedAmount = formData.get("isFixedAmount") === "true";
  const isReceiptRequired = formData.get("isReceiptRequired") !== "false";
  const rawPaymentAccountId = takeNumber(formData.get("paymentAccountId"));

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long." };

  if (!purpose || !collectionPurposeEnum.enumValues.includes(purpose as (typeof collectionPurposeEnum.enumValues)[number])) {
    return { error: "Valid purpose is required." };
  }

  if (isFixedAmount && (rawAmount === null || rawAmount <= 0)) {
    return { error: "Valid amount is required for fixed-amount collections." };
  }

  if (rawPaymentAccountId === null || !Number.isInteger(rawPaymentAccountId) || rawPaymentAccountId <= 0) {
    return { error: "Valid payment account is required." };
  }

  const [account] = await db
    .select({ id: treasuryAccounts.id, intakeId: treasuryAccounts.intakeId })
    .from(treasuryAccounts)
    .where(eq(treasuryAccounts.id, rawPaymentAccountId))
    .limit(1);

  if (!account) {
    return { error: "Payment account not found." };
  }

  if (account.intakeId !== effectiveIntakeId) {
    return { error: "Payment account must belong to the selected intake." };
  }

  const slug = await generateUniqueSlug(title);

  try {
    await db.insert(collections).values({
      intakeId: effectiveIntakeId,
      treasurerId: admin.id,
      title,
      slug,
      purpose: purpose as (typeof collectionPurposeEnum.enumValues)[number],
      description: description ?? null,
      amount: rawAmount !== null ? String(rawAmount) : null,
      isFixedAmount,
      isReceiptRequired,
      paymentAccountId: rawPaymentAccountId,
      status: "DRAFT",
    });
  } catch (err) {
    console.error("createCollection failed", err);
    return { error: "Failed to create collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}

type CollectionRow = {
  id: number;
  intakeId: number;
  status?: string;
};

async function loadOwnedCollection(
  formData: FormData,
  intakeScope: number | null,
): Promise<{ ok: true; row: CollectionRow; id: number } | { ok: false; error: string }> {
  const rawCollectionId = takeString(formData.get("collectionId"));
  if (!rawCollectionId) return { ok: false, error: "Invalid collection." };

  const collectionId = Number(rawCollectionId);
  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return { ok: false, error: "Invalid collection." };
  }

  const [existing] = await db
    .select({ id: collections.id, intakeId: collections.intakeId, status: collections.status })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!existing) return { ok: false, error: "Collection not found." };

  const scopeError = assertIntakeOwnership(existing.intakeId, intakeScope);
  if (scopeError) return { ok: false, error: scopeError };

  return { ok: true, row: existing, id: collectionId };
}

export async function publishCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const loaded = await loadOwnedCollection(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };
  if (loaded.row.status === "PUBLISHED") {
    return { error: "Collection is already published." };
  }

  try {
    await db
      .update(collections)
      .set({ status: "PUBLISHED" })
      .where(eq(collections.id, loaded.id));
  } catch (err) {
    console.error("publishCollection failed", err);
    return { error: "Failed to publish collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}

export async function archiveCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const loaded = await loadOwnedCollection(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  try {
    await db
      .update(collections)
      .set({ status: "ARCHIVED" })
      .where(eq(collections.id, loaded.id));
  } catch (err) {
    console.error("archiveCollection failed", err);
    return { error: "Failed to archive collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}

export async function restoreCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const loaded = await loadOwnedCollection(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };
  if (loaded.row.status !== "ARCHIVED") {
    return { error: "Only archived collections can be restored." };
  }

  try {
    await db
      .update(collections)
      .set({ status: "PUBLISHED" })
      .where(eq(collections.id, loaded.id));
  } catch (err) {
    console.error("restoreCollection failed", err);
    return { error: "Failed to restore collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}

export async function unpublishCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const loaded = await loadOwnedCollection(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };
  if (loaded.row.status !== "PUBLISHED") {
    return { error: "Only published collections can be unpublished." };
  }

  try {
    await db
      .update(collections)
      .set({ status: "DRAFT", updatedAt: new Date() })
      .where(eq(collections.id, loaded.id));
  } catch (err) {
    console.error("unpublishCollection failed", err);
    return { error: "Failed to unpublish collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}

export async function deleteCollection(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "collections")) {
    return { error: "You do not have permission to manage collections." };
  }

  const loaded = await loadOwnedCollection(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const [payment] = await db
    .select({ id: collectionPayments.id })
    .from(collectionPayments)
    .where(eq(collectionPayments.collectionId, loaded.id))
    .limit(1);

  if (payment) {
    return { error: "Cannot delete collection with existing payments." };
  }

  try {
    await db.delete(collections).where(eq(collections.id, loaded.id));
  } catch (err) {
    console.error("deleteCollection failed", err);
    return { error: "Failed to delete collection." };
  }

  revalidatePath("/admin/treasurer/collections");
  return { success: true };
}
