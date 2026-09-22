import { and, desc, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { religiousActivities } from "@/db/schema";
import { requireAdminModule } from "@/lib/admin/rbac";
import { getReligiousActivityTypes } from "@/lib/welfare/religious-activity-types";
import {
  buildDateFilterClause,
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  RELIGIOUS_ACTIVITIES_SORT_FIELD_MAP,
  buildReligiousActivitiesTableConfig,
} from "@/components/admin/welfare/religious-activities/table-config";
import { ReligiousActivitiesPageClient } from "@/components/admin/welfare/religious-activities/religious-activities-page-client";
import type { ReligiousActivityRow } from "@/components/admin/welfare/religious-activities/religious-activities-table";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(religiousActivities.title, contains),
      ilike(religiousActivities.title, prefix),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.type, religiousActivities.type));
  clauses.push(...buildDateFilterClause(state.filters.date, religiousActivities.recordDate));

  return clauses;
}

export default async function ReligiousActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminModule("religion");
  const raw = await searchParams;

  const typeOptions = getReligiousActivityTypes().map((t) => ({
    value: t,
    label: t,
  }));

  const config = buildReligiousActivitiesTableConfig(typeOptions);
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, RELIGIOUS_ACTIVITIES_SORT_FIELD_MAP);
  if (orderBy.length === 0) {
    orderBy.push(desc(religiousActivities.recordDate));
  }
  orderBy.push(desc(religiousActivities.id));

  const [countRow, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(religiousActivities)
      .where(where),
    db
      .select()
      .from(religiousActivities)
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const activities: ReligiousActivityRow[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    recordDate: row.recordDate,
    title: row.title,
    remarks: row.remarks,
    location: row.location,
    meetingLink: row.meetingLink,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <ReligiousActivitiesPageClient
      searchParams={raw}
      activities={activities}
      totalCount={countRow[0]?.count ?? 0}
      typeOptions={typeOptions}
    />
  );
}