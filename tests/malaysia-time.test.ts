import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMalaysiaDateTimeLocal,
  getMalaysiaDateISO,
  parseMalaysiaDateTimeLocal,
} from "../lib/time/malaysia";

test("formats Malaysia calendar dates around midnight", () => {
  assert.equal(getMalaysiaDateISO(new Date("2026-09-22T16:00:00.000Z")), "2026-09-23");
  assert.equal(getMalaysiaDateISO(new Date("2026-09-23T16:01:00.000Z")), "2026-09-24");
});

test("round-trips Malaysia datetime-local values", () => {
  const value = "2026-09-23T10:00";
  const parsed = parseMalaysiaDateTimeLocal(value);
  assert.ok(parsed);
  assert.equal(formatMalaysiaDateTimeLocal(parsed), value);
});

test("rejects invalid Malaysia datetime-local values", () => {
  assert.equal(parseMalaysiaDateTimeLocal("2026-02-30T10:00"), null);
  assert.equal(parseMalaysiaDateTimeLocal("2026-09-23T24:00"), null);
});