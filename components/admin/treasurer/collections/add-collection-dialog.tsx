"use client";

import { useState, useMemo, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2Icon, AlertCircleIcon } from "lucide-react";
import { createCollection } from "@/app/admin/treasurer/collections/actions";
import { formatBank, formatPurpose } from "@/components/admin/treasurer/collections/table-config";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { Field } from "@/components/ui/field";

type Account = {
  id: number;
  intakeId: number;
  bankName: string;
  accountNumber: number;
  treasurerName: string;
};

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

const PURPOSES = [
  { value: "MONTHLY_COLLECTION", label: "Monthly Collection" },
  { value: "WELFARE", label: "Welfare" },
  { value: "GOODS", label: "Goods" },
  { value: "FEAST", label: "Feast" },
  { value: "OTHERS", label: "Others" },
] as const;

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

function currentMonth(): string {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}
function currentYear(): string {
  return String(new Date().getFullYear());
}

const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});

export function AddCollectionDialog({
  trigger,
  accounts,
  intakeOptions,
  isAdminIntakeScoped,
}: {
  trigger: ReactNode;
  accounts: Account[];
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [intakeId, setIntakeId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [description, setDescription] = useState("");
  const [isFixedAmount, setIsFixedAmount] = useState(true);
  const [amount, setAmount] = useState("");
  const [isReceiptRequired, setIsReceiptRequired] = useState(true);
  const [accountId, setAccountId] = useState("");

  const isMonthly = purpose === "MONTHLY_COLLECTION";

  const generatedTitle = useMemo(
    () =>
      isMonthly
        ? `Monthly Collection ${MONTHS.find((m) => m.value === month)?.label ?? ""} ${year}`
        : "",
    [isMonthly, month, year],
  );

  const filteredAccounts = isAdminIntakeScoped
    ? accounts
    : intakeId
      ? accounts.filter((a) => a.intakeId === Number(intakeId))
      : accounts;

  const effectiveTitle = isMonthly ? generatedTitle : title.trim();

  const formValid =
    purpose !== "" &&
    effectiveTitle !== "" &&
    accountId !== "" &&
    (!isFixedAmount || Number(amount) > 0) &&
    (isAdminIntakeScoped || intakeId !== "");

  function resetForm() {
    setIntakeId("");
    setPurpose("");
    setTitle("");
    setMonth(currentMonth());
    setYear(currentYear());
    setDescription("");
    setIsFixedAmount(true);
    setAmount("");
    setIsReceiptRequired(true);
    setAccountId("");
    setError(null);
  }

  function handlePurposeChange(value: string) {
    setPurpose(value);
    if (value !== "MONTHLY_COLLECTION") {
      setTitle("");
    }
  }

  function handleCreate() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    if (!isAdminIntakeScoped) fd.set("intakeId", intakeId);
    fd.set("title", effectiveTitle);
    fd.set("purpose", purpose);
    if (description.trim()) fd.set("description", description.trim());
    fd.set("isFixedAmount", String(isFixedAmount));
    fd.set("isReceiptRequired", String(isReceiptRequired));
    if (isFixedAmount) fd.set("amount", amount);
    fd.set("paymentAccountId", accountId);

    startTransition(async () => {
      const result = await createCollection(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to create collection.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : null}

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Set up a collection event for cadets to record payments.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!isAdminIntakeScoped && (
            <Field label="Intake" required>
              <Select value={intakeId} onValueChange={(v) => { setIntakeId(v); setAccountId(""); }}>
                <SelectTrigger>
                  {intakeId
                    ? intakeOptions.find((i) => String(i.id) === intakeId)?.intakeNo ?? "Select intake"
                    : "Select intake"}
                </SelectTrigger>
                <SelectContent>
                  {intakeOptions.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.intakeNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Purpose" required>
            <Select value={purpose} onValueChange={handlePurposeChange}>
              <SelectTrigger>
                {purpose ? formatPurpose(purpose) : "Select purpose"}
              </SelectTrigger>
              <SelectContent>
                {PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {isMonthly ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Month" required>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>{MONTHS.find((m) => m.value === month)?.label ?? "Select month"}</SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Year" required>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>{year}</SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y.value} value={y.value}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : purpose ? (
            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Welfare Fund Drive"
              />
            </Field>
          ) : null}
          {isMonthly && (
            <Field label="Title" required>
              <Input
                value={generatedTitle}
                readOnly
                disabled
                className="bg-muted/50"
              />
            </Field>
          )}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Brief description for cadets..."
            />
          </Field>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFixedAmount}
                onChange={(e) => setIsFixedAmount(e.target.checked)}
              />
              Fixed amount
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isReceiptRequired}
                onChange={(e) => setIsReceiptRequired(e.target.checked)}
              />
              Receipt required
            </label>
          </div>
          {isFixedAmount && (
            <Field label="Amount (RM)" required>
              <Input
                name="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(currencyOnly(e.target.value))}
                required
                placeholder="0"
              />
            </Field>
          )}
          <Field label="Payment Account" required>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                {accountId
                  ? (() => {
                    const a = filteredAccounts.find((acc) => String(acc.id) === accountId);
                    return a ? `${a.treasurerName} - ${a.accountNumber}(${formatBank(a.bankName)})` : "Select account";
                  })()
                  : "Select treasury account"}
              </SelectTrigger>
              <SelectContent>
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.treasurerName} - {a.accountNumber}({formatBank(a.bankName)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isPending || !formValid}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              Create Collection
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
