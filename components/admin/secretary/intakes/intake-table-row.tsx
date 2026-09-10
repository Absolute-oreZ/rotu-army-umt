"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeftIcon, CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { updateIntake } from "@/app/admin/secretary/intakes/actions";
import { digitsOnly } from "@/lib/admin/form-helpers";
import { storageUrl } from "@/lib/supabase/storage-public";
import Image from "next/image";
import type { IntakeRow } from "./intakes-table";

const INTAKE_NO_RE = /^\d+\/\d+$/;

type IntakeTableRowProps = {
  intake: IntakeRow;
  isEditing: boolean;
  editDisabled: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
  onSaved: () => void;
  mobile?: boolean;
  statusBadgeColor: (status: string) => string;
  formatStatus: (status: string) => string;
  onStatusChange: () => void;
};

export function IntakeTableRow({
  intake,
  isEditing,
  editDisabled,
  onEditRequest,
  onEditEnd,
  onSaved,
  mobile = false,
  statusBadgeColor,
  formatStatus,
  onStatusChange,
}: IntakeTableRowProps) {
  const router = useRouter();
  const [intakeNo, setIntakeNo] = useState(intake.intakeNo);
  const [displayName, setDisplayName] = useState(intake.displayName);
  const [startYear, setStartYear] = useState(String(intake.startYear));
  const [tagLine, setTagLine] = useState(intake.tagLine ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid =
    INTAKE_NO_RE.test(intakeNo.trim()) &&
    displayName.trim() !== "" &&
    Number.isInteger(Number(startYear)) &&
    Number(startYear) >= 2000 &&
    Number(startYear) <= 2100;

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);
    const formData = new FormData();
    formData.set("intakeId", String(intake.id));
    formData.set("intakeNo", intakeNo.trim());
    formData.set("displayName", displayName.trim());
    formData.set("startYear", startYear);
    formData.set("tagLine", tagLine.trim());
    formData.set("status", intake.status);

    startTransition(async () => {
      const result = await updateIntake(formData);
      if (result.success) {
        router.refresh();
        onSaved();
      } else {
        setError(result.error ?? "Failed to update intake.");
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && formValid && !isPending) {
      event.preventDefault();
      handleSave();
    }
    if (event.key === "Escape" && !isPending) {
      event.preventDefault();
      onEditEnd();
    }
  }

  const patchCell = intake.patchPhotoPath ? (
    <div className="relative size-8 overflow-hidden rounded-full border border-border">
      <Image src={storageUrl(intake.patchPhotoPath)} alt="" fill sizes="32px" className="object-cover" />
    </div>
  ) : (
    <div className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
      {intake.intakeNo.charAt(0)}
    </div>
  );

  if (mobile) {
    return (
      <div className="flex gap-3 rounded-lg border border-border p-4">
        {patchCell}
        <div className="min-w-0 flex-1">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{intake.displayName}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeColor(intake.status)}`}>
                  {formatStatus(intake.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {intake.intakeNo} · {intake.startYear} · {intake.cadetCount} active cadets
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{intake.tagLine || "No tagline"}</p>
              <div className="mt-2 flex items-center gap-1">
                <Button variant="outline" size="sm" className="flex-1 hover:text-sky-600" onClick={onEditRequest} disabled={editDisabled}>
                  <PencilIcon className="size-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="hover:text-amber-500" onClick={onStatusChange} disabled={editDisabled}>
                  <ArrowRightLeftIcon className="size-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={isPending} autoFocus aria-label="Display name" />
              <Input value={intakeNo} onChange={(event) => setIntakeNo(event.target.value)} onKeyDown={handleKeyDown} disabled={isPending} aria-label="Intake number" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={startYear} onChange={(event) => setStartYear(digitsOnly(event.target.value))} onKeyDown={handleKeyDown} disabled={isPending} aria-label="Start year" />
                <Input value={tagLine} onChange={(event) => setTagLine(event.target.value)} onKeyDown={handleKeyDown} disabled={isPending} aria-label="Tagline" />
              </div>
              {error && <span className="text-xs text-red-500">{error}</span>}
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon-xs" onClick={handleSave} disabled={isPending || !formValid} aria-label="Save">
                  {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={onEditEnd} disabled={isPending} aria-label="Cancel">
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <TableRow>
        <TableCell>{patchCell}</TableCell>
        <TableCell className="font-mono text-sm font-medium">{intake.intakeNo}</TableCell>
        <TableCell className="font-medium">{intake.displayName}</TableCell>
        <TableCell>{intake.startYear}</TableCell>
        <TableCell>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor(intake.status)}`}>
            {formatStatus(intake.status)}
          </span>
        </TableCell>
        <TableCell>{intake.cadetCount}</TableCell>
        <TableCell className="max-w-56 truncate">{intake.tagLine || "—"}</TableCell>
        <TableCell className="pr-5">
          <div className="flex items-center justify-end gap-0.5">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-sky-600"
                  onClick={onEditRequest}
                  disabled={editDisabled}
                  aria-label={`Edit ${intake.displayName}`}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-amber-500"
                  onClick={onStatusChange}
                  disabled={editDisabled}
                  aria-label={`Change status for ${intake.displayName}`}
                >
                  <ArrowRightLeftIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Change Status</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{patchCell}</TableCell>
      <TableCell>
        <Input value={intakeNo} onChange={(event) => setIntakeNo(event.target.value)} onKeyDown={handleKeyDown} className="h-8 w-24" autoFocus disabled={isPending} />
      </TableCell>
      <TableCell>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} onKeyDown={handleKeyDown} className="h-8 min-w-40" disabled={isPending} />
      </TableCell>
      <TableCell>
        <Input value={startYear} onChange={(event) => setStartYear(digitsOnly(event.target.value))} onKeyDown={handleKeyDown} className="h-8 w-20" inputMode="numeric" disabled={isPending} />
      </TableCell>
      <TableCell>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor(intake.status)}`}>
          {formatStatus(intake.status)}
        </span>
      </TableCell>
      <TableCell>{intake.cadetCount}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input value={tagLine} onChange={(event) => setTagLine(event.target.value)} onKeyDown={handleKeyDown} className="h-8 min-w-40" disabled={isPending} />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={handleSave} disabled={isPending || !formValid}>
                {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save (Enter)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={onEditEnd} disabled={isPending}>
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
