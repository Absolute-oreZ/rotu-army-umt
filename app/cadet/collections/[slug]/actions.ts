"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collections, collectionPayments } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/supabase/storage";
import {
  getAllowedImageExtension,
  sanitizeMoney,
  takeString,
} from "@/lib/admin/form-helpers";

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

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

  if (receiptFile) {
    if (receiptFile.size > MAX_RECEIPT_SIZE) {
      return { error: "Receipt file must be under 5 MB." };
    }
    const ext = getAllowedImageExtension(receiptFile);
    if (!ext) {
      return { error: "Receipt must be a JPG, PNG, or WebP image." };
    }
    const path = `payments/${collectionId}/${cadet.memberId}/receipt.${ext}`;
    const supabase = createSupabaseAdminClient();
    receiptPath = await uploadToStorage(supabase, receiptFile, path);
    if (receiptPath === null) {
      return { error: "Failed to upload receipt." };
    }
  }

  try {
    await db.insert(collectionPayments).values({
      collectionId,
      memberId: cadet.memberId,
      amountPaid,
      receiptPath,
    });
  } catch (err) {
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
