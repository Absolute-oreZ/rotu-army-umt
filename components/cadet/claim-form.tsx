"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { bankEnum } from "@/db/schema";
import { createClaim } from "@/app/cadet/claims/actions";
import type { CadetAccountRecord } from "@/lib/cadet/account-types";
import { currencyOnly, digitsOnly } from "@/lib/admin/form-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SingleFileField } from "@/components/ui/single-file-field";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type ClaimDialogProps = {
  trigger: ReactNode;
  account: CadetAccountRecord | null;
};

function formatBank(bank: string) {
  return bank.split("_").join(" ");
}

export function ClaimForm({ trigger, account }: ClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account ? String(account.accountNumber) : "",
  );
  const [duitNowId, setDuitNowId] = useState(
    account?.duitNowId != null ? String(account.duitNowId) : "",
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [saveAccount, setSaveAccount] = useState(!account);

  const existingQrCodePath = account?.qrCodePath ?? null;
  const hasQrCode = qrCodeFile !== null || existingQrCodePath !== null;

  const formValid = useMemo(() => {
    return (
      title.trim() !== "" &&
      amount.trim() !== "" &&
      bankName !== "" &&
      accountNumber.trim() !== "" &&
      receiptFile !== null &&
      hasQrCode
    );
  }, [title, amount, bankName, accountNumber, receiptFile, hasQrCode]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setDescription("");
    setBankName(account?.bankName ?? "");
    setAccountNumber(account ? String(account.accountNumber) : "");
    setDuitNowId(account?.duitNowId != null ? String(account.duitNowId) : "");
    setReceiptFile(null);
    setQrCodeFile(null);
    setSaveAccount(!account);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  }

  function handleSubmit() {
    if (!formValid) {
      setError("Please complete all required fields.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("amount", amount.trim());
    formData.set("bankName", bankName);
    formData.set("accountNumber", accountNumber.trim());
    if (duitNowId.trim()) {
      formData.set("duitNowId", duitNowId.trim());
    }
    if (description.trim()) {
      formData.set("description", description.trim());
    }
    if (receiptFile) {
      formData.set("receipt", receiptFile);
    }
    if (qrCodeFile) {
      formData.set("qrCode", qrCodeFile);
    }
    if (saveAccount || !account) {
      formData.set("saveAccount", "true");
    }

    startTransition(async () => {
      const result = await createClaim(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetForm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            setOpen(true);
          }
        }}
        className="inline-flex"
      >
        {trigger}
      </div>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Claim</DialogTitle>
          <DialogDescription>
            Submit a reimbursement claim. Required fields are marked with a red asterisk.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Claim
            </h3>

            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Training uniform reimbursement"
                maxLength={200}
              />
            </Field>

            <Field label="Amount (RM)" required>
              <Input
                value={amount}
                onChange={(e) => setAmount(currencyOnly(e.target.value))}
                inputMode="decimal"
                placeholder="0.00"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Any additional details about this claim..."
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                )}
              />
            </Field>

            <Field label="Receipt" required>
              <SingleFileField
                file={receiptFile}
                onChange={setReceiptFile}
                accept="image/*,.pdf"
                buttonLabel="Choose receipt"
                helperText="Upload a receipt image or PDF. Max 5 MB."
              />
            </Field>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Payment Details
            </h3>

            <Field label="Bank" required>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger placeholder="Select bank">
                  {bankName ? formatBank(bankName) : "Select bank"}
                </SelectTrigger>
                <SelectContent>
                  {bankEnum.enumValues.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {formatBank(bank)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Account Number" required>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(digitsOnly(e.target.value))}
                inputMode="numeric"
                maxLength={20}
                placeholder="012345678901"
              />
            </Field>

            <Field label="DuitNow ID">
              <Input
                value={duitNowId}
                onChange={(e) => setDuitNowId(digitsOnly(e.target.value))}
                inputMode="numeric"
                maxLength={20}
                placeholder="Optional"
              />
            </Field>

            <Field label="QR Code" required>
              <SingleFileField
                file={qrCodeFile}
                existingUrl={existingQrCodePath}
                onChange={setQrCodeFile}
                accept="image/*"
                buttonLabel="Choose QR code"
                helperText={
                  existingQrCodePath
                    ? "Your saved QR code will be reused unless you upload a replacement."
                    : "Upload the QR code used for receiving the reimbursement."
                }
              />
            </Field>

            {account ? (
              <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={saveAccount}
                  onChange={(event) => setSaveAccount(event.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">
                    Save these changes for future claims
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Leave this off if you only want to use the edited details for this claim.
                  </span>
                </span>
              </label>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-600">
                These payment details will be saved to your cadet account after you submit.
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={isPending || !formValid} onClick={handleSubmit}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Submit Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
