import "server-only";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  cadetInfos,
  intakeDisplayPhotos,
  intakePatchExplanationTranslations,
  intakePatchExplanations,
  intakes,
  members,
  frequentlyAskedQuestions,
  frequentlyAskedQuestionTranslations,
  programs,
  programTranslations,
  seeMoreLinks,
  webappContents,
  testimonials,
  testimonialTranslations,
  intakeTranslations,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_FAQ_ENTRIES, DEFAULT_SEE_MORE_LINKS } from "@/lib/data";

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

const FALLBACK_HERO_IMAGE = "/images/default-hero-image.jpg";
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
      .select({ value: count(cadetInfos.id) })
      .from(cadetInfos)
      .where(eq(cadetInfos.isActive, true)),
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
    heroImageUrl: singletonContent[0]?.heroImageUrl ?? FALLBACK_HERO_IMAGE,
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
    .orderBy(desc(intakes.startYear))
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
      displayPhotoPath: cadetInfos.displayPhotoPath,
      id: cadetInfos.id,
      quote: cadetInfos.quote,
    })
      .from(cadetInfos)
      .innerJoin(members, eq(cadetInfos.memberId, members.id))
      .where(
        and(
          eq(cadetInfos.intakeId, intake.id),
          eq(cadetInfos.isActive, true),
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
  const programRows = await db
    .select({
      id: programs.id,
      name: programs.name,
      slug: programs.slug,
      startDate: programs.startDate,
      coverPhotoPath: programs.coverPhotoPath,
      coverPhotoWidth: programs.coverPhotoWidth,
      coverPhotoHeight: programs.coverPhotoHeight,
    })
    .from(programs)
    .where(
      and(
        eq(programs.status, "PUBLISHED"),
        isNotNull(programs.coverPhotoPath),
      ),
    )
    .orderBy(desc(programs.startDate));

  if (programRows.length === 0) {
    return { years: [], byYear: {} };
  }

  const translationRows = await db
    .select({
      programId: programTranslations.programId,
      locale: programTranslations.locale,
      title: programTranslations.title,
    })
    .from(programTranslations)
    .where(
      and(
        inArray(
          programTranslations.programId,
          programRows.map((item) => item.id),
        ),
        inArray(programTranslations.locale, [locale, "en"]),
      ),
    );

  const titleByProgramId = new Map<number, Partial<Record<Locale, string>>>();

  for (const row of translationRows) {
    const current = titleByProgramId.get(row.programId) ?? {};
    titleByProgramId.set(row.programId, {
      ...current,
      [row.locale]: row.title,
    });
  }

  const byYear = new Map<number, PublicStoryProgram[]>();

  for (const row of programRows) {
    const titleEntry = titleByProgramId.get(row.id);
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

