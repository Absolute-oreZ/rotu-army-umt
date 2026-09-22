"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateIntakeStatus } from "@/app/admin/secretary/intakes/actions";
import type { IntakeRow } from "./intakes-table";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ChangeIntakeStatusDialog({
  intake,
  open,
  onOpenChange,
}: {
  intake: IntakeRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState(intake.status);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const needsConfirmation =
    intake.status === "PUBLISHED" || intake.status === "ARCHIVED";

  function handleSubmit() {
    if (needsConfirmation && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("intakeId", String(intake.id));
      fd.append("status", newStatus);
      const result = await updateIntakeStatus(fd);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error ?? "Failed to update status.");
      }
    });
  }

  const impactText =
    intake.status === "PUBLISHED"
      ? "This will remove it from the public website."
      : "This will restore the intake.";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setShowConfirm(false); setError(null); } onOpenChange(o); }}>
      <DialogContent className="w-100 max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Change the publication status of &quot;{intake.displayName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Current Status
            </label>
            <span className="text-sm font-medium">{intake.status}</span>
          </div>

          <Field label="New Status" required>
            <Select
              value={newStatus}
              onValueChange={(value) => {
                setNewStatus(value as typeof newStatus);
                setShowConfirm(false);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {needsConfirmation && showConfirm && newStatus !== intake.status && (
            <div className="rounded-lg bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-500">
              This intake is currently {intake.status.toLowerCase()}. {impactText}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={newStatus === intake.status || isPending}>
            {isPending
              ? "Updating..."
              : needsConfirmation && showConfirm
                ? "Confirm"
                : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
