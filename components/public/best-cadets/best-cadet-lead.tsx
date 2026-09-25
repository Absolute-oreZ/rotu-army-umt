import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicBestCadet } from "@/lib/public/content";
import { BestCadetPortrait } from "./best-cadet-portrait";
import { BestCadetMeta } from "./best-cadet-meta";
import { BestCadetQuote } from "./best-cadet-quote";
import { fillTemplate } from "@/lib/i18n/format";

export function BestCadetLead({
  cadet,
  locale,
  dictionary,
}: {
  cadet: PublicBestCadet;
  locale: Locale;
  dictionary: Dictionary["home"]["bestCadets"];
}) {
  return (
    <article className="grid gap-8 border-b border-border py-10 lg:grid-cols-[minmax(16rem,0.8fr)_1.2fr] lg:gap-14 lg:py-14">
      <BestCadetPortrait
        path={cadet.portraitPath}
        name={fillTemplate(dictionary.portraitAlt, { name: cadet.displayName })}
        sizes="(max-width: 1024px) 100vw, 36vw"
        loading="eager"
      />
      <div className="flex flex-col justify-center">
        <p className="record-label">
          {dictionary.title} · {cadet.awardYear}
        </p>
        <h3 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
          {cadet.displayName}
        </h3>
        <BestCadetMeta
          year={cadet.awardYear}
          intake={cadet.intakeNo}
          intakeLabel={dictionary.intakeLabel}
        />
        <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          {cadet.summary}
        </p>
        <div className="mt-8">
          <BestCadetQuote quote={cadet.quote} label={dictionary.quoteLabel} />
        </div>
        {cadet.relatedStorySlug ? (
          <Link
            href={`/${locale}/stories/${cadet.relatedStorySlug}`}
            aria-label={fillTemplate(dictionary.exploreMoreLabel, {
              name: cadet.displayName,
            })}
            className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            {dictionary.exploreMore}
            <ArrowUpRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
