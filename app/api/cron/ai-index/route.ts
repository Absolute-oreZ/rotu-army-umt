import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processQueuedPublicIndexJobs } from "@/lib/ai/knowledge/indexer";
import { cleanupRateLimitEntries } from "@/lib/rate-limit";
import { cleanupAITelemetry } from "@/lib/ai/core/telemetry";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (
    !secret ||
    supplied.length !== secret.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await processQueuedPublicIndexJobs();
  // Housekeeping must never mask the indexing outcome, so each cleanup is
  // isolated and reported separately.
  const rateLimitEntriesRemoved = await cleanupRateLimitEntries().catch(
    () => -1,
  );
  const telemetryCleanup = await cleanupAITelemetry().catch(() => ({
    aiRequestLogsRemoved: -1,
    aiToolExecutionLogsRemoved: -1,
  }));
  return NextResponse.json(
    { ...result, rateLimitEntriesRemoved, ...telemetryCleanup },
    { headers: { "Cache-Control": "no-store" } },
  );
}
