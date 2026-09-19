"use client";

import { cn } from "@/lib/utils";
import {
  TIMETABLE_DAYS,
  TIMETABLE_DAY_LABELS,
  TIMETABLE_SLOT_TIMES,
  formatSlotTime,
  isLunchBreakSlot,
  makeSlotKey,
  type TimetableDay,
  type TimetableSlotTime,
} from "@/lib/academic/helpers";

type TimetableScheduleProps = {
  mode: "view" | "edit";
  occupiedSlots: string[];
  previewSlots?: string[];
  previewFill?: boolean;
  onSlotMouseDown?: (day: TimetableDay, time: TimetableSlotTime) => void;
  onSlotMouseEnter?: (day: TimetableDay, time: TimetableSlotTime) => void;
};

const HATCH_STYLE = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(128,128,128,0.12) 6px, rgba(128,128,128,0.12) 12px)",
};

export function TimetableSchedule({
  mode,
  occupiedSlots,
  previewSlots = [],
  previewFill = true,
  onSlotMouseDown,
  onSlotMouseEnter,
}: TimetableScheduleProps) {
  const occupied = new Set(occupiedSlots);
  const preview = new Set(previewSlots);
  const isEdit = mode === "edit";

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead className="bg-muted/50">
                      <tr>
                        <th className="w-16 min-w-14 border-b border-r border-border px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Day
                        </th>
                        {TIMETABLE_SLOT_TIMES.map((time) => (
                          <th
                            key={time}
                            className="border-b border-r border-border px-0.5 py-1.5 text-center font-mono text-[9px] font-medium text-muted-foreground last:border-r-0"
                          >
                            {formatSlotTime(time).replace(" ", "").replace("AM", "").replace("PM", "")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIMETABLE_DAYS.map((day) => {
                        return (
                          <tr key={day} className="border-b border-border last:border-b-0">
                            <th className="w-16 min-w-14 border-r border-border px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {day}
                            </th>
                  {TIMETABLE_SLOT_TIMES.map((time) => {
                                      const key = makeSlotKey(day as TimetableDay, time as TimetableSlotTime);

                                      if (isLunchBreakSlot(time)) {
                                        return (
                                          <td
                                            key={key}
                                            className="border-r border-border px-0 py-1.5 text-center align-middle last:border-r-0"
                                            style={HATCH_STYLE}
                                          >
                                            <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
                                              Lunch
                                            </span>
                                          </td>
                                        );
                                      }

                    const isOccupied = occupied.has(key);
                    const isPreview = preview.has(key);

                    if (isEdit) {
                      return (
                        <td key={key} className="border-r border-border px-0.5 py-1 last:border-r-0">
                          <button
                            type="button"
                            aria-pressed={isOccupied}
                            aria-label={`${TIMETABLE_DAY_LABELS[day]} ${formatSlotTime(time)}`}
                            onMouseDown={() => onSlotMouseDown?.(day as TimetableDay, time)}
                            onMouseEnter={() => onSlotMouseEnter?.(day as TimetableDay, time)}
                            className={cn(
                              "h-7 w-full rounded-sm border transition-colors",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                              isOccupied
                                ? "border-primary/40 bg-primary/15"
                                : "border-dashed border-border/70 bg-muted/20 hover:border-primary/30",
                              isPreview &&
                                (previewFill
                                  ? "border-primary/50 bg-primary/25"
                                  : "border-destructive/40 bg-destructive/15"),
                            )}
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={key} className="border-r border-border px-0.5 py-1 last:border-r-0">
                        <div
                          className={cn(
                            "h-7 w-full rounded-sm border",
                            isOccupied
                              ? "border-primary/40 bg-primary/15"
                              : "border-dashed border-border/70 bg-muted/20",
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
