"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { digitsOnly } from "@/lib/admin/form-helpers";
import { formatBank } from "@/components/admin/treasurer/accounts/table-config";
import {
  getAccountDetails,
  updateTreasuryAccount,
  type AccountDetails,
} from "@/app/admin/treasurer/accounts/actions";
import { SingleFileField } from "@/components/ui/single-file-field";
import { BANKS } from "@/lib/data";

export function AccountDetailsSheet({
  accountId,
  initialMode,
  open,
  onOpenChange,
}: {
  accountId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        {open && accountId != null && (
          <SheetInner
            key={accountId}
            accountId={accountId}
            initialMode={initialMode}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  accountId,
  initialMode,
  onClose,
}: {
  accountId: number;
  initialMode: "view" | "edit";
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getAccountDetails(accountId).then((res) => {
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
  }, [accountId]);

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
          {fetchError ?? "Account not found."}
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

function ViewMode({ details, onEdit }: { details: AccountDetails; onEdit: () => void }) {
  const d = details;
  const qrUrl = d.qrCodeUrl;
  return (
    <>
      <SheetHeader>
        <SheetTitle>Account Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Account
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="Intake" value={d.intakeNo} />
              <DetailRow label="Account Holder" value={d.treasurerName} />
              <DetailRow label="Bank" value={formatBank(d.bankName)} />
              <DetailRow label="Account No" value={d.accountNumber} />
              <DetailRow label="DuitNow ID" value={d.duitNowId ?? "—"} />
              <DetailRow
                label="Created"
                value={format(new Date(d.createdAt), "dd MMM yyyy")}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              QR Code
            </h3>
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt="QR code"
                width={192}
                height={192}
                className="w-48 rounded-lg border border-border object-contain"
              />
            ) : (
              <span className="text-sm text-muted-foreground">No QR code uploaded.</span>
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
  details: AccountDetails;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [bank, setBank] = useState(details.bankName);
  const [accountNumber, setAccountNumber] = useState(String(details.accountNumber));
  const [duitNowId, setDuitNowId] = useState(String(details.duitNowId ?? ""));
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [removeQr, setRemoveQr] = useState(false);

  function handleUpdate() {
    if (!bank || !accountNumber.trim()) return;
    setError(null);

    const fd = new FormData();
    fd.set("accountId", String(details.id));
    fd.set("bankName", bank);
    fd.set("accountNumber", accountNumber.trim());
    if (duitNowId.trim()) fd.set("duitNowId", duitNowId.trim());
    if (removeQr) fd.set("removeQrCode", "true");
    if (qrFile) fd.set("qrCode", qrFile);

    startTransition(async () => {
      const result = await updateTreasuryAccount(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update account.");
      }
    });
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit Treasury Account</SheetTitle>
      </SheetHeader>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="flex flex-col gap-4">
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
              onChange={(f) => {
                setQrFile(f);
                if (!f && details.qrCodePath) {
                  setRemoveQr(true);
                } else {
                  setRemoveQr(false);
                }
              }}
              existingUrl={removeQr ? null : details.qrCodeUrl}
              className="max-w-40"
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={isPending || !bank || !accountNumber.trim()}>
          {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </>
  );
}
