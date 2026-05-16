import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  cadetInfos,
  intakes,
  intakeTranslations,
  members,
  frequentlyAskedQuestions,
  frequentlyAskedQuestionTranslations,
  programs,
  programTranslations,
  seeMoreLinks,
  webappContents,
  testimonials,
  testimonialTranslations,
} from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_FAQ_ENTRIES, DEFAULT_SEE_MORE_LINKS } from "@/lib/data";

export type PublicIntakeSummary = {
  displayName: string;
  slug: string;
  startYear: number;
  summary: string | null;
};

export type PublicProgramSummary = {
  endDate: Date;
  location: string;
  slug: string;
  startDate: Date;
  summary: string | null;
  title: string;
};

export type PublicTestimonial = {
  id: number;
  authorName: string;
  authorRank: string;
  authorImageUrl: string | null;
  content: string;
};

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

export async function getPublishedIntakeSummaries(
  locale: Locale,
): Promise<PublicIntakeSummary[]> {
  return db
    .select({
      displayName: intakes.displayName,
      slug: intakes.slug,
      startYear: intakes.startYear,
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
    .where(
      and(
        eq(intakes.status, "PUBLISHED"),
      ),
    )
    .orderBy(desc(intakes.startYear))
    .limit(3);
}

export async function getPublishedProgramSummaries(
  locale: Locale,
): Promise<PublicProgramSummary[]> {
  return db
    .select({
      endDate: programs.endDate,
      location: programs.location,
      slug: programs.slug,
      startDate: programs.startDate,
      summary: programTranslations.summary,
      title: programTranslations.title,
    })
    .from(programs)
    .innerJoin(
      programTranslations,
      and(
        eq(programTranslations.programId, programs.id),
        eq(programTranslations.locale, locale),
      ),
    )
    .where(eq(programs.status, "PUBLISHED"))
    .orderBy(desc(programs.startDate))
    .limit(3);
}

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
