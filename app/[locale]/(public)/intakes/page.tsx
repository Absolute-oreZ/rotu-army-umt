import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntakesTimeline } from "@/components/public/intakes-timeline";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedIntakeList } from "@/lib/public/content";

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
    title: dictionary.intakesPage.title,
    description: dictionary.intakesPage.description,
    alternates: {
      canonical: `/${locale}/intakes`,
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}/intakes`])),
    },
    openGraph: {
      title: dictionary.intakesPage.title,
      description: dictionary.intakesPage.description,
      type: "website",
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      url: `/${locale}/intakes`,
    },
  };
}

export default async function IntakesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const [dictionary, intakes] = await Promise.all([
    getDictionary(locale),
    getPublishedIntakeList(locale),
  ]);

  return (
    <main className="flex-1 overflow-y-auto bg-background text-foreground">
      <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <IntakesTimeline
            intakes={intakes}
            locale={locale}
            dictionary={dictionary.intakesPage}
          />
        </div>
      </section>
    </main>
  );
}
