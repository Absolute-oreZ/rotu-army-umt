import type { PublicSource } from "@/lib/ai/core/types";
import { ExternalLinkIcon } from "lucide-react";

export function CitationLink({
  source,
  index,
  sourceType,
}: {
  source: PublicSource;
  index: number;
  sourceType: string;
}) {
  const external = source.url.startsWith("http");
  return (
    <a
      className="underline decoration-current/40 underline-offset-2 hover:decoration-current"
      href={source.url}
      rel={external ? "noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      [{index + 1}] {source.title}
      <span className="ml-1 opacity-70">{sourceType}</span>
      {external && (
        <ExternalLinkIcon aria-hidden="true" className="ml-1 inline size-3" />
      )}
    </a>
  );
}
