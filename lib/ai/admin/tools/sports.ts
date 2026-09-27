import { avg, count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  apfaRecords,
  healthRecordMetrics,
  healthRecords,
  ukaRecords,
} from "@/db/schema";
import { toNumber, type AdminToolData } from "@/lib/ai/admin/tools/shared";

export async function executeSportsTool(
  name: string,
  intakeId: number | null,
): Promise<AdminToolData | null> {
  if (name !== "get_sports_statistics") return null;
  const [metricRow] = await db
    .select({
      metricRecords: count(healthRecordMetrics.id),
      averageBmi: avg(healthRecordMetrics.bmi),
    })
    .from(healthRecordMetrics)
    .innerJoin(
      healthRecords,
      eq(healthRecords.id, healthRecordMetrics.recordId),
    )
    .where(
      intakeId === null ? undefined : eq(healthRecords.intakeId, intakeId),
    );
  const [uka] = await db
    .select({ count: count(ukaRecords.id) })
    .from(ukaRecords)
    .where(intakeId === null ? undefined : eq(ukaRecords.intakeId, intakeId));
  const [apfa] = await db
    .select({ count: count(apfaRecords.id) })
    .from(apfaRecords)
    .where(intakeId === null ? undefined : eq(apfaRecords.intakeId, intakeId));
  return {
    metricRecords: Number(metricRow?.metricRecords ?? 0),
    averageBmi: toNumber(metricRow?.averageBmi),
    ukaSessions: Number(uka?.count ?? 0),
    apfaSessions: Number(apfa?.count ?? 0),
  };
}
