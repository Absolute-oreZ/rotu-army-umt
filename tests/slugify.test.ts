import assert from "node:assert/strict";
import test from "node:test";
import { slugify } from "../lib/slugify";

test("creates stable URL slugs", () => {
  assert.equal(slugify("Field Training Camp 2025"), "field-training-camp-2025");
  assert.equal(slugify("  Multiple   Spaces  "), "multiple-spaces");
});