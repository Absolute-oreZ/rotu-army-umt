import { AI_LIMITS } from "@/lib/ai/core/limits";

export type ConversationMessage = { role: "user" | "assistant"; content: string };

export function validateConversation(
  value: unknown,
  question: string,
): ConversationMessage[] | null {
  if (value === undefined) return [{ role: "user", content: question }];
  if (!Array.isArray(value) || value.length < 1 || value.length > AI_LIMITS.conversationTurns * 2)
    return null;
  const messages: ConversationMessage[] = [];
  let userTurns = 0;
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const message = item as Record<string, unknown>;
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    if (message.role !== expectedRole || typeof message.content !== "string" || !message.content.trim() || message.content.length > AI_LIMITS.conversationMessageCharacters)
      return null;
    if (message.role === "user") userTurns += 1;
    messages.push({ role: expectedRole, content: message.content.trim() });
  }
  if (messages.at(-1)?.role !== "user" || messages.at(-1)?.content !== question || userTurns > AI_LIMITS.conversationTurns)
    return null;
  return messages;
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|\s*$)/iu.test(request.headers.get("content-type") ?? ""))
    throw new SyntaxError("Expected JSON request body");
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > AI_LIMITS.maxRequestBytes)
    throw new RangeError("Request body too large");
  if (!request.body) throw new SyntaxError("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > AI_LIMITS.maxRequestBytes) {
        await reader.cancel();
        throw new RangeError("Request body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
}
