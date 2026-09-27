import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendRecords, cadets } from "@/db/schema";
import { intakeFilter, type AdminToolData } from "@/lib/ai/admin/tools/shared";

export async function executeWelfareTool(
  name: string,
  intakeId: number | null,
): Promise<AdminToolData | null> {
  if (name !== "get_welfare_statistics") return null;
  const [row] = await db
    .select({ absenceRecords: count(attendRecords.id) })
    .from(attendRecords)
    .innerJoin(cadets, eq(cadets.id, attendRecords.cadetId))
    .where(and(intakeFilter(intakeId, cadets.intakeId)));
  return { attendanceRecords: Number(row?.absenceRecords ?? 0) };
}
