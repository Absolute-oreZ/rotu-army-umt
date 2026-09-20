import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import { db } from "@/db";
import {
  cadets,
  healthRecordMetrics,
  healthRecords,
  intakes,
  members,
  platoons,
} from "@/db/schema";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
  type SortRule,
} from "@/lib/admin/table-search-params";
import {
  METRICS_SORT_FIELD_MAP,
  buildMetricsTableConfig,
} from "@/components/admin/sports/metrics/table-config";
import { MetricsPageClient } from "@/components/admin/sports/metrics/metrics-page-client";
import type { MetricRow } from "@/components/admin/sports/metrics/metrics-table";

type RecordOption = {
  id: number;
  label: string;
};

function formatRecordLabel(intakeNo: string | null, recordDate: string) {
  const date = new Date(`${recordDate}T00:00:00Z`);
  const formatted = new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return intakeNo === null ? formatted : `${intakeNo} — ${formatted}`;
}

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  recordIntakeId: number,
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
  clauses.push(...buildEnumFilterClause(state.filters.platoon, platoons.displayName));
  clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));
  clauses.push(
    ...buildEnumFilterClause(
      state.filters.bmiResult,
      healthRecordMetrics.bmiClassification,
    ),
  );

  clauses.push(eq(cadets.intakeId, recordIntakeId), eq(cadets.isActive, true));

  return clauses;
}

function buildSort(sortRules: SortRule[]) {
  const orderBy = buildSortOrderBy(sortRules, METRICS_SORT_FIELD_MAP);
  orderBy.push(asc(cadets.id));
  return orderBy;
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("metrics");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const rawRecordId = takeString(raw.recordId);
  const parsedRecordId = rawRecordId ? Number(rawRecordId) : null;
  const requestedRecordId =
    parsedRecordId && Number.isInteger(parsedRecordId) && parsedRecordId > 0
      ? parsedRecordId
      : null;

  const [intakeRows, platoonRows, recordRows] = await Promise.all([
    db
      .select({ id: intakes.id, intakeNo: intakes.intakeNo })
      .from(intakes)
      .orderBy(desc(intakes.startYear)),
    db
      .select({ displayName: platoons.displayName })
      .from(platoons)
      .orderBy(asc(platoons.displayName)),
    db
      .select({
        id: healthRecords.id,
        intakeId: healthRecords.intakeId,
        intakeNo: intakes.intakeNo,
        recordDate: healthRecords.recordDate,
      })
      .from(healthRecords)
      .innerJoin(intakes, eq(intakes.id, healthRecords.intakeId))
      .where(
        intakeScope !== null ? eq(healthRecords.intakeId, intakeScope) : undefined,
      )
      .orderBy(desc(healthRecords.recordDate), desc(healthRecords.id)),
  ]);

  const intakeFilterOptions = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));
  const platoonFilterOptions = platoonRows.map((p) => ({
    value: p.displayName,
    label: p.displayName,
  }));

  const records: RecordOption[] = recordRows.map((r) => ({
    id: r.id,
    label: formatRecordLabel(intakeScope === null ? r.intakeNo : null, r.recordDate),
  }));

  const selectedRecord = recordRows.find((r) => r.id === requestedRecordId) ?? null;

  const config = buildMetricsTableConfig(
    intakeScope === null ? intakeFilterOptions : [],
    platoonFilterOptions,
  );
  const state = parseTableSearchParams(raw, config);

  let rows: MetricRow[] = [];
  let totalCount = 0;

  if (selectedRecord) {
    const filterClauses = buildFilters(state, selectedRecord.intakeId);
    const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;
    const orderBy = buildSort(state.sortRules);

    const [countRow, metricRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(cadets)
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
        .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
        .leftJoin(
          healthRecordMetrics,
          and(
            eq(healthRecordMetrics.cadetId, cadets.id),
            eq(healthRecordMetrics.recordId, selectedRecord.id),
          ),
        )
        .where(where),
      db
        .select({
          cadetId: cadets.id,
          memberId: members.id,
          armyNo: members.armyNo,
          rank: members.rank,
          name: members.name,
          avatarPath: members.redBgPhotoPath,
          platoonName: platoons.displayName,
          intakeNo: intakes.intakeNo,
          metricId: healthRecordMetrics.id,
          age: healthRecordMetrics.age,
          height: healthRecordMetrics.height,
          weight: healthRecordMetrics.weight,
          bmi: healthRecordMetrics.bmi,
          bmiClassification: healthRecordMetrics.bmiClassification,
        })
        .from(cadets)
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
        .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
        .leftJoin(
          healthRecordMetrics,
          and(
            eq(healthRecordMetrics.cadetId, cadets.id),
            eq(healthRecordMetrics.recordId, selectedRecord.id),
          ),
        )
        .where(where)
        .orderBy(...orderBy)
        .limit(state.pageSize)
        .offset((state.page - 1) * state.pageSize),
    ]);

    totalCount = countRow[0]?.count ?? 0;
    rows = metricRows;
  }

  return (
    <MetricsPageClient
      searchParams={raw}
      records={records}
      recordId={selectedRecord?.id ?? null}
      rows={rows}
      totalCount={totalCount}
      isIntakeScoped={intakeScope !== null}
      intakeOptions={intakeRows}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
      platoonFilterOptions={platoonFilterOptions}
    />
  );
}
