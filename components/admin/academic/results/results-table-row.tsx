"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  CheckIcon,
  EyeIcon,
  FileUpIcon,
  Loader2Icon,
  PencilIcon,
  XIcon,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { ScorePill } from "@/components/admin/academic/shared/score-pill";
import { storageUrl } from "@/lib/supabase/storage-public";
import { currencyOnly } from "@/lib/admin/form-helpers";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { updateResultScoresAction } from "@/app/admin/academic/results/actions";

export type ResultRow = {
  resultId: number;
  cadetId: number;
  armyNo: number;
  rank: string;
  name: string;
  avatarPath: string | null;
  intakeNo: string | null;
  gpa: string | null;
  cgpa: string | null;
  resultSlipPath: string | null;
};

type ResultsTableRowProps = {
  row: ResultRow;
  isEditing: boolean;
  editDisabled: boolean;
  showIntakeColumn: boolean;
  onEditRequest: (resultId: number) => void;
  onEditEnd: () => void;
  onViewSlip: (row: ResultRow) => void;
  onUploadSlip: (row: ResultRow) => void;
};

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return parsed;
}

function isScoreValid(score: number | null): boolean {
  if (score === null) return true;
  if (Number.isNaN(score)) return false;
  return score >= 0 && score <= 4;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ResultsTableRow({
  row,
  isEditing,
  editDisabled,
  showIntakeColumn,
  onEditRequest,
  onEditEnd,
  onViewSlip,
  onUploadSlip,
}: ResultsTableRowProps) {
  const [gpaInput, setGpaInput] = useState(row.gpa ?? "");
  const [cgpaInput, setCgpaInput] = useState(row.cgpa ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const gpa = parseScore(gpaInput);
  const cgpa = parseScore(cgpaInput);
  const formValid = isScoreValid(gpa) && isScoreValid(cgpa);

  const avatar = row.avatarPath ? storageUrl(row.avatarPath) : null;

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    startTransition(async () => {
      const res = await updateResultScoresAction({
        resultId: row.resultId,
        gpa,
        cgpa,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onEditEnd();
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
        <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {avatar ? (
            <Image src={avatar} alt="" width={36} height={36} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-[11px] font-semibold uppercase text-muted-foreground">
              {getInitials(row.name)}
            </span>
          )}
        </span>
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
      {showIntakeColumn && <TableCell>{row.intakeNo ?? "—"}</TableCell>}
    </>
  );

  if (!isEditing) {
      return (
        <TableRow className="hover:bg-muted/50">
          {identityCells}
          <TableCell>
            <ScorePill score={row.gpa !== null ? Number(row.gpa) : null} />
          </TableCell>
          <TableCell>
            <ScorePill score={row.cgpa !== null ? Number(row.cgpa) : null} />
          </TableCell>
          <TableCell className="pr-5">
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                              <TooltipTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="hover:text-emerald-600"
                                  onClick={() => onViewSlip(row)}
                                  disabled={row.resultSlipPath === null}
                                  aria-label={`View result slip for ${row.name}`}
                                >
                                  <EyeIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {row.resultSlipPath ? "View result slip" : "No result slip uploaded"}
                              </TooltipContent>
                            </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="hover:text-sky-600"
                    onClick={() => onUploadSlip(row)}
                    aria-label={`Upload result slip for ${row.name}`}
                  >
                    <FileUpIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {row.resultSlipPath ? "Replace result slip" : "Upload result slip"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="hover:text-sky-600"
                    onClick={() => onEditRequest(row.resultId)}
                    disabled={editDisabled}
                    aria-label={`Edit scores for ${row.name}`}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit GPA / CGPA</TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>
      );
    }

  return (
    <TableRow>
      {identityCells}
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            value={gpaInput}
            onChange={(e) => setGpaInput(currencyOnly(e.target.value))}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            autoFocus
            inputMode="decimal"
            placeholder="0.00 – 4.00"
            aria-label={`GPA for ${row.name}`}
            className="h-8 w-20 font-mono tabular-nums"
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={cgpaInput}
          onChange={(e) => setCgpaInput(currencyOnly(e.target.value))}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          inputMode="decimal"
          placeholder="0.00 – 4.00"
          aria-label={`CGPA for ${row.name}`}
          className="h-8 w-20 font-mono tabular-nums"
        />
      </TableCell>
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
                aria-label={`Save scores for ${row.name}`}
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
                aria-label={`Cancel score edit for ${row.name}`}
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
