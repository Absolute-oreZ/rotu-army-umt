"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { treasuryAccounts, collections, intakes, adminUsers, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/supabase/storage";
import { signedStorageUrl } from "@/lib/supabase/storage";
import { bankEnum } from "@/db/schema";
import {
  assertIntakeOwnership,
  getAllowedImageExtension,
  resolveScopedIntakeId,
  takeString,
  takeNumber,
} from "@/lib/admin/form-helpers";

export type AccountDetails = {
  id: number;
  intakeId: number;
  intakeNo: string;
  bankName: string;
  accountNumber: number;
  qrCodePath: string | null;
  qrCodeUrl: string | null;
  duitNowId: number | null;
  treasurerName: string;
  createdAt: string;
};

export async function getAccountDetails(accountId: number): Promise<{ data: AccountDetails | null; error: string | null }> {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accounts")) {
    return { data: null, error: "You do not have permission to view treasury accounts." };
  }

  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { data: null, error: "Invalid account." };
  }

  const [row] = await db
    .select({
      id: treasuryAccounts.id,
      intakeId: treasuryAccounts.intakeId,
      intakeNo: intakes.intakeNo,
      bankName: treasuryAccounts.bankName,
      accountNumber: treasuryAccounts.accountNumber,
      qrCodePath: treasuryAccounts.qrCodePath,
      duitNowId: treasuryAccounts.duitNowId,
      treasurerName: members.name,
      createdAt: treasuryAccounts.createdAt,
    })
    .from(treasuryAccounts)
    .innerJoin(intakes, eq(intakes.id, treasuryAccounts.intakeId))
    .innerJoin(adminUsers, eq(adminUsers.id, treasuryAccounts.treasurerId))
    .innerJoin(members, eq(members.id, adminUsers.memberId))
    .where(eq(treasuryAccounts.id, accountId))
    .limit(1);

  if (!row) {
    return { data: null, error: "Account not found." };
  }

  const scopeError = assertIntakeOwnership(row.intakeId, intakeScope);
  if (scopeError) {
    return { data: null, error: scopeError };
  }

  return {
    data: {
      ...row,
      qrCodeUrl: await signedStorageUrl(createSupabaseAdminClient(), row.qrCodePath),
      createdAt: row.createdAt.toISOString(),
    },
    error: null,
  };
}

export async function createTreasuryAccount(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accounts")) {
    return { error: "You do not have permission to manage treasury accounts." };
  }

  const resolved = resolveScopedIntakeId(formData, intakeScope);
  if (!resolved.ok) return { error: resolved.error };
  const effectiveIntakeId = resolved.intakeId;

  const bankName = takeString(formData.get("bankName"));
  const accountNumber = takeNumber(formData.get("accountNumber"));
  const duitNowId = takeNumber(formData.get("duitNowId"));

  if (!bankName || !bankEnum.enumValues.includes(bankName as (typeof bankEnum.enumValues)[number])) {
    return { error: "Valid bank name is required." };
  }

  if (accountNumber === null || !Number.isInteger(accountNumber) || accountNumber <= 0) {
    return { error: "Valid account number is required." };
  }

  if (duitNowId !== null && (!Number.isInteger(duitNowId) || duitNowId <= 0)) {
    return { error: "Valid DuitNow ID is required." };
  }

  const rawQr = formData.get("qrCode");
  const qrFile = rawQr instanceof File && rawQr.size > 0 ? rawQr : null;

  if (qrFile) {
    if (qrFile.size > 5 * 1024 * 1024) {
      return { error: "QR code must be under 5 MB." };
    }
    if (!getAllowedImageExtension(qrFile)) {
      return { error: "QR code must be a JPG, PNG, or WebP image." };
    }
  }

  try {
    const [account] = await db
      .insert(treasuryAccounts)
      .values({
        intakeId: effectiveIntakeId,
        treasurerId: admin.id,
        bankName: bankName as (typeof bankEnum.enumValues)[number],
        accountNumber,
        duitNowId,
        qrCodePath: null,
      })
      .returning({ id: treasuryAccounts.id });

    if (!account) {
      return { error: "Failed to create account." };
    }

    if (qrFile) {
      const ext = getAllowedImageExtension(qrFile);
      if (ext) {
        const path = `treasury/${effectiveIntakeId}/accounts/${account.id}/qr.${ext}`;
        const supabase = createSupabaseAdminClient();
        const qrCodePath = await uploadToStorage(supabase, qrFile, path);
        if (qrCodePath) {
          await db
            .update(treasuryAccounts)
            .set({ qrCodePath })
            .where(eq(treasuryAccounts.id, account.id));
        }
      }
    }
  } catch (err) {
    console.error("createTreasuryAccount failed", err);
    return { error: "Failed to create treasury account." };
  }

  revalidatePath("/admin/treasurer/accounts");
  return { success: true };
}

export async function updateTreasuryAccount(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accounts")) {
    return { error: "You do not have permission to manage treasury accounts." };
  }

  const rawAccountId = takeString(formData.get("accountId"));
  if (!rawAccountId) {
    return { error: "Invalid account." };
  }

  const accountId = Number(rawAccountId);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: "Invalid account." };
  }

  const [existing] = await db
    .select({ id: treasuryAccounts.id, intakeId: treasuryAccounts.intakeId })
    .from(treasuryAccounts)
    .where(eq(treasuryAccounts.id, accountId))
    .limit(1);

  if (!existing) {
    return { error: "Account not found." };
  }

  const scopeError = assertIntakeOwnership(existing.intakeId, intakeScope);
  if (scopeError) return { error: scopeError };

  const bankName = takeString(formData.get("bankName"));
  const accountNumber = takeNumber(formData.get("accountNumber"));
  const duitNowId = takeNumber(formData.get("duitNowId"));

  if (!bankName || !bankEnum.enumValues.includes(bankName as (typeof bankEnum.enumValues)[number])) {
    return { error: "Valid bank name is required." };
  }

  if (accountNumber === null || !Number.isInteger(accountNumber) || accountNumber <= 0) {
    return { error: "Valid account number is required." };
  }

  if (duitNowId !== null && (!Number.isInteger(duitNowId) || duitNowId <= 0)) {
    return { error: "Valid DuitNow ID is required." };
  }

  const rawQr = formData.get("qrCode");
  const qrFile = rawQr instanceof File && rawQr.size > 0 ? rawQr : null;
  const removeQr = formData.get("removeQrCode") === "true";

  if (qrFile) {
    if (qrFile.size > 5 * 1024 * 1024) {
      return { error: "QR code must be under 5 MB." };
    }
    if (!getAllowedImageExtension(qrFile)) {
      return { error: "QR code must be a JPG, PNG, or WebP image." };
    }
  }

  try {
    await db.update(treasuryAccounts).set({
      bankName: bankName as (typeof bankEnum.enumValues)[number],
      accountNumber,
      duitNowId,
      ...(removeQr ? { qrCodePath: null } : {}),
    }).where(eq(treasuryAccounts.id, accountId));

    if (qrFile) {
      const ext = getAllowedImageExtension(qrFile);
      if (ext) {
        const path = `treasury/${existing.intakeId}/accounts/${accountId}/qr.${ext}`;
        const supabase = createSupabaseAdminClient();
        const qrCodePath = await uploadToStorage(supabase, qrFile, path);
        if (qrCodePath) {
          await db
            .update(treasuryAccounts)
            .set({ qrCodePath })
            .where(eq(treasuryAccounts.id, accountId));
        }
      }
    }
  } catch (err) {
    console.error("updateTreasuryAccount failed", err);
    return { error: "Failed to update account." };
  }

  revalidatePath("/admin/treasurer/accounts");
  return { success: true };
}

export async function deleteTreasuryAccount(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "accounts")) {
    return { error: "You do not have permission to manage treasury accounts." };
  }

  const rawAccountId = takeString(formData.get("accountId"));
  if (!rawAccountId) {
    return { error: "Invalid account." };
  }

  const accountId = Number(rawAccountId);
  if (!Number.isInteger(accountId) || accountId <= 0) {
    return { error: "Invalid account." };
  }

  const [existing] = await db
    .select({ id: treasuryAccounts.id, intakeId: treasuryAccounts.intakeId })
    .from(treasuryAccounts)
    .where(eq(treasuryAccounts.id, accountId))
    .limit(1);

  if (!existing) {
    return { error: "Account not found." };
  }

  const scopeError = assertIntakeOwnership(existing.intakeId, intakeScope);
  if (scopeError) return { error: scopeError };

  const [activeCollection] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.paymentAccountId, accountId),
        eq(collections.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  if (activeCollection) {
    return { error: "Cannot delete account with active published collections." };
  }

  try {
    await db.delete(treasuryAccounts).where(eq(treasuryAccounts.id, accountId));
  } catch (err) {
    console.error("deleteTreasuryAccount failed", err);
    return { error: "Failed to delete account." };
  }

  revalidatePath("/admin/treasurer/accounts");
  return { success: true };
}
