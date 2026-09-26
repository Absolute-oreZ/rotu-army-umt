import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SeeAlso } from "@/components/public/see-also";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { JoinTheRanks } from "@/components/public/join-the-ranks";
import { BestCadetSection } from "@/components/public/best-cadets/best-cadet-section";
import { HeroImage } from "@/components/public/hero-image";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getHomePageContent } from "@/lib/public/content";
import { StatCard } from "@/components/public/stat-card";
import { storageUrl } from "@/lib/supabase/storage-public";
import { isJoinTheRankEnabled } from "@/lib/env/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);

  return {
    title: dictionary.home.title,
    description: dictionary.home.intro,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`]),
      ),
    },
    openGraph: {
      title: dictionary.home.title,
      description: dictionary.home.intro,
      type: "website",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      url: `/${locale}`,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  const dictionary = await getDictionary(locale);
  const content = await getHomePageContent(locale);
  const heroImageSrc = content.heroImagePath ? storageUrl(content.heroImagePath) : "/images/default-hero-image.jpg";

  return (
    <main id="main-content" className="flex-1 bg-background text-foreground">
      <section className="px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="record-label">{dictionary.recordMarkers.home}</p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.96] tracking-tight sm:text-7xl">{dictionary.home.title}</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">{dictionary.home.intro}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/intakes`} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">{dictionary.home.primaryCta}<ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link href={`/${locale}/contact`} className="inline-flex min-h-11 items-center justify-center border border-border px-5 text-sm font-semibold hover:bg-muted">{dictionary.home.secondaryCta}</Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative aspect-[5/4] overflow-hidden border border-border bg-muted">
        {heroImageSrc ? (
          <HeroImage
            src={heroImageSrc}
            fallbackSrc="/images/default-hero-image.jpg"
            alt={dictionary.home.heroImageAlt}
          />
        ) : null}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-7xl">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              {dictionary.home.statsTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {dictionary.home.statsIntro}
            </p>
            <div className="mt-8 grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0">
              <StatCard
                label={dictionary.home.intakeCountLabel}
                value={content.stats.intakeCount}
              />
              <StatCard
                label={dictionary.home.officerCountLabel}
                value={content.stats.officerCount}
              />
              <StatCard
                label={dictionary.home.instructorCountLabel}
                value={content.stats.instructorCount}
              />
              <StatCard
                label={dictionary.home.cadetCountLabel}
                value={content.stats.cadetCount}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">{dictionary.home.faqTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {dictionary.home.faqIntro}
            </p>
            <div className="mt-8">
              {content.faqs.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {dictionary.home.faqEmpty}
                </p>
              ) : (
                <Accordion type="single" collapsible className="w-full border-t border-border">
                  {content.faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {isJoinTheRankEnabled() ? <JoinTheRanks
        title={dictionary.home.joinTheRanks.title}
        intro={dictionary.home.joinTheRanks.intro}
        steps={dictionary.home.joinTheRanks.steps}
        stepAlt={dictionary.home.joinTheRanks.stepAlt}
      /> : null}

      <BestCadetSection
        cadets={content.bestCadets}
        locale={locale}
        dictionary={dictionary.home.bestCadets}
      />

      <section className="border-t border-border py-14 sm:py-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <ScrollReveal>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                {dictionary.home.seeAlsoTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {dictionary.home.seeAlsoIntro}
              </p>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal className="mt-8">
          <SeeAlso
            items={content.seeAlsoLinks}
            dictionary={dictionary}
          />
        </ScrollReveal>
      </section>
    </main>
  );
}
