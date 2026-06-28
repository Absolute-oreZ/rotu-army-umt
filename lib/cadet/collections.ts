import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { collections, treasuryAccounts } from "@/db/schema";
import { storageUrl } from "@/lib/supabase/storage";

export async function getPublishedCollectionBySlug(
  slug: string,
  intakeId: number,
) {
  const [row] = await db
    .select({
      id: collections.id,
      title: collections.title,
      slug: collections.slug,
      purpose: collections.purpose,
      description: collections.description,
      amount: collections.amount,
      isFixedAmount: collections.isFixedAmount,
      isReceiptRequired: collections.isReceiptRequired,
      status: collections.status,
      bankName: treasuryAccounts.bankName,
      accountNumber: treasuryAccounts.accountNumber,
      qrCodePath: treasuryAccounts.qrCodePath,
      duitNowId: treasuryAccounts.duitNowId,
    })
    .from(collections)
    .innerJoin(treasuryAccounts, eq(treasuryAccounts.id, collections.paymentAccountId))
    .where(
      and(
        eq(collections.slug, slug),
        eq(collections.status, "PUBLISHED"),
        eq(collections.intakeId, intakeId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    qrCodeUrl: storageUrl(row.qrCodePath),
  };
}
