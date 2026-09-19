"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { updateCadetCourseAction } from "@/app/admin/academic/courses/actions";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { storageUrl } from "@/lib/supabase/storage-public";
import { SearchableSelect } from "@/components/admin/academic/shared/searchable-select";
import type { CadetCourseRow } from "./cadet-courses-table";
import type { CourseOptionItem } from "./edit-cadet-course-dialog";

type CadetCoursesTableRowProps = {
  row: CadetCourseRow;
  courses: CourseOptionItem[];
  isEditing: boolean;
  editDisabled: boolean;
  showIntakeColumn: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CadetCoursesTableRow({
  row,
  courses,
  isEditing,
  editDisabled,
  showIntakeColumn,
  onEditRequest,
  onEditEnd,
}: CadetCoursesTableRowProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    row.studyProgramId ? String(row.studyProgramId) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const avatarUrl = row.avatarPath ? storageUrl(row.avatarPath) : null;

  const courseSelectOptions = useMemo(
    () => [
      { value: "", label: "— Unassigned —" },
      ...courses.map((course) => ({
        value: String(course.id),
        label: `${course.name} (${course.completionYear} Years${
          !course.isSupported ? " • Unsupported" : ""
        })`,
      })),
    ],
    [courses],
  );

  function handleSave() {
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const res = await updateCadetCourseAction({
        cadetId: row.id,
        studyProgramId: selectedProgramId ? parseInt(selectedProgramId, 10) : null,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onEditEnd();
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
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
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
            />
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
      <TableCell>
        <CopyableValue value={row.matricNo} valueClassName="font-mono">
          {row.matricNo}
        </CopyableValue>
      </TableCell>
      {showIntakeColumn && <TableCell>{row.intakeNo}</TableCell>}
    </>
  );

  if (!isEditing) {
      return (
        <TableRow className="hover:bg-muted/50">
          {identityCells}
          <TableCell>{row.courseName ?? "—"}</TableCell>
          <TableCell className="font-mono tabular-nums">
            {row.currentYear}/{row.completionYear}
          </TableCell>
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
                    aria-label={`Edit course for ${row.name}`}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit course</TooltipContent>
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
          <SearchableSelect
            value={selectedProgramId}
            options={courseSelectOptions}
            onChange={(v) => {
              setSelectedProgramId(v);
              setError(null);
            }}
            placeholder="— Unassigned —"
            searchPlaceholder="Search course…"
            emptyLabel="No courses found"
            disabled={isPending}
            className="w-72 max-w-full"
            ariaLabel={`Course for ${row.name}`}
            onKeyDown={handleKeyDown}
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {row.currentYear}/{row.completionYear}
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
                disabled={isPending}
                aria-label={`Save course for ${row.name}`}
              >
                {isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save (Esc to cancel)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-red-600"
                onClick={onEditEnd}
                disabled={isPending}
                aria-label={`Cancel course edit for ${row.name}`}
              >
                <XIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Cancel</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

