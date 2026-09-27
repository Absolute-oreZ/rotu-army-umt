import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cadets, intakes } from "@/db/schema";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import { intakeFilter, type AdminToolData } from "@/lib/ai/admin/tools/shared";

export async function executeIntakeTool(
  name: string,
  intakeId: number | null,
): Promise<AdminToolData | null> {
  if (name !== "get_intake_statistics") return null;
  const rows = await db
    .select({
      intake: intakes.displayName,
      activeCadets: sql<number>`count(*) filter (where ${cadets.isActive} = true)`,
    })
    .from(intakes)
    .leftJoin(cadets, eq(cadets.intakeId, intakes.id))
    .where(intakeFilter(intakeId, cadets.intakeId))
    .groupBy(intakes.id, intakes.displayName)
    .orderBy(intakes.displayName)
    .limit(AI_LIMITS.maxRows);
  return {
    intakeCount: rows.length,
    activeCadetCounts: rows
      .map((row) => `${row.intake}: ${Number(row.activeCadets)}`)
      .join("; "),
  };
}
