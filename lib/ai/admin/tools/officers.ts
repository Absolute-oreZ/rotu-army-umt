import { and, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import {
  escapeSearchWildcards,
  searchTerm,
  type AdminToolData,
} from "@/lib/ai/admin/tools/shared";

export async function executeOfficerTool(
  name: string,
  question: string,
): Promise<AdminToolData | null> {
  if (name !== "search_officers") return null;
  const term = escapeSearchWildcards(searchTerm(question));
  if (!term)
    return { matches: "Provide a name to search. No records were queried." };
  const rows = await db
    .select({
      name: members.displayName,
      rank: members.rank,
      role: members.role,
    })
    .from(members)
    .where(
      and(
        sql`${members.role} in ('OFFICER', 'INSTRUCTOR')`,
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
