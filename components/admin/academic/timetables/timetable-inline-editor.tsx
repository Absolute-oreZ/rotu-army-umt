"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, EraserIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableSchedule } from "./timetable-schedule";
import { updateTimetableSlotsAction } from "@/app/admin/academic/timetables/actions";
import {
  TIMETABLE_SLOT_TIMES,
  makeSlotKey,
  parseSlotKey,
  type TimetableDay,
  type TimetableSlotTime,
} from "@/lib/academic/helpers";

type DragAnchor = {
  day: TimetableDay;
  startIndex: number;
  fill: boolean;
};

type TimetableInlineEditorProps = {
  timetableId: number;
  sessionId: number;
  cadetId: number;
  occupiedSlots: string[];
  onExit: () => void;
};

export function TimetableInlineEditor({
  timetableId,
  sessionId,
  cadetId,
  occupiedSlots,
  onExit,
}: TimetableInlineEditorProps) {
  const router = useRouter();

  const [slots, setSlots] = useState<Set<string>>(
    () =>
      new Set(
        occupiedSlots.filter((slotKey) => parseSlotKey(slotKey) !== null),
      ),
  );
  const [previewKeys, setPreviewKeys] = useState<Set<string>>(() => new Set());
  const [previewFill, setPreviewFill] = useState(true);
  const dragAnchorRef = useRef<DragAnchor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effective = new Set(slots);
  if (previewFill) {
    for (const key of previewKeys) effective.add(key);
  } else {
    for (const key of previewKeys) effective.delete(key);
  }

  function handleSlotMouseDown(day: TimetableDay, time: TimetableSlotTime) {
    const key = makeSlotKey(day, time);
    const fill = !effective.has(key);

    dragAnchorRef.current = { day, startIndex: TIMETABLE_SLOT_TIMES.indexOf(time), fill };
    setPreviewFill(fill);
    setPreviewKeys(new Set([key]));
  }

  function handleSlotMouseEnter(day: TimetableDay, time: TimetableSlotTime) {
    const anchor = dragAnchorRef.current;
    if (!anchor || anchor.day !== day) return;

    const hoverIndex = TIMETABLE_SLOT_TIMES.indexOf(time);
    const [from, to] = anchor.startIndex <= hoverIndex
      ? [anchor.startIndex, hoverIndex]
      : [hoverIndex, anchor.startIndex];

    const nextPreview = new Set<string>();
    for (let i = from; i <= to; i++) {
      nextPreview.add(makeSlotKey(day, TIMETABLE_SLOT_TIMES[i] as TimetableSlotTime));
    }
    setPreviewKeys(nextPreview);
  }

  function handleGridMouseUp() {
    const anchor = dragAnchorRef.current;
    if (!anchor) return;
    dragAnchorRef.current = null;

    const next = new Set(slots);
    for (const key of previewKeys) {
      if (anchor.fill) {
        next.add(key);
      } else {
        next.delete(key);
      }
    }

    setSlots(next);
    setPreviewKeys(new Set());
  }

  function handleClearAll() {
    setSlots(new Set());
    setPreviewKeys(new Set());
  }

  function handleCancel() {
    setSlots(new Set(occupiedSlots.filter((slotKey) => parseSlotKey(slotKey) !== null)));
    setPreviewKeys(new Set());
    onExit();
  }

  function handleSave() {
    setError(null);

    startTransition(async () => {
      const res = await updateTimetableSlotsAction({
        timetableId,
        sessionId,
        cadetId,
        occupiedSlots: Array.from(slots).sort(),
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      router.refresh();
      onExit();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div
        className="select-none"
        onMouseUp={handleGridMouseUp}
        onMouseLeave={handleGridMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        <TimetableSchedule
          mode="edit"
          occupiedSlots={Array.from(effective)}
          previewSlots={Array.from(previewKeys)}
          previewFill={previewFill}
          onSlotMouseDown={handleSlotMouseDown}
          onSlotMouseEnter={handleSlotMouseEnter}
        />
      </div>

      <div className="flex flex-row justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClearAll}
          disabled={isPending}
          className="mr-auto"
        >
          <EraserIcon className="size-4" />
          Clear All
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
        >
          <XIcon className="size-3.5" />
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2Icon className="size-3.5 animate-spin" />}
          <CheckIcon className="size-3.5" />
          Save Timetable
        </Button>
      </div>
    </div>
  );
}
