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
  const { locale } = await params as { locale: Locale };

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
  const { locale } = await params as { locale: Locale };

  const [dictionary, stories] = await Promise.all([
    getDictionary(locale),
    getPublishedStoriesByYear(locale),
  ]);

  if (stories.years.length === 0) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
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
    <main className="h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">
      <section className="flex h-full flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto h-full w-full max-w-7xl overflow-hidden">
          <StoriesBrowser
            locale={locale}
            stories={stories}
          />
        </div>
      </section>
    </main>
  );
}