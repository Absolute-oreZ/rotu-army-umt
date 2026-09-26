import type { Metadata } from "next";
import Link from "next/link";
import { StoriesBrowser } from "@/components/public/stories-browser";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedStoriesByYear } from "@/lib/public/content";
import { Empty } from "@/components/ui/empty";
import { LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.storiesPage.title,
    description: dictionary.storiesPage.description,
    alternates: {
      canonical: `/${locale}/stories`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}/stories`]),
      ),
    },
    openGraph: {
      title: dictionary.storiesPage.title,
      description: dictionary.storiesPage.description,
      type: "website",
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      url: `/${locale}/stories`,
    },
  };
}

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };

  const [dictionary, stories] = await Promise.all([
    getDictionary(locale),
    getPublishedStoriesByYear(locale),
  ]);

  if (stories.years.length === 0) {
    return (
      <main
        id="main-content"
        className="flex min-h-[calc(100dvh-4rem)] items-center justify-center"
      >
        <Empty
          title={dictionary.storiesPage.emptyTitle}
          description={dictionary.storiesPage.emptyDescription}
          icon={<LibraryBig />}
          action={
            <Button
              variant="link"
              className="border border-border text-muted-foreground"
            >
              <Link href={`/${locale}`}>
                {dictionary.storiesPage.emptyActionLabel}
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 bg-background text-foreground">
      <section className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto w-full max-w-7xl">
          <header className="mb-14 max-w-3xl">
            <p className="record-label">{dictionary.recordMarkers.stories}</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              {dictionary.storiesPage.title}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              {dictionary.storiesPage.description}
            </p>
          </header>
          <StoriesBrowser
            locale={locale}
            stories={stories}
            markers={dictionary.recordMarkers}
          />
        </div>
      </section>
    </main>
  );
}
