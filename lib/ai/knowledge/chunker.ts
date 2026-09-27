import { createHash } from "node:crypto";

export { chunkMarkdown } from "@/lib/ai/knowledge/markdown-chunker";
export type { MarkdownChunk } from "@/lib/ai/knowledge/markdown-chunker";

export function hashContent(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
