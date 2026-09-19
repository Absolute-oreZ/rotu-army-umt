import { asc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  intakes,
  sessions,
} from "@/db/schema";

export type IntakeRow = {
  id: number;
  intakeNo: string;
  startYear: number;
};

export type SessionRow = {
  id: number;
  sessionNumber: number;
  calendarYear: number;
  intakeId: number;
  intakeNo: string;
};

export async function getIntakeAndSessionOptions(
  intakeScope: number | null,
): Promise<{ intakeRows: IntakeRow[]; sessionRows: SessionRow[] }> {
  const intakeScopeClause: SQL<unknown> | undefined =
    intakeScope !== null ? eq(academicYears.intakeId, intakeScope) : undefined;

  const [intakeRows, sessionRows] = await Promise.all([
    db
      .select({ id: intakes.id, intakeNo: intakes.intakeNo, startYear: intakes.startYear })
      .from(intakes)
      .orderBy(asc(intakes.startYear)),
    db
      .select({
        id: sessions.id,
        sessionNumber: sessions.sessionNumber,
        calendarYear: academicYears.calendarYear,
        intakeId: academicYears.intakeId,
        intakeNo: intakes.intakeNo,
      })
      .from(sessions)
      .innerJoin(academicYears, eq(academicYears.id, sessions.academicYearId))
      .innerJoin(intakes, eq(intakes.id, academicYears.intakeId))
      .where(intakeScopeClause)
      .orderBy(asc(intakes.startYear), asc(academicYears.calendarYear), asc(sessions.sessionNumber)),
  ]);

  return { intakeRows, sessionRows };
}