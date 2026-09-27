import "server-only";
import { randomUUID } from "node:crypto";
import { lt } from "drizzle-orm";
import { db } from "@/db";
import { aiRequestLogs, aiToolExecutionLogs } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";

// describeAIError lives in errors.ts so it can be unit tested without a database.
export { describeAIError } from "@/lib/ai/core/errors";

export type AIRequestTelemetry = {
  requestId: string;
  assistant: "public" | "admin";
  locale?: Locale | null;
  intent?: string | null;
  retrievalMs: number;
  llmMs: number;
  sourceCount: number;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  success: boolean;
  failureReason?: string | null;
};

export function newAIRequestId() {
  return randomUUID();
}

export async function cleanupAITelemetry(retentionDays = 90) {
  const cutoff = new Date(
    Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000,
  );
  const [requests, tools] = await Promise.all([
    db
      .delete(aiRequestLogs)
      .where(lt(aiRequestLogs.createdAt, cutoff))
      .returning({ id: aiRequestLogs.id }),
    db
      .delete(aiToolExecutionLogs)
      .where(lt(aiToolExecutionLogs.createdAt, cutoff))
      .returning({ id: aiToolExecutionLogs.id }),
  ]);
  return {
    aiRequestLogsRemoved: requests.length,
    aiToolExecutionLogsRemoved: tools.length,
  };
}

export async function logAIRequest(input: AIRequestTelemetry) {
  try {
    await db.insert(aiRequestLogs).values({
      ...input,
      locale: input.locale ?? null,
      intent: input.intent ?? null,
      failureReason: input.failureReason ?? null,
    });
  } catch {
    // Telemetry failure must not change assistant behavior.
  }
}
