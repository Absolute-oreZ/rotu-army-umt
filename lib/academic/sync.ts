import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicResults,
  academicTimetables,
  academicYears,
  cadets,
  intakes,
  sessions,
  studyPrograms,
} from "@/db/schema";

export async function ensureCadetSessionRecords(sessionId: number): Promise<void> {
  const [sessionRow] = await db
    .select({
      sessionId: sessions.id,
      calendarYear: academicYears.calendarYear,
      intakeId: academicYears.intakeId,
      startYear: intakes.startYear,
    })
    .from(sessions)
    .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
    .innerJoin(intakes, eq(intakes.id, academicYears.intakeId))
    .where(eq(sessions.id, sessionId));

  if (!sessionRow) {
    return;
  }

  const elapsedYears = sessionRow.calendarYear - sessionRow.startYear + 1;

  const eligibleCadets = await db
    .select({
      id: cadets.id,
      completionYear: sql<number>`coalesce(${studyPrograms.completionYear}, 3)`,
    })
    .from(cadets)
    .leftJoin(studyPrograms, eq(studyPrograms.id, cadets.studyProgramId))
    .where(
      and(
        eq(cadets.intakeId, sessionRow.intakeId),
        eq(cadets.isActive, true)
      )
    );

  const activeUncompletedCadets = eligibleCadets.filter(
    (c) => elapsedYears <= Number(c.completionYear)
  );

  if (activeUncompletedCadets.length === 0) {
    return;
  }

  await db
    .insert(academicResults)
    .values(
      activeUncompletedCadets.map((c) => ({
        sessionId,
        cadetId: c.id,
      }))
    )
    .onConflictDoNothing({
      target: [academicResults.sessionId, academicResults.cadetId],
    });

  await db
    .insert(academicTimetables)
    .values(
      activeUncompletedCadets.map((c) => ({
        sessionId,
        cadetId: c.id,
        occupiedSlots: [],
      }))
    )
    .onConflictDoNothing({
      target: [academicTimetables.sessionId, academicTimetables.cadetId],
    });
}
