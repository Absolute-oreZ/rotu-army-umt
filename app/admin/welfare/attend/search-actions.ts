"use server";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cadets, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";

export type SearchResult = {
  id: number;
  label: string;
  armyNo: number;
};

const MAX_RESULTS = 20;

export async function searchCadets(
  query: string,
  limit = MAX_RESULTS
): Promise<{ success: true; data: SearchResult[] } | { success: false; error: string }> {
  try {
    const admin = await requireCurrentAdmin();

    if (!canAccessAdminModule(admin.role, "attend")) {
      return { success: false, error: "You do not have permission to search cadets." };
    }

    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const intakeScope = getIntakeScope(admin);
    const trimmedQuery = query.trim();
    const contains = `%${trimmedQuery}%`;
    const prefix = `${trimmedQuery}%`;
    const take = Math.min(Math.max(Math.trunc(limit) || MAX_RESULTS, 1), MAX_RESULTS);

    const conditions = [eq(cadets.isActive, true)];

    if (intakeScope !== null) {
      conditions.push(eq(cadets.intakeId, intakeScope));
    }

    const searchClause = or(
      ilike(members.name, contains),
      sql`${members.armyNo}::text ILIKE ${prefix}`,
      ilike(cadets.matricNo, contains)
    );

    if (searchClause) {
      conditions.push(searchClause);
    }

    const results = await db
      .select({
        id: cadets.id,
        name: members.name,
        armyNo: members.armyNo,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .where(and(...conditions))
      .orderBy(asc(members.name), asc(cadets.id))
      .limit(take);

    const data: SearchResult[] = results.map((r) => ({
      id: r.id,
      label: `${r.name} · #${r.armyNo}`,
      armyNo: r.armyNo,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("searchCadets failed", error);
    return { success: false, error: "Failed to search cadets." };
  }
}