"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { aiPublicDocumentVersions, aiPublicDocuments } from "@/db/schema";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { publishPublicDocumentVersion } from "@/lib/ai/knowledge/indexer";
import { hashContent } from "@/lib/ai/knowledge/chunker";
import { validatePublicKnowledgeVersion } from "@/lib/ai/knowledge/validation";
import { isLocale } from "@/lib/i18n/config";
import { slugify } from "@/lib/slugify";

type Result =
  { success: true; versionId?: string } | { success: false; error: string };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_TOPICS = new Set([
  "joining",
  "benefits",
  "what-to-expect",
  "cadet-journey",
  "activities",
  "training",
]);

async function authorizedAdmin() {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "ai-knowledge"))
    throw new Error("Not authorized");
  return admin;
}

function revalidateKnowledge(slug?: string) {
  revalidatePath("/admin/secretary/ai-knowledge");
  if (slug) {
    revalidatePath(`/admin/secretary/ai-knowledge/${slug}`);
    for (const locale of ["en", "ms", "zh", "ta"] as const)
      revalidatePath(`/${locale}/knowledge/${slug}`);
  }
}

export async function createPublicKnowledgeDocument(
  formData: FormData,
): Promise<Result> {
  const admin = await authorizedAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const language = String(formData.get("language") ?? "");
  const markdown = String(formData.get("markdown") ?? "");
  const slug = slugify(rawSlug || title);

  if (!SLUG_PATTERN.test(slug))
    return { success: false, error: "Use a lowercase, hyphen-separated slug." };
  if (!ALLOWED_TOPICS.has(category))
    return { success: false, error: "Choose a supported knowledge topic." };
  if (!isLocale(language))
    return { success: false, error: "Choose a supported language." };
  const validationError = validatePublicKnowledgeVersion(title, markdown);
  if (validationError) return { success: false, error: validationError };

  try {
    const version = await db.transaction(async (tx) => {
      const [document] = await tx
        .insert(aiPublicDocuments)
        .values({
          slug,
          canonicalTopic: category,
          category: category.toUpperCase().replaceAll("-", "_"),
          createdBy: admin.id,
          updatedBy: admin.id,
        })
        .returning({ id: aiPublicDocuments.id });
      const [createdVersion] = await tx
        .insert(aiPublicDocumentVersions)
        .values({
          documentId: document.id,
          language,
          title,
          markdown,
          contentHash: hashContent(`${title}\n${markdown}`),
          versionNumber: 1,
          createdBy: admin.id,
          updatedBy: admin.id,
        })
        .returning({ id: aiPublicDocumentVersions.id });
      return createdVersion;
    });
    revalidateKnowledge(slug);
    return { success: true, versionId: version.id };
  } catch {
    return {
      success: false,
      error: "A document with this slug already exists or could not be saved.",
    };
  }
}

export async function savePublicKnowledgeDraft(
  formData: FormData,
): Promise<Result> {
  const admin = await authorizedAdmin();
  const documentId = String(formData.get("documentId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const language = String(formData.get("language") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const markdown = String(formData.get("markdown") ?? "");
  if (!documentId || !isLocale(language))
    return {
      success: false,
      error: "The selected knowledge version is invalid.",
    };
  const validationError = validatePublicKnowledgeVersion(title, markdown);
  if (validationError) return { success: false, error: validationError };

  const [document] = await db
    .select({ id: aiPublicDocuments.id, slug: aiPublicDocuments.slug })
    .from(aiPublicDocuments)
    .where(eq(aiPublicDocuments.id, documentId))
    .limit(1);
  if (!document)
    return { success: false, error: "Knowledge article not found." };

  try {
    if (versionId) {
      const [existing] = await db
        .select()
        .from(aiPublicDocumentVersions)
        .where(
          and(
            eq(aiPublicDocumentVersions.id, versionId),
            eq(aiPublicDocumentVersions.documentId, documentId),
            eq(aiPublicDocumentVersions.language, language),
          ),
        )
        .limit(1);
      if (
        !existing ||
        existing.status === "ARCHIVED" ||
        existing.indexStatus === "INDEXING"
      )
        return {
          success: false,
          error:
            "This version cannot be edited while it is archived or indexing.",
        };
      if (existing.status === "DRAFT") {
        await db
          .update(aiPublicDocumentVersions)
          .set({
            title,
            markdown,
            contentHash: hashContent(`${title}\n${markdown}`),
            indexStatus: "UNINDEXED",
            indexError: null,
            updatedBy: admin.id,
          })
          .where(eq(aiPublicDocumentVersions.id, existing.id));
        await db
          .update(aiPublicDocuments)
          .set({ updatedBy: admin.id })
          .where(eq(aiPublicDocuments.id, documentId));
        revalidateKnowledge(document.slug);
        return { success: true, versionId: existing.id };
      }
    }

    const [latest] = await db
      .select({ versionNumber: aiPublicDocumentVersions.versionNumber })
      .from(aiPublicDocumentVersions)
      .where(
        and(
          eq(aiPublicDocumentVersions.documentId, documentId),
          eq(aiPublicDocumentVersions.language, language),
        ),
      )
      .orderBy(desc(aiPublicDocumentVersions.versionNumber))
      .limit(1);
    const [created] = await db
      .insert(aiPublicDocumentVersions)
      .values({
        documentId,
        language,
        title,
        markdown,
        contentHash: hashContent(`${title}\n${markdown}`),
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        createdBy: admin.id,
        updatedBy: admin.id,
      })
      .returning({ id: aiPublicDocumentVersions.id });
    await db
      .update(aiPublicDocuments)
      .set({ updatedBy: admin.id })
      .where(eq(aiPublicDocuments.id, documentId));
    revalidateKnowledge(document.slug);
    return { success: true, versionId: created.id };
  } catch {
    return { success: false, error: "The draft could not be saved." };
  }
}

export async function publishPublicKnowledgeVersion(
  formData: FormData,
): Promise<Result> {
  const admin = await authorizedAdmin();
  const versionId = String(formData.get("versionId") ?? "");
  if (!versionId)
    return { success: false, error: "Select a draft before publishing." };
  try {
    await publishPublicDocumentVersion(versionId, admin.id);
    const [version] = await db
      .select({ slug: aiPublicDocuments.slug })
      .from(aiPublicDocumentVersions)
      .innerJoin(
        aiPublicDocuments,
        eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
      )
      .where(eq(aiPublicDocumentVersions.id, versionId))
      .limit(1);
    revalidateKnowledge(version?.slug);
    return { success: true, versionId };
  } catch {
    return {
      success: false,
      error:
        "Publishing or search indexing failed. The version remains a draft; check provider configuration and retry.",
    };
  }
}

export async function restorePublicKnowledgeVersion(
  formData: FormData,
): Promise<Result> {
  const admin = await authorizedAdmin();
  const versionId = String(formData.get("versionId") ?? "");
  const [version] = await db
    .select()
    .from(aiPublicDocumentVersions)
    .where(eq(aiPublicDocumentVersions.id, versionId))
    .limit(1);
  if (!version || version.status !== "ARCHIVED")
    return {
      success: false,
      error: "Only an archived version can be restored.",
    };
  const [document] = await db
    .select()
    .from(aiPublicDocuments)
    .where(eq(aiPublicDocuments.id, version.documentId))
    .limit(1);
  if (!document)
    return { success: false, error: "Knowledge article not found." };
  const [latest] = await db
    .select({ versionNumber: aiPublicDocumentVersions.versionNumber })
    .from(aiPublicDocumentVersions)
    .where(
      and(
        eq(aiPublicDocumentVersions.documentId, document.id),
        eq(aiPublicDocumentVersions.language, version.language),
      ),
    )
    .orderBy(desc(aiPublicDocumentVersions.versionNumber))
    .limit(1);
  try {
    const [restored] = await db
      .insert(aiPublicDocumentVersions)
      .values({
        documentId: document.id,
        language: version.language,
        title: version.title,
        markdown: version.markdown,
        contentHash: version.contentHash,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        status: "DRAFT",
        createdBy: admin.id,
        updatedBy: admin.id,
      })
      .returning({ id: aiPublicDocumentVersions.id });
    await db
      .update(aiPublicDocuments)
      .set({ updatedBy: admin.id })
      .where(eq(aiPublicDocuments.id, document.id));
    revalidateKnowledge(document.slug);
    return { success: true, versionId: restored.id };
  } catch {
    return {
      success: false,
      error: "The version could not be restored as a draft.",
    };
  }
}

export async function archivePublicKnowledgeVersion(
  formData: FormData,
): Promise<Result> {
  await authorizedAdmin();
  const versionId = String(formData.get("versionId") ?? "");
  const [version] = await db
    .select({
      id: aiPublicDocumentVersions.id,
      documentId: aiPublicDocumentVersions.documentId,
      status: aiPublicDocumentVersions.status,
    })
    .from(aiPublicDocumentVersions)
    .where(eq(aiPublicDocumentVersions.id, versionId))
    .limit(1);
  if (!version || version.status !== "PUBLISHED")
    return {
      success: false,
      error: "This version is not currently published.",
    };
  const [document] = await db
    .select({ slug: aiPublicDocuments.slug })
    .from(aiPublicDocuments)
    .where(eq(aiPublicDocuments.id, version.documentId))
    .limit(1);
  await db
    .update(aiPublicDocumentVersions)
    .set({ status: "ARCHIVED", indexStatus: "STALE" })
    .where(eq(aiPublicDocumentVersions.id, version.id));
  revalidateKnowledge(document?.slug);
  return { success: true, versionId };
}
