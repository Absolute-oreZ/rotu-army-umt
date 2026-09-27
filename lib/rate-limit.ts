import { sql } from "drizzle-orm";
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
 * Atomically checks and increments a rate limit counter for an identifier + action.
 *
 * Uses an upsert so that concurrent requests do not bypass maxRequests by reading
 * the same count before either update is applied.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: Partial<RateLimitConfig> = {},
): Promise<RateLimitResult> {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = new Date();
  const windowStart = now;
  const expiresAt = new Date(now.getTime() + windowMs);

  const [row] = await db
    .insert(rateLimitEntries)
    .values({
      identifier,
      action,
      count: 1,
      windowStart,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [rateLimitEntries.identifier, rateLimitEntries.action],
      set: {
        count: sql`CASE WHEN ${rateLimitEntries.expiresAt} <= ${now} THEN 1 ELSE ${rateLimitEntries.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimitEntries.expiresAt} <= ${now} THEN ${windowStart} ELSE ${rateLimitEntries.windowStart} END`,
        expiresAt: sql`CASE WHEN ${rateLimitEntries.expiresAt} <= ${now} THEN ${expiresAt} ELSE ${rateLimitEntries.expiresAt} END`,
      },
    })
    .returning({
      count: rateLimitEntries.count,
      windowStart: rateLimitEntries.windowStart,
    });

  if (!row) {
    // Should only happen if the unique constraint is changed; fail closed.
    return {
      allowed: false,
      remaining: 0,
      resetTime: expiresAt.getTime(),
    };
  }

  const count = row.count;
  const allowed = count <= maxRequests;
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed,
    remaining,
    resetTime: new Date(row.windowStart.getTime() + windowMs).getTime(),
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
  // Production traffic terminates at Vercel, which overwrites x-forwarded-for
  // with the connecting client IP. Do not deploy this assumption behind an
  // additional proxy unless that proxy's client-IP header is authenticated.
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
