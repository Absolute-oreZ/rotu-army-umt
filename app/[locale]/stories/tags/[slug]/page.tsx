import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LibraryBig } from "lucide-react";
import { StoriesBrowser } from "@/components/public/stories-browser";
import { locales, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedStoriesByTag } from "@/lib/public/content";
import { Empty } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params as { locale: Locale; slug: string };

  if (!isLocale(locale)) notFound();

  const [dictionary, archive] = await Promise.all([
    getDictionary(locale),
    getPublishedStoriesByTag(locale, slug),
  ]);

  if (!archive) {
    notFound();
  }

  const title = `${archive.tag.name} - ${dictionary.storiesPage.title}`;

  return {
    title,
    description: dictionary.storyTagPage.description,
    alternates: {
      canonical: `/${locale}/stories/tags/${slug}`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}/stories/tags/${slug}`]),
      ),
    },
    openGraph: {
      title,
      description: dictionary.storyTagPage.description,
      type: "website",
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      url: `/${locale}/stories/tags/${slug}`,
    },
  };
}

export default async function StoryTagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params as { locale: Locale; slug: string };

  if (!isLocale(locale)) notFound();

  const [dictionary, archive] = await Promise.all([
    getDictionary(locale),
    getPublishedStoriesByTag(locale, slug),
  ]);

  if (!archive) {
    notFound();
  }

  const d = dictionary.storyTagPage;

  if (archive.stories.years.length === 0) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
        <Empty
          title={dictionary.storyTagPage.emptyTitle}
          description={dictionary.storyTagPage.emptyDescription}
          icon={<LibraryBig />}
          action={
            <Button
              variant="link"
              className="border border-border text-muted-foreground"
            >
              <Link href={`/${locale}`}>
                {dictionary.storyTagPage.emptyActionLabel}
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">
      <section className="flex h-full flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/${locale}/stories`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {d.backLabel}
            </Link>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {d.archiveLabel}
            </span>
          </div>

          <header className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {archive.tag.name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {d.description}
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            <StoriesBrowser
              locale={locale}
              stories={archive.stories}
            />
          </div>
        </div>
      </section>
    </main>
  );
}