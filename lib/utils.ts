import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PROGRAM_TOTAL_YEARS, SESSION_START_MONTH_DAY, SESSIONS_PER_YEAR } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function computeNextIntakeNo(intakeCount: number) {
  // const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(intakes);
  const localSeq = intakeCount + 1;
  const globalSeq = 42 + localSeq;
  return `${localSeq}/${globalSeq}`;
}

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function computeAcademicSchedule(startYear: number): Array<{
  yearNumber: number;
  calendarYear: number;
  sessions: Array<{ sessionNumber: number; startDate: Date }>;
}> {
  const today = new Date();
  const schedule = [];

  for (let yearNumber = 1; yearNumber <= PROGRAM_TOTAL_YEARS; yearNumber++) {
    const calendarYear = startYear + (yearNumber - 1);
    const yearStartDate = utcDate(calendarYear, 10, 1);

    if (yearStartDate > today) {
      break;
    }

    const sessions = [];

    for (let sessionNumber = 1; sessionNumber <= SESSIONS_PER_YEAR; sessionNumber++) {
      const { month, day, yearOffset } = SESSION_START_MONTH_DAY[sessionNumber];
      const sessionStartDate = utcDate(calendarYear + yearOffset, month, day);

      if (sessionStartDate > today) {
        break;
      }

      sessions.push({ sessionNumber, startDate: sessionStartDate });
    }

    schedule.push({ yearNumber, calendarYear, sessions });
  }

  return schedule;
}