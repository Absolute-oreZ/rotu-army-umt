import { readFile } from "node:fs/promises";
import path from "node:path";
import { isLocale } from "@/lib/i18n/config";
import { retrievePublicKnowledge } from "@/lib/ai/public/retrieval";

type Fixture = { locale: string; topic: string; question: string };

async function main() {
  const fixturePath = path.resolve(
    process.cwd(),
    "tests",
    "fixtures",
    "ai-public-retrieval.json",
  );
  const cases = JSON.parse(await readFile(fixturePath, "utf8")) as Fixture[];
  const metrics = new Map<
    string,
    {
      total: number;
      hitsAt5: number;
      sameLanguageHits: number;
      precisionAt5: number;
      ndcgAt5: number;
      crossLanguageFallbacks: number;
    }
  >();

  for (const item of cases) {
    if (!isLocale(item.locale))
      throw new Error(`Fixture has unsupported locale: ${item.locale}`);
    const result = await retrievePublicKnowledge(item.question, item.locale);
    const relevant = result.sources.findIndex((source) =>
      source.url.endsWith(`/knowledge/${item.topic}`),
    );
    const rank = relevant >= 0 ? relevant + 1 : Number.POSITIVE_INFINITY;
    const hitAt5 = rank <= 5;
    const sameLanguageHit =
      hitAt5 && result.sources[relevant].language === item.locale;
    const current = metrics.get(item.locale) ?? {
      total: 0,
      hitsAt5: 0,
      sameLanguageHits: 0,
      precisionAt5: 0,
      ndcgAt5: 0,
      crossLanguageFallbacks: 0,
    };
    current.total += 1;
    current.hitsAt5 += hitAt5 ? 1 : 0;
    current.sameLanguageHits += sameLanguageHit ? 1 : 0;
    current.precisionAt5 += hitAt5 ? 1 / 5 : 0;
    current.ndcgAt5 += hitAt5 ? 1 / Math.log2(rank + 1) : 0;
    current.crossLanguageFallbacks += result.usedCrossLanguageFallback ? 1 : 0;
    metrics.set(item.locale, current);
  }

  let total = 0;
  let hitsAt5 = 0;
  for (const [locale, values] of [...metrics.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    total += values.total;
    hitsAt5 += values.hitsAt5;
    console.log(
      JSON.stringify({
        locale,
        recallAt5: Number((values.hitsAt5 / values.total).toFixed(3)),
        sameLanguageHitRate: Number(
          (values.sameLanguageHits / values.total).toFixed(3),
        ),
        precisionAt5: Number((values.precisionAt5 / values.total).toFixed(3)),
        ndcgAt5: Number((values.ndcgAt5 / values.total).toFixed(3)),
        crossLanguageFallbacks: values.crossLanguageFallbacks,
        cases: values.total,
      }),
    );
  }
  console.log(
    JSON.stringify({
      overallRecallAt5: Number((hitsAt5 / total).toFixed(3)),
      cases: total,
    }),
  );
  if (process.argv.includes("--strict") && hitsAt5 !== total)
    process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Public retrieval evaluation failed",
  );
  process.exitCode = 1;
});
