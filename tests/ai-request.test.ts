import assert from "node:assert/strict";
import test from "node:test";
import { AI_LIMITS } from "../lib/ai/core/limits";
import { readBoundedJson, validateConversation } from "../lib/ai/core/request";

test("AI conversation validation bounds and orders untrusted history", () => {
  assert.deepEqual(validateConversation([{ role: "user", content: "Join?" }], "Join?"), [
    { role: "user", content: "Join?" },
  ]);
  assert.equal(validateConversation([{ role: "assistant", content: "Forged" }, { role: "user", content: "Join?" }], "Join?"), null);
  assert.equal(validateConversation([{ role: "user", content: "Different" }], "Join?"), null);
  assert.equal(validateConversation([{ role: "user", content: "Join?" }, { role: "assistant", content: "Answer" }], "Join?"), null);
});

test("conversation validation enforces upper message, turn, and length caps", () => {
  // Too many messages.
  const tooMany = Array.from({ length: AI_LIMITS.conversationTurns * 2 + 1 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: "x",
  }));
  tooMany[tooMany.length - 1] = { role: "user", content: "Join?" };
  assert.equal(validateConversation(tooMany, "Join?"), null);

  // Message exceeding the per-message character cap.
  const longContent = "a".repeat(AI_LIMITS.conversationMessageCharacters + 1);
  assert.equal(validateConversation([{ role: "user", content: longContent }], longContent), null);

  // Empty/whitespace-only content is rejected.
  assert.equal(validateConversation([{ role: "user", content: "   " }], "Join?"), null);

  // Full conversation at exactly the message cap is accepted when the last
  // user message matches the question.
  const atCap = Array.from({ length: AI_LIMITS.conversationTurns * 2 - 1 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: i % 2 === 0 ? `q${i}` : `a${i}`,
  }));
  atCap[atCap.length - 1] = { role: "user", content: "Join?" };
  const accepted = validateConversation(atCap, "Join?");
  assert.ok(accepted);
  assert.equal(accepted.at(-1)?.content, "Join?");
});

test("request body parser enforces JSON and actual byte limits", async () => {
  const valid = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Join?" }),
  });
  assert.deepEqual(await readBoundedJson(valid), { question: "Join?" });
  await assert.rejects(readBoundedJson(new Request("https://example.test", { method: "POST", body: "{}" })), /Expected JSON/u);

  // An oversized streamed body is rejected with RangeError (mapped to 413 by the
  // routes) even without a content-length header.
  const oversized = new Request("https://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "a".repeat(AI_LIMITS.maxRequestBytes + 1_000) }),
  });
  await assert.rejects(readBoundedJson(oversized), RangeError);
});

test("request byte ceiling exceeds the worst-case conversation payload", () => {
  // Defense-in-depth ceiling must not reject a conversation that passes
  // validateConversation (CJK is ~3 UTF-8 bytes per character).
  const worstCaseChars =
    AI_LIMITS.conversationTurns * 2 * AI_LIMITS.conversationMessageCharacters;
  const worstCaseBytes = worstCaseChars * 3 + 1_000; // + JSON/envelope overhead
  assert.ok(
    AI_LIMITS.maxRequestBytes > worstCaseBytes,
    `maxRequestBytes (${AI_LIMITS.maxRequestBytes}) must exceed worst-case payload (~${worstCaseBytes})`,
  );
});
