"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { updateCadetMetric } from "@/app/admin/sports/metrics/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { cn, formatLabel } from "@/lib/utils";
import { CadetProfileCell } from "@/components/admin/sports/cadet-profile-cell";
import type { MetricRow } from "./metrics-table";

const BMI_BADGE_STYLES: Record<string, string> = {
  UNDERWEIGHT: "bg-amber-600/15 text-amber-600",
  NORMAL: "bg-emerald-600/15 text-emerald-600",
  OVERWEIGHT: "bg-orange-600/15 text-orange-600",
  OBESE: "bg-red-600/15 text-red-600",
};

function formatMetricValue(value: string | null) {
  return value === null ? "—" : String(Number(value));
}

type MetricsTableRowProps = {
  row: MetricRow;
  recordId: number;
  isEditing: boolean;
  isIntakeScoped: boolean;
  nextEditableCadetId: number | null;
  editDisabled: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
  onSaved: (nextCadetId: number | null) => void;
};

export function MetricsTableRow({
  row,
  recordId,
  isEditing,
  isIntakeScoped,
  nextEditableCadetId,
  editDisabled,
  onEditRequest,
  onEditEnd,
  onSaved,
}: MetricsTableRowProps) {
  const router = useRouter();
  const [height, setHeight] = useState(row.height ?? "");
  const [weight, setWeight] = useState(row.weight ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = height.trim() !== "" && weight.trim() !== "";

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    const fd = new FormData();
    fd.set("recordId", String(recordId));
    fd.set("cadetId", String(row.cadetId));
    fd.set("height", height.trim());
    fd.set("weight", weight.trim());

    startTransition(async () => {
      const result = await updateCadetMetric(fd);
      if (result.success) {
        router.refresh();
        onSaved(nextEditableCadetId);
      } else {
        setError(result.error ?? "Failed to save metrics.");
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && formValid && !isPending) {
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

  const bmiBadge = row.bmiClassification ? (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        BMI_BADGE_STYLES[row.bmiClassification],
      )}
    >
      {formatLabel(row.bmiClassification)}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

  if (!isEditing) {
    return (
      <TableRow>
        {identityCells}
        <TableCell className="tabular-nums">{row.age ?? "—"}</TableCell>
        <TableCell className="tabular-nums">{formatMetricValue(row.weight)}</TableCell>
        <TableCell className="tabular-nums">{formatMetricValue(row.height)}</TableCell>
        <TableCell className="tabular-nums">{formatMetricValue(row.bmi)}</TableCell>
        <TableCell>{bmiBadge}</TableCell>
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
                {row.metricId !== null ? "Edit metrics" : "Add metrics"}
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
      <TableCell className="tabular-nums">{row.age ?? "—"}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            value={weight}
            onChange={(e) => setWeight(currencyOnly(e.target.value))}
            onKeyDown={handleKeyDown}
            inputMode="decimal"
            placeholder="kg"
            autoFocus
            disabled={isPending}
            aria-label={`Weight in kg for ${row.name}`}
            className="h-8 w-24 tabular-nums"
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={height}
          onChange={(e) => setHeight(currencyOnly(e.target.value))}
          onKeyDown={handleKeyDown}
          inputMode="decimal"
          placeholder="cm"
          disabled={isPending}
          aria-label={`Height in cm for ${row.name}`}
          className="h-8 w-24 tabular-nums"
        />
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {formatMetricValue(row.bmi)}
      </TableCell>
      <TableCell>{bmiBadge}</TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-emerald-600"
                onClick={handleSave}
                disabled={isPending || !formValid}
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