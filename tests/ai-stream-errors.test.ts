import assert from "node:assert/strict";
import test from "node:test";
import { AI_ERRORS, AIProviderError, safeAIErrorMessage } from "../lib/ai/core/errors";
import { hasAdminAICapability, adminAICapabilitiesForRole } from "../lib/ai/admin/capabilities";
import { describeAIError } from "../lib/ai/core/errors";

test("streamed provider failures map to safe, user-facing messages", () => {
  const fallback = AI_ERRORS.publicUnavailable;
  assert.equal(safeAIErrorMessage(new AIProviderError("RATE_LIMITED", "429", 429), fallback), "The assistant is temporarily busy. Please try again.");
  assert.equal(safeAIErrorMessage(new AIProviderError("QUOTA_EXHAUSTED", "402", 402), fallback), "The assistant is temporarily busy. Please try again.");
  assert.equal(safeAIErrorMessage(new AIProviderError("TIMEOUT", "slow"), fallback), AI_ERRORS.timeout);
  assert.equal(safeAIErrorMessage(new AIProviderError("MODEL_UNAVAILABLE", "404", 404), fallback), fallback);
  // Never leak provider internals.
  assert.equal(safeAIErrorMessage(new AIProviderError("UNAUTHORIZED", "Bearer sk-secret rejected"), fallback), AI_ERRORS.internal);
  assert.equal(safeAIErrorMessage(new AIProviderError("INVALID_RESPONSE", "raw body"), fallback), AI_ERRORS.internal);
  // Non-provider errors are always the generic internal message.
  assert.equal(safeAIErrorMessage(new Error("stack trace with sk-secret"), fallback), AI_ERRORS.internal);
});

test("telemetry failure reasons are categories, never raw exception text", () => {
  assert.equal(describeAIError(new AIProviderError("RATE_LIMITED", "429", 429)), "RATE_LIMITED:429");
  assert.equal(describeAIError(new Error("AI provider returned malformed structured output")), "INVALID_RESPONSE");
  assert.equal(describeAIError(new Error("Invalid AI answer fields")), "INVALID_RESPONSE");
  assert.equal(describeAIError(new Error("some secret path /var/secret")), "INTERNAL");
});

test("Admin AI capability gate hides the panel from roles with no readable tools", () => {
  // Roles with a readable capability (Officer/Instructor full access; scoped roles).
  for (const role of ["OFFICER", "INSTRUCTOR", "SECRETARY", "TREASURER", "SPORTS", "WELFARE", "ACADEMIC"] as const) {
    assert.equal(hasAdminAICapability(role), true, role);
  }
  // MULTIMEDIA has portfolio/stories/newsletters but no AI read tool.
  assert.equal(hasAdminAICapability("MULTIMEDIA"), false);
  assert.deepEqual(adminAICapabilitiesForRole("MULTIMEDIA"), []);
  assert.ok(adminAICapabilitiesForRole("TREASURER").includes("ADMIN_TREASURY_READ"));
});