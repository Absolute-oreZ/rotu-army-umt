import { and, desc, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaigns, newsletterSubscribers } from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { notFound } from "next/navigation";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  takeString,
  wrapLikePattern,
  type FilterCondition,
} from "@/lib/admin/table-search-params";
import {
  buildNewslettersTableConfig,
  NEWSLETTERS_SORT_FIELD_MAP,
  buildSubscribersTableConfig,
  SUBSCRIBERS_SORT_FIELD_MAP,
} from "@/components/admin/multimedia/newsletters/table-config";
import { NewslettersPageClient } from "@/components/admin/multimedia/newsletters/newsletters-page-client";
import { type CampaignRow, type SubscriberRow } from "@/components/admin/multimedia/newsletters/newsletters-table";

type NewsletterTab = "campaigns" | "subscribers";

function buildCampaignFilters(state: { q: string; filters: Record<string, FilterCondition[]> }): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(newsletterCampaigns.subject, contains),
      ilike(newsletterCampaigns.contentHtml, contains)
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, newsletterCampaigns.status));
  clauses.push(...buildDateFilterClause(state.filters.scheduledAt, newsletterCampaigns.scheduledAt));
  clauses.push(...buildDateFilterClause(state.filters.sentAt, newsletterCampaigns.sentAt));
  clauses.push(...buildDateFilterClause(state.filters.createdAt, newsletterCampaigns.createdAt));

  return clauses;
}

function buildSubscriberFilters(state: { q: string; filters: Record<string, FilterCondition[]> }): SQL[] {
  const clauses: SQL[] = [];

  if (state.q) {
    clauses.push(ilike(newsletterSubscribers.email, `%${state.q}%`));
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, newsletterSubscribers.status));
  clauses.push(...buildEnumFilterClause(state.filters.preferredLocale, newsletterSubscribers.preferredLocale));
  clauses.push(...buildDateFilterClause(state.filters.createdAt, newsletterSubscribers.createdAt));

  return clauses;
}

function buildCampaignsBaseQuery() {
  return db
    .select({
      id: newsletterCampaigns.id,
      subject: newsletterCampaigns.subject,
      previewText: newsletterCampaigns.previewText,
      contentHtml: newsletterCampaigns.contentHtml,
      contentText: newsletterCampaigns.contentText,
      status: newsletterCampaigns.status,
      scheduledAt: newsletterCampaigns.scheduledAt,
      sentAt: newsletterCampaigns.sentAt,
      recipientCount: newsletterCampaigns.recipientCount,
      sentByAdminUserId: newsletterCampaigns.sentByAdminUserId,
      createdAt: newsletterCampaigns.createdAt,
      updatedAt: newsletterCampaigns.updatedAt,
    })
    .from(newsletterCampaigns);
}

function buildSubscribersBaseQuery() {
  return db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      preferredLocale: newsletterSubscribers.preferredLocale,
      status: newsletterSubscribers.status,
      confirmedAt: newsletterSubscribers.confirmedAt,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt,
      createdAt: newsletterSubscribers.createdAt,
      updatedAt: newsletterSubscribers.updatedAt,
    })
    .from(newsletterSubscribers);
}

export default async function NewslettersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    notFound();
  }

  const raw = await searchParams;
  const tab = (takeString(raw.tab) === "subscribers" ? "subscribers" : "campaigns") as NewsletterTab;

  let campaigns: CampaignRow[] = [];
  let campaignsTotalCount = 0;
  let subscribers: SubscriberRow[] = [];
  let subscribersTotalCount = 0;

  if (tab === "campaigns") {
    const campaignsConfig = buildNewslettersTableConfig();
    const campaignState = parseTableSearchParams(raw, campaignsConfig);
    const campaignClauses = buildCampaignFilters(campaignState);
    const where = campaignClauses.length > 0 ? and(...campaignClauses) : undefined;

    const orderBy = buildSortOrderBy(campaignState.sortRules, NEWSLETTERS_SORT_FIELD_MAP);
    orderBy.push(desc(newsletterCampaigns.createdAt));

    const [countRow, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(newsletterCampaigns).where(where),
      buildCampaignsBaseQuery()
        .where(where)
        .orderBy(...orderBy)
        .limit(campaignState.pageSize)
        .offset((campaignState.page - 1) * campaignState.pageSize),
    ]);

    campaignsTotalCount = countRow[0]?.count ?? 0;
    campaigns = rows.map((c) => ({
      ...c,
      scheduledAt: c.scheduledAt?.toISOString() ?? null,
      sentAt: c.sentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } else {
    const subscribersConfig = buildSubscribersTableConfig();
    const subscriberState = parseTableSearchParams(raw, subscribersConfig);
    const subscriberClauses = buildSubscriberFilters(subscriberState);
    const where = subscriberClauses.length > 0 ? and(...subscriberClauses) : undefined;

    const orderBy = buildSortOrderBy(subscriberState.sortRules, SUBSCRIBERS_SORT_FIELD_MAP);
    orderBy.push(desc(newsletterSubscribers.createdAt));

    const [countRow, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(newsletterSubscribers).where(where),
      buildSubscribersBaseQuery()
        .where(where)
        .orderBy(...orderBy)
        .limit(subscriberState.pageSize)
        .offset((subscriberState.page - 1) * subscriberState.pageSize),
    ]);

    subscribersTotalCount = countRow[0]?.count ?? 0;
    subscribers = rows.map((s) => ({
      ...s,
      confirmedAt: s.confirmedAt?.toISOString() ?? null,
      unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  return (
    <NewslettersPageClient
      tab={tab}
      searchParams={raw}
      initialCampaigns={campaigns}
      initialCampaignsTotalCount={campaignsTotalCount}
      initialSubscribers={subscribers}
      initialSubscribersTotalCount={subscribersTotalCount}
    />
  );
}
