"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { updateCadetMetric } from "@/app/admin/sports/metrics/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import type { MetricRow } from "./metrics-table";

type EditMetricDialogProps = {
  row: MetricRow;
  recordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMetricDialog({
  row,
  recordId,
  open,
  onOpenChange,
}: EditMetricDialogProps) {
  const [height, setHeight] = useState(row.height ?? "");
  const [weight, setWeight] = useState(row.weight ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = height.trim() !== "" && weight.trim() !== "";

  function handleSave() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    fd.set("recordId", String(recordId));
    fd.set("cadetId", String(row.cadetId));
    fd.set("height", height.trim());
    fd.set("weight", weight.trim());

    startTransition(async () => {
      const result = await updateCadetMetric(fd);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error ?? "Failed to save metrics.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.metricId !== null ? "Edit Metrics" : "Add Metrics"}</DialogTitle>
          <DialogDescription>
            {row.name} · {formatRank(row.rank)} · {row.armyNo}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Height (cm)" required>
            <Input
              value={height}
              onChange={(e) => setHeight(currencyOnly(e.target.value))}
              inputMode="decimal"
              placeholder="e.g. 170"
            />
          </Field>
          <Field label="Weight (kg)" required>
            <Input
              value={weight}
              onChange={(e) => setWeight(currencyOnly(e.target.value))}
              inputMode="decimal"
              placeholder="e.g. 65.5"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Age, BMI, and BMI result are calculated automatically from these values.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !formValid}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Save Metrics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
