"use client";

import Image from "next/image";
import Link from "next/link";
import FlowingMenu from "./flowing-menu";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface SeeAlsoItem {
  title: string;
  link: string;
  imageUrl: string | null;
}

interface SeeAlsoProps {
  items: SeeAlsoItem[];
  dictionary: Dictionary;
}

export function SeeAlso({ items, dictionary }: SeeAlsoProps) {
  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          {dictionary.home.seeAlsoEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop View: Flowing Menu */}
      <div className="hidden lg:block w-full py-8">
        <div className="min-h-176">
          <FlowingMenu
            items={items.map((item) => ({
              image: item.imageUrl ?? "/images/default-hero-image.jpg",
              link: item.link,
              text: item.title,
            }))}
          />
        </div>
      </div>

      {/* Mobile View: Structured Grid */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6 lg:px-8 py-8">
        {items.map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className="group relative overflow-hidden rounded-md border border-border bg-card transition-all"
          >
            <div className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={item.imageUrl ?? "/images/war-fist.png"}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold uppercase tracking-wide text-foreground transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">{dictionary.home.seeAlsoExplore} &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
