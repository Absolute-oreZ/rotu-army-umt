import type { AIStreamEvent } from "@/lib/ai/core/stream-events";

export async function readAssistantEventStream(
  response: Response,
  onEvent: (event: AIStreamEvent) => void,
) {
  if (!response.body) throw new Error("AI stream body is unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder
        .decode(value, { stream: !done })
        .replace(/\r\n/gu, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (data) {
          let event: AIStreamEvent;
          try {
            event = JSON.parse(data) as AIStreamEvent;
          } catch {
            throw new Error("AI stream event was invalid");
          }
          onEvent(event);
          if (event.type === "done") completed = true;
          if (event.type === "error") throw new Error(event.message);
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  if (!completed) throw new Error("AI stream ended before completion");
}
