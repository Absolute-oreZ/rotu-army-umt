import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { IntakesTimeline } from "@/components/public/intakes-timeline";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublishedIntakeList } from "@/lib/public/content";
import { ContactRound } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };

  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.intakesPage.title,
    description: dictionary.intakesPage.description,
    alternates: {
      canonical: `/${locale}/intakes`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}/intakes`]),
      ),
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
  const { locale } = (await params) as { locale: Locale };

  const [dictionary, intakes] = await Promise.all([
    getDictionary(locale),
    getPublishedIntakeList(locale),
  ]);

  if (intakes.length === 0) {
    return (
      <main
        id="main-content"
        className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-foreground"
      >
        <Empty
          title={dictionary.intakesPage.emptyTitle}
          description={dictionary.intakesPage.emptyDescription}
          icon={<ContactRound />}
          action={
            <Button
              variant="link"
              className="text-muted-foreground border border-border"
            >
              <Link href={`/${locale}`}>
                {dictionary.intakesPage.emptyActionLabel}
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
            <p className="record-label">{dictionary.recordMarkers.intakes}</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              {dictionary.intakesPage.title}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              {dictionary.intakesPage.description}
            </p>
          </header>
          <IntakesTimeline
            intakes={intakes}
            locale={locale}
            dictionary={dictionary.intakesPage}
            registerLabel={dictionary.recordMarkers.intakesRegister}
          />
        </div>
      </section>
    </main>
  );
}
