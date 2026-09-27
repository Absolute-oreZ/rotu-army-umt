import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { hashContent } from "@/lib/ai/knowledge/chunker";
import { locales, isLocale } from "@/lib/i18n/config";

const root = path.resolve(process.cwd(), "content", "ai", "public");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseDocument(source: string, fileName: string) {
  const match = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/u.exec(
    source,
  );
  if (!match) throw new Error(`${fileName}: missing front matter`);
  const metadata = Object.fromEntries(
    match[1]
      .split(/\r?\n/u)
      .map((line) => {
        const separator = line.indexOf(":");
        if (separator < 0) return ["", ""];
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim(),
        ];
      })
      .filter(([key]) => key),
  );
  const slug = metadata.slug;
  const language = metadata.language;
  const title = metadata.title;
  const markdown = match[2].trim();
  if (typeof slug !== "string" || !slugPattern.test(slug))
    throw new Error(`${fileName}: invalid slug`);
  if (typeof language !== "string" || !isLocale(language))
    throw new Error(`${fileName}: unsupported language`);
  if (typeof title !== "string" || !title || !markdown)
    throw new Error(`${fileName}: title or Markdown missing`);
  if (metadata.audience !== "public")
    throw new Error(`${fileName}: audience must be public`);
  return {
    slug,
    language,
    title,
    markdown,
    category: metadata.category ?? slug,
  };
}

async function main() {
  if (process.env.ALLOW_AI_KNOWLEDGE_SEED !== "1") {
    throw new Error(
      "Set ALLOW_AI_KNOWLEDGE_SEED=1 to confirm this database write.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AI_KNOWLEDGE_SEED_ALLOW_PRODUCTION !== "1"
  ) {
    throw new Error(
      "Production seeding also requires AI_KNOWLEDGE_SEED_ALLOW_PRODUCTION=1.",
    );
  }
  const [
    { db },
    schema,
    { publishPublicDocumentVersion, processQueuedPublicIndexJobs },
  ] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
    import("@/lib/ai/knowledge/indexer"),
  ]);
  const { aiPublicDocumentVersions, aiPublicDocuments } = schema;
  const topics = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expected = new Set([
    "joining",
    "benefits",
    "what-to-expect",
    "cadet-journey",
    "activities",
    "training",
  ]);
  if (
    topics.length !== expected.size ||
    topics.some((topic) => !expected.has(topic))
  ) {
    throw new Error(
      "The public seed corpus must contain the six configured canonical topics.",
    );
  }
  let imported = 0;
  for (const topic of topics) {
    for (const locale of locales) {
      const file = path.join(root, topic, `${locale}.md`);
      const article = parseDocument(await readFile(file, "utf8"), file);
      if (article.slug !== topic || article.language !== locale)
        throw new Error(`${file}: path, slug, or locale mismatch`);
      const contentHash = hashContent(`${article.title}\n${article.markdown}`);
      const [document] = await db
        .insert(aiPublicDocuments)
        .values({
          slug: article.slug,
          canonicalTopic: topic,
          category: article.category.toUpperCase().replaceAll("-", "_"),
          audience: "public",
          sourceType: "curated_public_knowledge",
        })
        .onConflictDoUpdate({
          target: aiPublicDocuments.slug,
          set: {
            canonicalTopic: topic,
            category: article.category.toUpperCase().replaceAll("-", "_"),
            updatedAt: new Date(),
          },
        })
        .returning({ id: aiPublicDocuments.id });

      const [matching] = await db
        .select({
          id: aiPublicDocumentVersions.id,
          status: aiPublicDocumentVersions.status,
          indexStatus: aiPublicDocumentVersions.indexStatus,
        })
        .from(aiPublicDocumentVersions)
        .where(
          and(
            eq(aiPublicDocumentVersions.documentId, document.id),
            eq(aiPublicDocumentVersions.language, locale),
            eq(aiPublicDocumentVersions.contentHash, contentHash),
          ),
        )
        .orderBy(desc(aiPublicDocumentVersions.versionNumber))
        .limit(1);
      if (
        matching?.status === "PUBLISHED" &&
        matching.indexStatus === "INDEXED"
      ) {
        imported += 1;
        continue;
      }
      if (matching?.status === "DRAFT" && matching.indexStatus === "INDEXING") {
        imported += 1;
        continue;
      }
      let versionId = matching?.status === "DRAFT" ? matching.id : undefined;
      if (!versionId) {
        const [latest] = await db
          .select({ versionNumber: aiPublicDocumentVersions.versionNumber })
          .from(aiPublicDocumentVersions)
          .where(
            and(
              eq(aiPublicDocumentVersions.documentId, document.id),
              eq(aiPublicDocumentVersions.language, locale),
            ),
          )
          .orderBy(desc(aiPublicDocumentVersions.versionNumber))
          .limit(1);
        const [version] = await db
          .insert(aiPublicDocumentVersions)
          .values({
            documentId: document.id,
            language: locale,
            title: article.title,
            markdown: article.markdown,
            contentHash,
            versionNumber: (latest?.versionNumber ?? 0) + 1,
            status: "DRAFT",
          })
          .returning({ id: aiPublicDocumentVersions.id });
        versionId = version.id;
      }
      await publishPublicDocumentVersion(versionId, null);
      imported += 1;
      console.log(`Queued ${topic}/${locale} for indexing`);
    }
  }
  while (true) {
    const result = await processQueuedPublicIndexJobs();
    if (result.processed === 0) break;
  }
  const indexed = await db
    .select({
      slug: aiPublicDocuments.slug,
      language: aiPublicDocumentVersions.language,
      total: count(aiPublicDocumentVersions.id),
    })
    .from(aiPublicDocumentVersions)
    .innerJoin(
      aiPublicDocuments,
      eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
    )
    .where(
      and(
        inArray(aiPublicDocuments.slug, [...expected]),
        eq(aiPublicDocumentVersions.status, "PUBLISHED"),
        eq(aiPublicDocumentVersions.indexStatus, "INDEXED"),
      ),
    )
    .groupBy(aiPublicDocuments.slug, aiPublicDocumentVersions.language);
  const expectedPairs = new Set(
    [...expected].flatMap((slug) =>
      locales.map((locale) => `${slug}:${locale}`),
    ),
  );
  if (
    indexed.length !== expectedPairs.size ||
    indexed.some((row) => Number(row.total) !== 1) ||
    indexed.some((row) => !expectedPairs.has(`${row.slug}:${row.language}`))
  ) {
    throw new Error(
      "Public seed indexing is incomplete. Review failed index jobs in Public AI Knowledge and retry.",
    );
  }
  console.log(
    `Public knowledge seed ready: ${imported}/${topics.length * locales.length} localized documents.`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Public knowledge import failed",
  );
  process.exitCode = 1;
});
