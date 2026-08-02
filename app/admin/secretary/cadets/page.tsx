import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { CADET_RANKS, cadets, intakes, members } from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  CADETS_SORT_FIELD_MAP,
  buildCadetsTableConfig,
} from "@/components/admin/secretary/cadets/table-config";
import { CadetsPageClient } from "@/components/admin/secretary/cadets/cadets-page-client";

function buildFilters(state: { q: string; filters: Record<string, FilterCondition[]> }, isActive?: boolean, intakeScope?: number | null): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const prefix = wrapLikePattern(state.q, "prefix");
    const searchClause = or(
      ilike(members.name, contains),
      sql`${members.armyNo}::text ILIKE ${prefix}`,
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

  if (isActive !== undefined) {
    clauses.push(eq(cadets.isActive, isActive));
  }

  if (intakeScope !== null && intakeScope !== undefined) {
    clauses.push(eq(cadets.intakeId, intakeScope));
  }

  return clauses;
}

function buildBaseQuery() {
  return db
    .select({
      cadetInfoId: cadets.id,
      armyNo: members.armyNo,
      rank: members.rank,
      name: members.name,
      avatarPath: members.redBgPhotoPath,
      intakeNo: intakes.intakeNo,
      isActive: cadets.isActive,
    })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .innerJoin(intakes, eq(intakes.id, cadets.intakeId));
}

function buildCountQuery() {
  return db
    .select({ count: sql<number>`count(*)::int` })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .innerJoin(intakes, eq(intakes.id, cadets.intakeId));
}

export default async function CadetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const tab = takeString(raw.tab) === "inactive" ? "inactive" : "active";
  const isActiveFilter = tab === "active";

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo, startYear: intakes.startYear })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeOptions = intakeRows.map((i) => ({
    id: i.id,
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const intakeDialogOptions = intakeRows.map((i) => ({
    id: i.id,
    intakeNo: i.intakeNo,
  }));

  const config = buildCadetsTableConfig(intakeOptions, isActiveFilter ? "a_" : "i_");
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, isActiveFilter, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const rankValues = CADET_RANKS;
  const whenClauses = rankValues.map((r, i) => sql`WHEN ${r} THEN ${i}`);
  const rankOrder = sql`CASE ${members.rank}::text ${sql.join(whenClauses, sql` `)} ELSE 999 END`;

  const orderBy = buildSortOrderBy(state.sortRules, CADETS_SORT_FIELD_MAP);

  if (orderBy.length === 0) {
    orderBy.push(asc(rankOrder));
  }
  orderBy.push(asc(cadets.id));

  const [countRow, cadetRows] = await Promise.all([
    buildCountQuery().where(where),
    buildBaseQuery()
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  return (
    <CadetsPageClient
      tab={tab}
      searchParams={raw}
      cadets={cadetRows}
      totalCount={totalCount}
      intakeOptions={intakeOptions}
      intakeDialogOptions={intakeDialogOptions}
    />
  );
}
