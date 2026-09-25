import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicBestCadet } from "@/lib/public/content";
import { BestCadetPortrait } from "./best-cadet-portrait";
import { BestCadetMeta } from "./best-cadet-meta";
import { fillTemplate } from "@/lib/i18n/format";

export function BestCadetRegister({
  cadets,
  locale,
  dictionary,
}: {
  cadets: PublicBestCadet[];
  locale: Locale;
  dictionary: Dictionary["home"]["bestCadets"];
}) {
  return (
    <div className="pt-10">
      <p className="record-label mb-4">{dictionary.registerLabel}</p>
      <ol className="divide-y divide-border border-y border-border">
        {cadets.map((cadet) => (
          <li
            key={cadet.id}
            className="grid gap-4 py-5 sm:grid-cols-[4rem_4rem_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="font-mono text-sm text-primary">
              {cadet.awardYear}
            </span>
            <BestCadetPortrait
              path={cadet.portraitPath}
              name={fillTemplate(dictionary.portraitAlt, {
                name: cadet.displayName,
              })}
              sizes="64px"
            />
            <article>
              <h3 className="text-lg font-semibold">{cadet.displayName}</h3>
              <BestCadetMeta
                year={cadet.awardYear}
                intake={cadet.intakeNo}
                intakeLabel={dictionary.intakeLabel}
              />
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {cadet.summary}
              </p>
            </article>
            {cadet.relatedStorySlug ? (
              <Link
                href={`/${locale}/stories/${cadet.relatedStorySlug}`}
                aria-label={fillTemplate(dictionary.exploreMoreLabel, {
                  name: cadet.displayName,
                })}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {dictionary.exploreMore}
                <ArrowUpRight className="size-4" />
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
