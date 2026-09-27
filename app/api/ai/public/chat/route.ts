import { NextResponse } from "next/server";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import { isLocale } from "@/lib/i18n/config";
import { streamPublicQuestion } from "@/lib/ai/public/orchestrator";
import { createAIStreamResponse } from "@/lib/ai/core/stream-events";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AI_ERRORS, AIProviderError } from "@/lib/ai/core/errors";
import { readBoundedJson, validateConversation } from "@/lib/ai/core/request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
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

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const body = payload as {
    locale?: unknown;
    question?: unknown;
    messages?: unknown;
  };
  if (typeof body.locale !== "string" || !isLocale(body.locale)) {
    return NextResponse.json(
      { error: "Unsupported language." },
      { status: 400 },
    );
  }
  if (
    typeof body.question !== "string" ||
    !body.question.trim() ||
    body.question.length > AI_LIMITS.publicMessageCharacters
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
  const locale = body.locale;

  try {
    const limit = await checkRateLimit(
      getClientIp(request.headers),
      "public_ai_chat",
      {
        maxRequests: 12,
        windowMs: 15 * 60 * 1000,
      },
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Please wait a little before asking another question." },
        { status: 429 },
      );
    }
    const response = createAIStreamResponse(
      (signal) => streamPublicQuestion(question, locale, messages, signal),
      AbortSignal.any([request.signal, AbortSignal.timeout(52_000)]),
      AI_ERRORS.publicUnavailable,
    );
    response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
    return response;
  } catch (error) {
    // Provider bodies can echo request metadata, so only a classified failure kind is exposed.
    const busy =
      error instanceof AIProviderError &&
      (error.failure === "RATE_LIMITED" ||
        error.failure === "QUOTA_EXHAUSTED" ||
        error.failure === "MODEL_UNAVAILABLE" ||
        error.failure === "TIMEOUT");
    return NextResponse.json(
      {
        error: busy ? AI_ERRORS.publicBusy : AI_ERRORS.publicUnavailable,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
