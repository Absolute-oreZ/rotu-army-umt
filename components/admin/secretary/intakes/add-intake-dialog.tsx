"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { createIntake } from "@/app/admin/secretary/intakes/actions";
import { Field } from "@/components/ui/field";

const INTAKE_NO_RE = /^\d+\/\d+$/;

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function currentYear() {
  return String(new Date().getFullYear());
}

export function AddIntakeDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [intakeNo, setIntakeNo] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [startYear, setStartYear] = useState(currentYear());
  const [tagLine, setTagLine] = useState("");
  const [status, setStatus] = useState<Status>("DRAFT");

  const formValid =
    INTAKE_NO_RE.test(intakeNo) &&
    displayName.trim() !== "" &&
    Number.isFinite(Number(startYear)) &&
    Number(startYear) >= 2000 &&
    Number(startYear) <= 2100;

  function resetForm() {
    setIntakeNo("");
    setDisplayName("");
    setStartYear(currentYear());
    setTagLine("");
    setStatus("DRAFT");
    setError(null);
  }

  function handleSubmit() {
    if (!formValid) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("intakeNo", intakeNo);
      fd.append("displayName", displayName);
      fd.append("startYear", startYear);
      if (tagLine) fd.append("tagLine", tagLine);
      fd.append("status", status);

      const result = await createIntake(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetForm();
      setOpen(false);
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="w-120 max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Add Intake</DialogTitle>
            <DialogDescription>Fill in the basic information for the new intake.</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Intake No" required>
                <Input value={intakeNo} onChange={(e) => setIntakeNo(e.target.value)} placeholder="1/43" />
                <span className="text-[11px] text-muted-foreground/60">Format: X/Y (e.g. 1/43)</span>
              </Field>
              <Field label="Display Name" required>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Intake 1/43" />
              </Field>
              <Field label="Start Year" required>
                <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2025" />
              </Field>
              <Field label="Status">
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tagline">
                <Input value={tagLine} onChange={(e) => setTagLine(e.target.value)} placeholder="Optional" />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!formValid || isPending}>
                {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                Create Intake
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
