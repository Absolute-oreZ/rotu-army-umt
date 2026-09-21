import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimitEntries } from "@/db/schema";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Checks and increments rate limit for an identifier + action.
 * Uses a sliding window with fixed buckets for simplicity.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const expiresAt = new Date(now.getTime() + windowMs);

  // Try to find existing entry in current window
  const [existing] = await db
    .select()
    .from(rateLimitEntries)
    .where(
      and(
        eq(rateLimitEntries.identifier, identifier),
        eq(rateLimitEntries.action, action),
        sql`${rateLimitEntries.windowStart} >= ${windowStart.toISOString()}`,
      ),
    )
    .limit(1);

  if (existing) {
    const newCount = existing.count + 1;
    const allowed = newCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - newCount);

    if (allowed) {
      await db
        .update(rateLimitEntries)
        .set({ count: newCount })
        .where(eq(rateLimitEntries.id, existing.id));
    }

    return {
      allowed,
      remaining,
      resetTime: new Date(existing.windowStart.getTime() + windowMs).getTime(),
    };
  }

  // Create new entry
  await db.insert(rateLimitEntries).values({
    identifier,
    action,
    count: 1,
    windowStart: now,
    expiresAt,
  });

  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetTime: expiresAt.getTime(),
  };
}

/**
 * Cleans up expired rate limit entries.
 * Should be run periodically (e.g., via cron).
 */
export async function cleanupRateLimitEntries(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(rateLimitEntries)
    .where(sql`${rateLimitEntries.expiresAt} < ${now.toISOString()}`)
    .returning({ id: rateLimitEntries.id });

  return result.length;
}

/**
 * Gets the client IP from request headers.
 * Falls back to a default if not available.
 */
export function getClientIp(headers: Headers): string {
  // Check common proxy headers
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Default fallback (should not happen in production)
  return "unknown";
}