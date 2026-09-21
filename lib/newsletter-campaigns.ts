import "server-only";

import { and, eq, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterCampaignAttachments, newsletterCampaignDeliveries, newsletterCampaigns, newsletterCampaignTranslations, newsletterSubscribers } from "@/db/schema";
import { createSignedUnsubscribeToken } from "@/lib/newsletter";
import { escapeHtml } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { signedStorageUrl } from "@/lib/supabase/storage";

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const DEFAULT_FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL ?? "ROTU Army UMT <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BATCH_SIZE = 50;
const SENDING_HEARTBEAT_INTERVAL_MS = 30000;
const SENDING_LEASE_TTL_MS = 120000;
const MAX_RETRIES = 3;

export type CampaignDeliveryResult = { success: boolean; sentCount: number; failedCount: number; totalRecipients: number; error?: string };

function addFooter(html: string, unsubscribeUrl: string) {
  return `${html}<hr><p style="font-size:12px;color:#64748b">You are receiving this email because you subscribed to ROTU Army UMT updates. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>`;
}

const BULK_UPDATE_CHUNK = 200;

type DeliveryUpdate = {
  id: number;
  status: string;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  errorMessage?: string | null;
};

async function bulkUpdateDeliveries(updates: DeliveryUpdate[]) {
  if (!updates.length) return;

  const sentUpdates = updates.filter((u) => u.status === "SENT");
  const failedUpdates = updates.filter((u) => u.status === "FAILED");

  for (let i = 0; i < sentUpdates.length; i += BULK_UPDATE_CHUNK) {
    const chunk = sentUpdates.slice(i, i + BULK_UPDATE_CHUNK);
    await db.execute(sql`
      update ${newsletterCampaignDeliveries} as d
      set status = 'SENT',
          provider_message_id = v.provider_message_id,
          sent_at = v.sent_at,
          error_message = null
      from (values ${sql.join(
        chunk.map(
          (u) => sql`(${u.id}::int, ${u.providerMessageId ?? null}::text, ${u.sentAt ?? new Date()}::timestamptz)`
        ),
        sql`, `
      )}) as v(id, provider_message_id, sent_at)
      where d.id = v.id
    `);
  }

  for (let i = 0; i < failedUpdates.length; i += BULK_UPDATE_CHUNK) {
    const chunk = failedUpdates.slice(i, i + BULK_UPDATE_CHUNK);
    await db.execute(sql`
      update ${newsletterCampaignDeliveries} as d
      set status = 'FAILED',
          error_message = v.error_message
      from (values ${sql.join(
        chunk.map((u) => sql`(${u.id}::int, ${u.errorMessage ?? "Delivery failed"}::text)`),
        sql`, `
      )}) as v(id, error_message)
      where d.id = v.id
    `);
  }
}

export async function acquireSendingLease(campaignId: number, senderAdminUserId: string | null): Promise<{ success: boolean; leaseId?: string; error?: string }> {
  const leaseId = crypto.randomUUID();
  const heartbeatAt = new Date(Date.now() + SENDING_LEASE_TTL_MS);
  
  const claimed = await db.update(newsletterCampaigns)
    .set({ 
      status: "SENDING", 
      sentByAdminUserId: senderAdminUserId,
      sendingLeaseId: leaseId,
      sendingLeaseExpiresAt: heartbeatAt,
      retryCount: 0,
    })
    .where(and(
      eq(newsletterCampaigns.id, campaignId),
      or(
        eq(newsletterCampaigns.status, "DRAFT"),
        eq(newsletterCampaigns.status, "SCHEDULED"),
        eq(newsletterCampaigns.status, "FAILED"),
        and(eq(newsletterCampaigns.status, "SENDING"), lte(newsletterCampaigns.sendingLeaseExpiresAt, new Date()))
      )
    ))
    .returning({ id: newsletterCampaigns.id });
    
  if (!claimed.length) {
    return { success: false, error: "Campaign is already sending, sent, or unavailable." };
  }
  
  return { success: true, leaseId };
}

export async function renewSendingLease(campaignId: number, leaseId: string): Promise<boolean> {
  const heartbeatAt = new Date(Date.now() + SENDING_LEASE_TTL_MS);
  
  const updated = await db.update(newsletterCampaigns)
    .set({ sendingLeaseExpiresAt: heartbeatAt })
    .where(and(
      eq(newsletterCampaigns.id, campaignId),
      eq(newsletterCampaigns.sendingLeaseId, leaseId),
      eq(newsletterCampaigns.status, "SENDING")
    ))
    .returning({ id: newsletterCampaigns.id });
    
  return updated.length > 0;
}

export async function releaseSendingLease(campaignId: number, leaseId: string): Promise<void> {
  await db.update(newsletterCampaigns)
    .set({ 
      sendingLeaseId: null,
      sendingLeaseExpiresAt: null,
    })
    .where(and(
      eq(newsletterCampaigns.id, campaignId),
      eq(newsletterCampaigns.sendingLeaseId, leaseId)
    ));
}

export async function getCampaignSendingState(campaignId: number) {
  const [campaign] = await db.select({
    id: newsletterCampaigns.id,
    status: newsletterCampaigns.status,
    sendingLeaseId: newsletterCampaigns.sendingLeaseId,
    sendingLeaseExpiresAt: newsletterCampaigns.sendingLeaseExpiresAt,
    retryCount: newsletterCampaigns.retryCount,
  }).from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);
  
  return campaign ?? null;
}

export async function deliverNewsletterCampaign(campaignId: number, senderAdminUserId: string | null): Promise<CampaignDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "RESEND_API_KEY is not configured." };

  const leaseResult = await acquireSendingLease(campaignId, senderAdminUserId);
  if (!leaseResult.success) {
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: leaseResult.error };
  }
  
  const leaseId = leaseResult.leaseId!;
  
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
          path: supabase ? await signedStorageUrl(supabase, attachment.storagePath, undefined, "document") : null,
        })));
    
    if (attachments.some((attachment) => !attachment.path)) throw new Error("Unable to access a campaign attachment.");
    
    // Prepare all deliveries with idempotency keys
    const deliveryRows = subscribers.map((subscriber) => ({ 
      campaignId, 
      subscriberId: subscriber.id, 
      email: subscriber.email, 
      locale: translationMap.has(subscriber.preferredLocale) ? subscriber.preferredLocale : "en", 
      status: "QUEUED" as const,
      idempotencyKey: `${campaignId}-${subscriber.id}-${campaign.updatedAt?.getTime() ?? Date.now()}`,
    }));
    
    await db.insert(newsletterCampaignDeliveries)
      .values(deliveryRows)
      .onConflictDoNothing({ target: newsletterCampaignDeliveries.idempotencyKey });
    
    const deliveries = await db.select({ 
      id: newsletterCampaignDeliveries.id, 
      subscriberId: newsletterCampaignDeliveries.subscriberId, 
      email: newsletterCampaignDeliveries.email, 
      locale: newsletterCampaignDeliveries.locale,
      idempotencyKey: newsletterCampaignDeliveries.idempotencyKey,
    }).from(newsletterCampaignDeliveries)
      .where(and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId), 
        or(eq(newsletterCampaignDeliveries.status, "QUEUED"), eq(newsletterCampaignDeliveries.status, "FAILED"))
      ));
    
    let sentCount = 0;
    let failedCount = 0;
    const bulkUpdates: Array<{ id: number; status: string; providerMessageId?: string | null; sentAt?: Date | null; errorMessage?: string | null }> = [];
    
    const heartbeatInterval = setInterval(async () => {
      await renewSendingLease(campaignId, leaseId);
    }, SENDING_HEARTBEAT_INTERVAL_MS);
    
    try {
      for (let index = 0; index < deliveries.length; index += BATCH_SIZE) {
        const batch = deliveries.slice(index, index + BATCH_SIZE);
        const emails = batch.map((delivery) => { 
          const variant = translationMap.get(delivery.locale) ?? fallback; 
          const unsubscribeUrl = `${SITE_URL}/${delivery.locale}/newsletter/unsubscribe/${createSignedUnsubscribeToken(delivery.subscriberId)}`; 
          return { 
            from: DEFAULT_FROM_EMAIL, 
            to: [delivery.email], 
            subject: variant.subject, 
            html: addFooter(variant.contentHtml, unsubscribeUrl), 
            text: `${variant.contentText ?? variant.contentHtml}\n\nUnsubscribe: ${unsubscribeUrl}`, 
            ...(attachments.length ? { 
              attachments: attachments.map(({ filename, contentType, path }) => ({ filename, content_type: contentType, path: path! })) 
            } : {}),
            idempotencyKey: delivery.idempotencyKey,
          }; 
        });
        
        let batchSuccess = false;
        let lastError: Error | null = null;
        
        for (let retry = 0; retry < MAX_RETRIES && !batchSuccess; retry++) {
          try {
            const response = await fetch(RESEND_BATCH_URL, { 
              method: "POST", 
              headers: { 
                Authorization: `Bearer ${apiKey}`, 
                "Content-Type": "application/json" 
              }, 
              body: JSON.stringify({ emails }) 
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Resend returned ${response.status}: ${errorText}`);
            }
            
            const result = await response.json() as { data?: Array<{ id?: string }> };
            
            // Collect bulk updates instead of individual updates
            const now = new Date();
            for (let deliveryIndex = 0; deliveryIndex < batch.length; deliveryIndex++) {
              const delivery = batch[deliveryIndex];
              bulkUpdates.push({
                id: delivery.id,
                status: "SENT",
                providerMessageId: result.data?.[deliveryIndex]?.id ?? null,
                sentAt: now,
              });
            }
            
            sentCount += batch.length;
            batchSuccess = true;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error("Delivery failed");
            if (retry < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
            }
          }
        }
        
        if (!batchSuccess) {
          const message = lastError?.message ?? "Delivery failed after retries";
          for (const delivery of batch) {
            bulkUpdates.push({
              id: delivery.id,
              status: "FAILED",
              errorMessage: message,
            });
          }
          failedCount += batch.length;
        }
        
        // Apply bulk updates periodically to avoid memory buildup
        if (bulkUpdates.length >= BATCH_SIZE * 2) {
          await bulkUpdateDeliveries(bulkUpdates);
          bulkUpdates.length = 0;
        }
      }
    } finally {
      clearInterval(heartbeatInterval);
    }
    
    // Apply remaining bulk updates
    if (bulkUpdates.length > 0) {
      await bulkUpdateDeliveries(bulkUpdates);
    }
    
    const [remaining] = await db.select({ count: sql<number>`count(*)::int` })
      .from(newsletterCampaignDeliveries)
      .where(and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId), 
        inArray(newsletterCampaignDeliveries.status, ["QUEUED", "FAILED"])
      ));
      
    await db.update(newsletterCampaigns)
      .set({ 
        status: remaining.count === 0 ? "SENT" : "FAILED", 
        sentAt: remaining.count === 0 ? new Date() : null, 
        recipientCount: sentCount, 
        scheduledAt: null,
        sendingLeaseId: null,
        sendingLeaseExpiresAt: null,
      })
      .where(eq(newsletterCampaigns.id, campaignId));
      
    return { 
      success: remaining.count === 0, 
      sentCount, 
      failedCount, 
      totalRecipients: subscribers.length, 
      ...(remaining.count === 0 ? {} : { error: "Some deliveries failed. Retry the campaign to send failed recipients." }) 
    };
  } catch (error) {
    await db.update(newsletterCampaigns)
      .set({ 
        status: "FAILED",
        sendingLeaseId: null,
        sendingLeaseExpiresAt: null,
      })
      .where(eq(newsletterCampaigns.id, campaignId));
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: error instanceof Error ? error.message : "Newsletter delivery failed." };
  }
}

export async function getDueNewsletterCampaignIds(now = new Date()) {
  const rows = await db.select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(and(eq(newsletterCampaigns.status, "SCHEDULED"), lte(newsletterCampaigns.scheduledAt, now)))
    .limit(10);
  return rows.map((row) => row.id);
}

export async function getStuckSendingCampaigns(threshold = new Date(Date.now() - SENDING_LEASE_TTL_MS)) {
  const rows = await db.select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(and(
      eq(newsletterCampaigns.status, "SENDING"),
      lte(newsletterCampaigns.sendingLeaseExpiresAt, threshold)
    ))
    .limit(20);
  return rows.map((row) => row.id);
}

export async function getFailedNewsletterCampaignIds() {
  const rows = await db.select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(and(
      eq(newsletterCampaigns.status, "FAILED"),
      lte(newsletterCampaigns.retryCount, MAX_RETRIES)
    ))
    .limit(10);
  return rows.map((row) => row.id);
}

export async function retryFailedDeliveries(campaignId: number, senderAdminUserId: string | null): Promise<CampaignDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "RESEND_API_KEY is not configured." };

  const [existing] = await db.select({ retryCount: newsletterCampaigns.retryCount })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);
  if (!existing) return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "Campaign not found." };
  if (existing.retryCount >= MAX_RETRIES) {
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: "Maximum automatic retry attempts reached." };
  }
  const previousAttempts = existing.retryCount;

  const leaseResult = await acquireSendingLease(campaignId, senderAdminUserId);
  if (!leaseResult.success) {
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: leaseResult.error };
  }
  
  const leaseId = leaseResult.leaseId!;
  
  try {
    const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaignId)).limit(1);
    if (!campaign) throw new Error("Campaign not found.");
    
    const [translations, failedDeliveries, storedAttachments] = await Promise.all([
      db.select().from(newsletterCampaignTranslations).where(eq(newsletterCampaignTranslations.campaignId, campaignId)),
      db.select({ 
        id: newsletterCampaignDeliveries.id, 
        subscriberId: newsletterCampaignDeliveries.subscriberId, 
        email: newsletterCampaignDeliveries.email, 
        locale: newsletterCampaignDeliveries.locale,
        idempotencyKey: newsletterCampaignDeliveries.idempotencyKey,
      }).from(newsletterCampaignDeliveries)
        .where(and(
          eq(newsletterCampaignDeliveries.campaignId, campaignId),
          eq(newsletterCampaignDeliveries.status, "FAILED")
        )),
      db.select().from(newsletterCampaignAttachments).where(eq(newsletterCampaignAttachments.campaignId, campaignId)),
    ]);
    
    if (!failedDeliveries.length) {
      await releaseSendingLease(campaignId, leaseId);
      const [remaining] = await db.select({ count: sql<number>`count(*)::int` })
        .from(newsletterCampaignDeliveries)
        .where(and(
          eq(newsletterCampaignDeliveries.campaignId, campaignId),
          inArray(newsletterCampaignDeliveries.status, ["QUEUED", "FAILED"])
        ));
      if (remaining.count === 0) {
        await db.update(newsletterCampaigns)
          .set({ status: "SENT", sentAt: new Date(), scheduledAt: null })
          .where(eq(newsletterCampaigns.id, campaignId));
      }
      return { success: true, sentCount: 0, failedCount: 0, totalRecipients: 0 };
    }
    
    const translationMap = new Map(translations.map((translation) => [translation.locale, translation]));
    const fallback = translationMap.get("en") ?? { subject: campaign.subject, previewText: campaign.previewText, contentHtml: campaign.contentHtml, contentText: campaign.contentText };
    const supabase = storedAttachments.length ? createSupabaseAdminClient() : null;
   
        const attachments = await Promise.all(storedAttachments.map(async (attachment) => ({
          filename: attachment.fileName,
          contentType: attachment.contentType,
          path: supabase ? await signedStorageUrl(supabase, attachment.storagePath, undefined, "document") : null,
        })));
    
    if (attachments.some((attachment) => !attachment.path)) throw new Error("Unable to access a campaign attachment.");
    
    const heartbeatInterval = setInterval(async () => {
      await renewSendingLease(campaignId, leaseId);
    }, SENDING_HEARTBEAT_INTERVAL_MS);
    
    let sentCount = 0;
    let failedCount = 0;
    
    try {
      for (let index = 0; index < failedDeliveries.length; index += BATCH_SIZE) {
        const batch = failedDeliveries.slice(index, index + BATCH_SIZE);
        const emails = batch.map((delivery) => { 
          const variant = translationMap.get(delivery.locale) ?? fallback; 
          const unsubscribeUrl = `${SITE_URL}/${delivery.locale}/newsletter/unsubscribe/${createSignedUnsubscribeToken(delivery.subscriberId)}`; 
          return { 
            from: DEFAULT_FROM_EMAIL, 
            to: [delivery.email], 
            subject: variant.subject, 
            html: addFooter(variant.contentHtml, unsubscribeUrl), 
            text: `${variant.contentText ?? variant.contentHtml}\n\nUnsubscribe: ${unsubscribeUrl}`, 
            ...(attachments.length ? { 
              attachments: attachments.map(({ filename, contentType, path }) => ({ filename, content_type: contentType, path: path! })) 
            } : {}),
            idempotencyKey: delivery.idempotencyKey,
          }; 
        });
        
        let batchSuccess = false;
        let lastError: Error | null = null;
        
        for (let retry = 0; retry < MAX_RETRIES && !batchSuccess; retry++) {
          try {
            const response = await fetch(RESEND_BATCH_URL, { 
              method: "POST", 
              headers: { 
                Authorization: `Bearer ${apiKey}`, 
                "Content-Type": "application/json" 
              }, 
              body: JSON.stringify({ emails }) 
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Resend returned ${response.status}: ${errorText}`);
            }
            
            const result = await response.json() as { data?: Array<{ id?: string }> };
            
            await bulkUpdateDeliveries(batch.map((delivery, deliveryIndex) => ({
              id: delivery.id,
              status: "SENT",
              providerMessageId: result.data?.[deliveryIndex]?.id ?? null,
              sentAt: new Date(),
            })));
            
            sentCount += batch.length;
            batchSuccess = true;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error("Delivery failed");
            if (retry < MAX_RETRIES - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
            }
          }
        }
        
        if (!batchSuccess) {
          const message = lastError?.message ?? "Delivery failed after retries";
          await bulkUpdateDeliveries(batch.map((delivery) => ({
            id: delivery.id,
            status: "FAILED",
            errorMessage: message,
          })));
          failedCount += batch.length;
        }
      }
    } finally {
      clearInterval(heartbeatInterval);
    }
    
    const [remaining] = await db.select({ count: sql<number>`count(*)::int` })
      .from(newsletterCampaignDeliveries)
      .where(and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId), 
        inArray(newsletterCampaignDeliveries.status, ["QUEUED", "FAILED"])
      ));
      
    await db.update(newsletterCampaigns)
      .set({ 
        status: remaining.count === 0 ? "SENT" : "FAILED", 
        sentAt: remaining.count === 0 ? new Date() : null, 
        recipientCount: campaign.recipientCount + sentCount,
        scheduledAt: null,
        sendingLeaseId: null,
        sendingLeaseExpiresAt: null,
        retryCount: previousAttempts + 1,
      })
      .where(eq(newsletterCampaigns.id, campaignId));
      
    return { 
      success: remaining.count === 0, 
      sentCount, 
      failedCount, 
      totalRecipients: failedDeliveries.length, 
      ...(remaining.count === 0 ? {} : { error: "Some deliveries failed. Retry the campaign to send failed recipients." }) 
    };
  } catch (error) {
    await db.update(newsletterCampaigns)
      .set({ 
        status: "FAILED",
        sendingLeaseId: null,
        sendingLeaseExpiresAt: null,
        retryCount: previousAttempts + 1,
      })
      .where(eq(newsletterCampaigns.id, campaignId));
    return { success: false, sentCount: 0, failedCount: 0, totalRecipients: 0, error: error instanceof Error ? error.message : "Newsletter delivery failed." };
  }
}
