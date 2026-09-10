import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { intakes, ukaRecordAssessments, ukaRecords } from "@/db/schema";
import { getIntakeScope, requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
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

export default async function UkaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "uka")) {
    notFound();
  }

  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const historyRows = await db
    .select({ id: ukaRecords.id, intakeId: ukaRecords.intakeId, year: ukaRecords.year, session: ukaRecords.session, recordDate: ukaRecords.recordDate })
    .from(ukaRecords)
    .orderBy(asc(ukaRecords.intakeId), asc(ukaRecords.year), asc(ukaRecords.session));
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
    clauses.push(ilike(sql`'UKA-' || ${ukaRecords.session}::text || '-' || ${ukaRecords.year}::text`, wrapLikePattern(state.q, "contains")));
  }
  clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));
  clauses.push(...buildNumberFilterClause(state.filters.year, ukaRecords.year));
  if (intakeScope !== null) clauses.push(eq(ukaRecords.intakeId, intakeScope));
  const where = clauses.length > 0 ? and(...clauses) : undefined;
  const orderBy = [
    ...buildSortOrderBy(state.sortRules, RECORDS_SORT_FIELD_MAPS.UKA),
    asc(ukaRecords.id),
  ];

  const [countRows, recordRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ukaRecords)
      .innerJoin(intakes, eq(intakes.id, ukaRecords.intakeId))
      .where(where),
    db
      .select({
        id: ukaRecords.id,
        intakeId: ukaRecords.intakeId,
        intakeNo: intakes.intakeNo,
        recordDate: ukaRecords.recordDate,
        session: ukaRecords.session,
        year: ukaRecords.year,
        recordedCount: sql<number>`count(${ukaRecordAssessments.id})::int`,
      })
      .from(ukaRecords)
      .innerJoin(intakes, eq(intakes.id, ukaRecords.intakeId))
      .leftJoin(ukaRecordAssessments, eq(ukaRecordAssessments.recordId, ukaRecords.id))
      .where(where)
      .groupBy(ukaRecords.id, intakes.intakeNo)
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
      recordType="UKA"
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