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
  buildDateFilterClause,
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
import { deleteFromStorage, saveUpload } from "@/lib/supabase/storage";
import { sanitizeHtml } from "@/lib/newsletter/sanitize-html";
import { parseMalaysiaDateTimeLocal } from "@/lib/time/malaysia";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_TOTAL_BYTES = 5 * 1024 * 1024;

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
  orderBy.push(desc(newsletterCampaigns.id));

  const [countRow, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(newsletterCampaigns).where(where),
    db
      .select({
        id: newsletterCampaigns.id,
        subject: newsletterCampaigns.subject,
        previewText: newsletterCampaigns.previewText,
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
  clauses.push(...buildDateFilterClause(state.filters.scheduledAt, newsletterCampaigns.scheduledAt));
  clauses.push(...buildDateFilterClause(state.filters.sentAt, newsletterCampaigns.sentAt));
  clauses.push(...buildDateFilterClause(state.filters.createdAt, newsletterCampaigns.createdAt));

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

  const variants = locales.map((locale) => {
    const subjectKey = `subject_${locale}`;
    const previewKey = `previewText_${locale}`;
    const htmlKey = `contentHtml_${locale}`;
    const textKey = `contentText_${locale}`;
    return {
      locale,
      subject: takeString(formData.get(subjectKey)),
      previewText: takeString(formData.get(previewKey)),
      contentHtml: sanitizeHtml(takeString(formData.get(htmlKey)) ?? ""),
      contentText: takeString(formData.get(textKey)),
    };
  });
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
  const scheduledDate = scheduledAt ? parseMalaysiaDateTimeLocal(scheduledAt) : null;
  if (status === "SCHEDULED" && (!scheduledDate || scheduledDate <= new Date())) return { success: false as const, error: "Scheduled date must be in the future." };
  if (attachments.some((file) => file.size > MAX_ATTACHMENT_BYTES)) return { success: false as const, error: "Each attachment must be 5 MB or smaller." };
  if (attachments.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_TOTAL_BYTES) return { success: false as const, error: "Attachments must be 5 MB or smaller in total." };

  const uploadedPaths: string[] = [];
  const attachmentRows: Array<Omit<typeof newsletterCampaignAttachments.$inferInsert, "campaignId">> = [];

  try {
    if (attachments.length) {
      const supabase = createSupabaseAdminClient();
      const prefix = `newsletter/${crypto.randomUUID()}/attachments`;
      for (const file of attachments) {
        const saved = await saveUpload({
          supabase,
          file,
          prefix,
          stem: crypto.randomUUID(),
          kinds: ["image", "pdf"],
          maxBytes: MAX_ATTACHMENT_BYTES,
        });
        if (!saved.ok) throw new Error(saved.error);
        uploadedPaths.push(saved.path);
        attachmentRows.push({ fileName: file.name, storagePath: saved.path, contentType: saved.contentType, fileSize: saved.size });
      }
    }

    const campaign = await db.transaction(async (tx) => {
      const [created] = await tx.insert(newsletterCampaigns).values({
        subject,
        previewText,
        contentHtml,
        contentText,
        status: status as "DRAFT" | "SENT" | "SCHEDULED" | "SENDING" | "FAILED",
        scheduledAt: scheduledDate,
      }).returning({ id: newsletterCampaigns.id });
      await tx.insert(newsletterCampaignTranslations).values(variants.filter((variant) => variant.contentHtml && variant.subject).map((variant) => ({ campaignId: created.id, locale: variant.locale as Locale, subject: variant.subject!, previewText: variant.previewText, contentHtml: variant.contentHtml!, contentText: variant.contentText })));
      if (attachmentRows.length) {
        await tx.insert(newsletterCampaignAttachments).values(attachmentRows.map((row) => ({ ...row, campaignId: created.id })));
      }
      return created;
    });

    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const, data: { id: campaign.id } };
  } catch (err) {
    if (uploadedPaths.length) {
      const supabase = createSupabaseAdminClient();
      await Promise.all(uploadedPaths.map((path) => deleteFromStorage(supabase, path)));
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

  if (existing.status === "SENT" || existing.status === "SENDING") {
        return { success: false as const, error: "Cannot edit a sent or currently sending campaign." };
      }

    const variants = locales.map((locale) => {
      const subjectKey = `subject_${locale}`;
      const previewKey = `previewText_${locale}`;
      const htmlKey = `contentHtml_${locale}`;
      const textKey = `contentText_${locale}`;
      return {
        locale,
        subject: takeString(formData.get(subjectKey)),
        previewText: takeString(formData.get(previewKey)),
        contentHtml: sanitizeHtml(takeString(formData.get(htmlKey)) ?? ""),
        contentText: takeString(formData.get(textKey)),
      };
    });
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
  const scheduledDate = scheduledAt ? parseMalaysiaDateTimeLocal(scheduledAt) : null;
  if (status === "SCHEDULED" && (!scheduledDate || scheduledDate <= new Date())) return { success: false as const, error: "Scheduled date must be in the future." };
  if (attachments.some((file) => file.size > MAX_ATTACHMENT_BYTES)) return { success: false as const, error: "Each attachment must be 5 MB or smaller." };
  if (attachments.reduce((total, file) => total + file.size, 0) > MAX_ATTACHMENT_TOTAL_BYTES) return { success: false as const, error: "Attachments must be 5 MB or smaller in total." };

  const uploadedPaths: string[] = [];
  const attachmentRows: Array<Omit<typeof newsletterCampaignAttachments.$inferInsert, "campaignId">> = [];

  try {
    if (attachments.length) {
      const supabase = createSupabaseAdminClient();
      const prefix = `newsletter/${crypto.randomUUID()}/attachments`;
      for (const file of attachments) {
        const saved = await saveUpload({
          supabase,
          file,
          prefix,
          stem: crypto.randomUUID(),
          kinds: ["image", "pdf"],
          maxBytes: MAX_ATTACHMENT_BYTES,
        });
        if (!saved.ok) throw new Error(saved.error);
        uploadedPaths.push(saved.path);
        attachmentRows.push({ fileName: file.name, storagePath: saved.path, contentType: saved.contentType, fileSize: saved.size });
      }
    }

    await db.transaction(async (tx) => {
      await tx.update(newsletterCampaigns).set({
        subject,
        previewText,
        contentHtml,
        contentText,
        status: status as "DRAFT" | "SENT" | "SCHEDULED",
        scheduledAt: scheduledDate,
      }).where(eq(newsletterCampaigns.id, campaignId));
      await tx.delete(newsletterCampaignTranslations).where(eq(newsletterCampaignTranslations.campaignId, campaignId));
      await tx.insert(newsletterCampaignTranslations).values(variants.filter((variant) => variant.contentHtml && variant.subject).map((variant) => ({ campaignId, locale: variant.locale as Locale, subject: variant.subject!, previewText: variant.previewText, contentHtml: variant.contentHtml!, contentText: variant.contentText })));
      if (attachmentRows.length) {
        await tx.insert(newsletterCampaignAttachments).values(attachmentRows.map((row) => ({ ...row, campaignId })));
      }
    });

    revalidatePath("/admin/multimedia/newsletters");
    return { success: true as const };
  } catch (err) {
    if (uploadedPaths.length) {
      const supabase = createSupabaseAdminClient();
      await Promise.all(uploadedPaths.map((path) => deleteFromStorage(supabase, path)));
    }
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

  const scheduledDate = parseMalaysiaDateTimeLocal(scheduledAt);
  if (!scheduledDate || scheduledDate <= new Date()) {
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

function escapeCsvField(value: string): string {
  if (!value) return "";
  const startsWithDangerous = /^[=+\-@]/.test(value.trim());
  const needsQuotes = value.includes(",") || value.includes("\"") || value.includes("\n") || startsWithDangerous;
  let escaped = value.replace(/"/g, "\"\"");
  if (startsWithDangerous) {
    escaped = "'" + escaped;
  }
  if (needsQuotes || startsWithDangerous) {
    escaped = "\"" + escaped + "\"";
  }
  return escaped;
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
        escapeCsvField(r.email),
        escapeCsvField(r.preferredLocale),
        escapeCsvField(r.status),
        escapeCsvField(r.confirmedAt?.toISOString() ?? ""),
        escapeCsvField(r.unsubscribedAt?.toISOString() ?? ""),
        escapeCsvField(r.createdAt.toISOString()),
      ].join(",")
    ),
  ].join("\n");

  // Prepend UTF-8 BOM for Excel compatibility with non-ASCII characters
  const bom = "\uFEFF";
  const csvWithBom = bom + csv;

  return {
    success: true as const,
    data: csvWithBom,
    filename: `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`,
  };
}
