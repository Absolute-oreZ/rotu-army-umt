import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { accommodations, cadets, intakes, members } from "@/db/schema";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  ACCOMMODATIONS_SORT_FIELD_MAP,
  buildAccommodationsTableConfig,
} from "@/components/admin/welfare/accommodations/table-config";
import { AccommodationsPageClient } from "@/components/admin/welfare/accommodations/accommodations-page-client";
import type { AccommodationRow } from "@/components/admin/welfare/accommodations/accommodations-table";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
  adminGender: "MALE" | "FEMALE",
): SQL[] {
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

  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));
  clauses.push(...buildEnumFilterClause(state.filters.type, accommodations.type));
  clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));

  clauses.push(eq(cadets.isActive, true));

  if (intakeScope !== null) {
    clauses.push(eq(cadets.intakeId, intakeScope));
    clauses.push(eq(members.gender, adminGender));
  }

  return clauses;
}

export default async function AccommodationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("accommodations");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeFilterOptions = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const config = buildAccommodationsTableConfig(
    intakeScope === null ? intakeFilterOptions : [],
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope, admin.gender);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, ACCOMMODATIONS_SORT_FIELD_MAP);
  orderBy.push(asc(cadets.id));

  const [countRow, rowsRaw] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .leftJoin(accommodations, eq(accommodations.cadetId, cadets.id))
      .where(where),
    db
      .select({
        cadetId: cadets.id,
        armyNo: members.armyNo,
        rank: members.rank,
        name: members.name,
        avatarPath: members.redBgPhotoPath,
        intakeNo: intakes.intakeNo,
        accommodationId: accommodations.id,
        type: accommodations.type,
        address: accommodations.address,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .leftJoin(accommodations, eq(accommodations.cadetId, cadets.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const rows: AccommodationRow[] = rowsRaw.map((r) => ({
    cadetId: r.cadetId,
    armyNo: r.armyNo,
    rank: r.rank,
    name: r.name,
    avatarPath: r.avatarPath,
    intakeNo: r.intakeNo,
    accommodationId: r.accommodationId,
    type: r.type,
    address: r.address,
  }));

  return (
    <AccommodationsPageClient
      searchParams={raw}
      rows={rows}
      totalCount={countRow[0]?.count ?? 0}
      isIntakeScoped={intakeScope !== null}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
    />
  );
}
