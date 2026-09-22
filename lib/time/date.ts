import { DEFAULT_AGE } from "@/lib/constants";

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(start: Date, end: Date, locale: string): string {
  const startLabel = formatDate(start, locale);
  const endLabel = formatDate(end, locale);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

export function calculateAgeAt(birthdate: Date, asOf: Date): number {
  let age = asOf.getFullYear() - birthdate.getFullYear();
  const monthDiff = asOf.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

export function calculateAge(birthdate: Date): number {
  return calculateAgeAt(birthdate, new Date());
}

export function defaultBirthdate(): Date {
  const date = new Date();
  return new Date(date.getFullYear() - DEFAULT_AGE, 0, 1);
}