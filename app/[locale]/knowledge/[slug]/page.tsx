import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiPublicDocumentVersions, aiPublicDocuments } from "@/db/schema";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/env/public";

async function findPublishedVersion(locale: Locale, slug: string) {
  const [row] = await db
    .select({
      title: aiPublicDocumentVersions.title,
      markdown: aiPublicDocumentVersions.markdown,
      publishedAt: aiPublicDocumentVersions.publishedAt,
      canonicalTopic: aiPublicDocuments.canonicalTopic,
    })
    .from(aiPublicDocumentVersions)
    .innerJoin(
      aiPublicDocuments,
      eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
    )
    .where(
      and(
        eq(aiPublicDocuments.slug, slug),
        eq(aiPublicDocumentVersions.language, locale),
        eq(aiPublicDocumentVersions.status, "PUBLISHED"),
        eq(aiPublicDocumentVersions.indexStatus, "INDEXED"),
      ),
    )
    .orderBy(desc(aiPublicDocumentVersions.publishedAt))
    .limit(1);
  return row ?? null;
}

async function getAvailableLocales(slug: string) {
  const rows = await db
    .select({ locale: aiPublicDocumentVersions.language })
    .from(aiPublicDocumentVersions)
    .innerJoin(
      aiPublicDocuments,
      eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
    )
    .where(
      and(
        eq(aiPublicDocuments.slug, slug),
        eq(aiPublicDocumentVersions.status, "PUBLISHED"),
        eq(aiPublicDocumentVersions.indexStatus, "INDEXED"),
      ),
    );
  return [...new Set(rows.map((row) => row.locale))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale = rawLocale;
  const article = await findPublishedVersion(locale, slug);
  if (!article) return {};
  const availableLocales = await getAvailableLocales(slug);
  const description = article.markdown
    .replace(/^---[\s\S]*?---\s*/u, "")
    .replace(/[#>*_`\[\]()]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 160);
  const canonical = `${getSiteUrl()}/${locale}/knowledge/${slug}`;
  return {
    title: article.title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        availableLocales.map((item) => [
          item,
          `${getSiteUrl()}/${item}/knowledge/${slug}`,
        ]),
      ),
    },
    openGraph: {
      title: article.title,
      description,
      url: canonical,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
    },
    twitter: { card: "summary", title: article.title, description },
  };
}

export default async function PublicKnowledgeArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const article = await findPublishedVersion(rawLocale, slug);
  if (!article) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <article className="rounded-lg border border-border bg-card p-5 sm:p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <MarkdownPreview markdown={article.markdown} />
      </article>
    </main>
  );
}
