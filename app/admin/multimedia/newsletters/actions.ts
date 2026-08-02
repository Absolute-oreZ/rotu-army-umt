"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaignAttachments, newsletterCampaigns, newsletterCampaignDeliveries, newsletterCampaignTranslations, newsletterSubscribers } from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { takeString, takeNumber } from "@/lib/admin/form-helpers";
import {
  parseTableSearchParams,
  buildEnumFilterClause,
  wrapLikePattern,
  buildSortOrderBy,
} from "@/lib/admin/table-search-params";

import {
  buildNewslettersTableConfig,
  NEWSLETTERS_SORT_FIELD_MAP,
} from "@/components/admin/multimedia/newsletters/table-config";
import { deliverNewsletterCampaign } from "@/lib/newsletter-campaigns";
import { locales, type Locale } from "@/lib/i18n/config";
import { createNewsletterTokens, sendNewsletterConfirmationEmail } from "@/lib/newsletter";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, uploadToStorage } from "@/lib/supabase/storage";

export type CampaignRow = {
  id: number;
  subject: string;
  previewText: string | null;
  contentHtml: string;
  contentText: string | null;
  status: "DRAFT" | "SENT" | "SCHEDULED" | "SENDING" | "FAILED";
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentByAdminUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getNewsletterCampaigns(
  searchParams?: Record<string, string | string[] | undefined>
) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to view newsletters." };
  }

  const state = parseTableSearchParams(searchParams ?? {}, buildNewslettersTableConfig());
  const filterClauses = buildCampaignFilters(state);
  const where = filterClauses.length > 0 ? and(...filterClauses) : undefined;

  const orderBy = buildSortOrderBy(state.sortRules, NEWSLETTERS_SORT_FIELD_MAP);
  orderBy.push(desc(newsletterCampaigns.createdAt));

  const [countRow, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(newsletterCampaigns).where(where),
    db
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
      .from(newsletterCampaigns)
      .where(where)
      .orderBy(...orderBy)
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
  ]);

  const totalCount = countRow[0]?.count ?? 0;

  return {
    success: true as const,
    data: rows.map((r) => ({
      ...r,
      scheduledAt: r.scheduledAt?.toISOString() ?? null,
      sentAt: r.sentAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    totalCount,
    page: state.page,
    pageSize: state.pageSize,
  };
}

function buildCampaignFilters(state: { q: string; filters: Record<string, { operator: string; value: string }[]> }) {
  const clauses = [];

  if (state.q) {
    const contains = wrapLikePattern(state.q, "contains");
    const searchClause = or(
      ilike(newsletterCampaigns.subject, contains),
      ilike(newsletterCampaigns.contentHtml, contains)
    );
    if (searchClause) clauses.push(searchClause);
  }

  clauses.push(...buildEnumFilterClause(state.filters.status, newsletterCampaigns.status));

  return clauses;
}

/** Fetch single campaign details */
export async function getCampaignDetails(campaignId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to view newsletters." };
  }

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return { success: false as const, error: "Invalid campaign." };
  }

  const [row] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);

  if (!row) {
    return { success: false as const, error: "Campaign not found." };
  }

  const translations = await db.select().from(newsletterCampaignTranslations).where(eq(newsletterCampaignTranslations.campaignId, campaignId));
  const attachments = await db.select({ id: newsletterCampaignAttachments.id, fileName: newsletterCampaignAttachments.fileName, fileSize: newsletterCampaignAttachments.fileSize, contentType: newsletterCampaignAttachments.contentType }).from(newsletterCampaignAttachments).where(eq(newsletterCampaignAttachments.campaignId, campaignId));
  const deliveries = await db.select({ status: newsletterCampaignDeliveries.status }).from(newsletterCampaignDeliveries).where(eq(newsletterCampaignDeliveries.campaignId, campaignId));
  return {
    success: true as const,
    data: {
      ...row,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      sentAt: row.sentAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      translations: translations.map((translation) => ({ locale: translation.locale, subject: translation.subject, previewText: translation.previewText, contentHtml: translation.contentHtml, contentText: translation.contentText })),
      attachments,
      deliverySummary: { queued: deliveries.filter((delivery) => delivery.status === "QUEUED").length, sent: deliveries.filter((delivery) => delivery.status === "SENT").length, failed: deliveries.filter((delivery) => delivery.status === "FAILED").length },
    },
  };
}

/** Create a new campaign */
export async function createCampaign(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to manage newsletters." };
  }

  const variants = locales.map((locale) => ({ locale, subject: takeString(formData.get(`subject_${locale}`)), previewText: takeString(formData.get(`previewText_${locale}`)), contentHtml: takeString(formData.get(`contentHtml_${locale}`)), contentText: takeString(formData.get(`contentText_${locale}`)) }));
  const english = variants.find((variant) => variant.locale === "en")!;
  const subject = english.subject;
  const previewText = english.previewText;
  const contentHtml = english.contentHtml;
  const contentText = english.contentText;
  const status = takeString(formData.get("status")) ?? "DRAFT";
  const scheduledAt = takeString(formData.get("scheduledAt"));
  const attachments = formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);

  if (!subject) return { success: false as const, error: "Subject is required." };
  if (!contentHtml) return { success: false as const, error: "HTML content is required." };
  if (status !== "DRAFT" && status !== "SCHEDULED") return { success: false as const, error: "Invalid campaign status." };

  if (status === "SCHEDULED" && !scheduledAt) {
    return { success: false as const, error: "Scheduled date is required for scheduled campaigns." };
  }
  if (status === "SCHEDULED" && (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime()) || new Date(scheduledAt) <= new Date())) return { success: false as const, error: "Scheduled date must be in the future." };
  if (attachments.some((file) => file.size > 10 * 1024 * 1024)) return { success: false as const, error: "Each attachment must be 10 MB or smaller." };
  if (attachments.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) return { success: false as const, error: "Attachments must be 25 MB or smaller in total." };

  let campaignId: number | null = null;
  const uploadedPaths: string[] = [];
  try {
    const campaign = await db.transaction(async (tx) => {
      const [created] = await tx.insert(newsletterCampaigns).values({
        subject,
        previewText,
        contentHtml,
        contentText,
        status: status as "DRAFT" | "SENT" | "SCHEDULED" | "SENDING" | "FAILED",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }).returning({ id: newsletterCampaigns.id });
      campaignId = created.id;
      await tx.insert(newsletterCampaignTranslations).values(variants.filter((variant) => variant.contentHtml && variant.subject).map((variant) => ({ campaignId: created.id, locale: variant.locale as Locale, subject: variant.subject!, previewText: variant.previewText, contentHtml: variant.contentHtml!, contentText: variant.contentText })));
      return created;
    });

    if (attachments.length) {
      const supabase = createSupabaseAdminClient();
      const attachmentRows = [];
      for (const file of attachments) {
        const path = `newsletter/${campaign.id}/attachments/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const uploadedPath = await uploadToStorage(supabase, file, path, file.type);
        if (!uploadedPath) throw new Error("Attachment upload failed.");
        uploadedPaths.push(uploadedPath);
        attachmentRows.push({ campaignId: campaign.id, fileName: file.name, storagePath: uploadedPath, contentType: file.type || "application/octet-stream", fileSize: file.size });
      }
      await db.insert(newsletterCampaignAttachments).values(attachmentRows);
    }

    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const, data: { id: campaign.id } };
  } catch (err) {
    if (campaignId) {
      const supabase = createSupabaseAdminClient();
      await Promise.all(uploadedPaths.map((path) => deleteFromStorage(supabase, path)));
      await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId));
    }
    console.error("createCampaign failed", err);
    return { success: false as const, error: "Failed to create campaign." };
  }
}

/** Update an existing campaign */
export async function updateCampaign(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to manage newsletters." };
  }

  const campaignId = takeNumber(formData.get("campaignId"));
  if (!campaignId) return { success: false as const, error: "Invalid campaign." };

  const [existing] = await db
    .select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  if (!existing) {
    return { success: false as const, error: "Campaign not found." };
  }

  if (existing.status === "SENT") {
    return { success: false as const, error: "Cannot edit a sent campaign." };
  }

  const variants = locales.map((locale) => ({ locale, subject: takeString(formData.get(`subject_${locale}`)), previewText: takeString(formData.get(`previewText_${locale}`)), contentHtml: takeString(formData.get(`contentHtml_${locale}`)), contentText: takeString(formData.get(`contentText_${locale}`)) }));
  const english = variants.find((variant) => variant.locale === "en")!;
  const subject = english.subject;
  const previewText = english.previewText;
  const contentHtml = english.contentHtml;
  const contentText = english.contentText;
  const status = takeString(formData.get("status")) ?? "DRAFT";
  const scheduledAt = takeString(formData.get("scheduledAt"));
  const attachments = formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);

  if (!subject) return { success: false as const, error: "Subject is required." };
  if (!contentHtml) return { success: false as const, error: "HTML content is required." };
  if (status !== "DRAFT" && status !== "SCHEDULED") return { success: false as const, error: "Invalid campaign status." };
  if (status === "SCHEDULED" && (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime()) || new Date(scheduledAt) <= new Date())) return { success: false as const, error: "Scheduled date must be in the future." };
  if (attachments.some((file) => file.size > 10 * 1024 * 1024)) return { success: false as const, error: "Each attachment must be 10 MB or smaller." };
  if (attachments.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) return { success: false as const, error: "Attachments must be 25 MB or smaller in total." };

  try {
    await db.transaction(async (tx) => {
      await tx.update(newsletterCampaigns).set({
        subject,
        previewText,
        contentHtml,
        contentText,
        status: status as "DRAFT" | "SENT" | "SCHEDULED",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }).where(eq(newsletterCampaigns.id, campaignId));
      await tx.delete(newsletterCampaignTranslations).where(eq(newsletterCampaignTranslations.campaignId, campaignId));
      await tx.insert(newsletterCampaignTranslations).values(variants.filter((variant) => variant.contentHtml && variant.subject).map((variant) => ({ campaignId, locale: variant.locale as Locale, subject: variant.subject!, previewText: variant.previewText, contentHtml: variant.contentHtml!, contentText: variant.contentText })));
    });

    if (attachments.length) {
      const supabase = createSupabaseAdminClient();
      const attachmentRows = [];
      for (const file of attachments) {
        const path = `newsletter/${campaignId}/attachments/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const uploadedPath = await uploadToStorage(supabase, file, path, file.type);
        if (!uploadedPath) throw new Error("Attachment upload failed.");
        attachmentRows.push({ campaignId, fileName: file.name, storagePath: uploadedPath, contentType: file.type || "application/octet-stream", fileSize: file.size });
      }
      await db.insert(newsletterCampaignAttachments).values(attachmentRows);
    }

    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const };
  } catch (err) {
    console.error("updateCampaign failed", err);
    return { success: false as const, error: "Failed to update campaign." };
  }
}

/** Delete a campaign */
export async function deleteCampaign(campaignId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to manage newsletters." };
  }

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return { success: false as const, error: "Invalid campaign." };
  }

  const [existing] = await db
    .select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  if (!existing) {
    return { success: false as const, error: "Campaign not found." };
  }

  try {
    const attachments = await db.select({ storagePath: newsletterCampaignAttachments.storagePath }).from(newsletterCampaignAttachments).where(eq(newsletterCampaignAttachments.campaignId, campaignId));
    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId));
    if (attachments.length) {
      const supabase = createSupabaseAdminClient();
      await Promise.all(attachments.map((attachment) => deleteFromStorage(supabase, attachment.storagePath)));
    }
    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const };
  } catch (err) {
    console.error("deleteCampaign failed", err);
    return { success: false as const, error: "Failed to delete campaign." };
  }
}

/** Send campaign to all active subscribers */
export async function sendCampaign(campaignId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to manage newsletters." };
  }

  const result = await deliverNewsletterCampaign(campaignId, admin.id);

  revalidatePath("/admin/multimedia/newsletters");

  if (!result.success) {
    return { success: false as const, error: result.error ?? "Newsletter delivery failed.", data: result };
  }

  return { success: true as const, data: result };
}

/** Schedule a campaign */
export async function scheduleCampaign(campaignId: number, scheduledAt: string) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to manage newsletters." };
  }

  const [campaign] = await db
    .select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return { success: false as const, error: "Campaign not found." };
  }

  if (campaign.status === "SENT") {
    return { success: false as const, error: "Cannot schedule a sent campaign." };
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return { success: false as const, error: "Scheduled date must be in the future." };
  }

  try {
    await db
      .update(newsletterCampaigns)
      .set({ status: "SCHEDULED", scheduledAt: scheduledDate })
      .where(eq(newsletterCampaigns.id, campaignId));

    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const };
  } catch (err) {
    console.error("scheduleCampaign failed", err);
    return { success: false as const, error: "Failed to schedule campaign." };
  }
}

export async function retryFailedCampaign(campaignId: number) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "newsletters")) return { success: false as const, error: "You do not have permission to manage newsletters." };
  const [campaign] = await db.select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status }).from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);
  if (!campaign) return { success: false as const, error: "Campaign not found." };
  if (campaign.status !== "FAILED") return { success: false as const, error: "Only failed campaigns can be retried." };
  await db.update(newsletterCampaigns).set({ status: "DRAFT" }).where(eq(newsletterCampaigns.id, campaignId));
  const result = await deliverNewsletterCampaign(campaignId, admin.id);
  revalidatePath("/admin/multimedia/newsletters");
  return result.success ? { success: true as const, data: result } : { success: false as const, error: result.error ?? "Retry failed.", data: result };
}

export async function cancelScheduledCampaign(campaignId: number) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "newsletters")) return { success: false as const, error: "You do not have permission to manage newsletters." };
  const [campaign] = await db.select({ status: newsletterCampaigns.status }).from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);
  if (!campaign) return { success: false as const, error: "Campaign not found." };
  if (campaign.status !== "SCHEDULED") return { success: false as const, error: "Only scheduled campaigns can be cancelled." };
  await db.update(newsletterCampaigns).set({ status: "DRAFT", scheduledAt: null }).where(eq(newsletterCampaigns.id, campaignId));
  revalidatePath("/admin/multimedia/newsletters");
  return { success: true as const };
}

export async function resendSubscriberConfirmation(subscriberId: string) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "newsletters")) return { success: false as const, error: "You do not have permission to manage newsletters." };
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriberId)).limit(1);
  if (!subscriber) return { success: false as const, error: "Subscriber not found." };
  const tokens = createNewsletterTokens();
  await db.update(newsletterSubscribers).set({ status: "PENDING", confirmedAt: null, confirmationTokenHash: tokens.confirmationTokenHash, unsubscribeTokenHash: tokens.unsubscribeTokenHash }).where(eq(newsletterSubscribers.id, subscriberId));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const dictionary = await getDictionary(subscriber.preferredLocale);
    await sendNewsletterConfirmationEmail({ to: subscriber.email, copy: dictionary.newsletter, confirmationUrl: `${siteUrl}/${subscriber.preferredLocale}/newsletter/confirm/${tokens.confirmationToken}`, unsubscribeUrl: `${siteUrl}/${subscriber.preferredLocale}/newsletter/unsubscribe/${tokens.unsubscribeToken}` });
    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to send confirmation email." }; }
}

export async function updateSubscriberStatus(subscriberId: string, status: "ACTIVE" | "UNSUBSCRIBED") {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "newsletters")) return { success: false as const, error: "You do not have permission to manage newsletters." };
  await db.update(newsletterSubscribers).set({ status, confirmedAt: status === "ACTIVE" ? new Date() : undefined, unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null }).where(eq(newsletterSubscribers.id, subscriberId));
  revalidatePath("/admin/multimedia/newsletters");
  return { success: true as const };
}

export async function deleteSubscriber(subscriberId: string) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "newsletters")) return { success: false as const, error: "You do not have permission to manage newsletters." };
  const [delivery] = await db.select({ id: newsletterCampaignDeliveries.id }).from(newsletterCampaignDeliveries).where(eq(newsletterCampaignDeliveries.subscriberId, subscriberId)).limit(1);
  if (delivery) {
    await db.update(newsletterSubscribers).set({ email: `deleted-${subscriberId}@invalid.local`, status: "UNSUBSCRIBED", confirmationTokenHash: null, unsubscribeTokenHash: null, unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.id, subscriberId));
  } else {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriberId));
  }
  revalidatePath("/admin/multimedia/newsletters");
  return { success: true as const };
}

/** Export all subscribers as CSV */
export async function exportSubscribers() {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "newsletters")) {
    return { success: false as const, error: "You do not have permission to export subscribers." };
  }

  const { newsletterSubscribers: nl } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");

  const rows = await db
    .select({
      email: nl.email,
      preferredLocale: nl.preferredLocale,
      status: nl.status,
      confirmedAt: nl.confirmedAt,
      unsubscribedAt: nl.unsubscribedAt,
      createdAt: nl.createdAt,
    })
    .from(nl)
    .orderBy(desc(nl.createdAt));

  const csv = [
    "Email,Preferred Locale,Status,Confirmed At,Unsubscribed At,Created At",
    ...rows.map((r) =>
      [
        r.email,
        r.preferredLocale,
        r.status,
        r.confirmedAt?.toISOString() ?? "",
        r.unsubscribedAt?.toISOString() ?? "",
        r.createdAt.toISOString(),
      ].join(",")
    ),
  ].join("\n");

  return {
    success: true as const,
    data: csv,
    filename: `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`,
  };
}
