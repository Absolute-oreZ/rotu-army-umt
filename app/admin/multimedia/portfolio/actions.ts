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
  bestCadets,
  bestCadetTranslations,
  members,
  cadets,
  intakes,
  events,
} from "@/db/schema";
import { and, asc, eq, exists, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteFromStorage, saveImage } from "@/lib/supabase/storage";
import { DEFAULT_HERO_IMAGE_PATH } from "@/lib/constants";
import { locales } from "@/lib/i18n/config";
import {
  buildFAQTableConfig,
  buildSeeMoreTableConfig,
  FAQ_SORT_FIELD_MAP,
  SEE_MORE_SORT_FIELD_MAP,
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
import { sanitizeUrlForHtml } from "@/lib/url-validation";
import { getMalaysiaDateISO } from "@/lib/time/malaysia";
import { isUniqueViolation } from "@/lib/db/errors";

const SHARED_IMAGE_PATHS = new Set<string>([DEFAULT_HERO_IMAGE_PATH]);

function canDeleteImage(path: string) {
  if (path.startsWith("placeholder/")) return false;
  return !SHARED_IMAGE_PATHS.has(path);
}

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
        faqTotalCount: 0,
        seeMoreTotalCount: 0,
        faqOrderItems: [],
        seeMoreOrderItems: [],
      },
    };
  }

  const faqConfig = buildFAQTableConfig();
  const seeMoreConfig = buildSeeMoreTableConfig();
  const faqState = parseTableSearchParams(raw, faqConfig);
  const seeMoreState = parseTableSearchParams(raw, seeMoreConfig);

  const faqWhere = buildFAQWhere(content.id, faqState.q, faqState.filters.status, faqState.filters.createdAt);
  const seeMoreWhere = buildSeeMoreWhere(content.id, seeMoreState.q, seeMoreState.filters.status, seeMoreState.filters.createdAt);

  const faqOrder = buildSortOrderBy(faqState.sortRules, FAQ_SORT_FIELD_MAP);
  faqOrder.push(asc(frequentlyAskedQuestions.id));
  const seeMoreOrder = buildSortOrderBy(seeMoreState.sortRules, SEE_MORE_SORT_FIELD_MAP);
  seeMoreOrder.push(asc(seeMoreLinks.id));

  const [faqCountRows, faqRows, seeMoreCountRows, seeMoreRows, faqOrderRows, seeMoreOrderRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(frequentlyAskedQuestions).where(faqWhere),
    db.select().from(frequentlyAskedQuestions).where(faqWhere).orderBy(...faqOrder)
      .limit(faqState.pageSize).offset((faqState.page - 1) * faqState.pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(seeMoreLinks).where(seeMoreWhere),
    db.select().from(seeMoreLinks).where(seeMoreWhere).orderBy(...seeMoreOrder)
      .limit(seeMoreState.pageSize).offset((seeMoreState.page - 1) * seeMoreState.pageSize),
    db.select({ id: frequentlyAskedQuestions.id, sortOrder: frequentlyAskedQuestions.sortOrder, label: frequentlyAskedQuestionTranslations.question })
      .from(frequentlyAskedQuestions)
      .leftJoin(frequentlyAskedQuestionTranslations, and(eq(frequentlyAskedQuestionTranslations.faqId, frequentlyAskedQuestions.id), eq(frequentlyAskedQuestionTranslations.locale, "en")))
      .where(eq(frequentlyAskedQuestions.webappContentId, content.id)).orderBy(asc(frequentlyAskedQuestions.sortOrder), asc(frequentlyAskedQuestions.id)),
    db.select({ id: seeMoreLinks.id, sortOrder: seeMoreLinks.sortOrder, label: seeMoreLinks.title })
      .from(seeMoreLinks).where(eq(seeMoreLinks.webappContentId, content.id)).orderBy(asc(seeMoreLinks.sortOrder), asc(seeMoreLinks.id)),
  ]);

  const faqTranslations = faqRows.length > 0
    ? await db.select().from(frequentlyAskedQuestionTranslations).where(inArray(frequentlyAskedQuestionTranslations.faqId, faqRows.map((faq) => faq.id)))
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
      faqTotalCount: faqCountRows[0]?.count ?? 0,
      seeMoreTotalCount: seeMoreCountRows[0]?.count ?? 0,
      faqOrderItems: faqOrderRows.map((row) => ({ ...row, label: row.label ?? "Untitled FAQ" })),
      seeMoreOrderItems: seeMoreOrderRows,
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
        setIfPresent("googleMapLocationUrl", sanitizeUrlForHtml(String(formData.get("googleMapLocationUrl")), { allowedSchemes: ["https:"], allowedHosts: ["www.google.com", "maps.google.com"] }) || null);
        setIfPresent("officialEmail", formData.get("officialEmail"));
        setIfPresent("facebookUrl", sanitizeUrlForHtml(String(formData.get("facebookUrl")), { allowedSchemes: ["https:"], allowedHosts: ["www.facebook.com", "facebook.com", "m.facebook.com"] }) || null);
        setIfPresent("instagramUrl", sanitizeUrlForHtml(String(formData.get("instagramUrl")), { allowedSchemes: ["https:"], allowedHosts: ["www.instagram.com", "instagram.com"] }) || null);
        setIfPresent("youtubeUrl", sanitizeUrlForHtml(String(formData.get("youtubeUrl")), { allowedSchemes: ["https:"], allowedHosts: ["www.youtube.com", "youtube.com", "youtu.be"] }) || null);
        setIfPresent("tiktokUrl", sanitizeUrlForHtml(String(formData.get("tiktokUrl")), { allowedSchemes: ["https:"], allowedHosts: ["www.tiktok.com", "tiktok.com", "vt.tiktok.com"] }) || null);
        setIfPresent("xUrl", sanitizeUrlForHtml(String(formData.get("xUrl")), { allowedSchemes: ["https:"], allowedHosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"] }) || null);

  const [content] = await db
    .select({ heroImagePath: webappContents.heroImagePath })
    .from(webappContents)
    .where(eq(webappContents.singletonKey, true))
    .limit(1);

  // Handle hero image file upload
  const heroImageFile = formData.get("heroImageFile") as File | null;
  let heroImagePath: string | null = null;
  const supabase = createSupabaseAdminClient();

  if (heroImageFile && heroImageFile.size > 0) {
    const saved = await saveImage({
      supabase,
      file: heroImageFile,
      prefix: "webapp/hero",
      stem: "hero",
    });

    if (!saved.ok) {
      return { success: false as const, error: saved.error };
    }

    heroImagePath = saved.path;
  }

  // Handle hero image removal
  const removeHeroImage = formData.get("removeHeroImage") === "true";

  const obsoleteHeroPath =
    heroImagePath !== null
      ? content?.heroImagePath ?? null
      : removeHeroImage
        ? content?.heroImagePath ?? null
        : null;

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

    if (obsoleteHeroPath && canDeleteImage(obsoleteHeroPath)) {
      await deleteFromStorage(supabase, obsoleteHeroPath);
    }

    revalidatePath("/admin/multimedia/portfolio");
    revalidatePath("/");
    return { success: true as const };
  } catch (err) {
    console.error("updateWebappContent failed", err);
    if (heroImagePath) {
      await deleteFromStorage(supabase, heroImagePath);
    }
    return { success: false as const, error: "Failed to update portfolio." };
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
  const supabase = createSupabaseAdminClient();

  if (imageFile && imageFile.size > 0) {
    const saved = await saveImage({
      supabase,
      file: imageFile,
      prefix: "webapp/see-more",
      stem: "see-more",
    });

    if (!saved.ok) {
      return { success: false as const, error: saved.error };
    }

    imagePath = saved.path;
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
    if (imagePath) {
      await deleteFromStorage(supabase, imagePath);
    }
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

  const [existing] = await db
    .select({ id: seeMoreLinks.id, imagePath: seeMoreLinks.imagePath })
    .from(seeMoreLinks)
    .where(eq(seeMoreLinks.id, linkId))
    .limit(1);

  if (!existing) {
    return { success: false as const, error: "See More link not found." };
  }

  // Handle image upload
  const imageFile = formData.get("imageFile") as File | null;
  let newImagePath: string | null | undefined = undefined;
  let obsoleteImagePath: string | null = null;
  const supabase = createSupabaseAdminClient();

  if (imageFile && imageFile.size > 0) {
    const saved = await saveImage({
      supabase,
      file: imageFile,
      prefix: "webapp/see-more",
      stem: "see-more",
    });

    if (!saved.ok) {
      return { success: false as const, error: saved.error };
    }

    newImagePath = saved.path;
    if (existing.imagePath) obsoleteImagePath = existing.imagePath;
  }

  const removeImage = formData.get("removeImage") === "true";
  if (removeImage) {
    newImagePath = null;
    if (existing.imagePath) obsoleteImagePath = existing.imagePath;
  }

  try {
    const updates: Record<string, string | number | null | undefined> = {
      title,
      link,
      status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    };
    if (newImagePath !== undefined) {
      updates.imagePath = newImagePath;
    }

    await db.update(seeMoreLinks).set(updates).where(eq(seeMoreLinks.id, linkId));

    if (obsoleteImagePath && canDeleteImage(obsoleteImagePath)) {
      await deleteFromStorage(supabase, obsoleteImagePath);
    }

    revalidatePath("/admin/multimedia/portfolio");
    return { success: true as const };
  } catch (err) {
    console.error("updateSeeMoreLink failed", err);
    if (newImagePath) {
      await deleteFromStorage(supabase, newImagePath);
    }
    return { success: false as const, error: "Failed to update See More link." };
  }
}

export async function deleteSeeMoreLink(linkId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "portfolio")) {
    return { success: false as const, error: "You do not have permission to manage portfolio." };
  }

  let imagePath: string | null = null;

  try {
    await db.transaction(async (tx) => {
      const [link] = await tx
        .select({ sortOrder: seeMoreLinks.sortOrder, imagePath: seeMoreLinks.imagePath })
        .from(seeMoreLinks)
        .where(eq(seeMoreLinks.id, linkId))
        .limit(1);
      if (!link) return;
      imagePath = link.imagePath;
      await tx.delete(seeMoreLinks).where(eq(seeMoreLinks.id, linkId));
      await tx.update(seeMoreLinks).set({ sortOrder: sql`${seeMoreLinks.sortOrder} - 1` }).where(gt(seeMoreLinks.sortOrder, link.sortOrder));
    });

    if (imagePath && canDeleteImage(imagePath)) {
      await deleteFromStorage(createSupabaseAdminClient(), imagePath);
    }

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

async function assertPortfolioAccess() {
  const admin = await requireCurrentAdmin();
  return canAccessAdminModule(admin.role, "portfolio");
}

export async function createBestCadet(formData: FormData) {
  if (!(await assertPortfolioAccess())) return { success: false as const, error: "You do not have permission to manage portfolio." };
  const memberId = Number(formData.get("memberId"));
  const storyId = Number(formData.get("relatedStoryId")) || null;
  const awardDate = String(formData.get("awardDate") ?? "");
  const date = new Date(`${awardDate}T00:00:00Z`);
  const normalizedAwardDate = Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
  const portrait = formData.get("portrait");
  const translations = locales.map((locale) => ({ locale: locale as "en" | "ms" | "zh" | "ta", summary: String(formData.get(`summary_${locale}`) ?? "").trim(), quote: String(formData.get(`quote_${locale}`) ?? "").trim() || null }));
  if (!memberId || !/^\d{4}-\d{2}-\d{2}$/.test(awardDate) || normalizedAwardDate !== awardDate || awardDate > getMalaysiaDateISO() || translations.some((item) => !item.summary) || !(portrait instanceof File) || portrait.size === 0) return { success: false as const, error: "Select a cadet, a valid award date no later than today, a portrait, and provide a summary in all four languages." };
  const [selectedCadet] = await db.select({ memberId: cadets.memberId, displayName: members.displayName, intakeId: cadets.intakeId, intakeNo: intakes.intakeNo })
    .from(cadets)
    .innerJoin(members, eq(cadets.memberId, members.id))
    .innerJoin(intakes, eq(cadets.intakeId, intakes.id))
    .where(and(eq(cadets.memberId, memberId), eq(cadets.isActive, true)))
    .limit(1);
  if (!selectedCadet) return { success: false as const, error: "The selected cadet is no longer available." };
  const [existingIntakeRecord, existingYearRecord] = await Promise.all([
    db.select({ id: bestCadets.id }).from(bestCadets).where(eq(bestCadets.intakeId, selectedCadet.intakeId)).limit(1),
    db.select({ id: bestCadets.id }).from(bestCadets).where(sql`extract(year from ${bestCadets.awardDate}) = ${date.getUTCFullYear()}`).limit(1),
  ]);
  console.log("Best Cadet validation:", {
    selectedCadet,
    existingIntakeRecord,
    existingYearRecord,
  });
  if (existingIntakeRecord.length > 0) return { success: false as const, error: "This intake already has a Best Cadet." };
  if (existingYearRecord.length > 0) return { success: false as const, error: `${date.getUTCFullYear()} already has a Best Cadet.` };
  if (storyId) {
    const [story] = await db.select({ id: events.id }).from(events).where(and(eq(events.id, storyId), eq(events.status, "PUBLISHED"))).limit(1);
    if (!story) return { success: false as const, error: "Select an available published story." };
  }
  let uploadedPath: string | null = null;
  try {
    const supabase = createSupabaseAdminClient();
    const saved = await saveImage({ supabase, file: portrait, prefix: "webapp/best-cadets", stem: `portrait-${crypto.randomUUID()}` });
    if (!saved.ok) return { success: false as const, error: saved.error };
    uploadedPath = saved.path;
    let createdRecord: { id: number; memberId: number; displayName: string; awardDate: string; intakeNoSnapshot: string; portraitPath: string; status: "DRAFT" } | null = null;
    await db.transaction(async (tx) => {
      const [record] = await tx.insert(bestCadets).values({ memberId: selectedCadet.memberId, displayName: selectedCadet.displayName, awardDate, intakeId: selectedCadet.intakeId, intakeNoSnapshot: selectedCadet.intakeNo, portraitPath: saved.path, relatedStoryId: storyId, status: "DRAFT" }).returning({ id: bestCadets.id });
      await tx.insert(bestCadetTranslations).values(translations.map((row) => ({ bestCadetId: record.id, ...row })));
      createdRecord = { id: record.id, memberId: selectedCadet.memberId, displayName: selectedCadet.displayName, awardDate, intakeNoSnapshot: selectedCadet.intakeNo, portraitPath: saved.path, status: "DRAFT" };
    });
    revalidatePath("/admin/multimedia/portfolio");
    for (const locale of locales) revalidatePath(`/${locale}`);
    return { success: true as const, data: createdRecord! };
  } catch (error) {
    if (uploadedPath) { try { await deleteFromStorage(createSupabaseAdminClient(), uploadedPath); } catch {} }
    if (isUniqueViolation(error)) return { success: false as const, error: "Only one Best Cadet is allowed per intake and per award year." };
    console.error("createBestCadet failed", error);
    return { success: false as const, error: "Failed to create Best Cadet record." };
  }
}

export async function setBestCadetStatus(id: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  if (!(await assertPortfolioAccess())) return { success: false as const, error: "You do not have permission to manage portfolio." };
  if (status === "PUBLISHED") {
    const rows = await db.select({ summary: bestCadetTranslations.summary, locale: bestCadetTranslations.locale }).from(bestCadetTranslations).where(eq(bestCadetTranslations.bestCadetId, id));
    if (locales.some((locale) => !rows.some((row) => row.locale === locale && row.summary.trim()))) return { success: false as const, error: "A localized summary is required in all four languages before publishing." };
  }
  await db.update(bestCadets).set({ status, updatedAt: new Date() }).where(eq(bestCadets.id, id));
  revalidatePath("/admin/multimedia/portfolio");
  for (const locale of locales) revalidatePath(`/${locale}`);
  return { success: true as const };
}

export async function deleteBestCadet(id: number) {
  if (!(await assertPortfolioAccess())) return { success: false as const, error: "You do not have permission to manage portfolio." };
  const [row] = await db.select({ portraitPath: bestCadets.portraitPath }).from(bestCadets).where(eq(bestCadets.id, id)).limit(1);
  await db.delete(bestCadets).where(eq(bestCadets.id, id));
  if (row?.portraitPath) { try { await deleteFromStorage(createSupabaseAdminClient(), row.portraitPath); } catch {} }
  revalidatePath("/admin/multimedia/portfolio");
  for (const locale of locales) revalidatePath(`/${locale}`);
  return { success: true as const };
}
