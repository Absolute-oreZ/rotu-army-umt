import { PROGRAM_TOTAL_YEARS, SESSION_START_MONTH_DAY, SESSIONS_PER_YEAR } from "@/lib/constants";
import { utcDate } from "@/lib/time/date";

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
    if (yearStartDate > today) break;

    const sessions = [];
    for (let sessionNumber = 1; sessionNumber <= SESSIONS_PER_YEAR; sessionNumber++) {
      const { month, day, yearOffset } = SESSION_START_MONTH_DAY[sessionNumber];
      const sessionStartDate = utcDate(calendarYear + yearOffset, month, day);
      if (sessionStartDate > today) break;
      sessions.push({ sessionNumber, startDate: sessionStartDate });
    }
    schedule.push({ yearNumber, calendarYear, sessions });
  }

  return schedule;
}