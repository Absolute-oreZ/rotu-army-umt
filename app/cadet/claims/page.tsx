import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cadetAccounts, claims } from "@/db/schema";
import { requireCurrentCadet } from "@/lib/auth/cadet";
import { ClaimsList } from "@/components/cadet/claims-list";
import { signedStorageUrl } from "@/lib/supabase/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function CadetClaimsPage() {
  const cadet = await requireCurrentCadet();

  const [rows, account] = await Promise.all([
    db
      .select({
        id: claims.id,
        title: claims.title,
        amount: claims.amount,
        status: claims.status,
        createdAt: claims.createdAt,
      })
      .from(claims)
      .where(eq(claims.memberId, cadet.memberId))
      .orderBy(desc(claims.createdAt)),
    db
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
      .where(eq(cadetAccounts.memberId, cadet.memberId))
      .limit(1),
  ]);

  const supabase = createSupabaseAdminClient();
  const accountRow = account[0] ?? null;
  const accountRecord = accountRow
    ? {
        ...accountRow,
        qrCodePath: await signedStorageUrl(supabase, accountRow.qrCodePath),
        createdAt: accountRow.createdAt.toISOString(),
        updatedAt: accountRow.updatedAt.toISOString(),
      }
    : null;

  return (
    <ClaimsList
      account={accountRecord}
      claims={rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
