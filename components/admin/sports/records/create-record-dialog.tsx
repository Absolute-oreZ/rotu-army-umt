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
import { createAssessmentRecord } from "@/app/admin/sports/assessments/actions";
import { Field } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";

function parseRecordDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatRecordDate(value: Date | undefined) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

function getMalaysiaDateISO(): string {
  const now = new Date();
  // Malaysia is UTC+8
  const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return malaysiaTime.toISOString().slice(0, 10);
}

export function CreateRecordDialog({
  recordType,
  intakeOptions,
  isAdminIntakeScoped,
  trigger,
  scopedIntakeId,
  latestSessionDates,
}: {
  recordType: "UKA" | "APFA";
  intakeOptions: DialogIntakeOption[];
  isAdminIntakeScoped: boolean;
  trigger: ReactNode;
  scopedIntakeId: number | null;
  latestSessionDates: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [intakeId, setIntakeId] = useState("");
  const [recordDate, setRecordDate] = useState(() => getMalaysiaDateISO());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = (isAdminIntakeScoped || intakeId !== "") && recordDate !== "";
  const selectedIntakeId = intakeId || (scopedIntakeId === null ? "" : String(scopedIntakeId));

  function resetForm() {
      setIntakeId("");
      setRecordDate(getMalaysiaDateISO());
      setError(null);
    }

  function handleCreate() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    fd.set("recordType", recordType);
    if (!isAdminIntakeScoped) fd.set("intakeId", intakeId);
    fd.set("recordDate", recordDate);

    startTransition(async () => {
      const result = await createAssessmentRecord(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
        router.push(`/admin/sports/assessments?record=${recordType}:${result.data.id}`);
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
          <DialogTitle>New {recordType} Record</DialogTitle>
          <DialogDescription>
            Start a new {recordType} assessment session. Cadet results are entered on the
            Assessments page afterwards.
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
          <Field label="Record Date" required>
            <DatePicker
              value={parseRecordDate(recordDate)}
              onChange={(date) => setRecordDate(formatRecordDate(date))}
              placeholder="Select record date"
              isDateDisabled={(date) => {
                if (!selectedIntakeId) return false;
                const previousDate = latestSessionDates[`${selectedIntakeId}:${date.getFullYear()}`];
                return previousDate ? dateKey(date) <= previousDate : false;
              }}
            />
          </Field>
          <p className="text-xs text-muted-foreground">The session number and year are calculated from the selected date.</p>
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