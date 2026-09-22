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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provisionSessionAction } from "@/app/admin/academic/results/actions";
import { Loader2Icon, SparklesIcon } from "lucide-react";

type IntakeOption = {
  id: number;
  intakeNo: string;
  startYear: number;
};

type ProvisionSessionDialogProps = {
  intakes: IntakeOption[];
  defaultIntakeId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (sessionId: number) => void;
};

export function ProvisionSessionDialog({
  intakes,
  defaultIntakeId,
  open,
  onOpenChange,
  onSuccess,
}: ProvisionSessionDialogProps) {
  const [intakeId, setIntakeId] = useState<number>(
    defaultIntakeId ?? intakes[0]?.id ?? 0
  );
  const currentYear = new Date().getFullYear();
  const [calendarYear, setCalendarYear] = useState<number>(currentYear);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!intakeId) {
      setError("Please select an intake.");
      return;
    }

    startTransition(async () => {
      const res = await provisionSessionAction({
        intakeId,
        calendarYear,
        sessionNumber,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      if (res.data) {
        onSuccess?.(res.data.sessionId);
      }
      onOpenChange(false);
    });
  }

  const selectedIntake = intakes.find((i) => i.id === intakeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              Provision Academic Session
            </DialogTitle>
            <DialogDescription>
              Create a new academic session and automatically provision result and timetable records for eligible active cadets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {intakes.length > 1 ? (
              <Field label="Intake" required>
                <Select value={String(intakeId)} onValueChange={(value) => setIntakeId(Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {intakes.map((i) => <SelectItem key={i.id} value={String(i.id)}>Intake {i.intakeNo} (Started {i.startYear})</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              selectedIntake && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <span className="text-xs text-muted-foreground block">Target Intake</span>
                  <span className="font-semibold text-foreground">
                    Intake {selectedIntake.intakeNo} (Started {selectedIntake.startYear})
                  </span>
                </div>
              )
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Calendar Year" required>
                <Input type="number" min={2020} max={2040} value={calendarYear} onChange={(e) => setCalendarYear(parseInt(e.target.value, 10) || currentYear)} required />
              </Field>

              <Field label="Session Number" required>
                <Select value={String(sessionNumber)} onValueChange={(value) => setSessionNumber(Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Session 1 (Oct)</SelectItem><SelectItem value="2">Session 2 (Apr)</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              Session Title:{" "}
              <span className="font-mono font-bold text-foreground">
                {selectedIntake?.intakeNo ?? "X"}-{calendarYear}-{sessionNumber}
              </span>
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Provision Records
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
