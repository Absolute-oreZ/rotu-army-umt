"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collections, collectionPayments } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, saveUpload } from "@/lib/supabase/storage";
import { sanitizeMoney, takeString } from "@/lib/admin/form-helpers";

export async function recordPayment(formData: FormData) {
  const cadet = await requireCurrentCadet();

  const rawCollectionId = takeString(formData.get("collectionId"));
  if (!rawCollectionId) return { error: "Invalid collection." };

  const collectionId = Number(rawCollectionId);
  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return { error: "Invalid collection." };
  }

  const [collection] = await db
    .select({
      id: collections.id,
      intakeId: collections.intakeId,
      status: collections.status,
      isFixedAmount: collections.isFixedAmount,
      isReceiptRequired: collections.isReceiptRequired,
      amount: collections.amount,
      paymentAccountId: collections.paymentAccountId,
    })
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) return { error: "Collection not found." };
  if (collection.status !== "PUBLISHED") return { error: "This collection is no longer accepting payments." };
  if (collection.intakeId !== cadet.intakeId) return { error: "This collection is not for your intake." };

  if (collection.paymentAccountId === null) {
    return { error: "Payment account is not configured." };
  }

  const [existingPayment] = await db
    .select({ id: collectionPayments.id })
    .from(collectionPayments)
    .where(
      and(
        eq(collectionPayments.collectionId, collectionId),
        eq(collectionPayments.memberId, cadet.memberId),
      ),
    )
    .limit(1);

  if (existingPayment) {
    return { error: "You have already recorded a payment for this collection." };
  }

  const amountPaid = collection.isFixedAmount
    ? collection.amount ?? null
    : sanitizeMoney(formData.get("amount"));

  if (amountPaid === null) {
    return { error: collection.isFixedAmount ? "Collection amount is not set." : "Enter a valid amount." };
  }

  const rawReceipt = formData.get("receipt");
  const receiptFile = rawReceipt instanceof File && rawReceipt.size > 0 ? rawReceipt : null;

  if (collection.isReceiptRequired && !receiptFile) {
    return { error: "Receipt is required." };
  }

  let receiptPath: string | null = null;
  const supabase = createSupabaseAdminClient();

  if (receiptFile) {
    const saved = await saveUpload({
      supabase,
      file: receiptFile,
      prefix: `payments/${collectionId}/${cadet.memberId}`,
      stem: "receipt",
      kinds: ["image", "pdf"],
    });

    if (!saved.ok) {
      return { error: saved.error };
    }

    receiptPath = saved.path;
  }

  try {
    await db.insert(collectionPayments).values({
      collectionId,
      memberId: cadet.memberId,
      amountPaid,
      receiptPath,
    });
  } catch (err) {
    if (receiptPath) {
      await deleteFromStorage(supabase, receiptPath);
    }
    if (isUniqueViolation(err)) {
      return { error: "You have already recorded a payment for this collection." };
    }
    console.error("recordPayment failed", err);
    return { error: "Failed to record payment." };
  }

  revalidatePath(`/cadet/collections/${takeString(formData.get("slug")) ?? ""}`);
  return { success: true };
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === "23505";
}
