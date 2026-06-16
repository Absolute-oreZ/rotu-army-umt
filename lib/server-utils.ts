import "server-only";

import { sql } from "drizzle-orm";
import { intakes } from "@/db/schema";
import { db } from "@/db";

export async function computeNextIntakeNo() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(intakes);
  const localSeq = count + 1;
  const globalSeq = 42 + localSeq;
  return `${localSeq}/${globalSeq}`;
}
