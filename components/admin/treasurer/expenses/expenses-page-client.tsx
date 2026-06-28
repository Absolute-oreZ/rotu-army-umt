"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpensesTable, type Expense } from "@/components/admin/treasurer/expenses/expenses-table";
import { AddExpenseDialog } from "@/components/admin/treasurer/expenses/add-expense-dialog";
import { ExpenseDetailsSheet } from "@/components/admin/treasurer/expenses/expense-details-sheet";
import { DeleteExpenseDialog } from "@/components/admin/treasurer/expenses/delete-expense-dialog";
import { IntakeOption } from "@/lib/admin/table-search-params";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

type ExpensesPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  expenses: Expense[];
  totalCount: number;
  intakeOptions: IntakeOption[];
  dialogIntakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
};

export function ExpensesPageClient({
  searchParams,
  expenses,
  totalCount,
  intakeOptions,
  dialogIntakeOptions,
  isAdminIntakeScoped,
}: ExpensesPageClientProps) {
  const [sheetTarget, setSheetTarget] = useState<Expense | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <AddExpenseDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              New Expense
            </Button>
          }
          intakeOptions={dialogIntakeOptions}
          isAdminIntakeScoped={isAdminIntakeScoped}
        />
      </div>

      {error && !deleteTarget && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <span>{error}</span>
        </div>
      )}

      <ExpensesTable
        expenses={expenses}
        searchParams={searchParams}
        totalCount={totalCount}
        intakeOptions={intakeOptions}
        isAdminIntakeScoped={isAdminIntakeScoped}
        onEdit={(expense) => {
          setError(null);
          setSheetMode("edit");
          setSheetTarget(expense);
        }}
        onDelete={(expense) => {
          setError(null);
          setDeleteTarget(expense);
        }}
        onView={(expense) => {
          setError(null);
          setSheetMode("view");
          setSheetTarget(expense);
        }}
      />

      <ExpenseDetailsSheet
        key={sheetTarget?.id ?? "none"}
        expenseId={sheetTarget?.id ?? null}
        initialMode={sheetMode}
        open={!!sheetTarget}
        onOpenChange={(open) => {
          if (!open) setSheetTarget(null);
        }}
      />

      <DeleteExpenseDialog
        expense={deleteTarget}
        error={error}
        onError={setError}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}
