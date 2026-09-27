import assert from "node:assert/strict";
import test from "node:test";
import { resolveToolScope } from "../lib/ai/admin/scope";

test("intake-scoped roles always use the server-assigned intake", () => {
  assert.equal(
    resolveToolScope({ id: "s", role: "SECRETARY", intakeId: 12 }),
    12,
  );
  assert.equal(
    resolveToolScope({ id: "t", role: "TREASURER", intakeId: 15 }),
    15,
  );
  assert.throws(
    () => resolveToolScope({ id: "s", role: "SECRETARY", intakeId: null }),
    /Invariant violated/u,
  );
});

test("unrestricted roles do not inherit a client-supplied intake scope", () => {
  assert.equal(
    resolveToolScope({ id: "o", role: "OFFICER", intakeId: null }),
    null,
  );
  assert.equal(
    resolveToolScope({ id: "m", role: "MULTIMEDIA", intakeId: null }),
    null,
  );
});
