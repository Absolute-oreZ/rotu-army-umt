import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import { db } from "@/db";
import {
  apfaRecordAssessments,
  apfaRecords,
  cadets,
  intakes,
  members,
  platoons,
  ukaRecordAssessments,
  ukaRecords,
} from "@/db/schema";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import { getAssessmentStandards } from "@/lib/assessment/standards";
import type { AssessmentRecordType, AssessmentStandard } from "@/lib/assessment/types";
import {
  APFA_ASSESSMENT_SORT_FIELD_MAP,
  UKA_ASSESSMENT_SORT_FIELD_MAP,
  buildAssessmentsTableConfig,
} from "@/components/admin/sports/assessments/table-config";
import { AssessmentsPageClient } from "@/components/admin/sports/assessments/assessments-page-client";
import type { AssessmentRow } from "@/components/admin/sports/assessments/assessments-table";

type AssessmentRecordOption = {
  key: string;
  id: number;
  type: AssessmentRecordType;
  label: string;
  intakeId: number;
};

type StandardsByGender = {
  MALE: AssessmentStandard[];
  FEMALE: AssessmentStandard[];
};

function buildFilters(
  state: { q: string; filters: Record<string, FilterCondition[]> },
  recordIntakeId: number,
  resultColumn: typeof ukaRecordAssessments.result | typeof apfaRecordAssessments.result,
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
  clauses.push(...buildEnumFilterClause(state.filters.result, resultColumn));
  clauses.push(eq(cadets.intakeId, recordIntakeId), eq(cadets.isActive, true));

  return clauses;
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminModule("assessments");
  const intakeScope = getIntakeScope(admin);
  const raw = await searchParams;

  const rawRecord = takeString(raw.record);
  const [rawType, rawId] = rawRecord ? rawRecord.split(":") : [null, null];
  const requestedType: AssessmentRecordType | null =
    rawType === "UKA" || rawType === "APFA" ? rawType : null;
  const parsedRecordId = rawId ? Number(rawId) : null;
  const requestedRecordId =
    parsedRecordId && Number.isInteger(parsedRecordId) && parsedRecordId > 0
      ? parsedRecordId
      : null;

  const [ukaRows, apfaRows, platoonRows] = await Promise.all([
    db
      .select({
        id: ukaRecords.id,
        intakeId: ukaRecords.intakeId,
        recordDate: ukaRecords.recordDate,
        session: ukaRecords.session,
        year: ukaRecords.year,
        intakeNo: intakes.intakeNo,
      })
      .from(ukaRecords)
      .innerJoin(intakes, eq(intakes.id, ukaRecords.intakeId))
      .where(intakeScope !== null ? eq(ukaRecords.intakeId, intakeScope) : undefined)
      .orderBy(desc(ukaRecords.recordDate), desc(ukaRecords.id)),
    db
      .select({
        id: apfaRecords.id,
        intakeId: apfaRecords.intakeId,
        recordDate: apfaRecords.recordDate,
        session: apfaRecords.session,
        year: apfaRecords.year,
        intakeNo: intakes.intakeNo,
      })
      .from(apfaRecords)
      .innerJoin(intakes, eq(intakes.id, apfaRecords.intakeId))
      .where(intakeScope !== null ? eq(apfaRecords.intakeId, intakeScope) : undefined)
      .orderBy(desc(apfaRecords.recordDate), desc(apfaRecords.id)),
    db
      .select({ displayName: platoons.displayName })
      .from(platoons)
      .orderBy(asc(platoons.displayName)),
  ]);

  const platoonFilterOptions = platoonRows.map((p) => ({
    value: p.displayName,
    label: p.displayName,
  }));

  const combined = [
    ...ukaRows.map((r) => ({ ...r, type: "UKA" as const })),
    ...apfaRows.map((r) => ({ ...r, type: "APFA" as const })),
  ].sort((a, b) =>
    a.recordDate === b.recordDate ? b.id - a.id : a.recordDate < b.recordDate ? 1 : -1,
  );

  const records: AssessmentRecordOption[] = combined.map((r) => ({
    key: `${r.type}:${r.id}`,
    id: r.id,
    type: r.type,
    intakeId: r.intakeId,
    label: `${r.type}-${r.session}-${r.year}${intakeScope === null ? ` — ${r.intakeNo}` : ""}`,
  }));

  const selected =
    records.find((r) => r.type === requestedType && r.id === requestedRecordId) ?? null;

  const intakeFilterOptions = Array.from(new Set(combined.map((r) => r.intakeNo))).map((no) => ({
    value: no,
    label: no,
  }));

  const config = buildAssessmentsTableConfig(
    selected?.type ?? "UKA",
    intakeScope === null ? intakeFilterOptions : [],
    platoonFilterOptions,
  );
  const state = parseTableSearchParams(raw, config);

  let rows: AssessmentRow[] = [];
  let totalCount = 0;

  if (selected) {
    const resultColumn =
      selected.type === "UKA" ? ukaRecordAssessments.result : apfaRecordAssessments.result;
    const filterClauses = buildFilters(state, selected.intakeId, resultColumn);
    const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

    if (selected.type === "UKA") {
      const orderBy = [
        ...buildSortOrderBy(state.sortRules, UKA_ASSESSMENT_SORT_FIELD_MAP),
        asc(cadets.id),
      ];

      const [countRow, assessmentRows] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(cadets)
          .innerJoin(members, eq(members.id, cadets.memberId))
          .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
          .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
          .leftJoin(
            ukaRecordAssessments,
            and(
              eq(ukaRecordAssessments.cadetId, cadets.id),
              eq(ukaRecordAssessments.recordId, selected.id),
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
            gender: members.gender,
            avatarPath: members.redBgPhotoPath,
            platoonName: platoons.displayName,
            intakeNo: intakes.intakeNo,
            assessmentId: ukaRecordAssessments.id,
            pushUp: ukaRecordAssessments.pushUp,
            pushUpPass: ukaRecordAssessments.pushUpPass,
            sitUp: ukaRecordAssessments.sitUp,
            sitUpPass: ukaRecordAssessments.sitUpPass,
            runSeconds: ukaRecordAssessments.runSeconds,
            runPass: ukaRecordAssessments.runPass,
            result: ukaRecordAssessments.result,
          })
          .from(cadets)
          .innerJoin(members, eq(members.id, cadets.memberId))
          .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
          .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
          .leftJoin(
            ukaRecordAssessments,
            and(
              eq(ukaRecordAssessments.cadetId, cadets.id),
              eq(ukaRecordAssessments.recordId, selected.id),
            ),
          )
          .where(where)
          .orderBy(...orderBy)
          .limit(state.pageSize)
          .offset((state.page - 1) * state.pageSize),
      ]);

      totalCount = countRow[0]?.count ?? 0;
      rows = assessmentRows.map((r) => ({
        cadetId: r.cadetId,
        memberId: r.memberId,
        armyNo: r.armyNo,
        rank: r.rank,
        name: r.name,
        gender: r.gender,
        avatarPath: r.avatarPath,
        platoonName: r.platoonName,
        intakeNo: r.intakeNo,
        assessmentId: r.assessmentId,
        result: r.result,
        items: {
          pushUp: { value: r.pushUp, pass: r.pushUpPass },
          sitUp: { value: r.sitUp, pass: r.sitUpPass },
          run: { value: r.runSeconds, pass: r.runPass },
        },
      }));
    } else {
      const orderBy = [
        ...buildSortOrderBy(state.sortRules, APFA_ASSESSMENT_SORT_FIELD_MAP),
        asc(cadets.id),
      ];

      const [countRow, assessmentRows] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(cadets)
          .innerJoin(members, eq(members.id, cadets.memberId))
          .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
          .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
          .leftJoin(
            apfaRecordAssessments,
            and(
              eq(apfaRecordAssessments.cadetId, cadets.id),
              eq(apfaRecordAssessments.recordId, selected.id),
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
            gender: members.gender,
            avatarPath: members.redBgPhotoPath,
            platoonName: platoons.displayName,
            intakeNo: intakes.intakeNo,
            assessmentId: apfaRecordAssessments.id,
            runSeconds: apfaRecordAssessments.runSeconds,
            runPass: apfaRecordAssessments.runPass,
            pullUp: apfaRecordAssessments.pullUp,
            pullUpPass: apfaRecordAssessments.pullUpPass,
            swimmingMetres: apfaRecordAssessments.swimmingMetres,
            swimmingPass: apfaRecordAssessments.swimmingPass,
            floatingSeconds: apfaRecordAssessments.floatingSeconds,
            floatingPass: apfaRecordAssessments.floatingPass,
            result: apfaRecordAssessments.result,
          })
          .from(cadets)
          .innerJoin(members, eq(members.id, cadets.memberId))
          .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
          .leftJoin(platoons, eq(platoons.id, cadets.platoonId))
          .leftJoin(
            apfaRecordAssessments,
            and(
              eq(apfaRecordAssessments.cadetId, cadets.id),
              eq(apfaRecordAssessments.recordId, selected.id),
            ),
          )
          .where(where)
          .orderBy(...orderBy)
          .limit(state.pageSize)
          .offset((state.page - 1) * state.pageSize),
      ]);

      totalCount = countRow[0]?.count ?? 0;
      rows = assessmentRows.map((r) => ({
        cadetId: r.cadetId,
        memberId: r.memberId,
        armyNo: r.armyNo,
        rank: r.rank,
        name: r.name,
        gender: r.gender,
        avatarPath: r.avatarPath,
        platoonName: r.platoonName,
        intakeNo: r.intakeNo,
        assessmentId: r.assessmentId,
        result: r.result,
        items: {
          run: { value: r.runSeconds, pass: r.runPass },
          pullUp: { value: r.pullUp, pass: r.pullUpPass },
          swimming: { value: r.swimmingMetres, pass: r.swimmingPass },
          floating: { value: r.floatingSeconds, pass: r.floatingPass },
        },
      }));
    }
  }

  const standards: StandardsByGender | null = selected
    ? {
        MALE: getAssessmentStandards(selected.type, "MALE"),
        FEMALE: getAssessmentStandards(selected.type, "FEMALE"),
      }
    : null;

  return (
    <AssessmentsPageClient
      searchParams={raw}
      records={records}
      recordKey={selected?.key ?? null}
      recordId={selected?.id ?? null}
      recordType={selected?.type ?? null}
      isIntakeScoped={intakeScope !== null}
      intakeFilterOptions={intakeScope === null ? intakeFilterOptions : []}
      platoonFilterOptions={platoonFilterOptions}
      rows={rows}
      totalCount={totalCount}
      standards={standards}
    />
  );
}