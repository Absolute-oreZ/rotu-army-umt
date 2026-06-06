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
  const { locale } = await params as { locale: Locale };

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

export default async function IntakesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params as { locale: Locale };

  const [dictionary, intakes] = await Promise.all([
    getDictionary(locale),
    getPublishedIntakeList(locale),
  ]);

  if (intakes.length === 0) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-background text-foreground">
        <Empty
          title={dictionary.intakesPage.emptyTitle}
          description={dictionary.intakesPage.emptyDescription}
          icon={<ContactRound />}
          action={
            <Button variant="link" className="text-muted-foreground border border-border">
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