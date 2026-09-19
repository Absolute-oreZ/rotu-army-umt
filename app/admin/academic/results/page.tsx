import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  academicResults,
  cadets,
  intakes,
  members,
} from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule, isFullAccessAdminRole } from "@/lib/admin/roles";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  takePositiveInt,
  wrapLikePattern,
} from "@/lib/admin/table-search-params";
import {
  RESULTS_SORT_FIELD_MAP,
  buildResultsTableConfig,
} from "@/components/admin/academic/results/table-config";
import { ResultsPageClient } from "@/components/admin/academic/results/results-page-client";
import type { ResultRow } from "@/components/admin/academic/results/results-table";
import type { AcademicSessionOption } from "@/lib/academic/helpers";
import { ensureCadetSessionRecords } from "@/lib/academic/sync";
import {
  buildAcademicSessionOptions,
} from "@/lib/academic/helpers";
import { getIntakeAndSessionOptions } from "@/lib/academic/queries";

export const metadata = {
  title: "Results | Academic | ROTU Army UMT",
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "results")) {
    notFound();
  }

  const raw = await searchParams;
  const requestedSessionId = takePositiveInt(raw.sessionId);

  const { sessionRows } = await getIntakeAndSessionOptions(intakeScope);

  const sessionOptions: AcademicSessionOption[] = buildAcademicSessionOptions(sessionRows);

  const selectedSession = sessionRows.find((s) => s.id === requestedSessionId) ?? null;

  const isFullAccess = isFullAccessAdminRole(admin.role);
  const intakeFilterOptions = sessionRows
    .map((s) => s.intakeNo)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((intakeNo) => ({ value: intakeNo, label: intakeNo }));

  const config = buildResultsTableConfig({
    intakeOptions: isFullAccess ? intakeFilterOptions : [],
  });
  const state = parseTableSearchParams(raw, config);

  let rows: ResultRow[] = [];
  let totalCount = 0;

  if (selectedSession) {
    await ensureCadetSessionRecords(selectedSession.id);

    const clauses: SQL[] = [
      eq(cadets.isActive, true),
      eq(academicResults.sessionId, selectedSession.id),
    ];

    if (state.q) {
      const contains = wrapLikePattern(state.q, "contains");
      const prefix = wrapLikePattern(state.q, "prefix");
      clauses.push(
        or(
          ilike(members.name, contains),
          sql`${members.armyNo}::text ILIKE ${prefix}`,
        )!,
      );
    }

    clauses.push(...buildEnumFilterClause(state.filters.rank, members.rank));
    clauses.push(...buildEnumFilterClause(state.filters.intakeNo, intakes.intakeNo));

    if (intakeScope !== null) {
      clauses.push(eq(cadets.intakeId, intakeScope));
    }

    const where = and(...clauses);

    const orderBy = buildSortOrderBy(state.sortRules, RESULTS_SORT_FIELD_MAP);
    if (orderBy.length === 0) {
      orderBy.push(asc(members.name));
    }

    const [countRow, resultRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(academicResults)
        .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
        .where(where),
      db
        .select({
          resultId: academicResults.id,
          cadetId: cadets.id,
          armyNo: members.armyNo,
          rank: members.rank,
          name: members.name,
          avatarPath: members.redBgPhotoPath,
          intakeNo: intakes.intakeNo,
          gpa: academicResults.gpa,
          cgpa: academicResults.cgpa,
          resultSlipPath: academicResults.resultSlipPath,
        })
        .from(academicResults)
        .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
        .innerJoin(members, eq(members.id, cadets.memberId))
        .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
        .where(where)
        .orderBy(...orderBy)
        .limit(state.pageSize)
        .offset((state.page - 1) * state.pageSize),
    ]);

    totalCount = countRow[0]?.count ?? 0;
    rows = resultRows;
  }

  return (
    <ResultsPageClient
      searchParams={raw}
      sessions={sessionOptions}
      sessionId={selectedSession?.id ?? null}
      rows={rows}
      totalCount={totalCount}
      showIntakeColumn={isFullAccess}
    />
  );
}

