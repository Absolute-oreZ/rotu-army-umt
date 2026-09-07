"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteAssessmentRecord } from "@/app/admin/sports/assessments/actions";

type DeleteRecordDialogProps = {
  recordType: "UKA" | "APFA";
  record: { id: number; label: string };
  error: string | null;
  onError: (error: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteRecordDialog({
  recordType,
  record,
  error,
  onError,
  open,
  onOpenChange,
}: DeleteRecordDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const fd = new FormData();
    fd.set("recordType", recordType);
    fd.set("recordId", String(record.id));

    startTransition(async () => {
      const result = await deleteAssessmentRecord(fd);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        onError(result.error ?? "Failed to delete record.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {recordType} Record</DialogTitle>
          <DialogDescription>
            Delete {record.label}? All recorded cadet assessments for this record will be
            permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Delete Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}