"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import type { PublicIntake } from "@/lib/public/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

const FALLBACK_INTAKE_IMAGE = "/images/default-hero-image.jpg";

type IntakesTimelineProps = {
  intakes: PublicIntake[];
  locale: Locale;
  dictionary: Dictionary["intakesPage"];
};

export function IntakesTimeline({ intakes, locale, dictionary }: IntakesTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const element = timelineRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const start = rect.top + window.scrollY - viewport * 0.25;
      const end = rect.bottom + window.scrollY - viewport * 0.65;
      const next = Math.max(
        0,
        Math.min(1, (window.scrollY - start) / Math.max(1, end - start)),
      );
      setProgress(next);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  if (intakes.length === 0) {
    return (
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute left-7 top-0 h-full w-px bg-border sm:left-10" />
        <div className="relative pl-8 sm:pl-10">
          <span className="absolute left-0 top-1 inline-flex h-4 w-4 rounded-full border-2 border-primary bg-background" />
          <h2 className="text-2xl font-semibold tracking-tight">{dictionary.emptyTitle}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            {dictionary.emptyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={timelineRef} className="relative">
      <div className="pointer-events-none absolute left-3 top-0 h-full w-px bg-border sm:left-4 lg:left-1/2 lg:-translate-x-1/2" />
      <span
        className="pointer-events-none absolute left-0.5 z-10 inline-flex h-6 w-6 rounded-full border-2 border-primary bg-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--background)_88%,transparent)] transition-[top] duration-150 sm:left-[0.35rem] lg:left-1/2 lg:-translate-x-1/2"
        style={{ top: `calc(${(progress * 100).toFixed(3)}% - 0.75rem)` }}
      />

      <div className="space-y-16 sm:space-y-20">
        {intakes.map((intake, index) => {
          const isEven = index % 2 === 0;
          const coverColumnClass = isEven
            ? "lg:col-start-1 lg:row-start-1"
            : "lg:col-start-3 lg:row-start-1";
          const detailColumnClass = isEven
            ? "lg:col-start-3 lg:row-start-1"
            : "lg:col-start-1 lg:row-start-1";
          const coverSrc = intake.coverPhotoPath ?? FALLBACK_INTAKE_IMAGE;
          const patchSrc = intake.patchPhotoPath ?? FALLBACK_INTAKE_IMAGE;

          return (
            <ScrollReveal key={intake.slug}>
              <article className="relative pl-10 sm:pl-12 lg:pl-0">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] lg:items-start lg:gap-x-8">
                  <div className={`${coverColumnClass} group w-full`}>
                    <div className="relative aspect-5/3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                      <Image
                        src={coverSrc}
                        alt={`${intake.displayName} - ${dictionary.cardImageAlt}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>

                  <div className={`${detailColumnClass} w-full`}>
                    <div className="inline-flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src={patchSrc}
                          alt={`${intake.displayName} - ${dictionary.cardImageAlt}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {intake.intakeNo}
                        </p>
                        <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                          {intake.displayName}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {intake.summary ?? dictionary.summaryFallback}
                    </p>

                    <Link
                      href={`/${locale}/intakes/${intake.slug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {dictionary.viewDetails}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
