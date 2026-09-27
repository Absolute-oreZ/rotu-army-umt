import { Fragment, type ReactNode } from "react";
import { safeMarkdownHref } from "@/lib/ai/knowledge/validation";

const INLINE_PATTERN =
  /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/gu;

function safeLink(value: string) {
  return safeMarkdownHref(value);
}

function inline(value: string): ReactNode[] {
  const output: ReactNode[] = [];
  let position = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(value))) {
    if (match.index > position) output.push(value.slice(position, match.index));
    if (match[2] && match[3]) {
      const href = safeLink(match[3]);
      output.push(
        href ? (
          <a
            className="underline"
            href={href}
            key={`${match.index}-link`}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            target={href.startsWith("http") ? "_blank" : undefined}
          >
            {match[2]}
          </a>
        ) : (
          <span key={`${match.index}-bad-link`}>{match[2]}</span>
        ),
      );
    } else if (match[4])
      output.push(<strong key={`${match.index}-strong`}>{match[4]}</strong>);
    else if (match[5])
      output.push(
        <code className="rounded bg-muted px-1" key={`${match.index}-code`}>
          {match[5]}
        </code>,
      );
    else if (match[6])
      output.push(<em key={`${match.index}-em`}>{match[6]}</em>);
    position = INLINE_PATTERN.lastIndex;
  }
  if (position < value.length) output.push(value.slice(position));
  return output;
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/^---[\s\S]*?---\s*/u, "").split(/\r?\n/u);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (paragraph.length)
      blocks.push(
        <p className="mb-4 leading-7" key={`p-${blocks.length}`}>
          {inline(paragraph.join(" "))}
        </p>,
      );
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const Tag = listOrdered ? "ol" : "ul";
    blocks.push(
      <Tag
        className={`mb-4 list-inside space-y-1 ${listOrdered ? "list-decimal" : "list-disc"}`}
        key={`list-${blocks.length}`}
      >
        {list.map((item, i) => (
          <li key={`${i}-${item.slice(0, 12)}`}>{inline(item)}</li>
        ))}
      </Tag>,
    );
    list = [];
  };

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    const listItem = /^\s*(?:[-*+]\s+|\d+[.)]\s+)(.*)$/u.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const depth = Math.min(heading[1].length, 4) + 1;
      const text = inline(heading[2]);
      const className =
        depth <= 3
          ? "mb-3 mt-6 text-xl font-semibold"
          : "mb-2 mt-4 font-semibold";
      const Tag = `h${depth}` as "h2" | "h3" | "h4" | "h5";
      blocks.push(
        <Tag className={className} key={`h-${blocks.length}`}>
          {text}
        </Tag>,
      );
    } else if (listItem) {
      flushParagraph();
      const ordered = /^\s*\d+[.)]/u.test(line);
      if (list.length && ordered !== listOrdered) flushList();
      listOrdered = ordered;
      list.push(listItem[1]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return (
    <div className="text-sm">
      {blocks.map((block, index) => (
        <Fragment key={index}>{block}</Fragment>
      ))}
    </div>
  );
}
