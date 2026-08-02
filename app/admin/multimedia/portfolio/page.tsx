import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import { getPortfolioData, getAllMembers } from "@/app/admin/multimedia/portfolio/actions";
import { PortfolioPageClient } from "@/components/admin/multimedia/portfolio/portfolio-page-client";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    notFound();
  }

  const raw = await searchParams;

  const [portfolioData, membersResult] = await Promise.all([
    getPortfolioData(raw),
    getAllMembers(),
  ]);

  return (
    <PortfolioPageClient
      initialContent={portfolioData.data?.content ?? null}
      initialFaqs={portfolioData.data?.faqs ?? []}
      initialSeeMore={portfolioData.data?.seeMore ?? []}
      initialTestimonials={portfolioData.data?.testimonials ?? []}
      faqTotalCount={portfolioData.data?.faqTotalCount ?? 0}
      seeMoreTotalCount={portfolioData.data?.seeMoreTotalCount ?? 0}
      testimonialTotalCount={portfolioData.data?.testimonialTotalCount ?? 0}
      faqOrderItems={portfolioData.data?.faqOrderItems ?? []}
      seeMoreOrderItems={portfolioData.data?.seeMoreOrderItems ?? []}
      testimonialOrderItems={portfolioData.data?.testimonialOrderItems ?? []}
      searchParams={raw}
      members={membersResult.data ?? []}
    />
  );
}
