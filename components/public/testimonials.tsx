"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { storageUrl } from "@/lib/supabase/storage-public";
import { PublicTestimonial } from "@/lib/public/content";

interface TestimonialsProps {
  title: string;
  intro: string;
  testimonials: PublicTestimonial[];
}

const AUTOPLAY_MS = 5000;

export function Testimonials({ title, intro, testimonials }: TestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (testimonials.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, testimonials.length]);

  if (testimonials.length === 0) return null;

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () =>
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);

  return (
    <section
      className="relative overflow-hidden border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label={title}
    >
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground sm:text-base">
            {intro}
          </p>
        </ScrollReveal>

        <div className="mt-10">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/70 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((t) => (
                <article key={t.id} className="w-full shrink-0 p-6 sm:p-8 lg:p-10">
                  <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]">
                    <div className="relative">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border bg-muted">
                        {t.authorImagePath ? (
                          <Image src={storageUrl(t.authorImagePath)} alt={t.authorName} fill className="object-cover" sizes="100%" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                            {t.authorName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-3 -right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
                        <Quote className="size-4" aria-hidden="true" />
                      </div>
                    </div>

                    <div>
                      <blockquote className="text-lg leading-8 text-foreground sm:text-xl">
                        &ldquo;{t.content}&rdquo;
                      </blockquote>
                      <div className="mt-5 border-t border-border/70 pt-4">
                        <p className="text-base font-semibold">{t.authorName}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {t.authorRank}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted"
                aria-label="Next testimonial"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {testimonials.map((testimonial, idx) => (
                <button
                  key={testimonial.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-full transition-all ${
                    idx === activeIndex ? "h-2.5 w-8 bg-primary" : "h-2.5 w-2.5 bg-border"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  aria-current={idx === activeIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
