"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { MultiFileField, type MultiFileFieldItem } from "@/components/ui/multi-file-field";
import { currencyOnly } from "@/lib/admin/form-helpers";
import {
  getExpenseDetails,
  updateExpenseWithReceipts,
  type ExpenseDetails,
} from "@/app/admin/treasurer/expenses/actions";

export type ExpenseReceipt = {
  id: number;
  filePath: string;
  createdAt: string;
};

export function ExpenseDetailsSheet({
  expenseId,
  initialMode,
  open,
  onOpenChange,
}: {
  expenseId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        {open && expenseId != null && (
          <SheetInner
            key={expenseId}
            expenseId={expenseId}
            initialMode={initialMode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  expenseId,
  initialMode,
  onClose,
}: {
  expenseId: number;
  initialMode: "view" | "edit";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<ExpenseDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getExpenseDetails(expenseId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
      } else {
        setDetails(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [expenseId]);

  if (loading) {
    return (
      <SheetSkeleton className="w-140 max-w-[calc(100vw-2rem)] p-0" />
    );
  }

  if (fetchError || !details) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Error</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Expense not found."}
        </div>
      </>
    );
  }

  if (mode === "view") {
    return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  }

  return (
    <EditMode
      details={details}
      onCancel={() => setMode("view")}
      onClose={onClose}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground wrap-break-word">{value}</span>
    </div>
  );
}

function ViewMode({ details, onEdit }: { details: ExpenseDetails; onEdit: () => void }) {
  const d = details;
  return (
    <>
      <SheetHeader>
        <SheetTitle>Expense Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="Intake" value={d.intakeNo} />
              <DetailRow label="Amount" value={`RM ${Number(d.amount).toFixed(2)}`} />
              <DetailRow label="Created" value={format(new Date(d.createdAt), "dd MMM yyyy")} />
            </div>
            <DetailRow label="Title" value={d.title} />
            {d.description && <DetailRow label="Description" value={d.description} />}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Receipts ({d.receipts.length})
            </h3>
            {d.receipts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {d.receipts.map((receipt) => {
                  const url = receipt.filePath;
                  return (
                    <div key={receipt.id} className="overflow-hidden rounded-lg border border-border">
                      {url ? (
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                      <div className="bg-linear-to-t from-black/70 via-black/20 to-transparent px-2 py-1.5">
                        <p className="truncate text-[11px] font-medium text-white/90">
                          {receipt.filePath.split("/").pop()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No receipts.</span>
            )}
          </section>
        </div>
      </div>

      <SheetFooter>
        <Button onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditMode({
  details,
  onCancel,
  onClose,
}: {
  details: ExpenseDetails;
  onCancel: () => void;
  onClose: () => void;
}) {
  const nextReceiptId = useRef(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(details.title);
  const [description, setDescription] = useState(details.description ?? "");
  const [amount, setAmount] = useState(String(Number(details.amount).toFixed(2)));

  const [existingReceipts, setExistingReceipts] = useState<ExpenseReceipt[]>(details.receipts);
  const [receiptItems, setReceiptItems] = useState<MultiFileFieldItem[]>([]);

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
          ? { ...item, file, url: URL.createObjectURL(file) }
          : item,
      );
      const previous = current.find((item) => item.id === id);
      if (previous) URL.revokeObjectURL(previous.url);
      return next;
    });
  }

  function removeReceiptFile(id: string) {
    setReceiptItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
  }

  function handleSave() {
    if (!title.trim() || !amount.trim()) return;
    setError(null);

    const fd = new FormData();
    fd.set("expenseId", String(details.id));
    fd.set("title", title.trim());
    if (description.trim()) fd.set("description", description.trim());
    fd.set("amount", amount.trim());

    const removedIds = details.receipts.filter(
      (r) => !existingReceipts.some((er) => er.id === r.id),
    );
    for (const r of removedIds) {
      fd.append("removeReceiptIds", String(r.id));
    }

    for (const item of receiptItems) {
      fd.append("receiptFiles", item.file);
    }

    startTransition(async () => {
      const result = await updateExpenseWithReceipts(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update expense.");
      }
    });
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit Expense</SheetTitle>
      </SheetHeader>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="grid gap-5">
          <Field label="Title">
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

          <Field label="Amount (RM)">
            <Input
              value={amount}
              onChange={(e) => setAmount(currencyOnly(e.target.value))}
              placeholder="0.00"
            />
          </Field>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Current Receipts ({existingReceipts.length})
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Remove receipts below — changes apply on Save Changes.
              </p>
            </div>

            {existingReceipts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {existingReceipts.map((receipt) => {
                  const url = receipt.filePath;
                  return (
                    <div key={receipt.id} className="rounded-xl border border-border bg-background p-2 shadow-sm">
                      <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                        {url ? (
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-2">
                          <p className="truncate text-[11px] font-medium text-white/90">
                            {receipt.filePath.split("/").pop()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="hover:text-destructive"
                          onClick={() =>
                            setExistingReceipts((prev) => prev.filter((r) => r.id !== receipt.id))
                          }
                          disabled={isPending}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No existing receipts.</p>
            )}

            <MultiFileField
              label="Add New Receipts"
              items={receiptItems}
              onAddFiles={addReceiptFiles}
              onReplaceFile={replaceReceiptFile}
              onRemoveFile={removeReceiptFile}
              addLabel="Add receipt images"
              helperText="Select one or more receipt images. They will be uploaded when you save."
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending || !title.trim() || !amount.trim()}>
          {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </>
  );
}
