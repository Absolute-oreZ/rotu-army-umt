import { desc, sql } from "drizzle-orm";
import { requireAdminModule } from "@/lib/admin/rbac";
import { db } from "@/db";
import { bestCadets } from "@/db/schema";
import { getPortfolioData } from "@/app/admin/multimedia/portfolio/actions";
import { PortfolioPageClient } from "@/components/admin/multimedia/portfolio/portfolio-page-client";

async function getBestCadets() {
  const [countRows, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(bestCadets),
    db
      .select({
        id: bestCadets.id,
        displayName: bestCadets.displayName,
        awardDate: bestCadets.awardDate,
        intakeNoSnapshot: bestCadets.intakeNoSnapshot,
        status: bestCadets.status,
      })
      .from(bestCadets)
      .orderBy(desc(bestCadets.awardDate), desc(bestCadets.id)),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      awardYear: new Date(`${row.awardDate}T00:00:00Z`).getUTCFullYear(),
    })),
    totalCount: countRows[0]?.count ?? 0,
  };
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminModule("portfolio");
  const raw = await searchParams;

  const [portfolioData, bestCadetData] = await Promise.all([
    getPortfolioData(raw),
    getBestCadets(),
  ]);

  return (
    <PortfolioPageClient
      initialContent={portfolioData.data?.content ?? null}
      initialFaqs={portfolioData.data?.faqs ?? []}
      initialSeeMore={portfolioData.data?.seeMore ?? []}
      faqTotalCount={portfolioData.data?.faqTotalCount ?? 0}
      seeMoreTotalCount={portfolioData.data?.seeMoreTotalCount ?? 0}
      faqOrderItems={portfolioData.data?.faqOrderItems ?? []}
      seeMoreOrderItems={portfolioData.data?.seeMoreOrderItems ?? []}
      searchParams={raw}
      bestCadetRows={bestCadetData.rows}
      bestCadetTotalCount={bestCadetData.totalCount}
    />
  );
}
