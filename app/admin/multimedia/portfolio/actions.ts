"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { db } from "@/db";
import {
  webappContents,
  frequentlyAskedQuestions,
  frequentlyAskedQuestionTranslations,
  seeMoreLinks,
  testimonials,
  testimonialTranslations,
  members,
} from "@/db/schema";
import { and, asc, eq, exists, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/supabase/storage";
import { getFileExtension, getAllowedImageExtension } from "@/lib/admin/form-helpers";
import { locales } from "@/lib/i18n/config";
import {
  buildFAQTableConfig,
  buildSeeMoreTableConfig,
  buildTestimonialTableConfig,
  FAQ_SORT_FIELD_MAP,
  SEE_MORE_SORT_FIELD_MAP,
  TESTIMONIAL_SORT_FIELD_MAP,
} from "@/components/admin/multimedia/portfolio/table-config";
import {
  buildEnumFilterClause,
  buildDateFilterClause,
  buildSortOrderBy,
  parseTableSearchParams,
  wrapLikePattern,
  type FilterCondition,
  type RawSearchParams,
} from "@/lib/admin/table-search-params";

/**
 * Fetch the singleton webapp content record.
 * The table is defined with a `singleton_key` that is always true, so there is exactly one row.
 */
export async function getWebappContent() {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to view portfolio." };
  }
  const result = await db
    .select()
    .from(webappContents)
    .where(eq(webappContents.singletonKey, true))
    .limit(1);
  return { success: true as const, data: result[0] ?? null };
}

export async function getPortfolioData(raw: RawSearchParams) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to view portfolio." };
  }

  const [content] = await db
    .select()
    .from(webappContents)
    .where(eq(webappContents.singletonKey, true))
    .limit(1);

  if (!content) {
    return {
      success: true as const,
      data: {
        content: null,
        faqs: [],
        seeMore: [],
        testimonials: [],
        faqTotalCount: 0,
        seeMoreTotalCount: 0,
        testimonialTotalCount: 0,
        faqOrderItems: [],
        seeMoreOrderItems: [],
        testimonialOrderItems: [],
      },
    };
  }

  const faqConfig = buildFAQTableConfig();
  const seeMoreConfig = buildSeeMoreTableConfig();
  const testimonialConfig = buildTestimonialTableConfig();
  const faqState = parseTableSearchParams(raw, faqConfig);
  const seeMoreState = parseTableSearchParams(raw, seeMoreConfig);
  const testimonialState = parseTableSearchParams(raw, testimonialConfig);

  const faqWhere = buildFAQWhere(content.id, faqState.q, faqState.filters.status, faqState.filters.createdAt);
  const seeMoreWhere = buildSeeMoreWhere(content.id, seeMoreState.q, seeMoreState.filters.status, seeMoreState.filters.createdAt);
  const testimonialWhere = buildTestimonialWhere(testimonialState.q, testimonialState.filters.status, testimonialState.filters.createdAt);

  const faqOrder = buildSortOrderBy(faqState.sortRules, FAQ_SORT_FIELD_MAP);
  faqOrder.push(asc(frequentlyAskedQuestions.id));
  const seeMoreOrder = buildSortOrderBy(seeMoreState.sortRules, SEE_MORE_SORT_FIELD_MAP);
  seeMoreOrder.push(asc(seeMoreLinks.id));
  const testimonialOrder = buildSortOrderBy(testimonialState.sortRules, TESTIMONIAL_SORT_FIELD_MAP);
  testimonialOrder.push(asc(testimonials.id));

  const [faqCountRows, faqRows, seeMoreCountRows, seeMoreRows, testimonialCountRows, testimonialRows, faqOrderRows, seeMoreOrderRows, testimonialOrderRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(frequentlyAskedQuestions).where(faqWhere),
    db.select().from(frequentlyAskedQuestions).where(faqWhere).orderBy(...faqOrder)
      .limit(faqState.pageSize).offset((faqState.page - 1) * faqState.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(seeMoreLinks).where(seeMoreWhere),
    db.select().from(seeMoreLinks).where(seeMoreWhere).orderBy(...seeMoreOrder)
      .limit(seeMoreState.pageSize).offset((seeMoreState.page - 1) * seeMoreState.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(testimonials).leftJoin(members, eq(testimonials.memberId, members.id)).where(testimonialWhere),
    db.select({ testimonial: testimonials, memberName: members.displayName })
      .from(testimonials).leftJoin(members, eq(testimonials.memberId, members.id)).where(testimonialWhere)
      .orderBy(...testimonialOrder).limit(testimonialState.pageSize)
      .offset((testimonialState.page - 1) * testimonialState.pageSize),
    db.select({ id: frequentlyAskedQuestions.id, sortOrder: frequentlyAskedQuestions.sortOrder, label: frequentlyAskedQuestionTranslations.question })
      .from(frequentlyAskedQuestions)
      .leftJoin(frequentlyAskedQuestionTranslations, and(eq(frequentlyAskedQuestionTranslations.faqId, frequentlyAskedQuestions.id), eq(frequentlyAskedQuestionTranslations.locale, "en")))
      .where(eq(frequentlyAskedQuestions.webappContentId, content.id)).orderBy(asc(frequentlyAskedQuestions.sortOrder), asc(frequentlyAskedQuestions.id)),
    db.select({ id: seeMoreLinks.id, sortOrder: seeMoreLinks.sortOrder, label: seeMoreLinks.title })
      .from(seeMoreLinks).where(eq(seeMoreLinks.webappContentId, content.id)).orderBy(asc(seeMoreLinks.sortOrder), asc(seeMoreLinks.id)),
    db.select({ id: testimonials.id, sortOrder: testimonials.sortOrder, label: members.displayName })
      .from(testimonials).leftJoin(members, eq(testimonials.memberId, members.id)).orderBy(asc(testimonials.sortOrder), asc(testimonials.id)),
  ]);

  const faqTranslations = faqRows.length > 0
    ? await db.select().from(frequentlyAskedQuestionTranslations).where(inArray(frequentlyAskedQuestionTranslations.faqId, faqRows.map((faq) => faq.id)))
    : [];
  const testimonialTrans = testimonialRows.length > 0
    ? await db.select().from(testimonialTranslations).where(inArray(testimonialTranslations.testimonialId, testimonialRows.map(({ testimonial }) => testimonial.id)))
    : [];

  return {
    success: true as const,
    data: {
      content: content ?? null,
      faqs: faqRows.map((faq) => ({
        ...faq,
        createdAt: faq.createdAt.toISOString(),
        updatedAt: faq.updatedAt.toISOString(),
        translations: faqTranslations
          .filter((t) => t.faqId === faq.id)
          .reduce((acc, t) => ({ ...acc, [t.locale]: { question: t.question, answer: t.answer } }), {} as Record<string, { question: string; answer: string }>),
      })),
      seeMore: seeMoreRows.map((sm) => ({
        ...sm,
        createdAt: sm.createdAt.toISOString(),
        updatedAt: sm.updatedAt.toISOString(),
      })),
      testimonials: testimonialRows.map(({ testimonial: t, memberName }) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        memberName: memberName ?? "Unknown",
        translations: testimonialTrans
          .filter((tt) => tt.testimonialId === t.id)
          .reduce((acc, tt) => ({ ...acc, [tt.locale]: { content: tt.content } }), {} as Record<string, { content: string }>),
      })),
      faqTotalCount: faqCountRows[0]?.count ?? 0,
      seeMoreTotalCount: seeMoreCountRows[0]?.count ?? 0,
      testimonialTotalCount: testimonialCountRows[0]?.count ?? 0,
      faqOrderItems: faqOrderRows.map((row) => ({ ...row, label: row.label ?? "Untitled FAQ" })),
      seeMoreOrderItems: seeMoreOrderRows,
      testimonialOrderItems: testimonialOrderRows.map((row) => ({ ...row, label: row.label ?? "Unknown member" })),
    },
  };
}

function buildFAQWhere(contentId: number, query: string, conditions?: FilterCondition[], dateConditions?: FilterCondition[]) {
  const clauses = [eq(frequentlyAskedQuestions.webappContentId, contentId)];
  if (query) {
    clauses.push(exists(db.select({ id: frequentlyAskedQuestionTranslations.id }).from(frequentlyAskedQuestionTranslations)
      .where(and(eq(frequentlyAskedQuestionTranslations.faqId, frequentlyAskedQuestions.id), ilike(frequentlyAskedQuestionTranslations.question, wrapLikePattern(query))))));
  }
  clauses.push(...buildEnumFilterClause(conditions, frequentlyAskedQuestions.status));
  clauses.push(...buildDateFilterClause(dateConditions, frequentlyAskedQuestions.createdAt));
  return and(...clauses);
}

function buildSeeMoreWhere(contentId: number, query: string, conditions?: FilterCondition[], dateConditions?: FilterCondition[]) {
  const clauses = [eq(seeMoreLinks.webappContentId, contentId)];
  if (query) clauses.push(or(ilike(seeMoreLinks.title, wrapLikePattern(query)), ilike(seeMoreLinks.link, wrapLikePattern(query)))!);
  clauses.push(...buildEnumFilterClause(conditions, seeMoreLinks.status));
  clauses.push(...buildDateFilterClause(dateConditions, seeMoreLinks.createdAt));
  return and(...clauses);
}

function buildTestimonialWhere(query: string, conditions?: FilterCondition[], dateConditions?: FilterCondition[]) {
  const clauses = [...buildEnumFilterClause(conditions, testimonials.status)];
  clauses.push(...buildDateFilterClause(dateConditions, testimonials.createdAt));
  if (query) {
    clauses.push(or(
      ilike(members.displayName, wrapLikePattern(query)),
      exists(db.select({ id: testimonialTranslations.id }).from(testimonialTranslations)
        .where(and(eq(testimonialTranslations.testimonialId, testimonials.id), ilike(testimonialTranslations.content, wrapLikePattern(query))))),
    )!);
  }
  return clauses.length > 0 ? and(...clauses) : undefined;
}

/**
 * Update the singleton webapp content. Accepts a FormData payload where each key matches a column.
 * Only the fields that are present are updated.
 * Handles hero image file upload.
 */
export async function updateWebappContent(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const updates: Record<string, string | null> = {};
  // Helper to copy a string value if present.
  const setIfPresent = (key: string, value: FormDataEntryValue | null) => {
    if (value !== null) {
      const stringValue = String(value).trim();
      updates[key] = stringValue || null;
    }
  };

  setIfPresent("heroImagePath", formData.get("heroImagePath"));
  setIfPresent("googleMapLocationUrl", formData.get("googleMapLocationUrl"));
  setIfPresent("officialEmail", formData.get("officialEmail"));
  setIfPresent("facebookUrl", formData.get("facebookUrl"));
  setIfPresent("instagramUrl", formData.get("instagramUrl"));
  setIfPresent("youtubeUrl", formData.get("youtubeUrl"));
  setIfPresent("tikTokUrl", formData.get("tiktokUrl"));
  setIfPresent("xUrl", formData.get("xUrl"));

  // Handle hero image file upload
  const heroImageFile = formData.get("heroImageFile") as File | null;
  let heroImagePath: string | null = null;

  if (heroImageFile && heroImageFile.size > 0) {
    if (heroImageFile.size > 5 * 1024 * 1024) {
      return { success: false as const, error: "Hero image must be under 5 MB." };
    }
    if (!getAllowedImageExtension(heroImageFile)) {
      return { success: false as const, error: "Hero image must be a JPG, PNG, or WebP image." };
    }

    const ext = getFileExtension(heroImageFile);
    const path = `webapp/hero.${ext}`;
    const supabase = createSupabaseAdminClient();
    const uploadedPath = await uploadToStorage(supabase, heroImageFile, path);
    if (uploadedPath) {
      heroImagePath = uploadedPath;
    }
  }

  // Handle hero image removal
  const removeHeroImage = formData.get("removeHeroImage") === "true";

  try {
    const finalUpdates: Record<string, string | null | undefined> = { ...updates, updatedByAdminUserId: admin.id };
    if (heroImagePath) {
      finalUpdates.heroImagePath = heroImagePath;
    } else if (removeHeroImage) {
      finalUpdates.heroImagePath = null;
    }

    await db
      .update(webappContents)
      .set(finalUpdates)
      .where(eq(webappContents.singletonKey, true));

    revalidatePath("/admin/multimedia/portfolio");
    revalidatePath("/");
    return { success: true as const };
  } catch (err) {
    console.error("updateWebappContent failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false as const, error: message };
  }
}

// FAQ Actions
export async function createFAQ(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const [content] = await db
    .select({ id: webappContents.id })
    .from(webappContents)
    .where(eq(webappContents.singletonKey, true))
    .limit(1);

  if (!content) {
    return { success: false as const, error: "Webapp content not found." };
  }

  const status = String(formData.get("status") || "DRAFT");
  const [{ maxSortOrder }] = await db
    .select({ maxSortOrder: sql<number>`coalesce(max(${frequentlyAskedQuestions.sortOrder}), 0)` })
    .from(frequentlyAskedQuestions)
    .where(eq(frequentlyAskedQuestions.webappContentId, content.id));
  const sortOrder = Number(maxSortOrder) + 1;

  try {
    const [faq] = await db
      .insert(frequentlyAskedQuestions)
      .values({
        webappContentId: content.id,
        sortOrder,
        status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      })
      .returning({ id: frequentlyAskedQuestions.id });

    // Insert translations
    for (const locale of locales) {
      const question = String(formData.get(`question_${locale}`) ?? "");
      const answer = String(formData.get(`answer_${locale}`) ?? "");

      if (question && answer) {
        await db.insert(frequentlyAskedQuestionTranslations).values({
          faqId: faq.id,
          locale: locale as "en" | "ms" | "zh" | "ta",
          question,
          answer,
        });
      }
    }

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("createFAQ failed", err);
    return { success: false as const, error: "Failed to create FAQ." };
  }
}

export async function updateFAQ(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const faqId = Number(formData.get("faqId"));
  if (!faqId) {
    return { success: false as const, error: "Invalid FAQ ID." };
  }

  const status = String(formData.get("status") || "DRAFT");

  try {
    await db
      .update(frequentlyAskedQuestions)
      .set({ status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" })
      .where(eq(frequentlyAskedQuestions.id, faqId));

    // Update translations
    for (const locale of locales) {
      const question = String(formData.get(`question_${locale}`) ?? "");
      const answer = String(formData.get(`answer_${locale}`) ?? "");

      if (question || answer) {
        await db
          .insert(frequentlyAskedQuestionTranslations)
          .values({
            faqId,
            locale: locale as "en" | "ms" | "zh" | "ta",
            question,
            answer,
          })
          .onConflictDoUpdate({
            target: [frequentlyAskedQuestionTranslations.faqId, frequentlyAskedQuestionTranslations.locale],
            set: { question, answer },
          });
      }
    }

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("updateFAQ failed", err);
    return { success: false as const, error: "Failed to update FAQ." };
  }
}

export async function deleteFAQ(faqId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    await db.transaction(async (tx) => {
      const [faq] = await tx.select({ sortOrder: frequentlyAskedQuestions.sortOrder }).from(frequentlyAskedQuestions).where(eq(frequentlyAskedQuestions.id, faqId)).limit(1);
      if (!faq) return;
      await tx.delete(frequentlyAskedQuestions).where(eq(frequentlyAskedQuestions.id, faqId));
      await tx.update(frequentlyAskedQuestions).set({ sortOrder: sql`${frequentlyAskedQuestions.sortOrder} - 1` }).where(gt(frequentlyAskedQuestions.sortOrder, faq.sortOrder));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("deleteFAQ failed", err);
    return { success: false as const, error: "Failed to delete FAQ." };
  }
}

export async function reorderFAQs(orderedIds: number[]) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  const [content] = await db.select({ id: webappContents.id }).from(webappContents).where(eq(webappContents.singletonKey, true)).limit(1);
  if (!content) return { success: false as const, error: "Webapp content not found." };
  try {
    await db.transaction(async (tx) => {
      const rows = await tx.select({ id: frequentlyAskedQuestions.id }).from(frequentlyAskedQuestions).where(eq(frequentlyAskedQuestions.webappContentId, content.id));
      if (rows.length !== orderedIds.length || new Set(orderedIds).size !== rows.length || rows.some((row) => !orderedIds.includes(row.id))) throw new Error("Invalid FAQ order.");
      for (const [index, id] of orderedIds.entries()) await tx.update(frequentlyAskedQuestions).set({ sortOrder: index + 1 }).where(eq(frequentlyAskedQuestions.id, id));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to reorder FAQs." }; }
}

export async function setFAQStatus(faqId: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  try {
    await db.update(frequentlyAskedQuestions).set({ status, updatedAt: new Date() }).where(eq(frequentlyAskedQuestions.id, faqId));
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to update FAQ status." }; }
}

// See More Links Actions
export async function createSeeMoreLink(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const [content] = await db
    .select({ id: webappContents.id })
    .from(webappContents)
    .where(eq(webappContents.singletonKey, true))
    .limit(1);

  if (!content) {
    return { success: false as const, error: "Webapp content not found." };
  }

  const title = String(formData.get("title") ?? "");
  const link = String(formData.get("link") ?? "");
  const status = String(formData.get("status") || "DRAFT");

  if (!title || !link) {
    return { success: false as const, error: "Title and link are required." };
  }

  const [{ maxSortOrder }] = await db
    .select({ maxSortOrder: sql<number>`coalesce(max(${seeMoreLinks.sortOrder}), 0)` })
    .from(seeMoreLinks)
    .where(eq(seeMoreLinks.webappContentId, content.id));
  const sortOrder = Number(maxSortOrder) + 1;

  // Handle image upload
  const imageFile = formData.get("imageFile") as File | null;
  let imagePath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false as const, error: "Image must be under 5 MB." };
    }
    if (!getAllowedImageExtension(imageFile)) {
      return { success: false as const, error: "Image must be a JPG, PNG, or WebP image." };
    }

    const ext = getFileExtension(imageFile);
    const path = `webapp/see-more/${Date.now()}.${ext}`;
    const supabase = createSupabaseAdminClient();
    const uploadedPath = await uploadToStorage(supabase, imageFile, path);
    if (uploadedPath) {
      imagePath = uploadedPath;
    }
  }

  try {
    await db.insert(seeMoreLinks).values({
      webappContentId: content.id,
      title,
      link,
      imagePath,
      sortOrder,
      status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    });

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("createSeeMoreLink failed", err);
    return { success: false as const, error: "Failed to create See More link." };
  }
}

export async function updateSeeMoreLink(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const linkId = Number(formData.get("linkId"));
  if (!linkId) {
    return { success: false as const, error: "Invalid link ID." };
  }

  const title = String(formData.get("title") ?? "");
  const link = String(formData.get("link") ?? "");
  const status = String(formData.get("status") || "DRAFT");

  if (!title || !link) {
    return { success: false as const, error: "Title and link are required." };
  }

  // Handle image upload
  const imageFile = formData.get("imageFile") as File | null;
  let imagePath: string | null | undefined = undefined;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false as const, error: "Image must be under 5 MB." };
    }
    if (!getAllowedImageExtension(imageFile)) {
      return { success: false as const, error: "Image must be a JPG, PNG, or WebP image." };
    }

    const ext = getFileExtension(imageFile);
    const path = `webapp/see-more/${Date.now()}.${ext}`;
    const supabase = createSupabaseAdminClient();
    const uploadedPath = await uploadToStorage(supabase, imageFile, path);
    if (uploadedPath) {
      imagePath = uploadedPath;
    }
  }

  const removeImage = formData.get("removeImage") === "true";
  if (removeImage) {
    imagePath = null;
  }

  try {
    const updates: Record<string, string | number | null | undefined> = {
      title,
      link,
      status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    };
    if (imagePath !== undefined) {
      updates.imagePath = imagePath;
    }

    await db.update(seeMoreLinks).set(updates).where(eq(seeMoreLinks.id, linkId));

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("updateSeeMoreLink failed", err);
    return { success: false as const, error: "Failed to update See More link." };
  }
}

export async function deleteSeeMoreLink(linkId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    await db.transaction(async (tx) => {
      const [link] = await tx.select({ sortOrder: seeMoreLinks.sortOrder }).from(seeMoreLinks).where(eq(seeMoreLinks.id, linkId)).limit(1);
      if (!link) return;
      await tx.delete(seeMoreLinks).where(eq(seeMoreLinks.id, linkId));
      await tx.update(seeMoreLinks).set({ sortOrder: sql`${seeMoreLinks.sortOrder} - 1` }).where(gt(seeMoreLinks.sortOrder, link.sortOrder));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("deleteSeeMoreLink failed", err);
    return { success: false as const, error: "Failed to delete See More link." };
  }
}

export async function reorderSeeMoreLinks(orderedIds: number[]) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  const [content] = await db.select({ id: webappContents.id }).from(webappContents).where(eq(webappContents.singletonKey, true)).limit(1);
  if (!content) return { success: false as const, error: "Webapp content not found." };
  try {
    await db.transaction(async (tx) => {
      const rows = await tx.select({ id: seeMoreLinks.id }).from(seeMoreLinks).where(eq(seeMoreLinks.webappContentId, content.id));
      if (rows.length !== orderedIds.length || new Set(orderedIds).size !== rows.length || rows.some((row) => !orderedIds.includes(row.id))) throw new Error("Invalid link order.");
      for (const [index, id] of orderedIds.entries()) await tx.update(seeMoreLinks).set({ sortOrder: index + 1 }).where(eq(seeMoreLinks.id, id));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to reorder See More links." }; }
}

export async function setSeeMoreLinkStatus(linkId: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  try {
    await db.update(seeMoreLinks).set({ status, updatedAt: new Date() }).where(eq(seeMoreLinks.id, linkId));
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to update link status." }; }
}

export async function getSeeMoreLinkDetails(linkId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    const [link] = await db
      .select()
      .from(seeMoreLinks)
      .where(eq(seeMoreLinks.id, linkId))
      .limit(1);

    if (!link) {
      return { success: false as const, error: "Link not found." };
    }

    return {
      success: true as const,
      data: {
        ...link,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("getSeeMoreLinkDetails failed", err);
    return { success: false as const, error: "Failed to fetch link." };
  }
}

// Testimonial Actions
export async function createTestimonial(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const memberId = Number(formData.get("memberId"));
  const status = String(formData.get("status") || "DRAFT");

  if (!memberId) {
    return { success: false as const, error: "Member is required." };
  }

  try {
    const [{ maxSortOrder }] = await db
      .select({ maxSortOrder: sql<number>`coalesce(max(${testimonials.sortOrder}), 0)` })
      .from(testimonials);
    const sortOrder = Number(maxSortOrder) + 1;
    const [testimonial] = await db
      .insert(testimonials)
      .values({
        memberId,
        sortOrder,
        status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      })
      .returning({ id: testimonials.id });

    // Insert translations
    for (const locale of locales) {
      const content = String(formData.get(`content_${locale}`) ?? "");

      if (content) {
        await db.insert(testimonialTranslations).values({
          testimonialId: testimonial.id,
          locale: locale as "en" | "ms" | "zh" | "ta",
          content,
        });
      }
    }

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("createTestimonial failed", err);
    return { success: false as const, error: "Failed to create testimonial." };
  }
}

export async function updateTestimonial(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  const testimonialId = Number(formData.get("testimonialId"));
  if (!testimonialId) {
    return { success: false as const, error: "Invalid testimonial ID." };
  }

  const memberId = Number(formData.get("memberId"));
  const status = String(formData.get("status") || "DRAFT");

  try {
    await db
      .update(testimonials)
      .set({ memberId, status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED", updatedAt: new Date() })
      .where(eq(testimonials.id, testimonialId));

    // Update translations
    for (const locale of locales) {
      const content = String(formData.get(`content_${locale}`) ?? "");

      if (content) {
        await db
          .insert(testimonialTranslations)
          .values({
            testimonialId,
            locale: locale as "en" | "ms" | "zh" | "ta",
            content,
          })
          .onConflictDoUpdate({
            target: [testimonialTranslations.testimonialId, testimonialTranslations.locale],
            set: { content },
          });
      }
    }

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("updateTestimonial failed", err);
    return { success: false as const, error: "Failed to update testimonial." };
  }
}

export async function deleteTestimonial(testimonialId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    await db.transaction(async (tx) => {
      const [testimonial] = await tx
        .select({ sortOrder: testimonials.sortOrder })
        .from(testimonials)
        .where(eq(testimonials.id, testimonialId))
        .limit(1);
      if (!testimonial) return;
      await tx.delete(testimonials).where(eq(testimonials.id, testimonialId));
      await tx
        .update(testimonials)
        .set({ sortOrder: sql`${testimonials.sortOrder} - 1` })
        .where(gt(testimonials.sortOrder, testimonial.sortOrder));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("deleteTestimonial failed", err);
    return { success: false as const, error: "Failed to delete testimonial." };
  }
}

export async function reorderTestimonials(orderedIds: number[]) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  try {
    await db.transaction(async (tx) => {
      const rows = await tx.select({ id: testimonials.id }).from(testimonials);
      if (rows.length !== orderedIds.length || new Set(orderedIds).size !== rows.length || rows.some((row) => !orderedIds.includes(row.id))) throw new Error("Invalid testimonial order.");
      for (const [index, id] of orderedIds.entries()) await tx.update(testimonials).set({ sortOrder: index + 1 }).where(eq(testimonials.id, id));
    });
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to reorder testimonials." }; }
}

export async function setTestimonialStatus(testimonialId: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "portfolio")) return { success: false as const, error: "You do not have permission to manage portfolio." };
  try {
    await db.update(testimonials).set({ status, updatedAt: new Date() }).where(eq(testimonials.id, testimonialId));
    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch { return { success: false as const, error: "Failed to update testimonial status." }; }
}

export async function getTestimonialDetails(testimonialId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, testimonialId))
      .limit(1);

    if (!testimonial) return { success: false as const, error: "Testimonial not found." };

    const trans = await db
      .select()
      .from(testimonialTranslations)
      .where(eq(testimonialTranslations.testimonialId, testimonialId));

    const [member] = await db
      .select({ displayName: members.displayName, armyNo: members.armyNo })
      .from(members)
      .where(eq(members.id, testimonial.memberId))
      .limit(1);

    return {
      success: true as const,
      data: {
        ...testimonial,
        createdAt: testimonial.createdAt.toISOString(),
        updatedAt: testimonial.updatedAt.toISOString(),
        memberName: member?.displayName ?? "Unknown",
        memberArmyNo: member?.armyNo,
        translations: trans.reduce((acc, t) => ({
          ...acc,
          [t.locale]: { content: t.content },
        }), {} as Record<string, { content: string }>),
      },
    };
  } catch (err) {
    console.error("getTestimonialDetails failed", err);
    return { success: false as const, error: "Failed to fetch testimonial." };
  }
}

export async function getFAQDetails(faqId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    const [faq] = await db
      .select()
      .from(frequentlyAskedQuestions)
      .where(eq(frequentlyAskedQuestions.id, faqId))
      .limit(1);

    if (!faq) {
      return { success: false as const, error: "FAQ not found." };
    }

    const translations = await db
      .select()
      .from(frequentlyAskedQuestionTranslations)
      .where(eq(frequentlyAskedQuestionTranslations.faqId, faqId));

    return {
      success: true as const,
      data: {
        ...faq,
        createdAt: faq.createdAt.toISOString(),
        updatedAt: faq.updatedAt.toISOString(),
        translations: translations.reduce((acc, t) => ({
          ...acc,
          [t.locale]: { question: t.question, answer: t.answer },
        }), {} as Record<string, { question: string; answer: string }>),
      },
    };
  } catch (err) {
    console.error("getFAQDetails failed", err);
    return { success: false as const, error: "Failed to fetch FAQ." };
  }
}

export async function getAllMembers() {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  try {
    const result = await db
      .select({ id: members.id, displayName: members.displayName, armyNo: members.armyNo })
      .from(members)
      .orderBy(asc(members.displayName));
    return { success: true as const, data: result };
  } catch (err) {
    console.error("getAllMembers failed", err);
    return { success: false as const, error: "Failed to fetch members." };
  }
}
