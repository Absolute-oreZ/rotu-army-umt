"use client";

import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";

interface Step {
  title: string;
  description: string;
}

interface JoinTheRanksProps {
  title: string;
  intro: string;
  steps: Step[];
}

const STEP_COLORS = ["#535fc1", "#e15151", "#d8e156", "#58bbb9"] as const;
const STEP_IMAGES = [
  "/images/join-the-ranks-step-1.svg",
  "/images/join-the-ranks-step-2.svg",
  "/images/join-the-ranks-step-3.svg",
  "/images/join-the-ranks-step-4.svg",
] as const;

export function JoinTheRanks({ title, intro, steps }: JoinTheRanksProps) {
  const renderedSteps = steps.slice(0, 4);

  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {intro}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-6 lg:space-y-9">
          {renderedSteps.map((step, idx) => {
            const color = STEP_COLORS[idx] ?? STEP_COLORS[0];
            const image = STEP_IMAGES[idx] ?? STEP_IMAGES[0];
            const isReverse = idx % 2 === 1;

            return (
              <ScrollReveal key={step.title}>
                <article
                  className={`grid items-center gap-5 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:p-5 lg:grid-cols-2 lg:p-6 ${
                    isReverse ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <p className="text-4xl font-semibold leading-none sm:text-5xl" style={{ color }}>
                      {String(idx + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">{step.title}</h3>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      {step.description}
                    </p>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-xl border border-border/80 bg-background p-4 shadow-[0_10px_30px_rgba(0,0,0,0.14)] sm:p-5"
                    style={{ boxShadow: `0 16px 38px color-mix(in oklab, ${color} 30%, transparent)` }}
                  >
                    <div
                      className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-25"
                      style={{ backgroundColor: color }}
                    />
                    <div
                      className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full opacity-20"
                      style={{ backgroundColor: color }}
                    />
                    <div className="relative mx-auto aspect-4/3 w-full max-w-sm">
                      <Image src={image} alt={`Join the ranks step ${idx + 1}`} fill className="object-contain" />
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
