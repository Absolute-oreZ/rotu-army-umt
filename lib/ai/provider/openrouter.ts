import "server-only";
import type { AIProvider, ChatInput, ChatResult } from "@/lib/ai/core/provider";
import { parseStructuredResponse } from "@/lib/ai/core/structured-output";
import {
  AI_ERRORS,
  AIProviderError,
  isTransientProviderFailure,
} from "@/lib/ai/core/errors";
import { requireModelCapabilities } from "@/lib/ai/provider/model-capabilities";
import { AI_LIMITS } from "@/lib/ai/core/limits";

const endpoint = "https://openrouter.ai/api/v1";
// Non-streaming calls (embeddings, plain chat) must return quickly.
const REQUEST_TIMEOUT_MS = 18_000;
// Streaming must also cover a full generation plus an OpenRouter web-search
// round-trip, so it gets its own budget. The route's 52s request deadline still
// bounds the total, and this value stays below it with margin.
const STREAM_TIMEOUT_MS = 45_000;
const RETRY_BASE_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 1_200;

function readConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey)
    throw new AIProviderError("UNAUTHORIZED", "AI provider is not configured");
  return { apiKey };
}

function classifyStatus(status: number): AIProviderError {
  if (status === 429) {
    return new AIProviderError(
      "RATE_LIMITED",
      `AI provider rate limited the request (${status})`,
      status,
    );
  }
  if (status === 402) {
    return new AIProviderError(
      "QUOTA_EXHAUSTED",
      `AI provider credit exhausted (${status})`,
      status,
    );
  }
  if (status === 401 || status === 403) {
    return new AIProviderError(
      "UNAUTHORIZED",
      `AI provider rejected the API key (${status})`,
      status,
    );
  }
  if (status === 404) {
    return new AIProviderError(
      "MODEL_UNAVAILABLE",
      `AI provider does not serve the configured model (${status})`,
      status,
    );
  }
  return new AIProviderError(
    "MODEL_UNAVAILABLE",
    `AI provider request failed (${status})`,
    status,
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postOnce(
  path: string,
  body: unknown,
  apiKey: string,
  signal?: AbortSignal,
) {
  let response: Response;
  try {
    response = await fetch(`${endpoint}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "ROTU Army UMT",
      },
      body: JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
        : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new AIProviderError("TIMEOUT", "AI provider request timed out");
    }
    throw new AIProviderError(
      "MODEL_UNAVAILABLE",
      "AI provider is unreachable",
    );
  }

  if (!response.ok) {
    // Provider response bodies can include request metadata. Keep them out of app logs and UI.
    throw classifyStatus(response.status);
  }

  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new AIProviderError(
      "INVALID_RESPONSE",
      "AI provider returned a malformed response body",
    );
  }
}

async function post(path: string, body: unknown, signal?: AbortSignal) {
  const { apiKey } = readConfig();
  let lastError: unknown;
  for (
    let attempt = 1;
    attempt <= AI_LIMITS.providerMaxAttempts;
    attempt += 1
  ) {
    try {
      return await postOnce(path, body, apiKey, signal);
    } catch (error) {
      lastError = error;
      if (
        attempt === AI_LIMITS.providerMaxAttempts ||
        !isTransientProviderFailure(error)
      )
        throw error;
      await sleep(
        Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS),
      );
    }
  }
  throw lastError;
}

function readCitations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((annotation) => {
    const item = annotation as {
      type?: string;
      url_citation?: { url?: unknown; title?: unknown; content?: unknown };
    };
    const citation = item.url_citation;
    if (item.type !== "url_citation" || typeof citation?.url !== "string")
      return [];
    return [
      {
        url: citation.url,
        title:
          typeof citation.title === "string" ? citation.title : citation.url,
        content:
          typeof citation.content === "string"
            ? citation.content.slice(0, 1200)
            : "",
      },
    ];
  });
}

function toolsFor(input: ChatInput) {
  if (!input.webSearch) return undefined;
  requireModelCapabilities(input.model, ["supportsToolCalling"]);
  return [
    {
      type: "openrouter:web_search",
      parameters: {
        allowed_domains: input.webSearch.allowedDomains,
        max_results: input.webSearch.maxResults,
        max_total_results: input.webSearch.maxTotalResults,
        search_context_size: "medium",
      },
    },
  ];
}

function partialJsonStringField(source: string, field: string) {
  const marker = new RegExp('"' + field + '"\\s*:\\s*"', "u").exec(source);
  if (!marker) return "";
  const start = marker.index + marker[0].length;
  let output = "";
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') break;
    if (character !== "\\") {
      output += character;
      continue;
    }
    const escaped = source[index + 1];
    if (!escaped) break;
    const simple: Record<string, string> = {
      '"': '"',
      "\\": "\\",
      "/": "/",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
    };
    if (escaped in simple) {
      output += simple[escaped];
      index += 1;
      continue;
    }
    if (
      escaped !== "u" ||
      !/^[\da-f]{4}$/iu.test(source.slice(index + 2, index + 6))
    )
      break;
    output += String.fromCharCode(
      Number.parseInt(source.slice(index + 2, index + 6), 16),
    );
    index += 5;
  }
  return output;
}

async function* readSse(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason;
      const { done, value } = await reader.read();
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(
        /\r\n/gu,
        "\n",
      );
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = frame
          .split(/\r?\n/u)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (data && data !== "[DONE]") {
          try {
            yield JSON.parse(data) as Record<string, unknown>;
          } catch {
            throw new AIProviderError(
              "INVALID_RESPONSE",
              "AI provider returned a malformed stream event",
            );
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  } finally {
    if (signal?.aborted) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function* streamStructuredOutput<T>(
  input: ChatInput,
  validate: (value: unknown) => T,
) {
  requireModelCapabilities(input.model, [
    "supportsStructuredOutput",
    "supportsStreaming",
  ]);
  const { apiKey } = readConfig();
  let response: Response;
  try {
    response = await fetch(endpoint + "/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "ROTU Army UMT",
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        max_tokens: input.maxTokens ?? 700,
        temperature: input.temperature ?? 0.1,
        response_format: { type: "json_object" },
        stream: true,
        stream_options: { include_usage: true },
        ...(toolsFor(input) ? { tools: toolsFor(input) } : {}),
      }),
      signal: input.signal
        ? AbortSignal.any([
            input.signal,
            AbortSignal.timeout(STREAM_TIMEOUT_MS),
          ])
        : AbortSignal.timeout(STREAM_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (input.signal?.aborted) throw error;
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      throw new AIProviderError("TIMEOUT", "AI provider request timed out");
    throw new AIProviderError(
      "MODEL_UNAVAILABLE",
      "AI provider is unreachable",
    );
  }
  if (!response.ok) throw classifyStatus(response.status);
  if (!response.body)
    throw new AIProviderError(
      "INVALID_RESPONSE",
      "AI provider returned an empty stream",
    );

  let raw = "";
  let emitted = "";
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  const webCitations: ChatResult["webCitations"] = [];
  for await (const event of readSse(response.body, input.signal)) {
    const usage = event.usage as
      { prompt_tokens?: number; completion_tokens?: number } | undefined;
    promptTokens = usage?.prompt_tokens ?? promptTokens;
    completionTokens = usage?.completion_tokens ?? completionTokens;
    const choices = event.choices;
    if (!Array.isArray(choices)) continue;
    for (const value of choices) {
      const choice = value as {
        delta?: { content?: unknown; annotations?: unknown };
        message?: { annotations?: unknown };
      };
      const delta = choice.delta?.content;
      if (typeof delta === "string") {
        raw += delta;
        const answer = partialJsonStringField(raw, "answer");
        if (answer.startsWith(emitted) && answer.length > emitted.length) {
          yield { type: "delta", text: answer.slice(emitted.length) } as const;
          emitted = answer;
        }
      }
      webCitations.push(
        ...readCitations(choice.delta?.annotations),
        ...readCitations(choice.message?.annotations),
      );
    }
  }
  const output = parseStructuredResponse(raw, validate);
  yield {
    type: "result",
    output,
    promptTokens,
    completionTokens,
    webCitations,
  } as const;
}

function readMessage(payload: Record<string, unknown>): ChatResult {
  const choices = payload.choices;
  if (!Array.isArray(choices))
    throw new Error("AI provider returned an invalid response");
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  if (typeof first?.message?.content !== "string")
    throw new Error("AI provider returned an empty response");
  const usage = payload.usage as
    { prompt_tokens?: number; completion_tokens?: number } | undefined;
  const annotations =
    (first.message as { annotations?: unknown[] }).annotations ?? [];
  const webCitations = annotations.flatMap((annotation) => {
    const item = annotation as {
      type?: string;
      url_citation?: { url?: unknown; title?: unknown; content?: unknown };
    };
    const citation = item.url_citation;
    if (item.type !== "url_citation" || typeof citation?.url !== "string")
      return [];
    return [
      {
        url: citation.url,
        title:
          typeof citation.title === "string" ? citation.title : citation.url,
        content:
          typeof citation.content === "string"
            ? citation.content.slice(0, 1200)
            : "",
      },
    ];
  });
  return {
    content: first.message.content,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    webCitations,
  };
}

export const openRouterProvider: AIProvider = {
  async generateChat(input: ChatInput) {
    if (input.webSearch)
      requireModelCapabilities(input.model, ["supportsToolCalling"]);
    const payload = await post(
      "/chat/completions",
      {
        model: input.model,
        messages: input.messages,
        max_tokens: input.maxTokens ?? 700,
        temperature: input.temperature ?? 0.2,
        stream: false,
        ...(toolsFor(input) ? { tools: toolsFor(input) } : {}),
      },
      input.signal,
    );
    return readMessage(payload);
  },

  async generateStructuredOutput<T>(
    input: ChatInput,
    validate: (value: unknown) => T,
  ) {
    requireModelCapabilities(input.model, ["supportsStructuredOutput"]);
    for (let attempt = 0; attempt < 2; attempt++) {
      const payload = await post(
        "/chat/completions",
        {
          model: input.model,
          messages: input.messages,
          max_tokens: input.maxTokens ?? 700,
          temperature: input.temperature ?? 0.1,
          response_format: { type: "json_object" },
          stream: false,
          ...(toolsFor(input) ? { tools: toolsFor(input) } : {}),
        },
        input.signal,
      );
      const result = readMessage(payload);
      let output: T;
      try {
        output = parseStructuredResponse(result.content, validate);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.message !== AI_ERRORS.invalidStructuredOutput
        )
          throw error;
        if (attempt === 0) continue;
        throw new Error(AI_ERRORS.invalidStructuredOutput);
      }
      return {
        output,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        webCitations: result.webCitations,
      };
    }
    throw new Error(AI_ERRORS.invalidStructuredOutput);
  },

  streamStructuredOutput<T>(input: ChatInput, validate: (value: unknown) => T) {
    return streamStructuredOutput(input, validate);
  },

  async generateEmbedding(texts: string[], inputType: "query" | "document") {
    if (texts.length === 0) return [];
    const payload = await post("/embeddings", {
      model: process.env.AI_EMBEDDING_MODEL?.trim() || "baai/bge-m3",
      input: texts,
      dimensions: 1024,
      input_type: inputType,
    });
    const data = payload.data;
    if (!Array.isArray(data) || data.length !== texts.length) {
      throw new Error("AI embedding provider returned an invalid response");
    }
    return data.map((entry) => {
      const embedding = (entry as { embedding?: unknown }).embedding;
      if (
        !Array.isArray(embedding) ||
        embedding.length !== 1024 ||
        !embedding.every(Number.isFinite)
      ) {
        throw new Error("AI embedding provider returned an invalid vector");
      }
      return embedding as number[];
    });
  },
};

export function getPublicAIModel(requireWebSearch = false) {
  const model = process.env.AI_PUBLIC_MODEL?.trim();
  if (!model) throw new Error("Public AI model is not configured");
  requireModelCapabilities(model, [
    "supportsStructuredOutput",
    "supportsStreaming",
    ...(requireWebSearch ? ["supportsToolCalling" as const] : []),
  ]);
  return model;
}

export function getAdminAIModel() {
  const model = process.env.AI_ADMIN_MODEL?.trim();
  if (!model) throw new Error("Admin AI model is not configured");
  requireModelCapabilities(model, [
    "supportsStructuredOutput",
    "supportsStreaming",
  ]);
  return model;
}
