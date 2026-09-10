"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { updateAccommodation } from "@/app/admin/welfare/accommodations/actions";
import { CadetProfileCell } from "@/components/admin/sports/cadet-profile-cell";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { cn } from "@/lib/utils";
import type { AccommodationRow } from "./accommodations-table";

const TYPE_BADGE_STYLES: Record<string, string> = {
  HOSTEL: "bg-sky-600/15 text-sky-600",
  RENTAL: "bg-amber-600/15 text-amber-600",
};

const TYPE_LABELS: Record<string, string> = {
  HOSTEL: "Hostel",
  RENTAL: "Rental",
};

type AccommodationsTableRowProps = {
  row: AccommodationRow;
  isEditing: boolean;
  isIntakeScoped: boolean;
  nextEditableCadetId: number | null;
  editDisabled: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
  onSaved: (nextCadetId: number | null) => void;
};

export function AccommodationsTableRow({
  row,
  isEditing,
  isIntakeScoped,
  nextEditableCadetId,
  editDisabled,
  onEditRequest,
  onEditEnd,
  onSaved,
}: AccommodationsTableRowProps) {
  const router = useRouter();
  const [type, setType] = useState<"HOSTEL" | "RENTAL" | "">(row.type ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = type !== "";

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    const fd = new FormData();
    fd.set("cadetId", String(row.cadetId));
    fd.set("type", type);
    fd.set("address", address);

    startTransition(async () => {
      const result = await updateAccommodation(fd);
      if (result.success) {
        router.refresh();
        onSaved(nextEditableCadetId);
      } else {
        setError(result.error ?? "Failed to save accommodation.");
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
      {!isIntakeScoped && <TableCell>{row.intakeNo}</TableCell>}
    </>
  );

  const typeBadge = row.type ? (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        TYPE_BADGE_STYLES[row.type],
      )}
    >
      {TYPE_LABELS[row.type]}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

  if (!isEditing) {
    return (
      <TableRow>
        {identityCells}
        <TableCell>{typeBadge}</TableCell>
        <TableCell className="max-w-72">
          {row.address ? (
            <CopyableValue value={row.address}>{row.address}</CopyableValue>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="pr-5">
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-sky-600"
                  onClick={onEditRequest}
                  disabled={editDisabled}
                  aria-label={`Edit accommodation for ${row.name}`}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
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
        <Select value={type} onValueChange={(v) => setType(v as "HOSTEL" | "RENTAL")}>
          <SelectTrigger className="h-8 w-28">
            {type === "" ? "Select" : TYPE_LABELS[type]}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOSTEL">Hostel</SelectItem>
            <SelectItem value="RENTAL">Rental</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={300}
            disabled={isPending}
            aria-label={`Address for ${row.name}`}
            placeholder="Address"
            className="h-8 w-64"
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
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