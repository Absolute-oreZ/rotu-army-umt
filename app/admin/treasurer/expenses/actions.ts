"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { expenses, expenseReceipts, intakes } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import {
  assertIntakeOwnership,
  getAllowedImageExtension,
  resolveScopedIntakeId,
  sanitizeMoney,
  takeString,
} from "@/lib/admin/form-helpers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, signedStorageUrl, uploadToStorage } from "@/lib/supabase/storage";
import { slugify } from "@/lib/slugify";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

export type ExpenseDetails = {
  id: number;
  intakeId: number;
  intakeNo: string;
  title: string;
  description: string | null;
  amount: string;
  createdAt: string;
  receipts: {
    id: number;
    filePath: string | null;
    createdAt: string;
  }[];
};

type ReceiptInsert = {
  expenseId: number;
  filePath: string;
};

function takeFiles(values: FormDataEntryValue[]): File[] {
  return values.filter((value): value is File => value instanceof File && value.size > 0);
}

function getFileStem(file: File) {
  const name = file.name.replace(/\.[^.]+$/, "");
  return slugify(name) || "receipt";
}

function validateReceipts(files: File[]): string | null {
  for (const file of files) {
    if (!getAllowedImageExtension(file)) {
      return "Receipt files must be JPG, PNG, or WebP images.";
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      return "Each receipt must be under 5 MB.";
    }
  }
  return null;
}

/**
 * Upload a batch of receipt files for an expense and return the rows to insert.
 * Uses insert-then-returning on expense_receipts so the DB owns the id (no
 * manual sequence reservation). On any upload failure throws so the caller can
 * roll back created rows and already-uploaded files.
 */
async function uploadExpenseReceipts(
  supabase: SupabaseClient,
  files: File[],
  intakeId: number,
  expenseId: number,
): Promise<{ rows: ReceiptInsert[]; paths: string[] }> {
  const paths: string[] = [];
  const staged: Array<{ filePath: string; ext: string; stem: string }> = [];

  for (const file of files) {
    const ext = getAllowedImageExtension(file) ?? "jpg";
    const stem = getFileStem(file);
    const path = `expenses/${intakeId}/${expenseId}/${stem}.${ext}`;
    const uploaded = await uploadToStorage(supabase, file, path);
    if (!uploaded) {
      throw new Error("Failed to upload receipt.");
    }
    paths.push(uploaded);
    staged.push({ filePath: uploaded, ext, stem });
  }

  const rows = staged.map((s) => ({ expenseId, filePath: s.filePath }));
  return { rows, paths };
}

async function deleteReceiptFiles(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = createSupabaseAdminClient();
  await Promise.all(paths.map((path) => deleteFromStorage(supabase, path)));
}

async function loadOwnedExpense(
  formData: FormData,
  intakeScope: number | null,
): Promise<{ ok: true; id: number; intakeId: number } | { ok: false; error: string }> {
  const rawExpenseId = takeString(formData.get("expenseId"));
  if (!rawExpenseId) return { ok: false, error: "Invalid expense." };

  const expenseId = Number(rawExpenseId);
  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return { ok: false, error: "Invalid expense." };
  }

  const [existing] = await db
    .select({ id: expenses.id, intakeId: expenses.intakeId })
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!existing) return { ok: false, error: "Expense not found." };

  const scopeError = assertIntakeOwnership(existing.intakeId, intakeScope);
  if (scopeError) return { ok: false, error: scopeError };

  return { ok: true, id: existing.id, intakeId: existing.intakeId };
}

export async function getExpenseDetails(expenseId: number): Promise<{ data: ExpenseDetails | null; error: string | null }> {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { data: null, error: "You do not have permission to view expenses." };
  }

  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return { data: null, error: "Invalid expense." };
  }

  const [row] = await db
    .select({
      id: expenses.id,
      intakeId: expenses.intakeId,
      intakeNo: intakes.intakeNo,
      title: expenses.title,
      description: expenses.description,
      amount: expenses.amount,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .innerJoin(intakes, eq(intakes.id, expenses.intakeId))
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!row) {
    return { data: null, error: "Expense not found." };
  }

  const scopeError = assertIntakeOwnership(row.intakeId, intakeScope);
  if (scopeError) return { data: null, error: scopeError };

  const receiptRows = await db
    .select({
      id: expenseReceipts.id,
      filePath: expenseReceipts.filePath,
      createdAt: expenseReceipts.createdAt,
    })
    .from(expenseReceipts)
    .where(eq(expenseReceipts.expenseId, expenseId))
    .orderBy(expenseReceipts.createdAt, expenseReceipts.id);

  const supabase = createSupabaseAdminClient();
  const receipts = await Promise.all(
    receiptRows.map(async (r) => {
      const signedUrl = await signedStorageUrl(supabase, r.filePath);
      return {
        id: r.id,
        filePath: signedUrl,
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );

  return {
    data: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      receipts,
    },
    error: null,
  };
}

export async function createExpense(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { error: "You do not have permission to manage expenses." };
  }

  const resolved = resolveScopedIntakeId(formData, intakeScope);
  if (!resolved.ok) return { error: resolved.error };
  const effectiveIntakeId = resolved.intakeId;

  const [intake] = await db
    .select({ id: intakes.id })
    .from(intakes)
    .where(eq(intakes.id, effectiveIntakeId))
    .limit(1);

  if (!intake) {
    return { error: "Intake not found." };
  }

  const title = takeString(formData.get("title"));
  const description = takeString(formData.get("description"));
  const amount = sanitizeMoney(formData.get("amount"));
  const receiptFiles = takeFiles(formData.getAll("receiptFiles"));

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long." };
  if (amount === null) return { error: "Valid amount is required." };
  if (receiptFiles.length === 0) return { error: "At least one receipt is required." };

  const receiptError = validateReceipts(receiptFiles);
  if (receiptError) return { error: receiptError };

  const supabase = createSupabaseAdminClient();
  let expenseId = 0;
  let uploadedPaths: string[] = [];

  try {
    const [expense] = await db
      .insert(expenses)
      .values({
        intakeId: effectiveIntakeId,
        treasurerId: admin.id,
        title,
        description: description ?? null,
        amount,
      })
      .returning({ id: expenses.id });

    if (!expense) {
      return { error: "Failed to create expense." };
    }

    expenseId = expense.id;

    const { rows, paths } = await uploadExpenseReceipts(supabase, receiptFiles, effectiveIntakeId, expenseId);
    uploadedPaths = paths;

    if (rows.length > 0) {
      await db.insert(expenseReceipts).values(rows);
    }
  } catch (err) {
    console.error("createExpense failed", err);
    await deleteReceiptFiles(uploadedPaths);
    if (expenseId !== 0) {
      await db.delete(expenses).where(eq(expenses.id, expenseId));
    }
    return { error: "Failed to create expense." };
  }

  revalidatePath("/admin/treasurer/expenses");
  return { success: true };
}

export async function updateExpense(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { error: "You do not have permission to manage expenses." };
  }

  const loaded = await loadOwnedExpense(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const title = takeString(formData.get("title"));
  const description = takeString(formData.get("description"));
  const amount = sanitizeMoney(formData.get("amount"));

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long." };
  if (amount === null) return { error: "Valid amount is required." };

  try {
    await db
      .update(expenses)
      .set({
        title,
        description: description ?? null,
        amount,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, loaded.id));
  } catch (err) {
    console.error("updateExpense failed", err);
    return { error: "Failed to update expense." };
  }

  revalidatePath("/admin/treasurer/expenses");
  return { success: true };
}

export async function deleteExpense(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { error: "You do not have permission to manage expenses." };
  }

  const loaded = await loadOwnedExpense(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const receipts = await db
    .select({ filePath: expenseReceipts.filePath })
    .from(expenseReceipts)
    .where(eq(expenseReceipts.expenseId, loaded.id));

  try {
    await db.delete(expenses).where(eq(expenses.id, loaded.id));
  } catch (err) {
    console.error("deleteExpense failed", err);
    return { error: "Failed to delete expense." };
  }

  await deleteReceiptFiles(receipts.map((r) => r.filePath));

  revalidatePath("/admin/treasurer/expenses");
  return { success: true };
}

export async function updateExpenseWithReceipts(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { error: "You do not have permission to manage expenses." };
  }

  const loaded = await loadOwnedExpense(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const title = takeString(formData.get("title"));
  const description = takeString(formData.get("description"));
  const amount = sanitizeMoney(formData.get("amount"));

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title is too long." };
  if (amount === null) return { error: "Valid amount is required." };

  const removeIds = formData
    .getAll("removeReceiptIds")
    .map((value) => takeString(value))
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const addFiles = takeFiles(formData.getAll("receiptFiles"));
  const receiptError = validateReceipts(addFiles);
  if (receiptError) return { error: receiptError };

  const supabase = createSupabaseAdminClient();
  let uploadedPaths: string[] = [];

  try {
    const receiptsToRemove = removeIds.length
      ? await db
          .select({ id: expenseReceipts.id, filePath: expenseReceipts.filePath })
          .from(expenseReceipts)
          .where(and(eq(expenseReceipts.expenseId, loaded.id), inArray(expenseReceipts.id, removeIds)))
      : [];

    if (receiptsToRemove.length !== removeIds.length) {
      return { error: "One or more receipts were not found." };
    }

    let newRows: ReceiptInsert[] = [];
    if (addFiles.length > 0) {
      const uploaded = await uploadExpenseReceipts(supabase, addFiles, loaded.intakeId, loaded.id);
      newRows = uploaded.rows;
      uploadedPaths = uploaded.paths;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(expenses)
        .set({ title, description: description ?? null, amount, updatedAt: new Date() })
        .where(eq(expenses.id, loaded.id));

      if (receiptsToRemove.length > 0) {
        await tx.delete(expenseReceipts).where(inArray(expenseReceipts.id, receiptsToRemove.map((r) => r.id)));
      }

      if (newRows.length > 0) {
        await tx.insert(expenseReceipts).values(newRows);
      }
    });

    if (receiptsToRemove.length > 0) {
      await deleteReceiptFiles(receiptsToRemove.map((r) => r.filePath));
    }
  } catch (err) {
    console.error("updateExpenseWithReceipts failed", err);
    await deleteReceiptFiles(uploadedPaths);
    return { error: "Failed to update expense." };
  }

  revalidatePath("/admin/treasurer/expenses");
  return { success: true };
}

export async function manageReceipts(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "expenses")) {
    return { error: "You do not have permission to manage expenses." };
  }

  const loaded = await loadOwnedExpense(formData, intakeScope);
  if (!loaded.ok) return { error: loaded.error };

  const removeIds = formData
    .getAll("removeReceiptIds")
    .map((value) => takeString(value))
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const addFiles = takeFiles(formData.getAll("receiptFiles"));

  if (removeIds.length === 0 && addFiles.length === 0) {
    return { error: "No receipt changes were provided." };
  }

  const receiptError = validateReceipts(addFiles);
  if (receiptError) return { error: receiptError };

  const supabase = createSupabaseAdminClient();
  let uploadedPaths: string[] = [];

  try {
    const receiptsToRemove = removeIds.length
      ? await db
          .select({ id: expenseReceipts.id, filePath: expenseReceipts.filePath })
          .from(expenseReceipts)
          .where(and(eq(expenseReceipts.expenseId, loaded.id), inArray(expenseReceipts.id, removeIds)))
      : [];

    if (receiptsToRemove.length !== removeIds.length) {
      return { error: "One or more receipts were not found." };
    }

    let newRows: ReceiptInsert[] = [];
    if (addFiles.length > 0) {
      const uploaded = await uploadExpenseReceipts(supabase, addFiles, loaded.intakeId, loaded.id);
      newRows = uploaded.rows;
      uploadedPaths = uploaded.paths;
    }

    await db.transaction(async (tx) => {
      if (receiptsToRemove.length > 0) {
        await tx.delete(expenseReceipts).where(inArray(expenseReceipts.id, receiptsToRemove.map((r) => r.id)));
      }
      if (newRows.length > 0) {
        await tx.insert(expenseReceipts).values(newRows);
      }
      await tx.update(expenses).set({ updatedAt: new Date() }).where(eq(expenses.id, loaded.id));
    });

    if (receiptsToRemove.length > 0) {
      await deleteReceiptFiles(receiptsToRemove.map((r) => r.filePath));
    }
  } catch (err) {
    console.error("manageReceipts failed", err);
    await deleteReceiptFiles(uploadedPaths);
    return { error: "Failed to update receipts." };
  }

  revalidatePath("/admin/treasurer/expenses");
  return { success: true };
}
