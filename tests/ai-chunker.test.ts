import assert from "node:assert/strict";
import test from "node:test";
import { chunkMarkdown, hashContent } from "../lib/ai/knowledge/chunker";

test("Markdown chunking retains heading paths and keeps an FAQ section together", () => {
  const markdown = [
    "# Joining",
    "## Who can apply?",
    "Students should check the current official intake notice for eligibility.",
    "## Application process",
    "Applicants follow the published application instructions.",
  ].join("\n\n");
  const chunks = chunkMarkdown(markdown);
  assert.equal(chunks.length, 2);
  assert.match(chunks[0].headingPath, /Joining > Who can apply\?/u);
  assert.match(chunks[0].content, /current official intake notice/u);
  assert.match(chunks[1].headingPath, /Joining > Application process/u);
  assert.ok(chunks.every((chunk) => chunk.tokenCount <= 600));
});

test("content hashes are stable SHA-256 identifiers", () => {
  assert.equal(hashContent("same content"), hashContent("same content"));
  assert.notEqual(hashContent("same content"), hashContent("changed content"));
  assert.equal(hashContent("same content").length, 64);
});

test("oversized unbroken Markdown is split below the hard limit", () => {
  const pathological = [
    "# Long content",
    "x".repeat(10_000),
    "https://example.org/" + "a".repeat(5_000),
    "文".repeat(2_000),
  ].join("\n\n");
  const chunks = chunkMarkdown(pathological);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.tokenCount <= 600));
  assert.ok(chunks.every((chunk) => chunk.headingPath === "Long content"));
});
