"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { MultiFileField, type MultiFileFieldItem } from "@/components/ui/multi-file-field";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { createExpense } from "@/app/admin/treasurer/expenses/actions";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

export function AddExpenseDialog({
  trigger,
  intakeOptions,
  isAdminIntakeScoped,
}: {
  trigger: ReactNode;
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
}) {
  const nextReceiptId = useRef(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [intakeId, setIntakeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptItems, setReceiptItems] = useState<MultiFileFieldItem[]>([]);

  const canSubmit =
    title.trim() !== "" &&
    amount.trim() !== "" &&
    receiptItems.length > 0 &&
    (isAdminIntakeScoped || intakeId !== "");

  function resetForm() {
    setIntakeId("");
    setTitle("");
    setDescription("");
    setAmount("");
    setReceiptItems((current) => {
      for (const item of current) {
        URL.revokeObjectURL(item.url);
      }
      return [];
    });
    setError(null);
  }

  function addReceiptFiles(files: File[]) {
    if (files.length === 0) return;
    setReceiptItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${Date.now()}-${nextReceiptId.current++}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  }

  function replaceReceiptFile(id: string, file: File | null) {
    if (!file) return;
    setReceiptItems((current) => {
      const next = current.map((item) =>
        item.id === id
          ? {
              ...item,
              file,
              url: URL.createObjectURL(file),
            }
          : item,
      );
      const previous = current.find((item) => item.id === id);
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      return next;
    });
  }

  function removeReceiptFile(id: string) {
    setReceiptItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function handleCreate() {
    if (!canSubmit) return;
    setError(null);

    const fd = new FormData();
    if (!isAdminIntakeScoped) {
      fd.set("intakeId", intakeId);
    }
    fd.set("title", title.trim());
    if (description.trim()) fd.set("description", description.trim());
    fd.set("amount", amount.trim());
    for (const item of receiptItems) {
      fd.append("receiptFiles", item.file);
    }

    startTransition(async () => {
      const result = await createExpense(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to create expense.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : null}

      <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>New Expense</DialogTitle>
              <DialogDescription>
                Record spending and attach one or more supporting receipts.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4">
              {!isAdminIntakeScoped ? (
                <Field label="Intake" required>
                  <Select value={intakeId} onValueChange={setIntakeId}>
                    <SelectTrigger>
                      {intakeId
                        ? intakeOptions.find((i) => String(i.id) === intakeId)?.intakeNo ?? "Select intake"
                        : "Select intake"}
                    </SelectTrigger>
                    <SelectContent>
                      {intakeOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.intakeNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Field label="Title" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Expense title" />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes"
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </Field>

              <Field label="Amount (RM)" required>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(currencyOnly(e.target.value))}
                  placeholder="0.00"
                />
              </Field>

              <MultiFileField
                label="Receipts"
                required
                items={receiptItems}
                onAddFiles={addReceiptFiles}
                onReplaceFile={replaceReceiptFile}
                onRemoveFile={removeReceiptFile}
                addLabel="Add receipt images"
                helperText="Select one or more receipt images. You can replace or remove each thumbnail before saving."
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isPending || !canSubmit}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              Create Expense
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
