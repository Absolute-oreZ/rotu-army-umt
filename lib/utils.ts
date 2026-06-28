import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DEFAULT_AGE, PROGRAM_TOTAL_YEARS, SESSION_START_MONTH_DAY, SESSIONS_PER_YEAR } from "./data";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDU_DOMAIN = "ocean.umt.edu.my";

export type BMIClassification = "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(start: Date, end: Date, locale: string): string {
  const s = formatDate(start, locale);
  const e = formatDate(end, locale);
  return s === e ? s : `${s} – ${e}`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function calculateBMI(heightM: number, weightKg: number): number | null {
  if (!Number.isFinite(heightM) || !Number.isFinite(weightKg)) return null;
  if (heightM <= 0 || weightKg <= 0) return null;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 100) / 100;
  if (bmi < 12 || bmi > 60) return null;
  return bmi;
}

export function getBMIClassification(bmi: number | null): BMIClassification | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25) return "NORMAL";
  if (bmi < 30) return "OVERWEIGHT";
  return "OBESE";
}

export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

export function isValidPersonalEmail(email: string): boolean {
  const v = email.trim().toLowerCase();
  if (!EMAIL_RE.test(v)) return false;
  const domain = v.split("@")[1];
  return domain !== EDU_DOMAIN;
}

export function isValidEduEmail(email: string): boolean {
  const v = email.trim().toLowerCase();
  if (!EMAIL_RE.test(v)) return false;
  const domain = v.split("@")[1];
  return domain === EDU_DOMAIN;
}

export function defaultBirthdate(): Date {
  const d = new Date();
  return new Date(d.getFullYear() - DEFAULT_AGE, 0, 1);
}


export function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}