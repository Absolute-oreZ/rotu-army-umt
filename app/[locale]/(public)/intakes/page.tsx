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
      <section className="relative isolate overflow-hidden border-b border-border bg-linear-to-br from-muted/80 via-background to-muted/30">
        <div className="absolute -left-32 top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-foreground/5 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {dictionary.intakesPage.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {dictionary.intakesPage.title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {dictionary.intakesPage.intro}
          </p>
        </div>
      </section>

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
