import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildNumberFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import { buildExpensesTableConfig, EXPENSES_SORT_FIELD_MAP } from "@/components/admin/treasurer/expenses/table-config";
import { ExpensesPageClient } from "@/components/admin/treasurer/expenses/expenses-page-client";
import type { Expense } from "@/components/admin/treasurer/expenses/expenses-table";
import { batchSignedStorageUrls } from "@/lib/supabase/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { intakes, expenses, expenseReceipts } from "@/db/schema";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(expenses.title, contains),
      ilike(expenses.description, contains),
      ilike(intakes.intakeNo, contains),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildNumberFilterClause(state.filters.amount, expenses.amount));
  clauses.push(...buildDateFilterClause(state.filters.createdAt, expenses.createdAt));
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

  if (intakeScope !== null) {
    clauses.push(eq(expenses.intakeId, intakeScope));
  }

  return clauses;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("expenses");
  const intakeScope = getIntakeScope(admin);

  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo, startYear: intakes.startYear })
    .from(intakes)
    .orderBy(sql`${intakes.startYear} DESC`);

  const intakeOptions = intakeRows.map((intake) => ({
    value: intake.intakeNo,
    label: intake.intakeNo,
  }));

  const intakeDialogOptions = intakeRows.map((intake) => ({
    id: intake.id,
    intakeNo: intake.intakeNo,
  }));

  const config = buildExpensesTableConfig(
    intakeScope !== null ? undefined : intakeOptions,
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, EXPENSES_SORT_FIELD_MAP);
  orderBy.push(sql`${expenses.id} DESC`);

  const [countRow, expenseRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .innerJoin(intakes, eq(intakes.id, expenses.intakeId))
      .where(where),
    db
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
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const expenseIds = expenseRows.map((expense) => expense.id);
    const receiptRows = expenseIds.length > 0
      ? await db
          .select({
            id: expenseReceipts.id,
            expenseId: expenseReceipts.expenseId,
            filePath: expenseReceipts.filePath,
            createdAt: expenseReceipts.createdAt,
          })
          .from(expenseReceipts)
          .where(inArray(expenseReceipts.expenseId, expenseIds))
          .orderBy(sql`${expenseReceipts.createdAt} ASC`, sql`${expenseReceipts.id} ASC`)
      : [];

    const receiptsByExpense = new Map<number, Expense["receipts"]>();
    if (receiptRows.length > 0) {
      const supabase = createSupabaseAdminClient();

      // Batch sign all receipt URLs
      const filePaths = receiptRows.map((r) => r.filePath);
      const fileUrls = await batchSignedStorageUrls(supabase, filePaths, "document");

      for (let i = 0; i < receiptRows.length; i++) {
        const receipt = receiptRows[i];
        const current = receiptsByExpense.get(receipt.expenseId) ?? [];
        current.push({
          id: receipt.id,
          fileUrl: fileUrls[i],
          isPdf: receipt.filePath.toLowerCase().endsWith(".pdf"),
          createdAt: receipt.createdAt.toISOString(),
        });
        receiptsByExpense.set(receipt.expenseId, current);
      }
    }

  return (
    <ExpensesPageClient
      searchParams={raw}
      expenses={expenseRows.map((expense) => ({
        ...expense,
        amount: expense.amount,
        createdAt: expense.createdAt.toISOString(),
        receipts: receiptsByExpense.get(expense.id) ?? [],
        receiptCount: receiptsByExpense.get(expense.id)?.length ?? 0,
      }))}
      totalCount={countRow[0]?.count ?? 0}
      intakeOptions={intakeOptions}
      dialogIntakeOptions={intakeDialogOptions}
      isAdminIntakeScoped={intakeScope !== null}
    />
  );
}
