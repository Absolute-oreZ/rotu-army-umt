"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bankEnum, cadetAccounts, claims } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/supabase/storage";
import {
  getAllowedImageExtension,
  sanitizeMoney,
  takeFile,
  takeString,
} from "@/lib/admin/form-helpers";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function takeBoolean(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value === "true";
}

export async function createClaim(formData: FormData) {
  const cadet = await requireCurrentCadet();

  const title = takeString(formData.get("title"));
  if (!title || title.length > 200) {
    return { error: "Title is required and must be under 200 characters." };
  }

  const amount = sanitizeMoney(formData.get("amount"));
  if (amount === null) {
    return { error: "Enter a valid amount." };
  }

  const bankName = takeString(formData.get("bankName"));
  if (!bankName || !bankEnum.enumValues.includes(bankName as (typeof bankEnum.enumValues)[number])) {
    return { error: "Bank is required." };
  }

  const rawAccountNumber = takeString(formData.get("accountNumber"));
  if (!rawAccountNumber || !/^\d+$/.test(rawAccountNumber)) {
    return { error: "Account number is required." };
  }
  const accountNumber = Number(rawAccountNumber);
  if (!Number.isInteger(accountNumber) || accountNumber <= 0) {
    return { error: "Enter a valid account number." };
  }

  const rawDuitNowId = takeString(formData.get("duitNowId"));
  const duitNowId =
    rawDuitNowId === null
      ? null
      : Number(rawDuitNowId);
  if (rawDuitNowId !== null && (!Number.isInteger(duitNowId!) || duitNowId! <= 0)) {
    return { error: "Enter a valid DuitNow ID." };
  }

  const receiptFile = takeFile(formData.get("receipt"));
  if (!receiptFile) return { error: "Receipt is required." };
  if (receiptFile.size > MAX_FILE_SIZE) {
    return { error: "Receipt must be under 5 MB." };
  }

  const qrFile = takeFile(formData.get("qrCode"));
  if (qrFile && qrFile.size > MAX_FILE_SIZE) {
    return { error: "QR code must be under 5 MB." };
  }

  const saveAccount = takeBoolean(formData.get("saveAccount"));
  const description = takeString(formData.get("description"));

  const [existingAccount] = await db
    .select({
      id: cadetAccounts.id,
      qrCodePath: cadetAccounts.qrCodePath,
    })
    .from(cadetAccounts)
    .where(eq(cadetAccounts.memberId, cadet.memberId))
    .limit(1);

  const timestamp = Date.now();
  const basePath = `claims/${cadet.intakeId}/${cadet.memberId}/${timestamp}`;
  const supabase = createSupabaseAdminClient();

  const receiptExt = getAllowedImageExtension(receiptFile) ?? "jpg";
  const receiptPath = await uploadToStorage(
    supabase,
    receiptFile,
    `${basePath}/receipt.${receiptExt}`,
  );
  if (!receiptPath) return { error: "Failed to upload receipt." };

  let qrCodePath = existingAccount?.qrCodePath ?? null;
  if (qrFile) {
    const qrExt = getAllowedImageExtension(qrFile) ?? "jpg";
    qrCodePath = await uploadToStorage(
      supabase,
      qrFile,
      `${basePath}/qr.${qrExt}`,
    );
    if (!qrCodePath) return { error: "Failed to upload QR code." };
  }

  if (!qrCodePath) {
    return { error: "QR code is required." };
  }

  try {
    await db.insert(claims).values({
      memberId: cadet.memberId,
      intakeId: cadet.intakeId,
      title,
      amount,
      receiptPath,
      qrCodePath,
      description,
    });

    if (saveAccount || !existingAccount) {
      const accountValues = {
        memberId: cadet.memberId,
        bankName: bankName as (typeof bankEnum.enumValues)[number],
        accountNumber,
        duitNowId,
        qrCodePath,
        updatedAt: new Date(),
      };

      if (existingAccount) {
        await db
          .update(cadetAccounts)
          .set(accountValues)
          .where(eq(cadetAccounts.memberId, cadet.memberId));
      } else {
        await db.insert(cadetAccounts).values({
          ...accountValues,
          qrCodePath,
        });
      }
    }
  } catch (err) {
    console.error("createClaim failed", err);
    return { error: "Failed to create claim." };
  }

  revalidatePath("/cadet/claims");
  return { success: true };
}
