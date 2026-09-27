import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { collectionPayments, collections } from "@/db/schema";
import { toNumber, type AdminToolData } from "@/lib/ai/admin/tools/shared";

export async function executeTreasuryTool(
  name: string,
  intakeId: number | null,
): Promise<AdminToolData | null> {
  if (name !== "get_treasury_statistics") return null;
  const [row] = await db
    .select({
      payments: count(collectionPayments.id),
      totalRecorded: sql<string>`coalesce(sum(${collectionPayments.amountPaid}), 0)`,
    })
    .from(collectionPayments)
    .innerJoin(collections, eq(collections.id, collectionPayments.collectionId))
    .where(intakeId === null ? undefined : eq(collections.intakeId, intakeId));
  return {
    paymentRecords: Number(row?.payments ?? 0),
    totalRecorded: toNumber(row?.totalRecorded),
  };
}
