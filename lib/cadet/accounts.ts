import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cadetAccounts } from "@/db/schema";
import { signedStorageUrl } from "@/lib/supabase/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CadetAccountRecord } from "@/lib/cadet/account-types";

export async function getCadetAccountByMemberId(
  memberId: number,
): Promise<CadetAccountRecord | null> {
  const [row] = await db
    .select({
      id: cadetAccounts.id,
      memberId: cadetAccounts.memberId,
      bankName: cadetAccounts.bankName,
      accountNumber: cadetAccounts.accountNumber,
      duitNowId: cadetAccounts.duitNowId,
      qrCodePath: cadetAccounts.qrCodePath,
      createdAt: cadetAccounts.createdAt,
      updatedAt: cadetAccounts.updatedAt,
    })
    .from(cadetAccounts)
    .where(eq(cadetAccounts.memberId, memberId))
    .limit(1);

  if (!row) return null;

  const supabase = createSupabaseAdminClient();

  return {
    ...row,
    qrCodeUrl: await signedStorageUrl(supabase, row.qrCodePath),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
