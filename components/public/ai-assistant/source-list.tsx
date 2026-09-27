import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicSource } from "@/lib/ai/core/types";
import { CitationLink } from "@/components/public/ai-assistant/citation-link";

export function SourceList({
  sources,
  copy,
}: {
  sources: PublicSource[];
  copy: Dictionary["aiAssistant"];
}) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 border-t border-current/15 pt-2">
      <h3 className="mb-1 text-xs font-semibold">{copy.sourceTitle}</h3>
      <ol className="space-y-1">
        {sources.map((source, index) => (
          <li className="text-xs" key={source.id}>
            <CitationLink
              index={index}
              source={source}
              sourceType={
                copy.sourceTypes[source.sourceType] ?? source.sourceType
              }
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
