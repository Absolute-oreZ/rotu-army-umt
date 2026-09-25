"use server";

import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cadets,
  eventTranslations,
  events,
  intakes,
  members,
} from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { wrapLikePattern } from "@/lib/admin/table-search-params";

export type BestCadetSearchResult = {
  id: number;
  label: string;
  detail: string | null;
};

const MAX_RESULTS = 20;

export async function searchBestCadetRecords(
  kind: "cadet" | "story",
  query: string,
): Promise<
  | { success: true; data: BestCadetSearchResult[] }
  | { success: false; error: string }
> {
  try {
    const admin = await requireCurrentAdmin();

    if (!canAccessAdminModule(admin.role, "portfolio")) {
      return {
        success: false,
        error: "You do not have permission to search records.",
      };
    }

    const term = query.trim();
    if (term.length < 2) return { success: true, data: [] };

    const pattern = wrapLikePattern(term);

    if (kind === "cadet") {
      const rows = await db
        .select({
          id: members.id,
          label: members.displayName,
          detail: sql<string>`concat('Army No. ', ${members.armyNo}, ' · Matric ', ${cadets.matricNo}, ' · Intake ', ${intakes.intakeNo})`,
        })
        .from(cadets)
        .innerJoin(members, eq(cadets.memberId, members.id))
        .innerJoin(intakes, eq(cadets.intakeId, intakes.id))
        .where(
          and(
            eq(cadets.isActive, true),
            or(
              ilike(members.displayName, pattern),
              sql`${members.armyNo}::text ilike ${pattern}`,
              ilike(cadets.matricNo, pattern),
            ),
          ),
        )
        .orderBy(asc(members.displayName))
        .limit(MAX_RESULTS);

      return { success: true, data: rows };
    }

    const rows = await db
      .select({ id: events.id, label: events.name, detail: events.slug })
      .from(events)
      .leftJoin(
        eventTranslations,
        and(
          eq(eventTranslations.eventId, events.id),
          eq(eventTranslations.locale, "en"),
        ),
      )
      .where(
        and(
          eq(events.status, "PUBLISHED"),
          or(
            ilike(events.name, pattern),
            ilike(eventTranslations.title, pattern),
          ),
        ),
      )
      .orderBy(asc(events.startDate))
      .limit(MAX_RESULTS);

    return { success: true, data: rows };
  } catch (error) {
    console.error("searchBestCadetRecords failed", error);
    return { success: false, error: "Failed to search records." };
  }
}
