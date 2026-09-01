import { and, desc, ilike, or, sql } from "drizzle-orm";
import { events } from "@/db/schema";
import { db } from "@/db";
import type { SQL } from "drizzle-orm";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildStoriesTableConfig,
  STORIES_SORT_FIELD_MAP,
} from "@/components/admin/multimedia/stories/table-config";
import { StoriesPageClient } from "@/components/admin/multimedia/stories/stories-page-client";
import { getAvailableStoryTags } from "@/app/admin/multimedia/stories/actions";

function buildFilters(state: { q: string; filters: Record<string, FilterCondition[]> }): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(events.name, contains),
      ilike(events.slug, contains),
      ilike(events.location, contains),
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, events.status));
  clauses.push(...buildDateFilterClause(state.filters.startDate, events.startDate));

  return clauses;
}

function buildBaseQuery() {
  return db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      status: events.status,
      coverPhotoPath: events.coverPhotoPath,
      createdAt: events.createdAt,
    })
    .from(events);
}

function buildCountQuery() {
  return db.select({ count: sql<number>`count(*)::int` }).from(events);
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "stories")) {
    notFound();
  }

  const raw = await searchParams;

  const config = buildStoriesTableConfig();
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, STORIES_SORT_FIELD_MAP);
  orderBy.push(desc(events.startDate));
  orderBy.push(desc(events.id));

  const availableTagsPromise = getAvailableStoryTags();
  const [countRow, storyRows, availableTagsResult] = await Promise.all([
    buildCountQuery().where(where),
    buildBaseQuery()
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    availableTagsPromise,
  ]);
  const availableTags = availableTagsResult.data;

  const totalCount = countRow[0]?.count ?? 0;

  return (
    <StoriesPageClient
      searchParams={raw}
      stories={storyRows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        createdAt: s.createdAt.toISOString(),
      }))}
      totalCount={totalCount}
      availableTags={availableTags}
    />
  );
}
