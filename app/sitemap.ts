import type { MetadataRoute } from "next";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import {
  aiPublicDocumentVersions,
  aiPublicDocuments,
  events,
  intakes,
} from "@/db/schema";
import { locales } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/env/public";

export const revalidate = 3600;

const DEFAULT_PATHS = ["", "intakes", "stories", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = getSiteUrl();

  const [intakeRows, storyRows, knowledgeRows] = await Promise.all([
    db
      .select({ slug: intakes.slug, updatedAt: intakes.updatedAt })
      .from(intakes)
      .where(eq(intakes.status, "PUBLISHED")),
    db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(eq(events.status, "PUBLISHED")),
    db
      .select({
        slug: aiPublicDocuments.slug,
        locale: aiPublicDocumentVersions.language,
        publishedAt: aiPublicDocumentVersions.publishedAt,
      })
      .from(aiPublicDocumentVersions)
      .innerJoin(
        aiPublicDocuments,
        eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
      )
      .where(
        and(
          eq(aiPublicDocumentVersions.status, "PUBLISHED"),
          eq(aiPublicDocumentVersions.indexStatus, "INDEXED"),
        ),
      ),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of DEFAULT_PATHS) {
      const route = path ? `/${locale}/${path}` : `/${locale}`;
      entries.push({
        url: `${SITE_URL}${route}`,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${SITE_URL}${path ? `/${l}/${path}` : `/${l}`}`,
            ]),
          ),
        },
      });
    }

    for (const intake of intakeRows) {
      entries.push({
        url: `${SITE_URL}/${locale}/intakes/${encodeURIComponent(intake.slug)}`,
        lastModified: intake.updatedAt,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${SITE_URL}/${l}/intakes/${encodeURIComponent(intake.slug)}`,
            ]),
          ),
        },
      });
    }

    for (const story of storyRows) {
      entries.push({
        url: `${SITE_URL}/${locale}/stories/${encodeURIComponent(story.slug)}`,
        lastModified: story.updatedAt,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${SITE_URL}/${l}/stories/${encodeURIComponent(story.slug)}`,
            ]),
          ),
        },
      });
    }
  }

  const knowledgeBySlug = new Map<string, typeof knowledgeRows>();
  for (const row of knowledgeRows) {
    if (row.publishedAt === null) continue;
    knowledgeBySlug.set(row.slug, [
      ...(knowledgeBySlug.get(row.slug) ?? []),
      row,
    ]);
  }
  for (const [slug, versions] of knowledgeBySlug) {
    const languages = Object.fromEntries(
      versions.map((version) => [
        version.locale,
        `${SITE_URL}/${version.locale}/knowledge/${encodeURIComponent(slug)}`,
      ]),
    );
    for (const version of versions) {
      entries.push({
        url: `${SITE_URL}/${version.locale}/knowledge/${encodeURIComponent(slug)}`,
        lastModified: version.publishedAt ?? undefined,
        alternates: { languages },
      });
    }
  }

  return entries;
}
