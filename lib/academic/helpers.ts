export type TimetableDay = "SUN" | "MON" | "TUE" | "WED" | "THU";

export const TIMETABLE_DAYS: readonly TimetableDay[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
];

export const TIMETABLE_DAY_LABELS: Record<TimetableDay, string> = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
};

export const TIMETABLE_SLOT_TIMES = [
  "0800",
  "0900",
  "1000",
  "1100",
  "1200",
  "1300",
  "1400",
  "1500",
  "1600",
  "1700",
] as const;

export type TimetableSlotTime = (typeof TIMETABLE_SLOT_TIMES)[number];

export const LUNCH_BREAK_SLOTS: readonly TimetableSlotTime[] = ["1300"];

export function isLunchBreakSlot(time: string): boolean {
  return time === "1300";
}

export function formatSlotTime(time: string): string {
  if (time.length !== 4) return time;
  const hours = parseInt(time.slice(0, 2), 10);
  const minutes = time.slice(2);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${period}`;
}

export function formatSlotRange(startTime: string, durationUnits = 1): string {
  const startIndex = TIMETABLE_SLOT_TIMES.indexOf(startTime as TimetableSlotTime);
  if (startIndex === -1) return formatSlotTime(startTime);
  const endIndex = Math.min(
    TIMETABLE_SLOT_TIMES.length - 1,
    startIndex + durationUnits
  );
  return `${formatSlotTime(startTime)} – ${formatSlotTime(
    TIMETABLE_SLOT_TIMES[endIndex] ?? startTime
  )}`;
}

export function makeSlotKey(day: TimetableDay, time: TimetableSlotTime): string {
  return `${day}_${time}`;
}

export function parseSlotKey(slotKey: string): {
  day: TimetableDay;
  time: TimetableSlotTime;
} | null {
  const parts = slotKey.split("_");
  if (parts.length !== 2) return null;
  const [day, time] = parts;
  if (!TIMETABLE_DAYS.includes(day as TimetableDay)) return null;
  if (!TIMETABLE_SLOT_TIMES.includes(time as TimetableSlotTime)) return null;
  return {
    day: day as TimetableDay,
    time: time as TimetableSlotTime,
  };
}

export function calculateCadetCurrentYear(
  intakeStartYear: number,
  asOf: Date = new Date()
): number {
  const currentCalendarYear = asOf.getFullYear();
  const isAfterOct1 =
    asOf.getMonth() > 9 || (asOf.getMonth() === 9 && asOf.getDate() >= 1);
  const academicStartYear = isAfterOct1
    ? currentCalendarYear
    : currentCalendarYear - 1;
  const elapsedYears = academicStartYear - intakeStartYear;
  return Math.max(1, elapsedYears + 1);
}

export function formatCadetYearRatio(
  currentYear: number,
  completionYear: number = 3
): string {
  return `${currentYear}/${completionYear}`;
}

export function isCadetCourseCompleted(
  currentYear: number,
  completionYear: number = 3
): boolean {
  return currentYear > completionYear;
}

export function formatAcademicSessionTitle(
  intakeNo: string,
  calendarYear: number,
  sessionNumber: number
): string {
  return `${intakeNo}-${calendarYear}-${sessionNumber}`;
}

export type GpaTier = "danger" | "success" | "warning" | "primary" | "muted";

export function getGpaTier(score: number | null | undefined): GpaTier {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "muted";
  }
  if (score <= 2.5) return "danger";
  if (score <= 3.0) return "success";
  if (score <= 3.5) return "warning";
  return "primary";
}

export const GPA_TIER_CLASSES: Record<GpaTier, string> = {
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  primary: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  muted: "text-muted-foreground",
};

export function isAcademicManualProvisionEnabled(): boolean {
  return process.env.ACADEMIC_MANUAL_PROVISION === "true";
}

export type AcademicSessionOption = {
  id: number;
  title: string;
  intakeNo: string;
  calendarYear: number;
  sessionNumber: number;
};

export function buildAcademicSessionOptions(rows: Array<{
  id: number;
  sessionNumber: number;
  calendarYear: number;
  intakeNo: string;
}>): AcademicSessionOption[] {
  return rows.map((s) => ({
    id: s.id,
    title: formatAcademicSessionTitle(s.intakeNo, s.calendarYear, s.sessionNumber),
    intakeNo: s.intakeNo,
    calendarYear: s.calendarYear,
    sessionNumber: s.sessionNumber,
  }));
}
