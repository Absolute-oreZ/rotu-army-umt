import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicBestCadet } from "@/lib/public/content";
import { BestCadetLead } from "./best-cadet-lead";
import { BestCadetRegister } from "./best-cadet-register";

export function BestCadetSection({
  cadets,
  locale,
  dictionary,
}: {
  cadets: PublicBestCadet[];
  locale: Locale;
  dictionary: Dictionary["home"]["bestCadets"];
}) {
  if (cadets.length === 0) return null;
  const [lead, ...remaining] = cadets;
  return (
    <section
      aria-labelledby="best-cadet-heading"
      className="border-t border-border bg-[color-mix(in_oklab,var(--primary)_12%,var(--background))] px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div>
            <p className="record-label">{dictionary.eyebrow}</p>
            <h2
              id="best-cadet-heading"
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {dictionary.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            {dictionary.intro}
          </p>
        </header>
        <BestCadetLead cadet={lead} locale={locale} dictionary={dictionary} />
        {remaining.length > 0 ? (
          <BestCadetRegister
            cadets={remaining}
            locale={locale}
            dictionary={dictionary}
          />
        ) : null}
      </div>
    </section>
  );
}
