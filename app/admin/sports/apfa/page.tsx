import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { apfaRecordAssessments, apfaRecords, intakes } from "@/db/schema";
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

export default async function ApfaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "apfa")) {
    notFound();
  }

  const raw = await searchParams;

  const intakeRows = await db
    .select({ id: intakes.id, intakeNo: intakes.intakeNo })
    .from(intakes)
    .orderBy(desc(intakes.startYear));

  const intakeFilterOptions = intakeRows.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));
  const config = buildRecordsTableConfig(intakeScope === null ? intakeFilterOptions : []);
  const state = parseTableSearchParams(raw, config);

  const clauses: SQL[] = [];
  if (state.q) {
    clauses.push(ilike(intakes.intakeNo, wrapLikePattern(state.q, "contains")));
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

  return (
    <RecordsPageClient
      recordType="APFA"
      searchParams={raw}
      records={recordRows}
      totalCount={countRows[0]?.count ?? 0}
      isIntakeScoped={intakeScope !== null}
      intakeOptions={intakeRows}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
    />
  );
}