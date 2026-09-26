import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { PublicStoriesByYear } from "@/lib/public/content";
import { storageUrl } from "@/lib/supabase/storage-public";
import { fillTemplate } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type StoriesBrowserProps = {
  locale: Locale;
  stories: PublicStoriesByYear;
  markers: Dictionary["recordMarkers"];
};

export function StoriesBrowser({ locale, stories, markers }: StoriesBrowserProps) {
  const recordCount = (count: number) =>
    fillTemplate(
      count === 1 ? markers.recordsCountOne : markers.recordsCountOther,
      { count },
    );

  return <div className="grid gap-10 lg:grid-cols-[9rem_1fr]">
    <aside className="self-start lg:sticky lg:top-24"><p className="record-label mb-3">{markers.storiesIndex}</p><nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" aria-label={markers.storyYears}>{stories.years.map((year) => <a key={year} href={`#year-${year}`} className="shrink-0 border-l-2 border-border px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">{year}</a>)}</nav></aside>
    <div className="space-y-16">{stories.years.map((year) => { const entries = stories.byYear[year] ?? []; return <section key={year} id={`year-${year}`} className="scroll-mt-24"><div className="mb-5 flex items-baseline justify-between border-b border-border pb-3"><h2 className="font-mono text-2xl tabular-nums">{year}</h2><span className="record-label">{recordCount(entries.length)}</span></div><div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">{entries.map((story, index) => <article key={story.id} className={index === 0 ? "sm:col-span-2" : ""}><Link href={`/${locale}/stories/${story.slug}`} className="group block"><div className={`relative overflow-hidden border border-border bg-muted ${index === 0 ? "aspect-[16/8]" : "aspect-[4/3]"}`}>{story.coverPhotoPath ? <Image src={storageUrl(story.coverPhotoPath)} alt={story.title} fill sizes={index === 0 ? "(max-width: 640px) 100vw, 80vw" : "(max-width: 640px) 100vw, 40vw"} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /> : null}<span className="absolute left-3 top-3 bg-background/90 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em]">{String(story.id).padStart(4, "0")}</span></div><div className="mt-3 flex items-start justify-between gap-4"><h3 className="max-w-xl text-lg font-semibold leading-tight group-hover:text-primary">{story.title}</h3><span className="font-mono text-xs text-muted-foreground">{year}</span></div></Link></article>)}</div></section>; })}</div>
  </div>;
}
