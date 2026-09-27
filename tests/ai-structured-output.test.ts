import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStructuredResponse,
  validateAIAnswer,
} from "../lib/ai/core/structured-output";

test("malformed JSON is rejected rather than returned as free text", () => {
  assert.throws(
    () => parseStructuredResponse("answer: hi", (value) => value),
    /malformed structured output/u,
  );
});

test("answer schema drops unknown citation IDs and rejects invalid fields", () => {
  const answer = validateAIAnswer(
    {
      answer: "Grounded answer",
      citations: ["SOURCE_1", "https://attacker.example", "SOURCE_1"],
      usedCurrentInfo: false,
    },
    new Set(["SOURCE_1"]),
    650,
  );
  assert.deepEqual(answer.citations, ["SOURCE_1"]);
  assert.throws(() =>
    validateAIAnswer(
      { answer: "x", citations: [], usedCurrentInfo: "false" },
      new Set(),
      650,
    ),
  );
  assert.throws(() =>
    validateAIAnswer(
      { answer: "", citations: [], usedCurrentInfo: false },
      new Set(),
      650,
    ),
  );
});
