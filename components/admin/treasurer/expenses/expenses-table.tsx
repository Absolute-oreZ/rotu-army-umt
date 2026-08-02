"use client";

import { useMemo } from "react";
import { EyeIcon, PencilIcon, Trash2Icon, ReceiptIcon } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { useTableURL } from "@/lib/admin/use-table-url";
import { IntakeOption, isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { buildExpensesTableConfig } from "@/components/admin/treasurer/expenses/table-config";

export type ExpenseReceipt = {
  id: number;
  fileUrl: string;
  createdAt: string;
};

export type Expense = {
  id: number;
  intakeId: number;
  intakeNo: string;
  title: string;
  description: string | null;
  amount: string;
  receiptCount: number;
  receipts: ExpenseReceipt[];
  createdAt: string;
};

type ExpensesTableProps = {
  expenses: Expense[];
  searchParams: RawSearchParams;
  totalCount: number;
  intakeOptions: IntakeOption[];
  isAdminIntakeScoped: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onView: (expense: Expense) => void;
};

export function ExpensesTable({
  expenses,
  searchParams,
  totalCount,
  intakeOptions,
  isAdminIntakeScoped,
  onEdit,
  onDelete,
  onView,
}: ExpensesTableProps) {
  const config = useMemo(
    () => buildExpensesTableConfig(isAdminIntakeScoped ? undefined : intakeOptions),
    [intakeOptions, isAdminIntakeScoped],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search expenses..."
        totalCount={totalCount}
        shownCount={expenses.length}
        state={state}
        onChange={update}
        onReset={reset}
        isDefault={isDefault}
      />

      <div className="mb-4">
        <GlobalFilterBar
          filters={state.filters}
          sortRules={state.sortRules}
          filterColumns={config.filterColumns}
          sortKeys={config.sortKeys}
          sortLabels={config.sortLabels}
          onFilterUpdate={(filters) => update({ filters, page: 1 })}
          onSortUpdate={(sortRules) => update({ sortRules })}
        />
      </div>

      {expenses.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No expenses yet. Add one to start tracking spending."
              : "No expenses match the current filters. Try clearing some."
          }
          icon={<ReceiptIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={update} />
              <SortableHead columnKey="title" label="Title" state={state} onChange={update} />
              <TableHead>Description</TableHead>
              <SortableHead columnKey="amount" label="Amount" state={state} onChange={update} />
              <TableHead>Receipts</TableHead>
              <SortableHead columnKey="createdAt" label="Created" state={state} onChange={update} />
              <TableHead className="pr-5 text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const firstReceipt = expense.receipts[0];
              const firstReceiptUrl = firstReceipt?.fileUrl ?? null;

              return (
                <TableRow key={expense.id}>
                  <TableCell>{expense.intakeNo}</TableCell>
                  <TableCell className="max-w-48">
                    <CopyableValue value={expense.title} valueClassName="truncate block font-medium">
                      <span className="truncate block font-medium">{expense.title}</span>
                    </CopyableValue>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <CopyableValue
                      value={expense.description}
                      valueClassName="line-clamp-2 text-xs text-muted-foreground"
                    >
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {expense.description ?? "—"}
                      </span>
                    </CopyableValue>
                  </TableCell>
                  <TableCell className="tabular-nums">RM {Number(expense.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {firstReceiptUrl ? (
                        <Image
                          src={firstReceiptUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                          {expense.receipts.length}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{expense.receipts.length}</span>
                        <span className="text-xs text-muted-foreground">
                          {expense.receipts.length === 1 ? "receipt" : "receipts"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(expense.createdAt).toLocaleDateString("en-MY", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-emerald-600"
                            onClick={() => onView(expense)}
                          >
                            <EyeIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View Details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-sky-600"
                            onClick={() => onEdit(expense)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="hover:text-destructive"
                            onClick={() => onDelete(expense)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={update}
      />
    </>
  );
}
