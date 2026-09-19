"use client";

import { useState, useTransition } from "react";
import { CheckIcon, Loader2Icon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { updateCourseAction } from "@/app/admin/academic/courses/actions";
import type { CourseManagementRow } from "./courses-management-table";

type CourseManagementTableRowProps = {
  course: CourseManagementRow;
  isEditing: boolean;
  editDisabled: boolean;
  onEditRequest: () => void;
  onEditEnd: () => void;
  onDeleteRequest: () => void;
};

export function CourseManagementTableRow({
  course,
  isEditing,
  editDisabled,
  onEditRequest,
  onEditEnd,
  onDeleteRequest,
}: CourseManagementTableRowProps) {
  const [name, setName] = useState(course.name);
  const [completionYear, setCompletionYear] = useState(String(course.completionYear));
  const [isSupported, setIsSupported] = useState(String(course.isSupported));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedYear = Number(completionYear);
  const formValid =
    name.trim() !== "" &&
    Number.isInteger(parsedYear) &&
    parsedYear >= 1 &&
    parsedYear <= 8;

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    const formData = new FormData();
    formData.set("id", String(course.id));
    formData.set("name", name.trim());
    formData.set("completionYear", String(parsedYear));
    formData.set("isSupported", isSupported);

    startTransition(async () => {
      const res = await updateCourseAction(formData);
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

  if (!isEditing) {
    return (
      <TableRow>
        <TableCell>
          <CopyableValue value={course.name}>{course.name}</CopyableValue>
        </TableCell>
        <TableCell className="tabular-nums">
          {course.completionYear} {course.completionYear === 1 ? "Year" : "Years"}
        </TableCell>
        <TableCell>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              course.isSupported
                ? "bg-emerald-600/15 text-emerald-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {course.isSupported ? "Supported" : "Unsupported"}
          </span>
        </TableCell>
        <TableCell className="font-mono tabular-nums">{course.enrolledCount}</TableCell>
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
                  aria-label={`Edit ${course.name}`}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit course</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-red-600"
                  onClick={onDeleteRequest}
                  disabled={editDisabled}
                  aria-label={`Delete ${course.name}`}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete course</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            autoFocus
            aria-label={`Course name for ${course.name}`}
            className="h-8 w-64 max-w-full uppercase"
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          max={8}
          value={completionYear}
          onChange={(e) => setCompletionYear(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          inputMode="numeric"
          aria-label={`Duration in years for ${course.name}`}
          className="h-8 w-20 tabular-nums"
        />
      </TableCell>
      <TableCell>
        <Select value={isSupported} onValueChange={setIsSupported}>
          <SelectTrigger aria-label={`Supported status for ${course.name}`} className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="font-mono tabular-nums">{course.enrolledCount}</TableCell>
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
                aria-label={`Save ${course.name}`}
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
                aria-label={`Cancel edit for ${course.name}`}
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

