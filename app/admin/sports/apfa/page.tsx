import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { apfaRecordAssessments, apfaRecords, intakes } from "@/db/schema";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildNumberFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
} from "@/lib/admin/table-search-params";
import {
  RECORDS_SORT_FIELD_MAPS,
  buildRecordsTableConfig,
} from "@/components/admin/sports/records/table-config";
import { RecordsPageClient } from "@/components/admin/sports/records/records-page-client";

export default async function ApfaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("apfa");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const historyRows = await db
    .select({ id: apfaRecords.id, intakeId: apfaRecords.intakeId, year: apfaRecords.year, session: apfaRecords.session, recordDate: apfaRecords.recordDate })
    .from(apfaRecords)
    .orderBy(asc(apfaRecords.intakeId), asc(apfaRecords.year), asc(apfaRecords.session));
  const previousSessionDatesByRecordId: Record<string, string> = {};
  const latestSessionDates: Record<string, string> = {};
  let historyGroup = "";
  let previousDate: string | undefined;
  for (const row of historyRows) {
    const group = `${row.intakeId}:${row.year}`;
    if (group !== historyGroup) {
      historyGroup = group;
      previousDate = undefined;
    }
    if (previousDate) {
      previousSessionDatesByRecordId[String(row.id)] = previousDate;
    }
    previousDate = row.recordDate;
    latestSessionDates[`${row.intakeId}:${row.year}`] = row.recordDate;
  }

  const intakeFilterOptions = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));
  const config = buildRecordsTableConfig(intakeScope === null ? intakeFilterOptions : []);
  const state = parseTableSearchParams(raw, config);

  const clauses: SQL[] = [];
  if (state.q) {
    clauses.push(ilike(sql`'APFA-' || ${apfaRecords.session}::text || '-' || ${apfaRecords.year}::text`, wrapLikePattern(state.q, "contains")));
  }
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));
  clauses.push(...buildNumberFilterClause(state.filters.year, apfaRecords.year));
  if (intakeScope !== null) clauses.push(eq(apfaRecords.intakeId, intakeScope));
  const where = clauses.length > 0 ? and(...clauses) : undefined;
  const orderBy = [
    ...buildSortOrderBy(state.sortRules, RECORDS_SORT_FIELD_MAPS.APFA),
    asc(apfaRecords.id),
  ];

  const [countRows, recordRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(apfaRecords)
      .innerJoin(intakes, eq(intakes.id, apfaRecords.intakeId))
      .where(where),
    db
      .select({
        id: apfaRecords.id,
        intakeId: apfaRecords.intakeId,
        intakeNo: intakes.intakeNo,
        recordDate: apfaRecords.recordDate,
        session: apfaRecords.session,
        year: apfaRecords.year,
        recordedCount: sql<number>`count(${apfaRecordAssessments.id})::int`,
      })
      .from(apfaRecords)
      .innerJoin(intakes, eq(intakes.id, apfaRecords.intakeId))
      .leftJoin(apfaRecordAssessments, eq(apfaRecordAssessments.recordId, apfaRecords.id))
      .where(where)
      .groupBy(apfaRecords.id, intakes.intakeNo)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);
  const recordsWithPreviousDates = recordRows.map((row) => ({
    ...row,
    previousSessionDate: previousSessionDatesByRecordId[String(row.id)] ?? null,
  }));

  return (
    <RecordsPageClient
      recordType="APFA"
      searchParams={raw}
      records={recordsWithPreviousDates}
      totalCount={countRows[0]?.count ?? 0}
      isIntakeScoped={intakeScope !== null}
      intakeOptions={intakeRows}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
      scopedIntakeId={intakeScope}
      latestSessionDates={latestSessionDates}
    />
  );
}