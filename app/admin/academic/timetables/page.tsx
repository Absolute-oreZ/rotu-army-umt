import { requireAdminModule, getIntakeScope } from "@/lib/admin/rbac";

import { takePositiveInt } from "@/lib/admin/table-search-params";
import { TimetablesPageClient } from "@/components/admin/academic/timetables/timetables-page-client";
import type { CadetSummary } from "@/components/admin/academic/timetables/timetables-page-client";
import type { AcademicSessionOption } from "@/lib/academic/helpers";
import { ensureCadetSessionRecords } from "@/lib/academic/sync";
import {
  calculateCadetCurrentYear,
  buildAcademicSessionOptions,
} from "@/lib/academic/helpers";
import { getIntakeAndSessionOptions } from "@/lib/academic/queries";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicTimetables,
  cadets,
  intakes,
  members,
  studyPrograms,
} from "@/db/schema";

export const metadata = {
  title: "Timetables | Academic | ROTU Army UMT",
};

export default async function TimetablesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const admin = await requireAdminModule("timetables");
  const intakeScope = getIntakeScope(admin);
  const requestedSessionId = takePositiveInt(raw.sessionId);
  const requestedCadetId = takePositiveInt(raw.cadetId);

  const { sessionRows } = await getIntakeAndSessionOptions(intakeScope);

  const sessionOptions: AcademicSessionOption[] = buildAcademicSessionOptions(sessionRows);

  const selectedSession = sessionRows.find((s) => s.id === requestedSessionId) ?? null;

  let cadetSummaries: CadetSummary[] = [];
  let selectedCadet: CadetSummary | null = null;
  let timetable: {
    id: number;
    occupiedSlots: string[];
    timetablePdfPath: string | null;
  } | null = null;

  if (selectedSession) {
    await ensureCadetSessionRecords(selectedSession.id);

    const cadetRows = await db
      .select({
        cadetId: cadets.id,
        armyNo: members.armyNo,
        rank: members.rank,
        name: members.name,
        displayName: members.displayName,
        matricNo: cadets.matricNo,
        avatarPath: members.redBgPhotoPath,
        intakeStartYear: intakes.startYear,
        courseName: studyPrograms.name,
        completionYear: studyPrograms.completionYear,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
      .where(and(eq(cadets.intakeId, selectedSession.intakeId), eq(cadets.isActive, true)))
      .orderBy(asc(members.name));

    cadetSummaries = cadetRows.map((r) => {
      const completionYear = Number(r.completionYear ?? 3);
      const currentYear = calculateCadetCurrentYear(r.intakeStartYear);
      return {
        cadetId: r.cadetId,
        armyNo: r.armyNo,
        rank: r.rank,
        name: r.name,
        displayName: r.displayName,
        matricNo: r.matricNo,
        avatarPath: r.avatarPath,
        courseName: r.courseName,
        currentYear,
        completionYear,
        isCourseCompleted: currentYear > completionYear,
      };
    });

    selectedCadet =
      cadetSummaries.find((c) => c.cadetId === requestedCadetId) ?? cadetSummaries[0] ?? null;

    if (selectedCadet) {
      const [timetableRow] = await db
        .select({
          id: academicTimetables.id,
          occupiedSlots: academicTimetables.occupiedSlots,
          timetablePdfPath: academicTimetables.timetablePdfPath,
        })
        .from(academicTimetables)
        .where(
          and(
            eq(academicTimetables.sessionId, selectedSession.id),
            eq(academicTimetables.cadetId, selectedCadet.cadetId),
          ),
        );

      timetable = timetableRow ?? null;
    }
  }

  return (
    <TimetablesPageClient
      sessions={sessionOptions}
      sessionId={selectedSession?.id ?? null}
      cadets={cadetSummaries}
      cadetId={selectedCadet?.cadetId ?? null}
      timetable={timetable}
    />
  );
}

