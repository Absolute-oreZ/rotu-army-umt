import type { MetadataRoute } from "next";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { events, intakes } from "@/db/schema";
import { locales } from "@/lib/i18n/config";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const DEFAULT_PATHS = ["", "intakes", "stories", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [intakeRows, storyRows] = await Promise.all([
    db
      .select({ slug: intakes.slug, updatedAt: intakes.updatedAt })
      .from(intakes)
      .where(eq(intakes.status, "PUBLISHED")),
    db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(eq(events.status, "PUBLISHED")),
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

  return entries;
}
