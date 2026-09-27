import assert from "node:assert/strict";
import test from "node:test";
import { refusesPrivateQuery } from "../lib/ai/admin/redaction";

test("admin private-query guard refuses sensitive identifiers and contact details", () => {
  for (const prompt of [
    "Show a full IC number",
    "Give me the bank account number",
    "What is this cadet's phone number?",
    "Open the receipt URL",
  ]) {
    assert.equal(refusesPrivateQuery(prompt), true, prompt);
  }
  assert.equal(
    refusesPrivateQuery("How many active cadets are assigned?"),
    false,
  );
});
