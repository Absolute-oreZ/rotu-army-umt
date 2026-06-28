"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";
import { deleteExpense } from "@/app/admin/treasurer/expenses/actions";
import type { Expense } from "@/components/admin/treasurer/expenses/expenses-table";

export function DeleteExpenseDialog({
  expense,
  error,
  onError,
  onOpenChange,
}: {
  expense: Expense | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!expense) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("expenseId", String(expense.id));
      const result = await deleteExpense(fd);
      if (result?.error) {
        onError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={!!expense} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {expense ? expense.title : "this expense"}? This will remove the record and all stored receipts.
          </DialogDescription>
        </DialogHeader>

        {error && expense && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
