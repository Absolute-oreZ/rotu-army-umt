"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Masonry, { type MasonryItem } from "@/components/ui/masonry";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicStoriesByYear } from "@/lib/public/content";
import { cn } from "@/lib/utils";

type StoriesBrowserProps = {
  locale: Locale;
  dictionary: Dictionary["storiesPage"];
  stories: PublicStoriesByYear;
};

export function StoriesBrowser({
  locale,
  dictionary,
  stories,
}: StoriesBrowserProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(
    stories.years[0] ?? null,
  );

  const rosterRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeYear = useMemo(() => {
    if (selectedYear !== null && stories.years.includes(selectedYear)) {
      return selectedYear;
    }

    return stories.years[0] ?? null;
  }, [selectedYear, stories.years]);

  useEffect(() => {
    const container = containerRef.current;
    const roster = rosterRef.current;

    if (!container || !roster) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest("[data-years-scroll]")) {
        return;
      }

      event.preventDefault();
      roster.scrollTop += event.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const masonryItems = useMemo<MasonryItem[]>(() => {
    if (activeYear === null) {
      return [];
    }

    return (stories.byYear[activeYear] ?? []).map((program) => ({
      id: String(program.id),
      img: program.coverPhotoPath,
      url: `/${locale}/stories/${program.slug}`,
      width: program.coverPhotoWidth ?? 1000,
      height: program.coverPhotoHeight ?? 1000,
      title: program.title,
    }));
  }, [activeYear, locale, stories.byYear]);

  if (stories.years.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          {dictionary.emptyTitle}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
          {dictionary.emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid h-full min-h-0 gap-6 overflow-hidden md:grid-cols-[10rem_minmax(0,1fr)]"
    >
      <aside className="min-h-0 overflow-hidden">
        <div
          data-years-scroll
          className="
            flex gap-2 overflow-x-auto pb-1
            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden

            md:h-full md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0
          "
        >
          {stories.years.map((year) => {
            const isActive = year === activeYear;

            return (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2 text-left text-sm font-semibold transition-colors hover:cursor-pointer",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </aside>

      <section
        ref={rosterRef}
        className="
          min-h-0 overflow-y-auto pr-1
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        <Masonry
          key={activeYear}
          items={masonryItems}
          animateFrom="bottom"
          blurToFocus
          colorShiftOnHover={false}
          duration={0.6}
          ease="power3.out"
          hoverScale={0.97}
          scaleOnHover
          stagger={0.05}
        />
      </section>
    </div>
  );
}