import "server-only";

import { and, eq, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaignAttachments, newsletterCampaignDeliveries, newsletterCampaigns, newsletterCampaignTranslations, newsletterSubscribers } from "@/db/schema";
import { createSignedUnsubscribeToken } from "@/lib/newsletter";
import { escapeHtml } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { signedStorageUrl } from "@/lib/supabase/storage";

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "ROTU Army UMT <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BATCH_SIZE = 50;

export type CampaignDeliveryResult = { success: boolean; sentCount: number; failedCount: number; totalRecipients: number; error?: string };

function addFooter(html: string, unsubscribeUrl: string) {
  return `${html}<hr><p style="font-size:12px;color:#64748b">You are receiving this email because you subscribed to ROTU Army UMT updates. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`;
}

export async function deliverNewsletterCampaign(campaignId: number, senderAdminUserId: string | null): Promise<CampaignDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "RESEND_API_KEY is not configured." };

  const claimed = await db.update(newsletterCampaigns).set({ status: "SENDING", sentByAdminUserId: senderAdminUserId }).where(and(eq(newsletterCampaigns.id, campaignId), or(eq(newsletterCampaigns.status, "DRAFT"), eq(newsletterCampaigns.status, "SCHEDULED")))).returning({ id: newsletterCampaigns.id });
  if (!claimed.length) return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "Campaign is already sending, sent, or unavailable." };

  try {
    const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);
    if (!campaign) throw new Error("Campaign not found.");
    const [translations, subscribers, storedAttachments] = await Promise.all([
      db.select().from(newsletterCampaignTranslations).where(eq(newsletterCampaignTranslations.campaignId, campaignId)),
      db.select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, preferredLocale: newsletterSubscribers.preferredLocale }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "ACTIVE")),
      db.select().from(newsletterCampaignAttachments).where(eq(newsletterCampaignAttachments.campaignId, campaignId)),
    ]);
    if (!subscribers.length) throw new Error("No active subscribers to send to.");
    const translationMap = new Map(translations.map((translation) => [translation.locale, translation]));
    const fallback = translationMap.get("en") ?? { subject: campaign.subject, previewText: campaign.previewText, contentHtml: campaign.contentHtml, contentText: campaign.contentText };
    const supabase = storedAttachments.length ? createSupabaseAdminClient() : null;
    const attachments = await Promise.all(storedAttachments.map(async (attachment) => ({
      filename: attachment.fileName,
      contentType: attachment.contentType,
      path: supabase ? await signedStorageUrl(supabase, attachment.storagePath, 3600) : null,
    })));
    if (attachments.some((attachment) => !attachment.path)) throw new Error("Unable to access a campaign attachment.");
    await db.insert(newsletterCampaignDeliveries).values(subscribers.map((subscriber) => ({ campaignId, subscriberId: subscriber.id, email: subscriber.email, locale: translationMap.has(subscriber.preferredLocale) ? subscriber.preferredLocale : "en", status: "QUEUED" as const }))).onConflictDoNothing();
    const deliveries = await db.select({ id: newsletterCampaignDeliveries.id, subscriberId: newsletterCampaignDeliveries.subscriberId, email: newsletterCampaignDeliveries.email, locale: newsletterCampaignDeliveries.locale }).from(newsletterCampaignDeliveries).where(and(eq(newsletterCampaignDeliveries.campaignId, campaignId), or(eq(newsletterCampaignDeliveries.status, "QUEUED"), eq(newsletterCampaignDeliveries.status, "FAILED"))));
    let sentCount = 0;
    let failedCount = 0;
    for (let index = 0; index < deliveries.length; index += BATCH_SIZE) {
      const batch = deliveries.slice(index, index + BATCH_SIZE);
      const emails = batch.map((delivery) => { const variant = translationMap.get(delivery.locale) ?? fallback; const unsubscribeUrl = `${SITE_URL}/${delivery.locale}/newsletter/unsubscribe/${createSignedUnsubscribeToken(delivery.subscriberId)}`; return { from: DEFAULT_FROM_EMAIL, to: [delivery.email], subject: variant.subject, html: addFooter(variant.contentHtml, unsubscribeUrl), text: `${variant.contentText ?? variant.contentHtml}\n\nUnsubscribe: ${unsubscribeUrl}`, ...(attachments.length ? { attachments: attachments.map(({ filename, contentType, path }) => ({ filename, content_type: contentType, path: path! })) } : {}) }; });
      try {
        const response = await fetch(RESEND_BATCH_URL, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ emails }) });
        if (!response.ok) throw new Error(`Resend returned ${response.status}.`);
        const result = await response.json() as { data?: Array<{ id?: string }> };
        await Promise.all(batch.map((delivery, deliveryIndex) => db.update(newsletterCampaignDeliveries).set({ status: "SENT", providerMessageId: result.data?.[deliveryIndex]?.id ?? null, sentAt: new Date(), errorMessage: null }).where(eq(newsletterCampaignDeliveries.id, delivery.id))));
        sentCount += batch.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delivery failed.";
        await Promise.all(batch.map((delivery) => db.update(newsletterCampaignDeliveries).set({ status: "FAILED", errorMessage: message }).where(eq(newsletterCampaignDeliveries.id, delivery.id))));
        failedCount += batch.length;
      }
    }
    const [remaining] = await db.select({ count: sql<number>`count(*)::int` }).from(newsletterCampaignDeliveries).where(and(eq(newsletterCampaignDeliveries.campaignId, campaignId), inArray(newsletterCampaignDeliveries.status, ["QUEUED", "FAILED"])));
    await db.update(newsletterCampaigns).set({ status: remaining.count === 0 ? "SENT" : "FAILED", sentAt: remaining.count === 0 ? new Date() : null, recipientCount: sentCount, scheduledAt: null }).where(eq(newsletterCampaigns.id, campaignId));
    return { success: remaining.count === 0, sentCount, failedCount, totalRecipients: subscribers.length, ...(remaining.count === 0 ? {} : { error: "Some deliveries failed. Retry the campaign to send failed recipients." }) };
  } catch (error) {
    await db.update(newsletterCampaigns).set({ status: "FAILED" }).where(eq(newsletterCampaigns.id, campaignId));
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: error instanceof Error ? error.message : "Newsletter delivery failed." };
  }
}

export async function getDueNewsletterCampaignIds(now = new Date()) {
  const rows = await db.select({ id: newsletterCampaigns.id }).from(newsletterCampaigns).where(and(eq(newsletterCampaigns.status, "SCHEDULED"), lte(newsletterCampaigns.scheduledAt, now))).limit(10);
  return rows.map((row) => row.id);
}
