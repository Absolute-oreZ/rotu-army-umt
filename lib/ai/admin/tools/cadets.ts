import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cadets, intakes, members } from "@/db/schema";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import {
  intakeFilter,
  searchTerm,
  type AdminToolData,
  escapeSearchWildcards,
} from "@/lib/ai/admin/tools/shared";

export async function executeCadetTool(
  name: string,
  intakeId: number | null,
  question: string,
): Promise<AdminToolData | null> {
  if (name === "get_cadet_statistics") {
    const [row] = await db
      .select({
        total: count(cadets.id),
        active: sql<number>`count(*) filter (where ${cadets.isActive} = true)`,
      })
      .from(cadets)
      .where(intakeFilter(intakeId, cadets.intakeId));
    return {
      totalCadets: Number(row?.total ?? 0),
      activeCadets: Number(row?.active ?? 0),
    };
  }
  if (name === "search_cadets") {
    const term = escapeSearchWildcards(searchTerm(question));
    if (!term)
      return {
        matches: "Provide a cadet name to search. No records were queried.",
      };
    const rows = await db
      .select({
        displayName: members.displayName,
        rank: members.rank,
        intake: intakes.displayName,
        active: cadets.isActive,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .where(
        and(
          intakeFilter(intakeId, cadets.intakeId),
          or(
            ilike(members.displayName, `%${term}%`),
            ilike(members.name, `%${term}%`),
          ),
        ),
      )
      .orderBy(members.displayName)
      .limit(AI_LIMITS.maxRows);
    return { matches: JSON.stringify(rows) };
  }
  return null;
}
