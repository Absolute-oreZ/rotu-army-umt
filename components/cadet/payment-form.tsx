"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SingleFileField } from "@/components/ui/single-file-field";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { recordPayment } from "@/app/cadet/collections/[slug]/actions";
import { Field } from "../ui/field";

type PaymentFormProps = {
  collectionId: number;
  slug: string;
  isFixedAmount: boolean;
  fixedAmount: string | null;
  isReceiptRequired: boolean;
};

export function PaymentForm({
  collectionId,
  slug,
  isFixedAmount,
  fixedAmount,
  isReceiptRequired,
}: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("collectionId", String(collectionId));
    formData.set("slug", slug);

    if (isReceiptRequired && !receiptFile) {
      setError("Receipt is required.");
      return;
    }

    if (receiptFile) {
      formData.set("receipt", receiptFile);
    }

    startTransition(async () => {
      const result = await recordPayment(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-600/10 p-5 text-center">
        <p className="font-semibold text-emerald-600">Payment recorded!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your payment has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {!isFixedAmount && (
        <Field label="Amount (RM)">
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

      {isFixedAmount && fixedAmount && (
        <p className="text-sm">
          <span className="text-muted-foreground">Amount to pay:</span>{" "}
          <span className="font-semibold">
            RM {Number(fixedAmount).toFixed(2)}
          </span>
        </p>
      )}

      <SingleFileField
        label={isReceiptRequired ? "Upload Receipt" : "Upload Receipt (optional)"}
        file={receiptFile}
        onChange={setReceiptFile}
        accept="image/*,.pdf"
        buttonLabel="Choose receipt"
        helperText="Max 5 MB. Image or PDF."
      />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Submitting..." : "Confirm Payment"}
      </Button>
    </form>
  );
}
