"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import { SingleFileField } from "@/components/ui/single-file-field";
import { createTreasuryAccount } from "@/app/admin/treasurer/accounts/actions";
import { formatBank } from "@/components/admin/treasurer/accounts/table-config";
import { digitsOnly } from "@/lib/admin/form-helpers";
import { Field } from "@/components/ui/field";
import { BANKS } from "@/lib/data";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

export function AddAccountDialog({
  trigger,
  intakeOptions,
  isAdminIntakeScoped,
}: {
  trigger: ReactNode;
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [intakeId, setIntakeId] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [duitNowId, setDuitNowId] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);

  const formValid =
    bank !== "" &&
    accountNumber.trim() !== "" &&
    (isAdminIntakeScoped || intakeId !== "");

  function resetForm() {
    setIntakeId("");
    setBank("");
    setAccountNumber("");
    setDuitNowId("");
    setQrFile(null);
    setError(null);
  }

  function handleCreate() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    if (!isAdminIntakeScoped) fd.set("intakeId", intakeId);
    fd.set("bankName", bank);
    fd.set("accountNumber", accountNumber.trim());
    if (duitNowId.trim()) fd.set("duitNowId", duitNowId.trim());
    if (qrFile) fd.set("qrCode", qrFile);

    startTransition(async () => {
      const result = await createTreasuryAccount(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to create account.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Treasury Account</DialogTitle>
          <DialogDescription>
            Add a bank account for collecting payments.
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
              <Select value={intakeId} onValueChange={setIntakeId}>
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
          <Field label="Bank" required>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger>{bank ? formatBank(bank) : "Select bank"}</SelectTrigger>
              <SelectContent>
                {BANKS.map((b) => (
                  <SelectItem key={b} value={b}>{formatBank(b)}</SelectItem>
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
            />
          </Field>
          <Field label="DuitNow ID">
            <Input
              value={duitNowId}
              onChange={(e) => setDuitNowId(digitsOnly(e.target.value))}
              inputMode="numeric"
              maxLength={20}
            />
          </Field>
          <Field label="QR Code">
            <SingleFileField
              file={qrFile}
              onChange={setQrFile}
              onRemove={() => setQrFile(null)}
              className="max-w-40"
            />
          </Field>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isPending || !formValid}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
