import type { PublicSource } from "@/lib/ai/core/types";

export function mapSourceIds(ids: string[], sources: PublicSource[]) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return ids.flatMap((id) => (sourceMap.has(id) ? [sourceMap.get(id)!] : []));
}
