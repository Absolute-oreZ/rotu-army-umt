"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadResultSlipAction } from "@/app/admin/academic/results/actions";
import { Loader2Icon } from "lucide-react";
import { Field } from "@/components/ui/field";
import { DocumentFileField } from "@/components/ui/document-file-field";

type UploadResultSlipDialogProps = {
  row: {
    resultId: number;
    name: string;
    hasSlip: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function UploadResultSlipDialog({
  row,
  open,
  onOpenChange,
  onSuccess,
}: UploadResultSlipDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!row) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !file) {
      setError("Please select a PDF file.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("resultId", String(row.resultId));
    formData.set("file", file);

    startTransition(async () => {
      const res = await uploadResultSlipAction(formData);
      if (!res.success) {
        setError(res.error);
        return;
      }

      setFile(null);
      onSuccess?.();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {row.hasSlip ? "Replace Result Slip" : "Upload Result Slip"}
            </DialogTitle>
            <DialogDescription>
              Upload official university examination result slip (PDF) for{" "}
              <span className="font-semibold text-foreground">{row.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field label="Result Slip Document (PDF)" required>
              <DocumentFileField file={file} onChange={(nextFile, nextError) => { setFile(nextFile); setError(nextError ?? null); }} error={error} />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !file}>
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
