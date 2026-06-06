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
import { Testimonials } from "@/components/public/testimonials";
import { HeroImage } from "@/components/public/hero-image";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getHomePageContent } from "@/lib/public/content";
import { StatCard } from "@/components/public/stat-card";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  const dictionary = await getDictionary(locale);
  const content = await getHomePageContent(locale);

  return (
    <main className="flex-1 overflow-y-auto bg-background text-foreground">
      <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden">
        <HeroImage
          src={content.heroImageUrl}
          fallbackSrc="/images/default-hero-image.jpg"
          alt={dictionary.home.heroImageAlt}
        />
        <div className="absolute inset-0 bg-white/42 dark:bg-black/58" />
        <div className="absolute inset-0 bg-linear-to-r from-background/74 via-background/35 to-transparent dark:from-background/82 dark:via-background/56 dark:to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-background/66 to-transparent dark:from-background/74" />

        <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {dictionary.home.intro}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/intakes`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {dictionary.home.primaryCta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background/75 px-4 text-sm font-semibold transition-colors hover:bg-muted"
              >
                {dictionary.home.secondaryCta}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-t border-border px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              {dictionary.home.statsTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {dictionary.home.statsIntro}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <JoinTheRanks
        title={dictionary.home.joinTheRanks.title}
        intro={dictionary.home.joinTheRanks.intro}
        steps={dictionary.home.joinTheRanks.steps}
      />

      <Testimonials
        title={dictionary.home.testimonials.title}
        intro={dictionary.home.testimonials.intro}
        testimonials={content.testimonials}
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
