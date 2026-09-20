import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { attendRecords, cadets, intakes, members } from "@/db/schema";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import { getAttendSources } from "@/lib/welfare/attend-sources";
import {
  buildDateFilterClause,
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  ATTEND_SORT_FIELD_MAP,
  buildAttendTableConfig,
} from "@/components/admin/welfare/attend/table-config";
import { AttendPageClient } from "@/components/admin/welfare/attend/attend-page-client";
import type { AttendRecordRow } from "@/components/admin/welfare/attend/attend-table";

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  intakeScope: number | null,
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
  clauses.push(...buildDateFilterClause(state.filters.date, attendRecords.recordDate));
  clauses.push(...buildEnumFilterClause(state.filters.attendType, attendRecords.attendType));
  clauses.push(...buildEnumFilterClause(state.filters.source, attendRecords.source));
  clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));

  if (intakeScope !== null) {
    clauses.push(eq(cadets.intakeId, intakeScope));
  }

  return clauses;
}

export default async function AttendPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("attend");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const sourceFilterOptions = getAttendSources().map((s) => ({
    value: s,
    label: s,
  }));

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeFilterOptions = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const config = buildAttendTableConfig(
    sourceFilterOptions,
    intakeScope === null ? intakeFilterOptions : [],
  );
  const state = parseTableSearchParams(raw, config);
  const filterClauses = buildFilters(state, intakeScope);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, ATTEND_SORT_FIELD_MAP);
  if (orderBy.length === 0) {
    orderBy.push(desc(attendRecords.recordDate));
    orderBy.push(desc(attendRecords.id));
  }

  const cadetOptions = await db
    .select({ id: cadets.id, name: members.name, armyNo: members.armyNo })
    .from(cadets)
    .innerJoin(members, eq(members.id, cadets.memberId))
    .where(
      and(
        eq(cadets.isActive, true),
        intakeScope !== null ? eq(cadets.intakeId, intakeScope) : undefined,
      ),
    )
    .orderBy(asc(members.name))
    .limit(500);

  const [countRow, recordRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendRecords)
      .innerJoin(cadets, eq(cadets.id, attendRecords.cadetId))
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .where(where),
    db
      .select({
        id: attendRecords.id,
        cadetId: cadets.id,
        armyNo: members.armyNo,
        rank: members.rank,
        name: members.name,
        avatarPath: members.redBgPhotoPath,
        intakeNo: intakes.intakeNo,
        recordDate: attendRecords.recordDate,
        attendType: attendRecords.attendType,
        source: attendRecords.source,
        createdAt: attendRecords.createdAt,
      })
      .from(attendRecords)
      .innerJoin(cadets, eq(cadets.id, attendRecords.cadetId))
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const records: AttendRecordRow[] = recordRows.map((r) => ({
    id: r.id,
    cadetId: r.cadetId,
    armyNo: r.armyNo,
    rank: r.rank,
    name: r.name,
    avatarPath: r.avatarPath,
    intakeNo: r.intakeNo,
    recordDate: r.recordDate,
    attendType: r.attendType,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <AttendPageClient
      searchParams={raw}
      records={records}
      totalCount={countRow[0]?.count ?? 0}
      isIntakeScoped={intakeScope !== null}
      sourceFilterOptions={sourceFilterOptions}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
      cadetOptions={cadetOptions.map((c) => ({
        id: c.id,
        label: `${c.name} · #${c.armyNo}`,
      }))}
    />
  );
}
