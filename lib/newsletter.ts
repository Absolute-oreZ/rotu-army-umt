import "server-only";

import crypto from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomDelay() {
  const min = 150;
  const max = 300;
  return sleep(min + Math.floor(Math.random() * (max - min + 1)));
}

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "ROTU Army UMT <onboarding@resend.dev>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterEmailCopy = {
  emailSubject: string;
  emailGreeting: string;
  emailIntro: string;
  emailButton: string;
  emailFallback: string;
  emailFooter: string;
  emailUnsubscribeLabel: string;
};

export type NewsletterConfirmationStatus = "confirmed" | "already_confirmed" | "invalid";
export type NewsletterUnsubscribeStatus = "unsubscribed" | "already_unsubscribed" | "invalid";

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

export function hashNewsletterToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createNewsletterTokens() {
  const confirmationToken = crypto.randomBytes(32).toString("hex");
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  return {
    confirmationToken,
    confirmationTokenHash: hashNewsletterToken(confirmationToken),
    unsubscribeToken,
    unsubscribeTokenHash: hashNewsletterToken(unsubscribeToken),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildNewsletterEmailHtml({
  copy,
  confirmationUrl,
  unsubscribeUrl,
}: {
  copy: NewsletterEmailCopy;
  confirmationUrl: string;
  unsubscribeUrl: string;
}) {
  return `<!doctype html>
          <html lang="en">
            <body style="margin:0;padding:0;background:#0f1115;font-family:Arial,sans-serif;color:#e5e7eb;">
              <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
                <div style="border:1px solid rgba(148,163,184,.22);border-radius:20px;background:#111827;padding:32px;">
                  <p style="margin:0 0 16px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#94a3b8;">
                    ROTU Army UMT
                  </p>
                  <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f8fafc;">
                    ${escapeHtml(copy.emailSubject)}
                  </h1>
                  <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:#cbd5e1;">
                    ${escapeHtml(copy.emailGreeting)}
                  </p>
                  <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#cbd5e1;">
                    ${escapeHtml(copy.emailIntro)}
                  </p>
                  <p style="margin:0 0 24px;">
                    <a href="${confirmationUrl}" style="display:inline-block;border-radius:999px;background:#f8fafc;color:#0f1115;padding:12px 20px;font-size:13px;font-weight:700;letter-spacing:.14em;text-decoration:none;text-transform:uppercase;">
                      ${escapeHtml(copy.emailButton)}
                    </a>
                  </p>
                  <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">
                    ${escapeHtml(copy.emailFallback)}
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;color:#cbd5e1;">
                    <a href="${confirmationUrl}" style="color:#93c5fd;text-decoration:underline;">${confirmationUrl}</a>
                  </p>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#94a3b8;">
                    ${escapeHtml(copy.emailFooter)}
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">
                    <a href="${unsubscribeUrl}" style="color:#93c5fd;text-decoration:underline;">${escapeHtml(copy.emailUnsubscribeLabel)}</a>
                  </p>
                </div>
              </div>
            </body>
          </html>`;
}

function buildNewsletterEmailText({
  copy,
  confirmationUrl,
  unsubscribeUrl,
}: {
  copy: NewsletterEmailCopy;
  confirmationUrl: string;
  unsubscribeUrl: string;
}) {
  return [
    copy.emailSubject,
    "",
    copy.emailGreeting,
    copy.emailIntro,
    "",
    copy.emailButton,
    confirmationUrl,
    "",
    copy.emailFallback,
    confirmationUrl,
    "",
    copy.emailFooter,
    copy.emailUnsubscribeLabel,
    unsubscribeUrl,
  ].join("\n");
}

export async function sendNewsletterConfirmationEmail({
  to,
  copy,
  confirmationUrl,
  unsubscribeUrl,
}: {
  to: string;
  copy: NewsletterEmailCopy;
  confirmationUrl: string;
  unsubscribeUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: copy.emailSubject,
      html: buildNewsletterEmailHtml({ copy, confirmationUrl, unsubscribeUrl }),
      text: buildNewsletterEmailText({ copy, confirmationUrl, unsubscribeUrl }),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to send newsletter confirmation email (${response.status}): ${details}`,
    );
  }
}

export async function confirmNewsletterSubscription(token: string): Promise<NewsletterConfirmationStatus> {
  const tokenHash = hashNewsletterToken(token);

  const [subscriber] = await db
    .select({
      confirmedAt: newsletterSubscribers.confirmedAt,
      id: newsletterSubscribers.id,
      status: newsletterSubscribers.status,
    })
    .from(newsletterSubscribers)
    .where(
      or(
        eq(newsletterSubscribers.confirmationTokenHash, tokenHash),
      ),
    )
    .limit(1);

  if (!subscriber) {
    // Perform a timing-safe fake compare and randomized delay to reduce timing
    // side-channel leakage for non-existing tokens.
    try {
      const tokenBuf = Buffer.from(tokenHash, "hex");
      const fake = crypto.randomBytes(tokenBuf.length);
      // timingSafeEqual will throw if buffers length mismatch, guarded above
      crypto.timingSafeEqual(tokenBuf, fake);
    } catch {
      // ignore
    }
    await randomDelay();
    return "invalid";
  }

  if (subscriber.status === "ACTIVE" || subscriber.confirmedAt) {
    // Clear the confirmation token to prevent re-use and enumeration.
    await db
      .update(newsletterSubscribers)
      .set({ confirmationTokenHash: null })
      .where(eq(newsletterSubscribers.id, subscriber.id));
    await randomDelay();
    return "already_confirmed";
  }

  if (subscriber.status !== "PENDING") {
    await db
      .update(newsletterSubscribers)
      .set({ confirmationTokenHash: null })
      .where(eq(newsletterSubscribers.id, subscriber.id));
    await randomDelay();
    return "invalid";
  }

  await db
    .update(newsletterSubscribers)
    .set({
      confirmedAt: new Date(),
      status: "ACTIVE",
      confirmationTokenHash: null,
    })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  await randomDelay();

  return "confirmed";
}

export async function unsubscribeNewsletterSubscription(token: string): Promise<NewsletterUnsubscribeStatus> {
  const tokenHash = hashNewsletterToken(token);

  const [subscriber] = await db
    .select({
      id: newsletterSubscribers.id,
      status: newsletterSubscribers.status,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt,
    })
    .from(newsletterSubscribers)
    .where(
      or(
        eq(newsletterSubscribers.unsubscribeTokenHash, tokenHash),
      ),
    )
    .limit(1);

  if (!subscriber) {
    try {
      const tokenBuf = Buffer.from(tokenHash, "hex");
      const fake = crypto.randomBytes(tokenBuf.length);
      crypto.timingSafeEqual(tokenBuf, fake);
    } catch {
      // ignore
    }
    await randomDelay();
    return "invalid";
  }

  if (subscriber.status === "UNSUBSCRIBED" || subscriber.unsubscribedAt) {
    // Clear token hash to prevent re-use and enumeration.
    await db
      .update(newsletterSubscribers)
      .set({ unsubscribeTokenHash: null })
      .where(eq(newsletterSubscribers.id, subscriber.id));
    await randomDelay();
    return "already_unsubscribed";
  }

  await db
    .update(newsletterSubscribers)
    .set({
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      unsubscribeTokenHash: null,
    })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  return "unsubscribed";
}
