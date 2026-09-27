import type { PublicSource } from "@/lib/ai/core/types";
import { safeAIErrorMessage } from "@/lib/ai/core/errors";

export type AIStreamEvent =
  | { type: "start" }
  | { type: "delta"; text: string }
  | { type: "replace"; text: string }
  | { type: "sources"; sources: PublicSource[]; crossLanguage?: boolean }
  | { type: "metadata"; scopeLabel: string; toolName: string | null }
  | { type: "done" }
  | { type: "error"; message: string };

export function encodeAIStreamEvent(event: AIStreamEvent) {
  return "data: " + JSON.stringify(event) + "\n\n";
}

export function createAIStreamResponse(
  eventsForRequest: (signal: AbortSignal) => AsyncIterable<AIStreamEvent>,
  requestSignal: AbortSignal,
  unavailableMessage: string,
) {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let iterator: AsyncIterator<AIStreamEvent> | null = null;
  const abortFromRequest = () => abortController.abort(requestSignal.reason);
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      if (requestSignal.aborted) abortFromRequest();
      else
        requestSignal.addEventListener("abort", abortFromRequest, {
          once: true,
        });
      iterator = eventsForRequest(abortController.signal)[
        Symbol.asyncIterator
      ]();
      void (async () => {
        try {
          while (!abortController.signal.aborted) {
            const next = await iterator!.next();
            if (next.done) break;
            streamController.enqueue(
              encoder.encode(encodeAIStreamEvent(next.value)),
            );
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            streamController.enqueue(
              encoder.encode(
                encodeAIStreamEvent({
                  type: "error",
                  message: safeAIErrorMessage(error, unavailableMessage),
                }),
              ),
            );
          }
        } finally {
          try {
            streamController.close();
          } catch {}
          requestSignal.removeEventListener("abort", abortFromRequest);
          if (abortController.signal.aborted) await iterator?.return?.();
        }
      })();
    },
    async cancel() {
      abortController.abort();
      await iterator?.return?.();
    },
  });
  return new Response(body, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
