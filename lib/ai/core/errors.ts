export const AI_ERRORS = {
  publicUnavailable:
    "The assistant is temporarily unavailable. Please try again later.",
  publicBusy:
    "The assistant is receiving very many questions right now. Please try again in a moment.",
  adminUnavailable: "The admin assistant is temporarily unavailable.",
  adminBusy:
    "The admin assistant is receiving very many questions right now. Please try again in a moment.",
  invalidStructuredOutput: "AI provider returned malformed structured output",
  timeout: "The request took too long. Please try again.",
  internal: "The assistant could not complete the request.",
} as const;

export type AIProviderFailure =
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "UNAUTHORIZED"
  | "MODEL_UNAVAILABLE"
  | "TIMEOUT"
  | "INVALID_RESPONSE";

export class AIProviderError extends Error {
  readonly failure: AIProviderFailure;
  readonly status: number | null;

  constructor(
    failure: AIProviderFailure,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "AIProviderError";
    this.failure = failure;
    this.status = status;
  }
}

export function isTransientProviderFailure(error: unknown) {
  return (
    error instanceof AIProviderError &&
    (error.failure === "RATE_LIMITED" ||
      error.failure === "MODEL_UNAVAILABLE" ||
      error.failure === "TIMEOUT")
  );
}

// Telemetry records a bounded category, never raw exception text, because the
// provider message can echo request metadata or credentials.
export function describeAIError(error: unknown) {
  if (error instanceof AIProviderError)
    return `${error.failure}${error.status ? `:${error.status}` : ""}`;
  if (
    error instanceof Error &&
    /malformed structured output|invalid ai (answer|citation|metadata)/iu.test(
      error.message,
    )
  )
    return "INVALID_RESPONSE";
  return "INTERNAL";
}

export function safeAIErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AIProviderError)) return AI_ERRORS.internal;
  switch (error.failure) {
    case "RATE_LIMITED":
    case "QUOTA_EXHAUSTED":
      return "The assistant is temporarily busy. Please try again.";
    case "TIMEOUT":
      return AI_ERRORS.timeout;
    case "MODEL_UNAVAILABLE":
      return fallback;
    case "UNAUTHORIZED":
    case "INVALID_RESPONSE":
      return AI_ERRORS.internal;
    default:
      return AI_ERRORS.internal;
  }
}
