import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { cadets, intakes, members, studyPrograms } from "@/db/schema";
import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";
import {
  buildEnumFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type RawSearchParams,
} from "@/lib/admin/table-search-params";
import {
  CADET_COURSES_SORT_FIELD_MAP,
  COURSES_SORT_FIELD_MAP,
  buildCadetCoursesTableConfig,
  buildCoursesManagementTableConfig,
} from "@/components/admin/academic/courses/table-config";
import { CoursesPageClient } from "@/components/admin/academic/courses/courses-page-client";
import { calculateCadetCurrentYear } from "@/lib/academic/helpers";

export const metadata = {
  title: "Courses | Academic | ROTU Army UMT",
};

export default async function CoursesPage(props: {
  searchParams: Promise<RawSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const admin = await requireAdminModule("courses");
  const intakeScope = getIntakeScope(admin);
  const isFullAccess = admin.role === "OFFICER" || admin.role === "INSTRUCTOR";
  const activeTab = searchParams.tab === "courses" ? "courses" : "cadets";

  const allStudyPrograms = await db
    .select({
      id: studyPrograms.id,
      name: studyPrograms.name,
      completionYear: studyPrograms.completionYear,
      isSupported: studyPrograms.isSupported,
    })
    .from(studyPrograms)
    .orderBy(asc(studyPrograms.name));

  const courseOptions = allStudyPrograms.map((p) => ({
    value: p.name,
    label: p.name,
  }));

  const allIntakes = isFullAccess
    ? await db
        .select({ id: intakes.id, intakeNo: intakes.intakeNo })
        .from(intakes)
        .orderBy(asc(intakes.startYear))
    : [];

  const intakeOptions = allIntakes.map((i) => ({
    value: i.intakeNo,
    label: i.intakeNo,
  }));

  const cadetTableConfig = buildCadetCoursesTableConfig({
    intakeOptions,
    courseOptions,
    enableGpaFilters: true,
  });

  const cadetState = parseTableSearchParams(searchParams, cadetTableConfig);

  const cadetClauses: SQL[] = [eq(cadets.isActive, true)];

  if (cadetState.q) {
    const contains = wrapLikePattern(cadetState.q, "contains");
    const prefix = wrapLikePattern(cadetState.q, "prefix");
    cadetClauses.push(
      or(
        ilike(members.name, contains),
        sql`${members.armyNo}::text ILIKE ${prefix}`,
        ilike(cadets.matricNo, contains)
      )!
    );
  }

  cadetClauses.push(...buildEnumFilterClause(cadetState.filters.rank, members.rank));
  cadetClauses.push(
    ...buildEnumFilterClause(cadetState.filters.intakeNo, intakes.intakeNo)
  );
  cadetClauses.push(
    ...buildEnumFilterClause(cadetState.filters.course, studyPrograms.name)
  );

  // GPA/CGPA filters for all academic roles
  cadetClauses.push(...buildEnumFilterClause(cadetState.filters.gpa, cadets.cgpa));
  cadetClauses.push(...buildEnumFilterClause(cadetState.filters.cgpa, cadets.cgpa));

  if (intakeScope !== null && intakeScope !== undefined) {
    cadetClauses.push(eq(cadets.intakeId, intakeScope));
  }

  const cadetWhere = and(...cadetClauses);

  const cadetOrderBy = buildSortOrderBy(
    cadetState.sortRules,
    CADET_COURSES_SORT_FIELD_MAP
  );
  if (cadetOrderBy.length === 0) {
    cadetOrderBy.push(asc(members.name));
  }

  const cadetOffset = (cadetState.page - 1) * cadetState.pageSize;

  const [[cadetCountResult], cadetRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
      .where(cadetWhere),
    db
      .select({
        id: cadets.id,
        armyNo: members.armyNo,
        rank: members.rank,
        name: members.name,
        matricNo: cadets.matricNo,
        avatarPath: members.redBgPhotoPath,
        intakeNo: intakes.intakeNo,
        intakeStartYear: intakes.startYear,
        studyProgramId: cadets.studyProgramId,
        courseName: studyPrograms.name,
        completionYear: sql<number>`coalesce(${studyPrograms.completionYear}, 3)`,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
      .where(cadetWhere)
      .orderBy(...cadetOrderBy)
      .limit(cadetState.pageSize)
      .offset(cadetOffset),
  ]);

  const cadetsWithYear = cadetRows.map((r) => ({
    ...r,
    currentYear: calculateCadetCurrentYear(r.intakeStartYear),
  }));

  const coursesConfig = buildCoursesManagementTableConfig("c_");
  const coursesState = parseTableSearchParams(searchParams, coursesConfig);

  const coursesClauses: SQL[] = [];
  if (coursesState.q) {
    const contains = wrapLikePattern(coursesState.q, "contains");
    coursesClauses.push(ilike(studyPrograms.name, contains));
  }

  const isSupportedFilter = coursesState.filters.isSupported;
  if (isSupportedFilter && isSupportedFilter.length > 0) {
    const values = isSupportedFilter.map((f) => f.value === "true");
    coursesClauses.push(
      sql`${studyPrograms.isSupported} = ANY(ARRAY[${sql.join(values, sql`, `)}]::boolean[])`
    );
  }

  const coursesWhere =
    coursesClauses.length > 0 ? and(...coursesClauses) : undefined;

  const coursesOrderBy = buildSortOrderBy(
    coursesState.sortRules,
    COURSES_SORT_FIELD_MAP
  );
  if (coursesOrderBy.length === 0) {
    coursesOrderBy.push(asc(studyPrograms.name));
  }

  const coursesOffset = (coursesState.page - 1) * coursesState.pageSize;

  const [
    [coursesCountResult],
    courseRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(studyPrograms)
      .where(coursesWhere),
    db
      .select({
        id: studyPrograms.id,
        slug: studyPrograms.slug,
        name: studyPrograms.name,
        completionYear: studyPrograms.completionYear,
        isSupported: studyPrograms.isSupported,
        enrolledCount: sql<number>`(
          select count(*)::int
          from ${cadets}
          where ${cadets.studyProgramId} = ${studyPrograms.id}
            and ${cadets.isActive} = true
        )`,
      })
      .from(studyPrograms)
      .where(coursesWhere)
      .orderBy(...coursesOrderBy)
      .limit(coursesState.pageSize)
      .offset(coursesOffset),
  ]);

  return (
    <CoursesPageClient
      tab={activeTab}
      searchParams={searchParams}
      cadets={cadetsWithYear}
      cadetsTotalCount={cadetCountResult?.count ?? 0}
      courses={courseRows}
      coursesTotalCount={coursesCountResult?.count ?? 0}
      intakeOptions={intakeOptions}
      courseOptions={courseOptions}
      showIntakeColumn={isFullAccess}
    />
  );
}
