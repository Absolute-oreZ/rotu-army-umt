import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";
import { fillTemplate } from "@/lib/i18n/format";

interface Step {
  title: string;
  description: string;
}

interface JoinTheRanksProps {
  title: string;
  intro: string;
  steps: Step[];
  stepAlt: string;
}

const STEP_IMAGES = [
  "/images/join-the-ranks-step-1.svg",
  "/images/join-the-ranks-step-2.svg",
  "/images/join-the-ranks-step-3.svg",
  "/images/join-the-ranks-step-4.svg",
] as const;

export function JoinTheRanks({
  title,
  intro,
  steps,
  stepAlt,
}: JoinTheRanksProps) {
  const renderedSteps = steps.slice(0, 4);

  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {intro}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-6 lg:space-y-9">
          {renderedSteps.map((step, idx) => {
            const image = STEP_IMAGES[idx] ?? STEP_IMAGES[0];

            return (
              <ScrollReveal key={step.title}>
                <article className="grid items-center gap-5 border-b border-border py-6 sm:grid-cols-[5rem_1fr_0.9fr] sm:py-8">
                  <div className="space-y-3">
                    <p className="font-mono text-3xl leading-none text-primary sm:text-4xl">
                      {String(idx + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      {step.description}
                    </p>
                  </div>

                  <div className="relative overflow-hidden border border-border bg-muted p-3 sm:p-4">
                    <div className="relative mx-auto aspect-4/3 w-full max-w-sm">
                      <Image
                        src={image}
                        alt={fillTemplate(stepAlt, {
                          number: idx + 1,
                          title: step.title,
                        })}
                        fill
                        sizes="(min-width: 640px) 384px, calc(100vw - 2rem)"
                        className="object-contain"
                      />
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
