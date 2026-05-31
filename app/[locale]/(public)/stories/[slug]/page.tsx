import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedStoryDetail, getSimilarStories } from "@/lib/public/content";
import { StoryPhotoCarousel } from "@/components/public/story-photo-carousel";
import { VideoPreview } from "@/components/public/video-preview";
import { formatDateRange } from "@/lib/utils";
import { TagLink } from "@/components/public/tag-link";
import { SimilarStories } from "@/components/public/similar-stories";
import { MetaRow } from "@/components/public/story-meta-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};

  const locale: Locale = rawLocale;
  const story = await getPublishedStoryDetail(locale, slug);
  if (!story) return {};

  const title = story.seoTitle ?? story.title;
  const description = story.seoDescription ?? story.summary ?? undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/stories/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/stories/${slug}`])),
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      url: `/${locale}/stories/${slug}`,
    },
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;

  const [dictionary, story] = await Promise.all([
    getDictionary(locale),
    getPublishedStoryDetail(locale, slug),
  ]);

  if (!story) {
    notFound();
  }

  const d = dictionary.storyDetailPage;
  const dateRange = formatDateRange(story.startDate, story.endDate, locale);
  const similarStories = await getSimilarStories(locale, story.id);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-4 sm:pt-6">
          <Link
            href={`/${locale}/stories`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {d.backLabel}
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {d.detailLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 pt-8 pb-16 sm:gap-10 sm:pt-10 lg:grid-cols-[1fr_20rem] lg:gap-12 xl:grid-cols-[1fr_22rem]">
          <div className="min-w-0 lg:order-1">
            {story.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <TagLink key={tag.slug} href={`/${locale}/stories/tags/${tag.slug}`}>
                    {tag.name}
                  </TagLink>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {story.title}
            </h1>

            {story.summary && (
              <p className="mt-4 text-base leading-6 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
                {story.summary}
              </p>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:order-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 flex flex-col gap-4">
              <MetaRow
                icon={<CalendarDays className="h-4 w-4" />}
                label={d.dateLabel}
                value={dateRange}
              />
              <MetaRow
                icon={<MapPin className="h-4 w-4" />}
                label={d.locationLabel}
                value={story.location}
              />
              {story.participantCount !== null && (
                <MetaRow
                  icon={<Users className="h-4 w-4" />}
                  label={d.participantsLabel}
                  value={story.participantCount.toLocaleString(locale)}
                />
              )}
            </div>

            {story.videoUrl && (
              <VideoPreview url={story.videoUrl} label={d.watchVideo} />
            )}

            {story.displayPhotos.length > 0 && (
              <StoryPhotoCarousel
                photos={story.displayPhotos}
                alt={story.title}
                className="w-full"
              />
            )}
          </aside>
        </div>

        <SimilarStories
          locale={locale}
          stories={similarStories}
          title={d.similarStoriesLabel}
        />
      </div>
    </main>
  );
}