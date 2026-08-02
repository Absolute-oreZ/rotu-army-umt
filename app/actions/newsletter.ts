"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import {
  createNewsletterTokens,
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  sendNewsletterConfirmationEmail,
} from "@/lib/newsletter";

export async function subscribeToNewsletter(formData: FormData) {
  if (typeof formData.get("website") === "string" && String(formData.get("website")).trim()) return { error: "Unable to subscribe at this time." };
  const rawEmail = formData.get("email");
  const rawLocale = formData.get("locale");
  const preferredLocale: Locale =
    rawLocale === "en" ||
    rawLocale === "ms" ||
    rawLocale === "zh" ||
    rawLocale === "ta"
      ? rawLocale
      : "en";

  const dictionary = await getDictionary(preferredLocale);
  const { contactPage: d, newsletter: newsletterCopy } = dictionary;

  const email = typeof rawEmail === "string" ? normalizeNewsletterEmail(rawEmail) : "";

  if (!email) {
    return { error: d.newsletterRequiredError };
  }

  if (!isValidNewsletterEmail(email)) {
    return { error: d.newsletterInvalidEmailError };
  }

  let insertedSubscriberId: string | null = null;

  try {
    const existingSubscriberRows = await db
      .select({
        id: newsletterSubscribers.id,
        status: newsletterSubscribers.status,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    const existingSubscriber = existingSubscriberRows[0] ?? null;
    const tokens = createNewsletterTokens();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const confirmationUrl = new URL(
      `/${preferredLocale}/newsletter/confirm/${tokens.confirmationToken}`,
      origin,
    ).toString();
    const unsubscribeUrl = new URL(
      `/${preferredLocale}/newsletter/unsubscribe/${tokens.unsubscribeToken}`,
      origin,
    ).toString();

    if (existingSubscriber?.status === "ACTIVE") {
      return { error: d.newsletterDuplicateError };
    }

    const previousSubscriber = existingSubscriber ? await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, existingSubscriber.id)).limit(1).then((rows) => rows[0]) : null;
    if (previousSubscriber?.status === "PENDING" && previousSubscriber.updatedAt.getTime() > Date.now() - 15 * 60 * 1000) return { error: d.newsletterSendFailedError };
    if (existingSubscriber) {
      await db
        .update(newsletterSubscribers)
        .set({
          confirmationTokenHash: tokens.confirmationTokenHash,
          confirmedAt: null,
          preferredLocale,
          status: "PENDING",
          unsubscribeTokenHash: tokens.unsubscribeTokenHash,
          unsubscribedAt: null,
        })
        .where(eq(newsletterSubscribers.id, existingSubscriber.id));
    } else {
      const insertedRows = await db
        .insert(newsletterSubscribers)
        .values({
          email,
          preferredLocale,
          status: "PENDING",
          confirmationTokenHash: tokens.confirmationTokenHash,
          unsubscribeTokenHash: tokens.unsubscribeTokenHash,
        })
        .returning({
          id: newsletterSubscribers.id,
        });

      insertedSubscriberId = insertedRows[0]?.id ?? null;
    }

    try {
      await sendNewsletterConfirmationEmail({
        confirmationUrl,
        copy: newsletterCopy,
        to: email,
        unsubscribeUrl,
      });
    } catch (error) {
      console.error("Newsletter confirmation email failed:", error);

      if (insertedSubscriberId) {
        await db
          .delete(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, insertedSubscriberId));
      }
      else if (previousSubscriber) {
        await db.update(newsletterSubscribers).set({ status: previousSubscriber.status, confirmedAt: previousSubscriber.confirmedAt, confirmationTokenHash: previousSubscriber.confirmationTokenHash, unsubscribeTokenHash: previousSubscriber.unsubscribeTokenHash, unsubscribedAt: previousSubscriber.unsubscribedAt, preferredLocale: previousSubscriber.preferredLocale }).where(eq(newsletterSubscribers.id, previousSubscriber.id));
      }

      return { error: d.newsletterSendFailedError };
    }

    return { success: true };
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    return { error: d.newsletterErrorMessage };
  }
}
