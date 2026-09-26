import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { PublicIntake } from "@/lib/public/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { storageUrl } from "@/lib/supabase/storage-public";
import { fillTemplate } from "@/lib/i18n/format";

type IntakesTimelineProps = {
  intakes: PublicIntake[];
  locale: Locale;
  dictionary: Dictionary["intakesPage"];
  registerLabel: string;
};

export function IntakesTimeline({
  intakes,
  locale,
  dictionary,
  registerLabel,
}: IntakesTimelineProps) {
  const coverAlt = (intake: PublicIntake) =>
    fillTemplate(dictionary.coverImageAlt, { intake: intake.displayName });

  return (
    <div className="grid gap-10 lg:grid-cols-[10rem_1fr]">
      <aside className="self-start lg:sticky lg:top-24">
        <p className="record-label mb-3">{registerLabel}</p>
        <p className="max-w-48 text-sm leading-6 text-muted-foreground">
          {dictionary.description}
        </p>
      </aside>
      <div className="divide-y divide-border border-y border-border">
        {intakes.map((intake, index) => (
          <article
            key={intake.slug}
            className="grid gap-6 py-8 md:grid-cols-[5rem_minmax(0,1fr)] lg:grid-cols-[5rem_1fr_0.8fr] lg:gap-8"
          >
            <div className="font-mono text-2xl tabular-nums text-primary">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="relative aspect-5/3 overflow-hidden border border-border bg-muted lg:aspect-4/3">
              {intake.coverPhotoPath ? (
                <Image
                  src={storageUrl(intake.coverPhotoPath)}
                  alt={coverAlt(intake)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              ) : intake.patchPhotoPath ? (
                <Image
                  src={storageUrl(intake.patchPhotoPath)}
                  alt={coverAlt(intake)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-contain p-10"
                />
              ) : null}
            </div>
            <div className="flex flex-col justify-center">
              <p className="record-label">
                {dictionary.intakeNoLabel} / {intake.intakeNo}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {intake.displayName}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                {intake.summary ?? dictionary.summaryFallback}
              </p>
              <Link
                href={`/${locale}/intakes/${intake.slug}`}
                className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {dictionary.viewDetails}
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
