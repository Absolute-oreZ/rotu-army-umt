import { asc, desc, and, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { intakes } from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildIntakesTableConfig,
  INTAKES_SORT_FIELD_MAP,
} from "@/components/admin/secretary/intakes/table-config";
import { IntakesPageClient } from "@/components/admin/secretary/intakes/intakes-page-client";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(intakes.displayName, contains),
      sql`${intakes.intakeNo}::text ILIKE ${prefix}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, intakes.status));

  return clauses;
}

function buildBaseQuery() {
  return db
    .select({
      id: intakes.id,
      intakeNo: intakes.intakeNo,
      displayName: intakes.displayName,
      slug: intakes.slug,
      status: intakes.status,
      startYear: intakes.startYear,
      tagLine: intakes.tagLine,
      coverPhotoPath: intakes.coverPhotoPath,
      patchPhotoPath: intakes.patchPhotoPath,
      cadetCount: sql<number>`(SELECT count(*)::int FROM cadets WHERE cadets.intake_id = intakes.id AND cadets.is_active = true)`,
    })
    .from(intakes);
}

function buildCountQuery() {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(intakes);
}

export default async function IntakesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCurrentAdmin();
  const raw = await searchParams;

  const config = buildIntakesTableConfig();
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, INTAKES_SORT_FIELD_MAP);

  if (orderBy.length === 0) {
    orderBy.push(desc(intakes.startYear));
  }
  orderBy.push(asc(intakes.id));

  const [countRow, intakeRows] = await Promise.all([
    buildCountQuery().where(where),
    buildBaseQuery()
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  return (
    <IntakesPageClient
      searchParams={raw}
      intakes={intakeRows}
      totalCount={totalCount}
    />
  );
}
