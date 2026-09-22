"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { saveApfaAssessment, saveUkaAssessment } from "@/app/admin/sports/assessments/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { cn } from "@/lib/utils";
import { formatDuration, parseDuration } from "@/lib/sports/duration";
import type { AssessmentStandard } from "@/lib/assessment/types";
import { CadetProfileCell } from "@/components/admin/sports/cadet-profile-cell";
import {
  getInitialAssessmentValues,
  itemPlaceholder,
  sanitizeItemValue,
  type AssessmentItemColumn,
} from "./table-config";
import type { AssessmentRow } from "./assessments-table";

const RESULT_BADGE_STYLES: Record<string, string> = {
  PASS: "bg-emerald-600/15 text-emerald-600",
  FAIL: "bg-red-600/15 text-red-600",
};

type StandardsByGender = {
  MALE: AssessmentStandard[];
  FEMALE: AssessmentStandard[];
};

type AssessmentTableRowProps = {
  row: AssessmentRow;
  recordType: "UKA" | "APFA";
  standards: StandardsByGender | null;
  recordId: number;
  isEditing: boolean;
  isIntakeScoped: boolean;
  nextIncompleteCadetId: number | null;
  editDisabled: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
  onSaved: (nextCadetId: number | null) => void;
};

export function AssessmentTableRow({
  row,
  recordType,
  standards,
  recordId,
  isEditing,
  isIntakeScoped,
  nextIncompleteCadetId,
  editDisabled,
  onEditRequest,
  onEditEnd,
  onSaved,
}: AssessmentTableRowProps) {
  const router = useRouter();

  const itemColumns: AssessmentItemColumn[] =
    recordType === "UKA"
      ? [
          { key: "pushUp", label: "Push-up", unit: "count" },
          { key: "sitUp", label: "Sit-up", unit: "count" },
          { key: "run", label: "2.4km Run", unit: "seconds" },
        ]
      : [
          { key: "run", label: "1.6km Run", unit: "seconds" },
          { key: "pullUp", label: "Pull-up", unit: "count" },
          { key: "swimming", label: "Swimming", unit: "metres" },
          { key: "floating", label: "Floating", unit: "seconds" },
        ];

  const [values, setValues] = useState<Record<string, string>>(() =>
    isEditing ? getInitialAssessmentValues(row.items, itemColumns) : {},
  );
  const [error, setError] = useState<string | null>(() =>
    isEditing ? null : null,
  );
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
        router.refresh();
        onSaved(nextIncompleteCadetId);
      } else {
        setError(result.error ?? "Failed to save assessment.");
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && filledCount > 0 && !isPending) {
      event.preventDefault();
      handleSave();
      return;
    }
    if (event.key === "Escape" && !isPending) {
      if (document.querySelector("[data-slot='dialog-content']")) return;
      event.preventDefault();
      onEditEnd();
    }
  }

  const identityCells = (
    <>
      <TableCell>
        <CadetProfileCell name={row.name} avatarPath={row.avatarPath} />
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        <CopyableValue value={row.armyNo} valueClassName="font-mono tabular-nums">
          {row.armyNo}
        </CopyableValue>
      </TableCell>
      <TableCell>{formatRank(row.rank)}</TableCell>
      <TableCell className="font-medium">
        <CopyableValue value={row.name} valueClassName="font-medium">
          {row.name}
        </CopyableValue>
      </TableCell>
      {!isIntakeScoped && <TableCell>{row.intakeNo ?? "—"}</TableCell>}
      <TableCell>{row.platoonName ?? "—"}</TableCell>
    </>
  );

  const resultBadge =
    row.result !== null ? (
      <span
        className={cn(
          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
          RESULT_BADGE_STYLES[row.result],
        )}
      >
        {row.result === "PASS" ? "Pass" : "Fail"}
      </span>
    ) : row.assessmentId !== null ? (
      <span className="inline-block rounded-full bg-amber-600/15 px-2 py-0.5 text-xs font-medium text-amber-600">
        In Progress
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  if (!isEditing) {
    return (
      <TableRow>
        {identityCells}
        {itemColumns.map((col) => {
          const value = row.items[col.key]?.value ?? null;
          const pass = row.items[col.key]?.pass ?? null;
          const className =
            value !== null && pass === true
              ? "tabular-nums text-emerald-600"
              : value !== null && pass === false
                ? "tabular-nums text-red-500"
                : "tabular-nums";
          return (
            <TableCell key={col.key} className={className}>
              {value !== null ? (
                col.unit === "seconds" ? (
                  formatDuration(value)
                ) : (
                  String(value)
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          );
        })}
        <TableCell>{resultBadge}</TableCell>
        <TableCell className="pr-5">
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-sky-600"
                  onClick={onEditRequest}
                  disabled={editDisabled}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {row.assessmentId !== null ? "Edit assessment" : "Add assessment"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      {identityCells}
      {itemColumns.map((col, index) => {
        const standard = standards?.[row.gender]?.find((s) => s.key === col.key);
        return (
          <TableCell key={col.key}>
            <div className="flex flex-col gap-1">
              <Input
                value={values[col.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [col.key]: sanitizeItemValue(col.unit, e.target.value),
                  }))
                }
                onKeyDown={handleKeyDown}
                inputMode={col.unit === "seconds" ? "text" : "numeric"}
                placeholder={itemPlaceholder(standard)}
                autoFocus={index === 0}
                disabled={isPending}
                aria-label={`${col.label} for ${row.name}`}
                className="h-8 w-24 tabular-nums"
              />
              {index === 0 && error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          </TableCell>
        );
      })}
      <TableCell className="opacity-60">{resultBadge}</TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-emerald-600"
                onClick={handleSave}
                disabled={isPending || filledCount === 0}
              >
                {isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save (Enter)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-red-600"
                onClick={onEditEnd}
                disabled={isPending}
              >
                <XIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Cancel (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}