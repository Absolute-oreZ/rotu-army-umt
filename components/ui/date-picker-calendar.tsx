"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerCalendarProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  maxDate?: Date;
  minDate?: Date;
};

type View = "days" | "months" | "years";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DatePickerCalendar({
  value,
  onChange,
  maxDate,
  minDate,
}: DatePickerCalendarProps) {
  const [view, setView] = useState<View>("days");
  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = value ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedStr = value ? toDateStr(value) : null;
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const maxStr = maxDate ? toDateStr(maxDate) : null;
  const minStr = minDate ? toDateStr(minDate) : null;

  function isDisabled(dateStr: string) {
    if (maxStr && dateStr > maxStr) return true;
    if (minStr && dateStr < minStr) return true;
    return false;
  }

  function prevMonth() {
    setDisplayMonth((d) => {
      const m = d.month - 1;
      return m < 0 ? { year: d.year - 1, month: 11 } : { year: d.year, month: m };
    });
  }

  function nextMonth() {
    setDisplayMonth((d) => {
      const m = d.month + 1;
      return m > 11 ? { year: d.year + 1, month: 0 } : { year: d.year, month: m };
    });
  }

  function prevYear() {
    setDisplayMonth((d) => ({ ...d, year: d.year - 1 }));
  }

  function nextYear() {
    setDisplayMonth((d) => ({ ...d, year: d.year + 1 }));
  }

  function selectMonth(m: number) {
    setDisplayMonth((d) => ({ ...d, month: m }));
    setView("days");
  }

  function selectYear(year: number) {
    setDisplayMonth((d) => ({ ...d, year }));
    setView("days");
  }

  function handleDayClick(dateStr: string) {
    if (isDisabled(dateStr)) return;
    const date = parseDateStr(dateStr);
    if (selectedStr === dateStr) {
      onChange(undefined);
    } else {
      onChange(date);
    }
  }

  const { year, month } = displayMonth;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const prevMonthDays = new Date(year, month, 0).getDate();

  const weeks: Array<
    Array<{ day: number; dateStr: string; isCurrentMonth: boolean }>
  > = [];

  let currentDay = prevMonthDays - startWeekday + 1;
  let isCurrentMonth = false;

  for (let w = 0; w < 6; w++) {
    const week: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      if (currentDay > prevMonthDays && !isCurrentMonth) {
        isCurrentMonth = true;
        currentDay = 1;
      } else if (currentDay > daysInMonth && isCurrentMonth) {
        isCurrentMonth = false;
        currentDay = 1;
      }
      const actualMonth = isCurrentMonth ? month : month === 0 ? 11 : month - 1;
      const actualYear = isCurrentMonth
        ? year
        : month === 0 && !isCurrentMonth
          ? year - 1
          : year;
      week.push({
        day: currentDay,
        dateStr: toDateStr(new Date(actualYear, actualMonth, currentDay)),
        isCurrentMonth,
      });
      currentDay++;
    }
    weeks.push(week);
  }

  const navBtn =
    "inline-flex items-center justify-center rounded-md p-1 hover:bg-accent text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors";

  if (view === "months") {
    return (
      <div className="p-3" style={{ minWidth: 280 }}>
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={prevYear}
            className={cn(navBtn, "size-7")}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("years")}
            className="flex-1 text-center text-sm font-medium tabular-nums rounded px-1 py-0.5 hover:bg-accent transition-colors"
          >
            {year}
          </button>
          <button
            type="button"
            onClick={nextYear}
            className={cn(navBtn, "size-7")}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, m) => {
            const isSelected = selectedStr && m === value!.getMonth() && year === value!.getFullYear();
            return (
              <button
                key={m}
                type="button"
                onClick={() => selectMonth(m)}
                className={cn(
                  "rounded-md px-2 py-3 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-primary text-primary-foreground",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "years") {
    const decadeStart = Math.floor(year / 10) * 10 - 5;
    return (
      <div className="p-3" style={{ minWidth: 280 }}>
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setDisplayMonth((d) => ({ ...d, year: d.year - 20 }))
            }
            className={cn(navBtn, "size-7")}
          >
            <ChevronsLeftIcon className="size-4" />
          </button>
          <span className="flex-1 text-center text-sm font-medium tabular-nums">
            {decadeStart} – {decadeStart + 19}
          </span>
          <button
            type="button"
            onClick={() =>
              setDisplayMonth((d) => ({ ...d, year: d.year + 20 }))
            }
            className={cn(navBtn, "size-7")}
          >
            <ChevronsRightIcon className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 20 }, (_, i) => {
            const y = decadeStart + i;
            return (
              <button
                key={y}
                type="button"
                onClick={() => selectYear(y)}
                className={cn(
                  "rounded-md px-2 py-3 text-xs font-medium tabular-nums transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  y === year && "bg-accent font-semibold",
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3" style={{ minWidth: 280 }}>
      <div className="mb-2 flex items-center gap-0.5">
        <button
          type="button"
          onClick={prevYear}
          className={cn(navBtn, "size-7")}
        >
          <ChevronsLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={prevMonth}
          className={cn(navBtn, "size-7")}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-0.5 text-sm">
          <button
            type="button"
            onClick={() => setView("months")}
            className="rounded px-1.5 py-0.5 font-medium text-foreground hover:bg-accent transition-colors"
          >
            {MONTH_NAMES[month]}
          </button>
          <button
            type="button"
            onClick={() => setView("years")}
            className="rounded px-1.5 py-0.5 font-medium tabular-nums text-foreground hover:bg-accent transition-colors"
          >
            {year}
          </button>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className={cn(navBtn, "size-7")}
        >
          <ChevronRightIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={nextYear}
          className={cn(navBtn, "size-7")}
        >
          <ChevronsRightIcon className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-8 items-center justify-center text-[10px] font-medium uppercase text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {weeks.flat().map(({ day, dateStr, isCurrentMonth }, i) => {
          const isSelected = dateStr === selectedStr;
          const isToday = dateStr === todayStr;
          const disabled = !isCurrentMonth || isDisabled(dateStr);

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(dateStr)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                isCurrentMonth && "hover:bg-accent",
                isToday && !isSelected && "bg-accent/50 font-semibold",
                isSelected && "bg-primary text-primary-foreground font-semibold",
                !isCurrentMonth && "text-muted-foreground/40",
                disabled && "pointer-events-none opacity-30",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
