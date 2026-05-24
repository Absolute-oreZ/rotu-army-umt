import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoriesBrowser } from "@/components/public/stories-browser";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedStoriesByYear } from "@/lib/public/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
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
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;

  const [dictionary, stories] = await Promise.all([
    getDictionary(locale),
    getPublishedStoriesByYear(locale),
  ]);

  return (
    <main className="h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">
      <section className="flex h-full flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto h-full w-full max-w-7xl overflow-hidden">
          <StoriesBrowser
            locale={locale}
            dictionary={dictionary.storiesPage}
            stories={stories}
          />
        </div>
      </section>
    </main>
  );
}