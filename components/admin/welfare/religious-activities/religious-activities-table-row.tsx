"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ImageIcon, Loader2Icon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { updateReligiousActivity } from "@/app/admin/welfare/religious-activities/actions";
import { cn } from "@/lib/utils";
import { formatRecordDate, type ReligiousActivityRow } from "./religious-activities-table";

const TYPE_BADGE_STYLES: Record<string, string> = {
  YASIN: "bg-emerald-600/15 text-emerald-600",
  TAHLIL: "bg-sky-600/15 text-sky-600",
};

function badgeStyle(type: string) {
  return (
    TYPE_BADGE_STYLES[type.toUpperCase()] ??
    "bg-violet-600/15 text-violet-600"
  );
}

type ReligiousActivitiesTableRowProps = {
  activity: ReligiousActivityRow;
  typeOptions: { value: string; label: string }[];
  isEditing: boolean;
  editDisabled: boolean;
  onViewPhotos: (activity: ReligiousActivityRow) => void;
  onEditRequest: (activity: ReligiousActivityRow) => void;
  onDelete: (activity: ReligiousActivityRow) => void;
  onEditEnd: () => void;
};

export function ReligiousActivitiesTableRow({
  activity,
  typeOptions,
  isEditing,
  editDisabled,
  onViewPhotos,
  onEditRequest,
  onDelete,
  onEditEnd,
}: ReligiousActivitiesTableRowProps) {
  const router = useRouter();
  const [type, setType] = useState(activity.type);
  const [recordDate, setRecordDate] = useState(activity.recordDate);
  const [remarks, setRemarks] = useState(activity.remarks ?? "");
  const [location, setLocation] = useState(activity.location);
  const [meetingLink, setMeetingLink] = useState(activity.meetingLink ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = type !== "" && recordDate !== "" && location.trim() !== "";

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    if (meetingLink.trim() && !/^https?:\/\//.test(meetingLink.trim())) {
      setError("Meeting link must start with http:// or https://.");
      return;
    }

    const fd = new FormData();
    fd.set("activityId", String(activity.id));
    fd.set("type", type);
    fd.set("recordDate", recordDate);
    fd.set("remarks", remarks);
    fd.set("location", location);
    fd.set("meetingLink", meetingLink);

    startTransition(async () => {
      const result = await updateReligiousActivity(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
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

  const titleCell = (
    <TableCell className="font-medium">
      <CopyableValue value={activity.title} valueClassName="font-medium">
        {activity.title}
      </CopyableValue>
    </TableCell>
  );

  if (!isEditing) {
    return (
      <TableRow>
        {titleCell}
        <TableCell>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle(activity.type)}`}
          >
            {activity.type}
          </span>
        </TableCell>
        <TableCell className="tabular-nums">
          {formatRecordDate(activity.recordDate)}
        </TableCell>
        <TableCell className="max-w-56">
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {activity.remarks ?? "-"}
          </span>
        </TableCell>
        <TableCell>
          <CopyableValue value={activity.location}>
            {activity.location}
          </CopyableValue>
        </TableCell>
        <TableCell>
          {activity.meetingLink ? (
            <CopyableValue
              value={activity.meetingLink}
              ariaLabel={`Copy meeting link for ${activity.title}`}
            >
              <a
                href={activity.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-block max-w-48 truncate text-sm text-sky-600 hover:underline"
              >
                {activity.meetingLink}
              </a>
            </CopyableValue>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
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
                  onClick={() => onViewPhotos(activity)}
                  disabled={editDisabled}
                  aria-label={`View photos for ${activity.title}`}
                >
                  <ImageIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View photos</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="hover:text-sky-600"
                  onClick={() => onEditRequest(activity)}
                  disabled={editDisabled}
                  aria-label={`Edit ${activity.title}`}
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
                  className="hover:text-red-600"
                  onClick={() => onDelete(activity)}
                  disabled={editDisabled}
                  aria-label={`Delete ${activity.title}`}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={cn("bg-muted/40")}>
      {titleCell}
      <TableCell>
        <Select value={type} onValueChange={(value) => setType(value)}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          aria-label={`Record date for ${activity.title}`}
          className="h-8 w-36 tabular-nums"
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            placeholder="Remarks"
            aria-label={`Remarks for ${activity.title}`}
            className="h-8 w-40"
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          placeholder="Location"
          aria-label={`Location for ${activity.title}`}
          className="h-8 w-36"
        />
      </TableCell>
      <TableCell>
        <Input
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          placeholder="https://..."
          aria-label={`Meeting link for ${activity.title}`}
          className="h-8 w-40"
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
