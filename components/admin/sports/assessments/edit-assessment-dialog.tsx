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
import { saveApfaAssessment, saveUkaAssessment } from "@/app/admin/sports/assessments/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { parseDuration } from "@/lib/utils";
import type { AssessmentStandard } from "@/lib/assessment/types";
import { getAssessmentItems, itemPlaceholder, sanitizeItemValue } from "./table-config";
import type { AssessmentRow } from "./assessments-table";

type StandardsByGender = {
  MALE: AssessmentStandard[];
  FEMALE: AssessmentStandard[];
};

type EditAssessmentDialogProps = {
  row: AssessmentRow;
  recordType: "UKA" | "APFA";
  recordId: number;
  standards: StandardsByGender | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAssessmentDialog({
  row,
  recordType,
  recordId,
  standards,
  open,
  onOpenChange,
}: EditAssessmentDialogProps) {
  const itemColumns = getAssessmentItems(recordType);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filledCount = itemColumns.filter((c) => (values[c.key] ?? "").trim() !== "").length;

  function handleSave() {
    if (filledCount === 0 || isPending) return;
    setError(null);

    for (const col of itemColumns) {
      const raw = (values[col.key] ?? "").trim();
      if (raw !== "" && col.unit === "seconds" && parseDuration(raw) === null) {
        setError(`${col.label} must use mm:ss format (e.g. 11:30).`);
        return;
      }
    }

    const fd = new FormData();
    fd.set("recordId", String(recordId));
    fd.set("cadetId", String(row.cadetId));
    for (const col of itemColumns) {
      const raw = (values[col.key] ?? "").trim();
      if (raw !== "") fd.set(col.key, raw);
    }

    startTransition(async () => {
      const result =
        recordType === "UKA" ? await saveUkaAssessment(fd) : await saveApfaAssessment(fd);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error ?? "Failed to save assessment.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {row.assessmentId !== null ? "Edit Assessment" : "Add Assessment"}
          </DialogTitle>
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
          {itemColumns.map((col) => {
            const standard = standards?.[row.gender]?.find((s) => s.key === col.key);
            return (
              <Field key={col.key} label={col.label}>
                <Input
                  value={values[col.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [col.key]: sanitizeItemValue(col.unit, e.target.value),
                    }))
                  }
                  inputMode={col.unit === "seconds" ? "text" : "numeric"}
                  placeholder={itemPlaceholder(standard)}
                  disabled={isPending}
                />
              </Field>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Leave a field empty to keep its current value. The overall result is set once every
            item is recorded.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || filledCount === 0}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Save Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}