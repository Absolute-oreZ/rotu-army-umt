import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/rbac";
import { streamAdminQuestion } from "@/lib/ai/admin/orchestrator";
import { createAIStreamResponse } from "@/lib/ai/core/stream-events";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import { checkRateLimit } from "@/lib/rate-limit";
import { AI_ERRORS, AIProviderError } from "@/lib/ai/core/errors";
import { readBoundedJson, validateConversation } from "@/lib/ai/core/request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  let payload: unknown;
  try {
    payload = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof RangeError)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = payload as { question?: unknown; messages?: unknown };
  if (
    typeof body.question !== "string" ||
    !body.question.trim() ||
    body.question.length > AI_LIMITS.adminMessageCharacters
  ) {
    return NextResponse.json(
      { error: "Enter a question of up to 1,500 characters." },
      { status: 400 },
    );
  }
  const question = body.question.trim();
  const messages = validateConversation(body.messages, question);
  if (!messages)
    return NextResponse.json(
      { error: "Invalid conversation history." },
      { status: 400 },
    );

  try {
    const limit = await checkRateLimit(`admin:${admin.id}`, "admin_ai_chat", {
      maxRequests: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (!limit.allowed)
      return NextResponse.json(
        { error: "Please wait before asking another question." },
        { status: 429 },
      );
    return createAIStreamResponse(
      (signal) => streamAdminQuestion(admin, question, messages, signal),
      AbortSignal.any([request.signal, AbortSignal.timeout(52_000)]),
      AI_ERRORS.adminUnavailable,
    );
  } catch (error) {
    const busy =
      error instanceof AIProviderError &&
      (error.failure === "RATE_LIMITED" ||
        error.failure === "QUOTA_EXHAUSTED" ||
        error.failure === "MODEL_UNAVAILABLE" ||
        error.failure === "TIMEOUT");
    return NextResponse.json(
      { error: busy ? AI_ERRORS.adminBusy : AI_ERRORS.adminUnavailable },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
