import "server-only";
import { and, count, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  webappContents,
  seeMoreLinks,
  testimonials,
  testimonialTranslations,
  frequentlyAskedQuestions,
  frequentlyAskedQuestionTranslations,
  members,
  cadets,
  intakes,
  intakeTranslations,
  intakeDisplayPhotos,
  intakePatchExplanations,
  intakePatchExplanationTranslations,
  events,
  eventTranslations,
  eventDisplayPhotos,
  eventTags,
  eventTagTranslations,
  eventsToTags,
  contactReasons,
  contactReasonTranslations,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import {
  DEFAULT_HERO_IMAGE_URL,
  DEFAULT_GOOGLE_MAP_LOCATION_URL,
  DEFAULT_OFFICIAL_EMAIL,
  DEFAULT_FACEBOOK_URL,
  DEFAULT_INSTAGRAM_URL,
  DEFAULT_YOUTUBE_URL,
  DEFAULT_TIKTOK_URL,
  DEFAULT_X_URL,
  DEFAULT_FAQ_ENTRIES,
  DEFAULT_SEE_MORE_LINKS
} from "@/lib/data";

export type HomePageContent = {
  faqs: Array<{
    answer: string;
    id: number;
    question: string;
  }>;
  heroImageUrl: string;
  seeAlsoLinks: Array<{
    id: number;
    imageUrl: string | null;
    link: string;
    title: string;
  }>;
  stats: {
    cadetCount: number;
    intakeCount: number;
    instructorCount: number;
    officerCount: number;
  };
  testimonials: PublicTestimonial[];
};

export type PublicTestimonial = {
  id: number;
  authorName: string;
  authorRank: string;
  authorImageUrl: string | null;
  content: string;
};

export type PublicIntake = {
  intakeNo: string;
  displayName: string;
  slug: string;
  patchPhotoPath: string | null;
  coverPhotoPath: string | null;
  summary: string | null;
};

export type PublicIntakePatchExplanation = {
  key: string;
  translations: Partial<Record<Locale, string>>;
};

export type PublicIntakeDisplayPhoto = {
  id: number;
  photoPath: string;
};

export type PublicIntakeCadet = {
  id: number;
  displayName: string;
  displayPhotoPath: string | null;
  quote: string | null;
};

export type PublicIntakeDetail = PublicIntake & {
  innerPhotoPath: string | null;
  seoDescription: string | null;
  seoTitle: string | null;
  tagLine: string | null;
  tshirtPhotoPath: string | null;
  displayPhotos: PublicIntakeDisplayPhoto[];
  patchExplanations: PublicIntakePatchExplanation[];
  cadets: PublicIntakeCadet[];
};

export type PublicStoryProgram = {
  id: number;
  slug: string;
  startYear: number;
  coverPhotoPath: string;
  coverPhotoWidth: number | null;
  coverPhotoHeight: number | null;
  title: string;
};

export type PublicStoriesByYear = {
  years: number[];
  byYear: Record<number, PublicStoryProgram[]>;
};

export type PublicStoryTag = {
  slug: string;
  name: string;
};

export type PublicStoryTagArchive = {
  stories: PublicStoriesByYear;
  tag: PublicStoryTag;
};

export type PublicStoryDisplayPhoto = {
  id: number;
  photoPath: string;
};

export type PublicStoryDetail = {
  id: number;
  slug: string;
  name: string;
  title: string;
  summary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  startDate: Date;
  endDate: Date;
  location: string;
  participantCount: number | null;
  coverPhotoPath: string | null;
  coverPhotoWidth: number | null;
  coverPhotoHeight: number | null;
  videoUrl: string | null;
  tags: PublicStoryTag[];
  displayPhotos: PublicStoryDisplayPhoto[];
};

export type PublicContactReason = {
  id: number;
  iconKey: string;
  title: string;
  description: string;
};

export type ContactPageContent = {
  googleMapLocationUrl: string;
  officialEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  xUrl: string;
  contactReasons: PublicContactReason[];
};

const FALLBACK_STATS = {
  cadetCount: 120,
  intakeCount: 12,
  instructorCount: 18,
  officerCount: 24,
} as const;

const FALLBACK_SEE_ALSO_LINKS: HomePageContent["seeAlsoLinks"] = DEFAULT_SEE_MORE_LINKS.map(
  (entry, index) => ({
    id: index + 1,
    imageUrl: entry.imageUrl,
    link: entry.link,
    title: entry.title,
  }),
);

const FALLBACK_FAQS: Record<Locale, HomePageContent["faqs"]> = {
  en: DEFAULT_FAQ_ENTRIES.map((entry, index) => ({
    id: index + 1,
    question: entry.en.question,
    answer: entry.en.answer,
  })),
  ms: DEFAULT_FAQ_ENTRIES.map((entry, index) => ({
    id: index + 1,
    question: entry.ms.question,
    answer: entry.ms.answer,
  })),
  zh: DEFAULT_FAQ_ENTRIES.map((entry, index) => ({
    id: index + 1,
    question: entry.zh.question,
    answer: entry.zh.answer,
  })),
  ta: DEFAULT_FAQ_ENTRIES.map((entry, index) => ({
    id: index + 1,
    question: entry.ta.question,
    answer: entry.ta.answer,
  })),
};

export async function getHomePageContent(locale: Locale): Promise<HomePageContent> {
  const [
    singletonContent,
    intakeCountRows,
    officerCountRows,
    instructorCountRows,
    cadetCountRows,
    faqRows,
    linksRows,
    testimonialRows,
  ] = await Promise.all([
    db.select({ heroImageUrl: webappContents.heroImageUrl }).from(webappContents).limit(1),
    db
      .select({ value: count(intakes.id) })
      .from(intakes)
      .where(eq(intakes.status, "PUBLISHED")),
    db
      .select({ value: count(members.id) })
      .from(members)
      .where(eq(members.role, "OFFICER")),
    db
      .select({ value: count(members.id) })
      .from(members)
      .where(eq(members.role, "INSTRUCTOR")),
    db
      .select({ value: count(cadets.id) })
      .from(cadets)
      .where(eq(cadets.isActive, true)),
    db
      .select({
        answer: frequentlyAskedQuestionTranslations.answer,
        id: frequentlyAskedQuestions.id,
        question: frequentlyAskedQuestionTranslations.question,
      })
      .from(frequentlyAskedQuestions)
      .innerJoin(
        frequentlyAskedQuestionTranslations,
        and(
          eq(frequentlyAskedQuestionTranslations.faqId, frequentlyAskedQuestions.id),
          eq(frequentlyAskedQuestionTranslations.locale, locale),
        ),
      )
      .where(eq(frequentlyAskedQuestions.status, "PUBLISHED"))
      .orderBy(frequentlyAskedQuestions.sortOrder),
    db
      .select({
        id: seeMoreLinks.id,
        imageUrl: seeMoreLinks.imageUrl,
        link: seeMoreLinks.link,
        title: seeMoreLinks.title,
      })
      .from(seeMoreLinks)
      .where(eq(seeMoreLinks.status, "PUBLISHED"))
      .orderBy(seeMoreLinks.sortOrder),
    db
      .select({
        id: testimonials.id,
        authorName: members.displayName,
        authorRank: members.rank,
        authorImageUrl: members.blueBgPhotoPath,
        content: testimonialTranslations.content,
        locale: testimonialTranslations.locale,
      })
      .from(testimonials)
      .innerJoin(members, eq(testimonials.memberId, members.id))
      .leftJoin(
        testimonialTranslations,
        eq(testimonialTranslations.testimonialId, testimonials.id),
      )
      .where(eq(testimonials.status, "PUBLISHED"))
      .orderBy(testimonials.sortOrder),
  ]);

  const resolvedStats = {
    cadetCount: Number(cadetCountRows[0]?.value ?? 0) || FALLBACK_STATS.cadetCount,
    intakeCount: Number(intakeCountRows[0]?.value ?? 0) || FALLBACK_STATS.intakeCount,
    instructorCount:
      Number(instructorCountRows[0]?.value ?? 0) || FALLBACK_STATS.instructorCount,
    officerCount: Number(officerCountRows[0]?.value ?? 0) || FALLBACK_STATS.officerCount,
  };

  const testimonialMap = new Map<number, PublicTestimonial>();

  for (const row of testimonialRows) {
    if (!row.content) continue;

    const existing = testimonialMap.get(row.id);

    if (row.locale === locale) {
      testimonialMap.set(row.id, {
        id: row.id,
        authorName: row.authorName,
        authorRank: row.authorRank,
        authorImageUrl: row.authorImageUrl,
        content: row.content,
      });
    } else if (row.locale === "en" && (!existing || existing.content === "")) {
      testimonialMap.set(row.id, {
        id: row.id,
        authorName: row.authorName,
        authorRank: row.authorRank,
        authorImageUrl: row.authorImageUrl,
        content: row.content,
      });
    }
  }

  return {
    faqs: faqRows.length > 0 ? faqRows : FALLBACK_FAQS[locale],
    heroImageUrl: singletonContent[0]?.heroImageUrl ?? DEFAULT_HERO_IMAGE_URL,
    seeAlsoLinks: linksRows.length > 0 ? linksRows : FALLBACK_SEE_ALSO_LINKS,
    stats: resolvedStats,
    testimonials: Array.from(testimonialMap.values()),
  };
}

export async function getPublishedIntakeList(
  locale: Locale,
): Promise<PublicIntake[]> {
  return db
    .select({
      intakeNo: intakes.intakeNo,
      displayName: intakes.displayName,
      slug: intakes.slug,
      patchPhotoPath: intakes.patchPhotoPath,
      coverPhotoPath: intakes.coverPhotoPath,
      summary: intakeTranslations.summary,
    })
    .from(intakes)
    .leftJoin(
      intakeTranslations,
      and(
        eq(intakeTranslations.intakeId, intakes.id),
        eq(intakeTranslations.locale, locale),
      ),
    )
    .where(eq(intakes.status, "PUBLISHED"))
    .orderBy(desc(intakes.startYear));
}

export async function getPublishedIntakeDetail(
  locale: Locale,
  slug: string,
): Promise<PublicIntakeDetail | null> {
  const intakeRows = await db
    .select({
      coverPhotoPath: intakes.coverPhotoPath,
      displayName: intakes.displayName,
      id: intakes.id,
      innerPhotoPath: intakes.innerPhotoPath,
      intakeNo: intakes.intakeNo,
      patchPhotoPath: intakes.patchPhotoPath,
      seoDescription: intakeTranslations.seoDescription,
      seoTitle: intakeTranslations.seoTitle,
      slug: intakes.slug,
      summary: intakeTranslations.summary,
      tagLine: intakes.tagLine,
      tshirtPhotoPath: intakes.tshirtPhotoPath,
    })
    .from(intakes)
    .leftJoin(
      intakeTranslations,
      and(
        eq(intakeTranslations.intakeId, intakes.id),
        eq(intakeTranslations.locale, locale),
      ),
    )
    .where(and(eq(intakes.slug, slug), eq(intakes.status, "PUBLISHED")))
    .limit(1);

  const intake = intakeRows[0];
  if (!intake) {
    return null;
  }

  const [displayPhotoRows, patchExplanationRows, cadetRows] = await Promise.all([
    db
      .select({
        id: intakeDisplayPhotos.id,
        photoPath: intakeDisplayPhotos.photoPath,
      })
      .from(intakeDisplayPhotos)
      .where(eq(intakeDisplayPhotos.intakeId, intake.id))
      .orderBy(intakeDisplayPhotos.id),
    db
      .select({
        key: intakePatchExplanations.key,
        locale: intakePatchExplanationTranslations.locale,
        value: intakePatchExplanationTranslations.value,
      })
      .from(intakePatchExplanations)
      .leftJoin(
        intakePatchExplanationTranslations,
        and(
          eq(intakePatchExplanationTranslations.patchExplanationId, intakePatchExplanations.id),
          inArray(intakePatchExplanationTranslations.locale, [locale, "en"]),
        ),
      )
      .where(eq(intakePatchExplanations.intakeId, intake.id))
      .orderBy(intakePatchExplanations.id),
    db
      .select({
        displayName: members.displayName,
        displayPhotoPath: cadets.displayPhotoPath,
        id: cadets.id,
        quote: cadets.quote,
      })
      .from(cadets)
      .innerJoin(members, eq(cadets.memberId, members.id))
      .where(
        and(
          eq(cadets.intakeId, intake.id),
          eq(cadets.isActive, true),
          eq(members.role, "CADET"),
        ),
      )
      .orderBy(members.displayName),
  ]);

  const patchExplanationMap = new Map<
    string,
    PublicIntakePatchExplanation
  >();

  for (const row of patchExplanationRows) {
    if (!row.value) continue;

    const existing = patchExplanationMap.get(row.key);
    const localeKey = row.locale as Locale;
    const nextTranslations = {
      ...(existing?.translations ?? {}),
      [localeKey]: row.value,
    } satisfies Partial<Record<Locale, string>>;

    patchExplanationMap.set(row.key, {
      key: row.key,
      translations: nextTranslations,
    });
  }

  return {
    coverPhotoPath: intake.coverPhotoPath,
    cadets: cadetRows,
    displayName: intake.displayName,
    displayPhotos: displayPhotoRows,
    innerPhotoPath: intake.innerPhotoPath,
    seoDescription: intake.seoDescription,
    seoTitle: intake.seoTitle,
    intakeNo: intake.intakeNo,
    patchExplanations: Array.from(patchExplanationMap.values()),
    patchPhotoPath: intake.patchPhotoPath,
    slug: intake.slug,
    summary: intake.summary,
    tagLine: intake.tagLine,
    tshirtPhotoPath: intake.tshirtPhotoPath,
  };
}

export async function getPublishedStoriesByYear(
  locale: Locale,
): Promise<PublicStoriesByYear> {
  const eventRows = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
      coverPhotoPath: events.coverPhotoPath,
      coverPhotoWidth: events.coverPhotoWidth,
      coverPhotoHeight: events.coverPhotoHeight,
    })
    .from(events)
    .where(
      and(
        eq(events.status, "PUBLISHED"),
        isNotNull(events.coverPhotoPath),
      ),
    )
    .orderBy(desc(events.startDate));

  if (eventRows.length === 0) {
    return { years: [], byYear: {} };
  }

  const translationRows = await db
    .select({
      eventId: eventTranslations.eventId,
      locale: eventTranslations.locale,
      title: eventTranslations.title,
    })
    .from(eventTranslations)
    .where(
      and(
        inArray(
          eventTranslations.eventId,
          eventRows.map((item) => item.id),
        ),
        inArray(eventTranslations.locale, [locale, "en"]),
      ),
    );

  const titleByEventId = new Map<number, Partial<Record<Locale, string>>>();

  for (const row of translationRows) {
    const current = titleByEventId.get(row.eventId) ?? {};
    titleByEventId.set(row.eventId, {
      ...current,
      [row.locale]: row.title,
    });
  }

  const byYear = new Map<number, PublicStoryProgram[]>();

  for (const row of eventRows) {
    const titleEntry = titleByEventId.get(row.id);
    const title = titleEntry?.[locale] ?? titleEntry?.en ?? row.name;
    const startYear = row.startDate.getUTCFullYear();
    const list = byYear.get(startYear) ?? [];

    list.push({
      id: row.id,
      slug: row.slug,
      startYear,
      coverPhotoPath: row.coverPhotoPath ?? "/images/default-hero-image.jpg",
      coverPhotoWidth: row.coverPhotoWidth,
      coverPhotoHeight: row.coverPhotoHeight,
      title,
    });

    byYear.set(startYear, list);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return {
    years,
    byYear: Object.fromEntries(years.map((year) => [year, byYear.get(year) ?? []])),
  };
}

export async function getPublishedStoryDetail(
  locale: Locale,
  slug: string,
): Promise<PublicStoryDetail | null> {
  const eventRows = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      participantCount: events.participantCount,
      coverPhotoPath: events.coverPhotoPath,
      coverPhotoWidth: events.coverPhotoWidth,
      coverPhotoHeight: events.coverPhotoHeight,
      videoUrl: events.videoUrl,
    })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.status, "PUBLISHED")))
    .limit(1);

  const event = eventRows[0];
  if (!event) return null;

  const [translationRows, tagRows, displayPhotoRows] = await Promise.all([
    db
      .select({
        locale: eventTranslations.locale,
        title: eventTranslations.title,
        summary: eventTranslations.summary,
        seoTitle: eventTranslations.seoTitle,
        seoDescription: eventTranslations.seoDescription,
      })
      .from(eventTranslations)
      .where(
        and(
          eq(eventTranslations.eventId, event.id),
          inArray(eventTranslations.locale, [locale, "en"]),
        ),
      ),

    db
      .select({
        tagSlug: eventTags.slug,
        locale: eventTagTranslations.locale,
        name: eventTagTranslations.name,
      })
      .from(eventsToTags)
      .innerJoin(eventTags, eq(eventsToTags.tagId, eventTags.id))
      .leftJoin(
        eventTagTranslations,
        and(
          eq(eventTagTranslations.tagId, eventTags.id),
          inArray(eventTagTranslations.locale, [locale, "en"]),
        ),
      )
      .where(eq(eventsToTags.eventId, event.id))
      .orderBy(eventTags.slug, eventTagTranslations.locale),

    db
      .select({
        id: eventDisplayPhotos.id,
        photoPath: eventDisplayPhotos.photoPath,
      })
      .from(eventDisplayPhotos)
      .where(eq(eventDisplayPhotos.eventId, event.id))
      .orderBy(eventDisplayPhotos.id),
  ]);

  const translation =
    translationRows.find((r) => r.locale === locale) ??
    translationRows.find((r) => r.locale === "en");

  const tagMap = new Map<string, PublicStoryTag>();
  for (const row of tagRows) {
    if (!row.name) continue;
    const existing = tagMap.get(row.tagSlug);
    if (row.locale === locale) {
      tagMap.set(row.tagSlug, { slug: row.tagSlug, name: row.name });
    } else if (row.locale === "en" && !existing) {
      tagMap.set(row.tagSlug, { slug: row.tagSlug, name: row.name });
    }
  }

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    title: translation?.title ?? event.name,
    summary: translation?.summary ?? null,
    seoTitle: translation?.seoTitle ?? null,
    seoDescription: translation?.seoDescription ?? null,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    participantCount: event.participantCount,
    coverPhotoPath: event.coverPhotoPath,
    coverPhotoWidth: event.coverPhotoWidth,
    coverPhotoHeight: event.coverPhotoHeight,
    videoUrl: event.videoUrl,
    tags: Array.from(tagMap.values()),
    displayPhotos: displayPhotoRows,
  };
}

export async function getSimilarStories(
  locale: Locale,
  eventId: number,
  limit: number = 4,
): Promise<PublicStoryProgram[]> {
  const currentTagRows = await db
    .select({
      tagId: eventsToTags.tagId,
    })
    .from(eventsToTags)
    .where(eq(eventsToTags.eventId, eventId));

  const tagIds = currentTagRows.map((row) => row.tagId);

  if (tagIds.length === 0) {
    return [];
  }

  const sharedTagsCount = count(eventsToTags.tagId);

  const similarEventRows = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
      coverPhotoPath: events.coverPhotoPath,
      coverPhotoWidth: events.coverPhotoWidth,
      coverPhotoHeight: events.coverPhotoHeight,
      sharedTagsCount,
    })
    .from(events)
    .innerJoin(eventsToTags, eq(eventsToTags.eventId, events.id))
    .where(
      and(
        eq(events.status, "PUBLISHED"),
        isNotNull(events.coverPhotoPath),
        ne(events.id, eventId),
        inArray(eventsToTags.tagId, tagIds),
      ),
    )
    .groupBy(events.id)
    .orderBy(desc(sharedTagsCount), desc(events.startDate))
    .limit(limit);

  if (similarEventRows.length === 0) {
    return [];
  }

  const translationRows = await db
    .select({
      eventId: eventTranslations.eventId,
      locale: eventTranslations.locale,
      title: eventTranslations.title,
    })
    .from(eventTranslations)
    .where(
      and(
        inArray(
          eventTranslations.eventId,
          similarEventRows.map((item) => item.id),
        ),
        inArray(eventTranslations.locale, [locale, "en"]),
      ),
    );

  const titleByEventId = new Map<number, Partial<Record<Locale, string>>>();

  for (const row of translationRows) {
    const current = titleByEventId.get(row.eventId) ?? {};
    titleByEventId.set(row.eventId, {
      ...current,
      [row.locale]: row.title,
    });
  }

  return similarEventRows.map((row) => {
    const titleEntry = titleByEventId.get(row.id);
    const title = titleEntry?.[locale] ?? titleEntry?.en ?? row.name;

    return {
      id: row.id,
      slug: row.slug,
      startYear: row.startDate.getUTCFullYear(),
      coverPhotoPath: row.coverPhotoPath ?? "/images/default-hero-image.jpg",
      coverPhotoWidth: row.coverPhotoWidth,
      coverPhotoHeight: row.coverPhotoHeight,
      title,
    };
  });
}

export async function getPublishedStoriesByTag(
  locale: Locale,
  tagSlug: string,
): Promise<PublicStoryTagArchive | null> {
  const tagRows = await db
    .select({
      locale: eventTagTranslations.locale,
      name: eventTagTranslations.name,
      slug: eventTags.slug,
    })
    .from(eventTags)
    .leftJoin(
      eventTagTranslations,
      and(
        eq(eventTagTranslations.tagId, eventTags.id),
        inArray(eventTagTranslations.locale, [locale, "en"]),
      ),
    )
    .where(eq(eventTags.slug, tagSlug))
    .orderBy(eventTags.slug, eventTagTranslations.locale);

  if (tagRows.length === 0) {
    return null;
  }

  let tagName: string | null = null;
  for (const row of tagRows) {
    if (!row.name) continue;
    if (row.locale === locale) {
      tagName = row.name;
      break;
    }
    if (row.locale === "en" && tagName === null) {
      tagName = row.name;
    }
  }

  const eventRows = await db
    .select({
      coverPhotoHeight: events.coverPhotoHeight,
      coverPhotoPath: events.coverPhotoPath,
      coverPhotoWidth: events.coverPhotoWidth,
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
    })
    .from(eventsToTags)
    .innerJoin(eventTags, eq(eventsToTags.tagId, eventTags.id))
    .innerJoin(events, eq(eventsToTags.eventId, events.id))
    .where(
      and(
        eq(eventTags.slug, tagSlug),
        eq(events.status, "PUBLISHED"),
        isNotNull(events.coverPhotoPath),
      ),
    )
    .orderBy(desc(events.startDate));

  const tag = {
    slug: tagSlug,
    name: tagName ?? tagSlug,
  };

  if (eventRows.length === 0) {
    return {
      tag,
      stories: {
        years: [],
        byYear: {},
      },
    };
  }

  const translationRows = await db
    .select({
      locale: eventTranslations.locale,
      eventId: eventTranslations.eventId,
      title: eventTranslations.title,
    })
    .from(eventTranslations)
    .where(
      and(
        inArray(
          eventTranslations.eventId,
          eventRows.map((item) => item.id),
        ),
        inArray(eventTranslations.locale, [locale, "en"]),
      ),
    );

  const titleByEventId = new Map<number, Partial<Record<Locale, string>>>();

  for (const row of translationRows) {
    const current = titleByEventId.get(row.eventId) ?? {};
    titleByEventId.set(row.eventId, {
      ...current,
      [row.locale]: row.title,
    });
  }

  const byYear = new Map<number, PublicStoryProgram[]>();

  for (const row of eventRows) {
    const titleEntry = titleByEventId.get(row.id);
    const title = titleEntry?.[locale] ?? titleEntry?.en ?? row.name;
    const startYear = row.startDate.getUTCFullYear();
    const list = byYear.get(startYear) ?? [];

    list.push({
      id: row.id,
      slug: row.slug,
      startYear,
      coverPhotoPath: row.coverPhotoPath ?? "/images/default-hero-image.jpg",
      coverPhotoWidth: row.coverPhotoWidth,
      coverPhotoHeight: row.coverPhotoHeight,
      title,
    });

    byYear.set(startYear, list);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return {
    tag,
    stories: {
      years,
      byYear: Object.fromEntries(years.map((year) => [year, byYear.get(year) ?? []])),
    },
  };
}

export async function getContactPageContent(locale: Locale): Promise<ContactPageContent> {
  const [webappContentRow, reasonRows] = await Promise.all([
    db
      .select({
        googleMapLocationUrl: webappContents.googleMapLocationUrl ?? DEFAULT_GOOGLE_MAP_LOCATION_URL,
        officialEmail: webappContents.officialEmail ?? DEFAULT_OFFICIAL_EMAIL,
        facebookUrl: webappContents.facebookUrl ?? DEFAULT_FACEBOOK_URL,
        instagramUrl: webappContents.instagramUrl ?? DEFAULT_INSTAGRAM_URL,
        youtubeUrl: webappContents.youtubeUrl ?? DEFAULT_YOUTUBE_URL,
        tiktokUrl: webappContents.tiktokUrl ?? DEFAULT_TIKTOK_URL,
        xUrl: webappContents.xUrl ?? DEFAULT_X_URL,
      })
      .from(webappContents)
      .limit(1),
    db
      .select({
        id: contactReasons.id,
        iconKey: contactReasons.iconKey,
        title: contactReasonTranslations.title,
        description: contactReasonTranslations.description,
      })
      .from(contactReasons)
      .innerJoin(
        contactReasonTranslations,
        and(
          eq(contactReasonTranslations.reasonId, contactReasons.id),
          eq(contactReasonTranslations.locale, locale),
        ),
      )
      .orderBy(contactReasons.sortOrder),
  ]);

  const webappContent = webappContentRow[0];

  return {
    googleMapLocationUrl: webappContent?.googleMapLocationUrl ?? DEFAULT_GOOGLE_MAP_LOCATION_URL,
    officialEmail: webappContent?.officialEmail ?? DEFAULT_OFFICIAL_EMAIL,
    facebookUrl: webappContent?.facebookUrl ?? DEFAULT_FACEBOOK_URL,
    instagramUrl: webappContent?.instagramUrl ?? DEFAULT_INSTAGRAM_URL,
    youtubeUrl: webappContent?.youtubeUrl ?? DEFAULT_YOUTUBE_URL,
    tiktokUrl: webappContent?.tiktokUrl ?? DEFAULT_TIKTOK_URL,
    xUrl: webappContent?.xUrl ?? DEFAULT_X_URL,
    contactReasons: reasonRows,
  };
}
