"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedList from "@/components/ui/animated-list";
import Stack, { type StackCard } from "@/components/ui/stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PublicIntakeDetail } from "@/lib/public/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { storageUrl } from "@/lib/supabase/storage-public";

type IntakeDetailClientProps = {
  dictionary: Dictionary["intakeDetailPage"] &
    Dictionary["intakesPage"] & {
      backLabel: string;
    };
  intake: PublicIntakeDetail;
  locale: Locale;
  orderedPatchExplanations: {
    key: "ANIMAL" | "COLOR" | "PHILOSOPHY";
    value: string;
  }[];
  heroImage: string | null;
  patchHero: string | null;
  uniformPhotos: { label: string; src: string }[];
  summary: string;
};

export function IntakeDetailClient({
  dictionary,
  intake,
  locale,
  orderedPatchExplanations,
  heroImage,
  patchHero,
  uniformPhotos,
  summary,
}: IntakeDetailClientProps) {
  const rosterRef = useRef<HTMLDivElement | null>(null);
  const stackedDisplayPhotos = useMemo(
    () => intake.displayPhotos.slice(0, 4),
    [intake.displayPhotos],
  );
  const mobileDisplayPhotos = useMemo(
    () => intake.displayPhotos,
    [intake.displayPhotos],
  );
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [desktopPhotoMap] = useState(
    () => new Map<number, string>(stackedDisplayPhotos.map((photo, index) => [index + 1, photo.photoPath])),
  );
  const patchImage =
    intake.patchPhotoPath ??
    intake.coverPhotoPath ??
    intake.displayPhotos[0]?.photoPath ??
    null;

  const patchExplanationKeys = ["ANIMAL", "COLOR", "PHILOSOPHY"] as const;

  const rotatingHeaderItems = useMemo(
    () => [
      intake.displayName,
      intake.tagLine ?? dictionary.taglineFallback,
    ],
    [dictionary.taglineFallback, intake.displayName, intake.tagLine],
  );

  const [headerIndex, setHeaderIndex] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    if (rotatingHeaderItems.length < 2) return;

    const timer = window.setInterval(() => {
      setHeaderVisible(false);

      window.setTimeout(() => {
        setHeaderIndex(
          (current) => (current + 1) % rotatingHeaderItems.length,
        );
        setHeaderVisible(true);
      }, 220);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [rotatingHeaderItems.length]);

  const activeHeaderText =
    rotatingHeaderItems[headerIndex] ?? rotatingHeaderItems[0];
  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    const roster = rosterRef.current;

    if (!roster) return;

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    roster.scrollTop += event.deltaY;
  };

  return (
    <>
      <section
        className="hidden h-[calc(100dvh-4rem)] flex-col gap-4 overflow-hidden px-4 py-4 lg:flex lg:px-6 xl:px-8"
        onWheel={handleWheel}
      >
        <div className="flex shrink-0 items-center justify-between">
          <Link
            href={`/${locale}/intakes`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {dictionary.backLabel}
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {dictionary.detailEyebrow}
          </p>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="grid min-h-0 gap-5 overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1.2fr)] lg:items-start">
                <div className="relative h-24 w-24">
                  {stackedDisplayPhotos.length > 0 ? (
                    <Stack
                      cards={stackedDisplayPhotos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative h-full w-full overflow-hidden rounded-[0.75rem] border border-border bg-card shadow-sm"
                        >
                          <Image
                            src={storageUrl(photo.photoPath)}
                            alt={`${intake.displayName} display ${index + 1}`}
                            fill
                            priority={index === 0}
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                      randomRotation
                      sendToBackOnClick
                      mobileClickOnly
                      pauseOnHover
                      sensitivity={90}
                      rotationStep={2.5}
                      animationConfig={{ stiffness: 220, damping: 18 }}
                      onCardDoubleClick={(card: StackCard) => {
                        setExpandedPhoto(desktopPhotoMap.get(card.id) ?? null);
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[0.75rem] border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                      {dictionary.noGalleryPhotos}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold uppercase tracking-[0.28em] text-primary">
                      {intake.intakeNo}
                    </p>

                    <p
                      className={cn(
                        "mt-2 max-w-2xl text-3xl font-semibold uppercase tracking-[0.12em] transition-all duration-500 ease-out xl:text-4xl",
                        headerVisible
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0",
                      )}
                    >
                      {activeHeaderText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <Tabs defaultValue="summary" className="grid min-h-0 gap-4">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="summary">
                      {dictionary.summaryTab}
                    </TabsTrigger>

                    <TabsTrigger value="patch">
                      {dictionary.patchTab}
                    </TabsTrigger>

                    <TabsTrigger value="uniform">
                      {dictionary.uniformTab}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="min-h-0">
                    <p className="text-sm leading-7 text-foreground/90">
                      {summary}
                    </p>
                  </TabsContent>

                  <TabsContent value="patch" className="min-h-0">
                    <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
                      <div className="relative w-full max-w-80 overflow-hidden rounded-[1.2rem] border border-border bg-card shadow-sm">
                        <div className="relative aspect-3/4">
                          {patchImage ? (
                            <Image
                              src={storageUrl(patchImage)}
                              alt={`${intake.displayName} patch`}
                              fill
                              sizes="(max-width: 1280px) 100vw, 260px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="grid min-h-0 gap-3">
                        <div className="grid gap-3">
                          {patchExplanationKeys.map((key) => {
                            const explanation = intake.patchExplanations.find(
                              (entry) => entry.key === key,
                            );

                            const value =
                              explanation?.translations[locale] ??
                              explanation?.translations.en;

                            return value ? (
                              <div
                                key={key}
                                className="space-y-1 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                  {key}
                                </p>

                                <p className="text-sm leading-6 text-muted-foreground">
                                  {value}
                                </p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="uniform" className="min-h-0">
                    <div className="grid gap-4 xl:grid-cols-2">
                      {[
                        {
                          label: dictionary.innerLabel,
                          src: intake.innerPhotoPath,
                        },
                        {
                          label: dictionary.tshirtLabel,
                          src: intake.tshirtPhotoPath,
                        },
                      ].map((item) =>
                        item.src ? (
                          <article
                            key={item.label}
                            className="overflow-hidden rounded-[1.2rem] border border-border bg-card shadow-sm"
                          >
                            <div className="relative aspect-4/3">
                              <Image
                                src={storageUrl(item.src)}
                                alt={`${intake.displayName} ${item.label}`}
                                fill
                                sizes="(max-width: 1280px) 100vw, 30vw"
                                className="object-cover"
                              />
                            </div>

                            <div className="p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                {item.label}
                              </p>
                            </div>
                          </article>
                        ) : null,
                      )}

                      {intake.innerPhotoPath ||
                      intake.tshirtPhotoPath ? null : (
                        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                          {dictionary.noUniformPhotos}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border border-border bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {dictionary.cadetsTitle}
                </p>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {intake.cadets.length}
              </p>
            </div>

            <div
              ref={rosterRef}
              className="min-h-0 overflow-y-auto pr-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {intake.cadets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {dictionary.noCadets}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {intake.cadets.map((cadet) => (
                    <article
                      key={cadet.id}
                      tabIndex={0}
                      className={cn(
                        "group relative h-44 overflow-hidden rounded-[0.85rem] border border-border/70 bg-background/80 shadow-sm outline-none transition-transform duration-300 perspective-distant focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      )}
                    >
                      <div className="relative h-full w-full transition-transform duration-700 transform-3d group-hover:transform-[rotateY(180deg)] group-focus-visible:transform-[rotateY(180deg)]">
                        <div className="absolute inset-0 flex flex-col backface-hidden">
                          <div className="relative flex-[0_0_74%]">
                            {cadet.displayPhotoPath ? (
                              <Image
                                src={storageUrl(cadet.displayPhotoPath)}
                                alt={cadet.displayName}
                                fill
                                sizes="(max-width: 1280px) 50vw, 22vw"
                                className="object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="flex flex-[0_0_26%] min-h-0 items-center justify-center px-2 py-1 text-center">
                            <h3 className="line-clamp-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                              {cadet.displayName}
                            </h3>
                          </div>

                          <span className="sr-only">
                            {cadet.quote ?? dictionary.quoteFallback}
                          </span>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center rounded-[0.85rem] border border-border bg-card p-2 backface-hidden transform-[rotateY(180deg)]">
                          <p className="text-center text-[0.68rem] leading-4 text-muted-foreground">
                            {cadet.quote ?? dictionary.quoteFallback}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <div className="lg:hidden">
        <section className="border-b border-border bg-linear-to-br from-muted/80 via-background to-muted/30 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <Link
              href={`/${locale}/intakes`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {dictionary.backLabel}
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {dictionary.detailEyebrow}
            </p>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="space-y-4">
              {mobileDisplayPhotos.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3 p-3">
                    {mobileDisplayPhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative aspect-4/5 w-[72%] min-w-[72%] shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"
                      >
                        <Image
                          src={storageUrl(photo.photoPath)}
                          alt={`${intake.displayName} display ${index + 1}`}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 72vw, 0"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : heroImage ? (
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <Image
                    src={heroImage}
                    alt={`${intake.displayName} hero`}
                    fill
                    priority
                    sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1280px) calc(100vw - 3rem), 80rem"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                  {dictionary.noGalleryPhotos}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {intake.intakeNo}
                </p>

                <h1
                  className={cn(
                    "text-3xl font-semibold uppercase tracking-[0.12em] transition-all duration-500 ease-out",
                    headerVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0",
                  )}
                >
                  {activeHeaderText}
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {dictionary.summaryTab}
              </h2>

              <p className="text-sm leading-6 text-muted-foreground">
                {summary}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {dictionary.uniformTab}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {uniformPhotos.map((photo) => (
                  <article
                    key={photo.label}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  >
                    <div className="relative aspect-4/3">
                      <Image
                        src={storageUrl(photo.src)}
                        alt={`${intake.displayName} ${photo.label}`}
                        fill
                        sizes="(max-width: 640px) calc(100vw - 2rem), calc(50vw - 2rem)"
                        className="object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {photo.label}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {dictionary.patchTab}
              </h2>

              {orderedPatchExplanations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                  {dictionary.noPatchExplanations}
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {patchHero ? (
                      <Image
                        src={storageUrl(patchHero)}
                        alt={`${intake.displayName} patch`}
                        fill
                        sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1280px) calc(100vw - 3rem), 80rem"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    {orderedPatchExplanations.map((item) => (
                      <article
                        key={item.key}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                          {item.key}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.value}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pb-8">
              <h2 className="text-xl font-semibold tracking-tight">
                {dictionary.cadetsTitle}
              </h2>

              {intake.cadets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                  {dictionary.noCadets}
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
                  <AnimatedList
                    items={intake.cadets.map((cadet) => (
                      <article
                        key={cadet.id}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                            {cadet.displayPhotoPath ? (
                              <Image
                                src={storageUrl(cadet.displayPhotoPath)}
                                alt={cadet.displayName}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold tracking-tight">
                              {cadet.displayName}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {cadet.quote ?? dictionary.quoteFallback}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                    showGradients
                    displayScrollbar
                    className="max-h-104"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {expandedPhoto ? (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setExpandedPhoto(null)}
          role="presentation"
        >
          <div className="flex h-[80vh] w-[80vw] max-h-225 max-w-300 items-center justify-center">
            <Image
              src={expandedPhoto}
              alt={`${intake.displayName} expanded display photo`}
              width={1200}
              height={900}
              sizes="(max-width: 1280px) 80vw, 1200px"
              className="max-h-full max-w-full object-contain"
              onClick={(event: React.MouseEvent) => event.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
