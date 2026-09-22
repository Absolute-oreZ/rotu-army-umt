import assert from "node:assert/strict";
import test from "node:test";
import { detectFileKind, isAllowedExtension } from "../lib/storage/files";

test("detects supported file signatures", () => {
  assert.equal(detectFileKind(Uint8Array.from([0xff, 0xd8, 0xff]))?.contentType, "image/jpeg");
  assert.equal(detectFileKind(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]))?.kind, "pdf");
  assert.equal(detectFileKind(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]))?.kind, "video");
});

test("rejects unsupported extensions", () => {
  assert.equal(isAllowedExtension("svg", ["image"]), false);
  assert.equal(isAllowedExtension("mp4", ["video"]), true);
});