import { and, avg, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { academicResults, cadets, intakes, members } from "@/db/schema";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import {
  intakeFilter,
  toNumber,
  type AdminToolData,
} from "@/lib/ai/admin/tools/shared";

export async function executeAcademicTool(
  name: string,
  intakeId: number | null,
): Promise<AdminToolData | null> {
  if (name === "get_academic_statistics") {
    const [row] = await db
      .select({
        resultRecords: count(academicResults.id),
        averageGpa: avg(academicResults.gpa),
        averageCgpa: avg(academicResults.cgpa),
      })
      .from(academicResults)
      .innerJoin(cadets, eq(cadets.id, academicResults.cadetId))
      .where(and(intakeFilter(intakeId, cadets.intakeId)));
    return {
      resultRecords: Number(row?.resultRecords ?? 0),
      averageGpa: toNumber(row?.averageGpa),
      averageCgpa: toNumber(row?.averageCgpa),
    };
  }
  if (name === "get_gpa_rankings") {
    const rows = await db
      .select({
        name: members.displayName,
        cgpa: cadets.cgpa,
        intake: intakes.displayName,
      })
      .from(cadets)
      .innerJoin(members, eq(members.id, cadets.memberId))
      .innerJoin(intakes, eq(intakes.id, cadets.intakeId))
      .where(
        and(
          intakeFilter(intakeId, cadets.intakeId),
          sql`${cadets.cgpa} is not null`,
        ),
      )
      .orderBy(sql`${cadets.cgpa} desc`)
      .limit(AI_LIMITS.maxRows);
    return { rankings: JSON.stringify(rows) };
  }
  return null;
}
