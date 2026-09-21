"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bankEnum, cadetAccounts, claims } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, deleteManyFromStorage, saveImage, saveUpload } from "@/lib/supabase/storage";
import { sanitizeMoney, takeFile, takeString } from "@/lib/admin/form-helpers";

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

  const rawDuitNowId = takeString(formData.get("duitNowId"));
  if (rawDuitNowId !== null && rawDuitNowId !== "" && (!/^\d+$/.test(rawDuitNowId) || rawDuitNowId.length > 15)) {
    return { error: "Enter a valid DuitNow ID." };
  }

  const receiptFile = takeFile(formData.get("receipt"));
  if (!receiptFile) return { error: "Receipt is required." };

  const qrFile = takeFile(formData.get("qrCode"));

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

  const supabase = createSupabaseAdminClient();
  const uploadedPaths: string[] = [];

  const savedReceipt = await saveUpload({
    supabase,
    file: receiptFile,
    prefix: `claims/${cadet.intakeId}/${cadet.memberId}`,
    stem: "receipt",
    kinds: ["image", "pdf"],
  });

  if (!savedReceipt.ok) {
    return { error: savedReceipt.error };
  }

  uploadedPaths.push(savedReceipt.path);

  let qrCodePath = existingAccount?.qrCodePath ?? null;
  let obsoleteQrPath: string | null = null;

  if (qrFile) {
    const savedQr = await saveImage({
      supabase,
      file: qrFile,
      prefix: `claims/${cadet.intakeId}/${cadet.memberId}`,
      stem: "qr",
    });

    if (!savedQr.ok) {
      await deleteManyFromStorage(supabase, uploadedPaths);
      return { error: savedQr.error };
    }

    uploadedPaths.push(savedQr.path);
    qrCodePath = savedQr.path;
    if (existingAccount?.qrCodePath) obsoleteQrPath = existingAccount.qrCodePath;
  }

  if (!qrCodePath) {
    await deleteManyFromStorage(supabase, uploadedPaths);
    return { error: "QR code is required." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(claims).values({
        memberId: cadet.memberId,
        intakeId: cadet.intakeId,
        title,
        amount,
        receiptPath: savedReceipt.path,
        qrCodePath,
        description,
      });

      if (saveAccount || !existingAccount) {
        const accountValues = {
          memberId: cadet.memberId,
          bankName: bankName as (typeof bankEnum.enumValues)[number],
          accountNumberText: rawAccountNumber,
          duitNowIdText: rawDuitNowId,
          qrCodePath,
          updatedAt: new Date(),
        };

        if (existingAccount) {
          await tx
            .update(cadetAccounts)
            .set(accountValues)
            .where(eq(cadetAccounts.memberId, cadet.memberId));
        } else {
          await tx.insert(cadetAccounts).values(accountValues);
        }
      }
    });
  } catch (err) {
    console.error("createClaim failed", err);
    await deleteManyFromStorage(supabase, uploadedPaths);
    return { error: "Failed to create claim." };
  }

  if (obsoleteQrPath) {
    const [stillReferenced] = await db
      .select({ id: claims.id })
      .from(claims)
      .where(eq(claims.qrCodePath, obsoleteQrPath))
      .limit(1);

    if (!stillReferenced) {
      await deleteFromStorage(supabase, obsoleteQrPath);
    }
  }

  revalidatePath("/cadet/claims");
  return { success: true };
}
