import "server-only";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  eventTranslations,
  eventsToTags,
  eventTagTranslations,
  frequentlyAskedQuestions,
  frequentlyAskedQuestionTranslations,
  intakeTranslations,
  intakes,
} from "@/db/schema";
import { openRouterProvider } from "@/lib/ai/provider/openrouter";
import type { Locale } from "@/lib/i18n/config";
import type { PublicRetrievalResult, PublicSource } from "@/lib/ai/core/types";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import { getSiteUrl } from "@/lib/env/public";

type Candidate = PublicSource & { rank: number; score: number };

async function lexicalSearch(query: string, locale?: Locale) {
  return db.execute(sql`
    SELECT c.id, d.slug, v.title, c.source_type AS "sourceType", c.language,
      v.published_at AS "publishedAt", c.content, c.canonical_url AS url,
      ts_rank_cd(c.fts, websearch_to_tsquery('simple', ${query})) AS score
    FROM ai_public_chunks c
    JOIN ai_public_document_versions v ON v.id = c.document_version_id
    JOIN ai_public_documents d ON d.id = v.document_id
    WHERE v.status = 'PUBLISHED' AND v.index_status = 'INDEXED'
      AND c.fts @@ websearch_to_tsquery('simple', ${query})
      ${locale ? sql`AND c.language = ${locale}` : sql``}
    ORDER BY score DESC, v.published_at DESC
    LIMIT 10
  `);
}

async function vectorSearch(queryVector: number[], locale?: Locale) {
  const vector = `[${queryVector.join(",")}]`;
  return db.execute(sql`
    SELECT c.id, d.slug, v.title, c.source_type AS "sourceType", c.language,
      v.published_at AS "publishedAt", c.content, c.canonical_url AS url,
      1 - (c.embedding <=> ${vector}::vector) AS score
    FROM ai_public_chunks c
    JOIN ai_public_document_versions v ON v.id = c.document_version_id
    JOIN ai_public_documents d ON d.id = v.document_id
    WHERE v.status = 'PUBLISHED' AND v.index_status = 'INDEXED' AND c.embedding IS NOT NULL
      ${locale ? sql`AND c.language = ${locale}` : sql``}
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT 10
  `);
}

function asCandidate(
  row: Record<string, unknown>,
  rank: number,
): Candidate | null {
  if (
    typeof row.id !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.title !== "string" ||
    typeof row.content !== "string"
  )
    return null;
  const language = row.language;
  if (
    language !== "en" &&
    language !== "ms" &&
    language !== "zh" &&
    language !== "ta"
  )
    return null;
  const fallbackUrl = `/${language}/knowledge/${encodeURIComponent(String(row.slug))}`;
  let url = fallbackUrl;
  if (
    typeof row.url === "string" &&
    row.url.startsWith("/") &&
    !row.url.startsWith("//") &&
    !row.url.includes("\\")
  ) {
    url = row.url;
  } else if (typeof row.url === "string") {
    try {
      const candidateUrl = new URL(row.url);
      if (
        candidateUrl.protocol === "https:" &&
        candidateUrl.origin === new URL(getSiteUrl()).origin
      ) {
        url = `${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`;
      }
    } catch {
      // Keep the server-generated canonical knowledge URL.
    }
  }
  return {
    id: row.id,
    title: row.title,
    url,
    sourceType:
      typeof row.sourceType === "string" ? row.sourceType : "official_curated",
    language,
    publishedAt:
      row.publishedAt instanceof Date
        ? row.publishedAt.toISOString()
        : String(row.publishedAt ?? ""),
    excerpt: row.content.slice(0, 1100),
    rank,
    score: typeof row.score === "number" ? row.score : 0,
  };
}

function fuse(sets: Array<Array<Record<string, unknown>>>, locale: Locale) {
  const fused = new Map<string, Candidate>();
  for (const set of sets) {
    set.forEach((row, index) => {
      const candidate = asCandidate(row, index + 1);
      if (!candidate) return;
      const previous = fused.get(candidate.id);
      const languageBoost = candidate.language === locale ? 0.02 : 0;
      const rrf = 1 / (60 + index + 1) + languageBoost;
      fused.set(
        candidate.id,
        previous
          ? {
              ...previous,
              rank: previous.rank + 1,
              score: previous.score + rrf,
            }
          : { ...candidate, score: rrf },
      );
    });
  }
  return [...fused.values()].sort((a, b) => b.score - a.score);
}

function queryWords(query: string) {
  return [
    ...new Set(
      (query.toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).filter(
        (word) => word.length > 1,
      ),
    ),
  ];
}

function relevanceScore(query: string, text: string) {
  const normalized = text.toLocaleLowerCase();
  return queryWords(query).filter((word) => normalized.includes(word)).length;
}

// The locale-preference join can return one row per available translation, so a
// non-English request sees each entity twice. Fetch with headroom, then keep the
// requested-locale row per entity so retrieval slots are not spent on duplicates.
const SITE_FETCH_LIMIT = 50;
const SITE_RESULT_LIMIT = 25;
const TAG_FETCH_LIMIT = 100;

function dedupeByLocale<T extends { locale: string | null }>(
  rows: T[],
  keyOf: (row: T) => string | number,
  locale: Locale,
): T[] {
  const byKey = new Map<string | number, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }
    if (existing.locale !== locale && row.locale === locale)
      byKey.set(key, row);
  }
  return [...byKey.values()];
}

async function retrievePublishedSiteContent(
  query: string,
  locale: Locale,
): Promise<PublicSource[]> {
  const terms = queryWords(query).slice(0, 8);
  const matches = (columns: Array<Parameters<typeof ilike>[0]>) =>
    terms.length
      ? or(
          ...columns.flatMap((column) =>
            terms.map((term) => ilike(column, `%${term}%`)),
          ),
        )
      : undefined;
  const [faqRows, intakeRows, storyRows, tagRows] = await Promise.all([
    db
      .select({
        id: frequentlyAskedQuestions.id,
        locale: frequentlyAskedQuestionTranslations.locale,
        question: frequentlyAskedQuestionTranslations.question,
        answer: frequentlyAskedQuestionTranslations.answer,
      })
      .from(frequentlyAskedQuestions)
      .innerJoin(
        frequentlyAskedQuestionTranslations,
        and(
          eq(
            frequentlyAskedQuestionTranslations.faqId,
            frequentlyAskedQuestions.id,
          ),
          inArray(
            frequentlyAskedQuestionTranslations.locale,
            locale === "en" ? ["en"] : [locale, "en"],
          ),
        ),
      )
      .where(
        and(
          eq(frequentlyAskedQuestions.status, "PUBLISHED"),
          matches([
            frequentlyAskedQuestionTranslations.question,
            frequentlyAskedQuestionTranslations.answer,
          ]),
        ),
      )
      .orderBy(
        sql`case when ${frequentlyAskedQuestionTranslations.locale} = ${locale} then 0 else 1 end`,
        frequentlyAskedQuestions.sortOrder,
      )
      .limit(SITE_FETCH_LIMIT),
    db
      .select({
        slug: intakes.slug,
        displayName: intakes.displayName,
        locale: intakeTranslations.locale,
        summary: intakeTranslations.summary,
      })
      .from(intakes)
      .leftJoin(
        intakeTranslations,
        and(
          eq(intakeTranslations.intakeId, intakes.id),
          inArray(
            intakeTranslations.locale,
            locale === "en" ? ["en"] : [locale, "en"],
          ),
        ),
      )
      .where(
        and(
          eq(intakes.status, "PUBLISHED"),
          matches([intakes.displayName, intakeTranslations.summary]),
        ),
      )
      .orderBy(
        intakes.startYear,
        sql`case when ${intakeTranslations.locale} = ${locale} then 0 else 1 end`,
      )
      .limit(SITE_FETCH_LIMIT),
    db
      .select({
        id: events.id,
        slug: events.slug,
        name: events.name,
        startYear: sql<number>`extract(year from ${events.startDate})::int`,
        location: events.location,
        locale: eventTranslations.locale,
        title: eventTranslations.title,
        summary: eventTranslations.summary,
      })
      .from(events)
      .leftJoin(
        eventTranslations,
        and(
          eq(eventTranslations.eventId, events.id),
          inArray(
            eventTranslations.locale,
            locale === "en" ? ["en"] : [locale, "en"],
          ),
        ),
      )
      .where(
        and(
          eq(events.status, "PUBLISHED"),
          matches([
            eventTranslations.title,
            eventTranslations.summary,
            events.name,
            events.location,
          ]),
        ),
      )
      .orderBy(
        events.startDate,
        sql`case when ${eventTranslations.locale} = ${locale} then 0 else 1 end`,
      )
      .limit(SITE_FETCH_LIMIT),
    db
      .select({
        eventId: eventsToTags.eventId,
        name: eventTagTranslations.name,
      })
      .from(eventsToTags)
      .innerJoin(
        eventTagTranslations,
        and(
          eq(eventTagTranslations.tagId, eventsToTags.tagId),
          eq(eventTagTranslations.locale, locale),
        ),
      )
      .innerJoin(
        events,
        and(
          eq(events.id, eventsToTags.eventId),
          eq(events.status, "PUBLISHED"),
        ),
      )
      .where(matches([eventTagTranslations.name]))
      .orderBy(eventTagTranslations.name, eventsToTags.eventId)
      .limit(TAG_FETCH_LIMIT),
  ]);
  const faqs = dedupeByLocale(faqRows, (row) => row.id, locale).slice(
    0,
    SITE_RESULT_LIMIT,
  );
  const intakeSources = dedupeByLocale(
    intakeRows,
    (row) => row.slug,
    locale,
  ).slice(0, SITE_RESULT_LIMIT);
  const storySources = dedupeByLocale(storyRows, (row) => row.id, locale).slice(
    0,
    SITE_RESULT_LIMIT,
  );
  const tagsByEvent = new Map<number, string[]>();
  for (const tag of tagRows)
    tagsByEvent.set(tag.eventId, [
      ...(tagsByEvent.get(tag.eventId) ?? []),
      tag.name,
    ]);
  const candidates: Array<PublicSource & { match: number }> = [];

  for (const faq of faqs) {
    const excerpt = `${faq.question}\n${faq.answer}`;
    const match = relevanceScore(query, excerpt);
    if (match > 0)
      candidates.push({
        id: `faq-${faq.id}`,
        title: faq.question,
        url: `/${locale}#faq`,
        sourceType: "official_cms_faq",
        language: faq.locale,
        excerpt,
        match,
      });
  }
  for (const intake of intakeSources) {
    const excerpt = [intake.displayName, intake.summary]
      .filter(Boolean)
      .join("\n");
    const match = relevanceScore(query, excerpt);
    if (match > 0)
      candidates.push({
        id: `intake-${intake.slug}`,
        title: intake.displayName,
        url: `/${locale}/intakes/${intake.slug}`,
        sourceType: "official_cms_intake",
        language: intake.locale ?? "en",
        excerpt,
        match,
      });
  }
  for (const story of storySources) {
    const title = story.title ?? story.name;
    const tags = tagsByEvent.get(story.id) ?? [];
    const excerpt = [title, story.summary, story.name, story.location, ...tags]
      .filter(Boolean)
      .join("\n");
    const match = relevanceScore(query, excerpt);
    if (match > 0)
      candidates.push({
        id: `story-${story.slug}`,
        title,
        url: `/${locale}/stories/${story.slug}`,
        sourceType: "official_cms_story",
        language: story.locale ?? "en",
        excerpt: `${excerpt} (${story.startYear})`,
        match,
      });
  }

  return candidates
    .sort((a, b) => b.match - a.match)
    .slice(0, 4)
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      url: candidate.url,
      sourceType: candidate.sourceType,
      language: candidate.language,
      publishedAt: candidate.publishedAt,
      excerpt: candidate.excerpt,
    }));
}

export async function retrievePublicKnowledge(
  query: string,
  locale: Locale,
): Promise<PublicRetrievalResult> {
  const lexical = await lexicalSearch(query, locale);
  let candidates = fuse(
    [lexical as unknown as Array<Record<string, unknown>>],
    locale,
  );
  let usedCrossLanguageFallback = false;
  let queryVector: number[] | null = null;

  try {
    [queryVector] = await openRouterProvider.generateEmbedding(
      [query],
      "query",
    );
  } catch {
    // Lexical retrieval remains available while the embedding provider is unavailable.
  }

  if (queryVector) {
    const vector = await vectorSearch(queryVector, locale);
    candidates = fuse(
      [
        lexical as unknown as Array<Record<string, unknown>>,
        vector as unknown as Array<Record<string, unknown>>,
      ],
      locale,
    );
  }

  if (candidates.length < 3) {
    usedCrossLanguageFallback = true;
    const [crossLexical, crossVector] = await Promise.all([
      lexicalSearch(query),
      queryVector ? vectorSearch(queryVector) : Promise.resolve([]),
    ]);
    candidates = fuse(
      [
        lexical as unknown as Array<Record<string, unknown>>,
        queryVector
          ? []
          : (crossLexical as unknown as Array<Record<string, unknown>>),
        crossLexical as unknown as Array<Record<string, unknown>>,
        crossVector as unknown as Array<Record<string, unknown>>,
      ],
      locale,
    );
  }

  const liveSources = await retrievePublishedSiteContent(query, locale).catch(
    () => [],
  );
  return {
    sources: [
      ...liveSources,
      ...candidates.slice(0, AI_LIMITS.publicChunks).map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        url: candidate.url,
        sourceType: candidate.sourceType,
        language: candidate.language,
        publishedAt: candidate.publishedAt,
        excerpt: candidate.excerpt,
      })),
    ].slice(0, AI_LIMITS.publicChunks),
    usedCrossLanguageFallback,
  };
}
