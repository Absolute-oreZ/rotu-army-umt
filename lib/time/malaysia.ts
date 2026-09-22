export const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

const malaysiaDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MALAYSIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function dateTimeParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    malaysiaDateTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function getMalaysiaDateISO(date = new Date()): string {
  const parts = dateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatMalaysiaDateTimeLocal(date: Date): string {
  const parts = dateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseMalaysiaDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute) - 8 * 60 * 60 * 1000);
  return formatMalaysiaDateTimeLocal(date) === value ? date : null;
}

export function parseMalaysiaDate(value: string): Date | null {
  return parseMalaysiaDateTimeLocal(`${value}T00:00`);
}