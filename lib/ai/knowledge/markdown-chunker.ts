export type MarkdownChunk = {
  chunkIndex: number;
  headingPath: string;
  content: string;
  tokenCount: number;
};

type Block = { headingPath: string; content: string };

function estimateTokenCount(value: string) {
  const cjk = (value.match(/[\u3400-\u9fff\u0b80-\u0bff]/gu) ?? []).length;
  const remaining = Array.from(
    value.replace(/[\u3400-\u9fff\u0b80-\u0bff]/gu, " "),
  ).length;
  return Math.ceil(cjk + remaining / 3.6);
}

function tailContext(value: string, maxTokens: number) {
  const chars = Array.from(value);
  const cjk = (value.match(/[\u3400-\u9fff\u0b80-\u0bff]/gu) ?? []).length;
  return cjk > 0
    ? chars.slice(-maxTokens).join("")
    : value.split(/\s+/u).slice(-maxTokens).join(" ");
}

function parseBlocks(markdown: string): Block[] {
  const headings: string[] = [];
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const content = paragraph.join("\n").trim();
    if (content) blocks.push({ headingPath: headings.join(" > "), content });
    paragraph = [];
  };
  for (const line of markdown
    .replace(/^---[\s\S]*?---\s*/u, "")
    .split(/\r?\n/u)) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    if (heading) {
      flush();
      const depth = heading[1].length;
      headings.length = depth - 1;
      headings[depth - 1] = heading[2].trim();
      continue;
    }
    if (!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();
  return blocks;
}

function splitOversized(block: Block, hardMax: number): Block[] {
  const chunks: Block[] = [];
  let remaining = block.content.trim();
  while (remaining) {
    const chars = Array.from(remaining);
    let low = 1;
    let high = chars.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (estimateTokenCount(chars.slice(0, mid).join("")) <= hardMax)
        low = mid;
      else high = mid - 1;
    }
    let end = low;
    if (end < chars.length) {
      const prefix = chars.slice(0, end).join("");
      const sentence = Math.max(
        prefix.lastIndexOf(". "),
        prefix.lastIndexOf("! "),
        prefix.lastIndexOf("? "),
        prefix.lastIndexOf("\n"),
      );
      const word = Math.max(prefix.lastIndexOf(" "), prefix.lastIndexOf("\n"));
      const boundary = sentence > end * 0.55 ? sentence + 1 : word;
      if (boundary > 0) end = boundary;
    }
    const content = chars.slice(0, end).join("").trim();
    if (!content)
      throw new Error("Markdown chunker could not split oversized content");
    const tokenCount = estimateTokenCount(content);
    if (tokenCount > hardMax)
      throw new Error("Markdown chunk exceeds hard token limit");
    chunks.push({ ...block, content });
    remaining = chars.slice(end).join("").trimStart();
  }
  return chunks;
}

export function chunkMarkdown(markdown: string): MarkdownChunk[] {
  const target = 400;
  const softMax = 500;
  const hardMax = 600;
  const blocks = parseBlocks(markdown).flatMap((block) =>
    splitOversized(block, hardMax),
  );
  const chunks: MarkdownChunk[] = [];
  let currentHeading = "";
  let current: string[] = [];
  let carry = "";
  const flush = (continueInSection = false) => {
    const content = current.join("\n\n").trim();
    const tokenCount = estimateTokenCount(content);
    if (content && tokenCount >= 1) {
      if (tokenCount <= hardMax)
        chunks.push({
          headingPath: currentHeading,
          content,
          tokenCount,
          chunkIndex: chunks.length,
        });
      else
        chunks.push(
          ...splitOversized({ headingPath: currentHeading, content }, hardMax)
            .map((piece) => ({
              ...piece,
              tokenCount: estimateTokenCount(piece.content),
              chunkIndex: 0,
            }))
            .map((piece) => ({ ...piece, chunkIndex: chunks.length })),
        );
      carry = continueInSection ? tailContext(content, 60) : "";
    }
    current = [];
  };
  for (const block of blocks) {
    if (current.length && block.headingPath !== currentHeading) flush();
    if (!current.length && block.headingPath === currentHeading && carry) {
      current.push(carry);
      carry = "";
    }
    if (block.headingPath !== currentHeading) carry = "";
    const next = [...current, block.content].join("\n\n");
    if (current.length && estimateTokenCount(next) > softMax) flush(true);
    currentHeading = block.headingPath || currentHeading;
    current.push(block.content);
    if (estimateTokenCount(current.join("\n\n")) >= target) flush(true);
  }
  flush();
  if (chunks.length > 1 && chunks.at(-1)!.tokenCount < 80) {
    const tail = chunks.pop()!;
    const previous = chunks.at(-1)!;
    if (
      previous.headingPath === tail.headingPath &&
      previous.tokenCount + tail.tokenCount <= hardMax
    ) {
      previous.content += `\n\n${tail.content}`;
      previous.tokenCount += tail.tokenCount;
    } else chunks.push(tail);
  }
  return chunks.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}
