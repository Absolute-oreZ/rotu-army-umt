"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createHealthRecord } from "@/app/admin/sports/metrics/actions";
import { Field } from "@/components/ui/field";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

export function CreateRecordDialog({
  trigger,
  intakeOptions,
  isAdminIntakeScoped,
  onCreated,
}: {
  trigger: ReactNode;
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
  onCreated?: (recordId: number) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [intakeId, setIntakeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = isAdminIntakeScoped || intakeId !== "";

  function resetForm() {
    setIntakeId("");
    setError(null);
  }

  function handleCreate() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    if (!isAdminIntakeScoped) fd.set("intakeId", intakeId);

    startTransition(async () => {
      const result = await createHealthRecord(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
        if (onCreated) {
          onCreated(result.data.id);
        } else {
          router.push(`${window.location.pathname}?recordId=${result.data.id}`);
        }
      } else {
        setError(result.error ?? "Failed to create record.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Health Record</DialogTitle>
          <DialogDescription>
            Start a new health assessment session. Cadet metrics can be filled in afterwards.
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
                    ? intakeOptions.find((i) => String(i.id) === intakeId)?.intakeNo ??
                      "Select intake"
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
          <p className="text-xs text-muted-foreground">
            The record date is set to today automatically.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending || !formValid}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Create Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
