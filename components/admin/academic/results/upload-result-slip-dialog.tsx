"use client";

import { useRef, useState, useTransition } from "react";
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
import { FileUpIcon, Loader2Icon } from "lucide-react";

type UploadResultSlipDialogProps = {
  row: {
    resultId: number;
    sessionId: number;
    cadetId: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!row) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !file) {
      setError("Please select a PDF file.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("resultId", String(row.resultId));
    formData.set("sessionId", String(row.sessionId));
    formData.set("cadetId", String(row.cadetId));
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

            <div className="space-y-2">
              <label
                htmlFor="result-pdf-file"
                className="text-sm font-medium text-foreground block"
              >
                Result Slip Document (PDF) <span className="text-destructive">*</span>
              </label>

              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  id="result-pdf-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileUpIcon className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse PDF File
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 5MB (PDF only)
                  </p>
                </div>
              </div>

              {file && (
                <div className="rounded-md border border-border bg-muted/40 p-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-foreground truncate max-w-[260px]">
                    {file.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
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
