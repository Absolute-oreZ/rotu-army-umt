import { eq, type SQL } from "drizzle-orm";
import { cadets } from "@/db/schema";

export type AdminToolData = Record<string, number | string | null>;

export function intakeFilter(
  intakeId: number | null,
  column: typeof cadets.intakeId,
): SQL | undefined {
  return intakeId === null ? undefined : eq(column, intakeId);
}

export function searchTerm(question: string) {
  return question
    .replace(
      /\b(please|search|find|lookup|look up|list|show|me|cadets?|members?|kadet|officers?|instructors?|profile|details|for|named|with|name)\b/gi,
      " ",
    )
    .replace(/[?.,]/g, " ")
    .trim()
    .slice(0, 80);
}

export function escapeSearchWildcards(value: string) {
  return value.replace(/[\\%_]/gu, (character) => `\\${character}`);
}

export function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}
