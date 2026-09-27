import "server-only";
import { and, count, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  aiIndexJobs,
  aiPublicDocumentVersions,
  aiPublicDocuments,
  aiPublicChunks,
} from "@/db/schema";
import { openRouterProvider } from "@/lib/ai/provider/openrouter";
import { chunkMarkdown, hashContent } from "@/lib/ai/knowledge/chunker";
import { getSiteUrl } from "@/lib/env/public";
import { validatePublicKnowledgeVersion } from "@/lib/ai/knowledge/validation";

async function indexPublicDocumentVersion(
  versionId: string,
  adminUserId: string | null,
) {
  const [row] = await db
    .select({
      version: aiPublicDocumentVersions,
      document: aiPublicDocuments,
    })
    .from(aiPublicDocumentVersions)
    .innerJoin(
      aiPublicDocuments,
      eq(aiPublicDocuments.id, aiPublicDocumentVersions.documentId),
    )
    .where(eq(aiPublicDocumentVersions.id, versionId))
    .limit(1);

  if (!row || row.version.status !== "DRAFT")
    throw new Error("Knowledge draft was not found");
  const validationError = validatePublicKnowledgeVersion(
    row.version.title,
    row.version.markdown,
  );
  if (validationError) throw new Error(validationError);
  const chunks = chunkMarkdown(row.version.markdown);
  if (chunks.length === 0)
    throw new Error("Add some Markdown content before publishing");

  const [matchingPublished] = await db
    .select({ id: aiPublicDocumentVersions.id })
    .from(aiPublicDocumentVersions)
    .where(
      and(
        eq(aiPublicDocumentVersions.documentId, row.document.id),
        eq(aiPublicDocumentVersions.language, row.version.language),
        eq(aiPublicDocumentVersions.contentHash, row.version.contentHash),
        eq(aiPublicDocumentVersions.status, "PUBLISHED"),
        eq(aiPublicDocumentVersions.indexStatus, "INDEXED"),
      ),
    )
    .limit(1);
  const [reusable] = matchingPublished
    ? await db
        .select({ count: count(aiPublicChunks.id) })
        .from(aiPublicChunks)
        .where(eq(aiPublicChunks.documentVersionId, matchingPublished.id))
    : [{ count: 0 }];
  const canReuse = Boolean(
    matchingPublished && Number(reusable?.count) === chunks.length,
  );

  await db
    .update(aiPublicDocumentVersions)
    .set({ indexStatus: "INDEXING", indexError: null })
    .where(eq(aiPublicDocumentVersions.id, versionId));

  try {
    const vectors: number[][] = [];
    if (!canReuse) {
      for (let offset = 0; offset < chunks.length; offset += 16) {
        const batch = chunks.slice(offset, offset + 16);
        const inputs = batch.map((chunk) =>
          [row.version.title, chunk.headingPath, chunk.content]
            .filter(Boolean)
            .join("\n\n"),
        );
        vectors.push(
          ...(await openRouterProvider.generateEmbedding(inputs, "document")),
        );
      }
    }

    const publishedAt = new Date();
    await db.transaction(async (tx) => {
      await tx
        .delete(aiPublicChunks)
        .where(eq(aiPublicChunks.documentVersionId, versionId));
      if (canReuse && matchingPublished) {
        await tx.execute(sql`
          INSERT INTO ai_public_chunks (
            document_version_id, language, category, source_type, chunk_index,
            heading_path, content, embedding_text, content_hash, token_count,
            canonical_url, published_at, embedding
          )
          SELECT ${versionId}::uuid, language, category, source_type, chunk_index,
            heading_path, content, embedding_text, content_hash, token_count,
            canonical_url, ${publishedAt}, embedding
          FROM ai_public_chunks WHERE document_version_id = ${matchingPublished.id}::uuid
        `);
      } else {
        await tx.insert(aiPublicChunks).values(
          chunks.map((chunk, index) => {
            const embeddingText = [
              row.version.title,
              chunk.headingPath,
              chunk.content,
            ]
              .filter(Boolean)
              .join("\n\n");
            return {
              documentVersionId: versionId,
              language: row.version.language,
              category: row.document.category,
              sourceType: row.document.sourceType,
              chunkIndex: chunk.chunkIndex,
              headingPath: chunk.headingPath,
              content: chunk.content,
              embeddingText,
              contentHash: hashContent(embeddingText),
              tokenCount: chunk.tokenCount,
              canonicalUrl: `${getSiteUrl()}/${row.version.language}/knowledge/${row.document.slug}`,
              publishedAt,
              embedding: vectors[index],
            };
          }),
        );
      }
      await tx
        .update(aiPublicDocumentVersions)
        .set({ status: "ARCHIVED", indexStatus: "STALE" })
        .where(
          and(
            eq(aiPublicDocumentVersions.documentId, row.document.id),
            eq(aiPublicDocumentVersions.language, row.version.language),
            eq(aiPublicDocumentVersions.status, "PUBLISHED"),
          ),
        );
      await tx
        .update(aiPublicDocumentVersions)
        .set({
          status: "PUBLISHED",
          indexStatus: "INDEXED",
          indexError: null,
          publishedAt,
          publishedBy: adminUserId,
        })
        .where(eq(aiPublicDocumentVersions.id, versionId));
      if (adminUserId) {
        await tx
          .update(aiPublicDocuments)
          .set({ updatedBy: adminUserId })
          .where(eq(aiPublicDocuments.id, row.document.id));
      }
    });
  } catch (error) {
    await db
      .update(aiPublicDocumentVersions)
      .set({
        indexStatus: "FAILED",
        indexError: "Embedding generation or indexing failed",
      })
      .where(eq(aiPublicDocumentVersions.id, versionId));
    throw error;
  }
}

export async function publishPublicDocumentVersion(
  versionId: string,
  adminUserId: string | null,
) {
  const [row] = await db
    .select({ version: aiPublicDocumentVersions })
    .from(aiPublicDocumentVersions)
    .where(eq(aiPublicDocumentVersions.id, versionId))
    .limit(1);
  if (
    !row ||
    row.version.status !== "DRAFT" ||
    row.version.indexStatus === "INDEXING"
  )
    throw new Error("Knowledge draft is missing or already indexing");
  const validationError = validatePublicKnowledgeVersion(
    row.version.title,
    row.version.markdown,
  );
  if (validationError) throw new Error(validationError);
  const chunks = chunkMarkdown(row.version.markdown);
  if (chunks.length === 0)
    throw new Error("Add some Markdown content before publishing");
  await db.transaction(async (tx) => {
    const [claimedVersion] = await tx
      .update(aiPublicDocumentVersions)
      .set({ indexStatus: "INDEXING", indexError: null })
      .where(
        and(
          eq(aiPublicDocumentVersions.id, versionId),
          eq(aiPublicDocumentVersions.status, "DRAFT"),
          sql`${aiPublicDocumentVersions.indexStatus} <> 'INDEXING'`,
        ),
      )
      .returning({ id: aiPublicDocumentVersions.id });
    if (!claimedVersion)
      throw new Error("Knowledge draft is already being indexed");
    await tx
      .insert(aiIndexJobs)
      .values({
        documentVersionId: versionId,
        requestedBy: adminUserId,
        status: "QUEUED",
        attempts: 0,
        lastError: null,
        startedAt: null,
        completedAt: null,
      })
      .onConflictDoUpdate({
        target: aiIndexJobs.documentVersionId,
        set: {
          requestedBy: adminUserId,
          status: "QUEUED",
          attempts: 0,
          lastError: null,
          startedAt: null,
          completedAt: null,
        },
      });
  });
}

export async function processPublicIndexJob(jobId: string) {
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const retryBefore = new Date(Date.now() - 2 * 60 * 1000);
  const [job] = await db
    .update(aiIndexJobs)
    .set({
      status: "INDEXING",
      attempts: sql`${aiIndexJobs.attempts} + 1`,
      startedAt: new Date(),
      lastError: null,
    })
    .where(
      and(
        eq(aiIndexJobs.id, jobId),
        or(
          eq(aiIndexJobs.status, "QUEUED"),
          and(
            eq(aiIndexJobs.status, "INDEXING"),
            lt(aiIndexJobs.startedAt, staleBefore),
          ),
          and(
            eq(aiIndexJobs.status, "FAILED"),
            lt(aiIndexJobs.updatedAt, retryBefore),
            sql`${aiIndexJobs.attempts} < 3`,
          ),
        ),
      ),
    )
    .returning({
      versionId: aiIndexJobs.documentVersionId,
      requestedBy: aiIndexJobs.requestedBy,
      attempts: aiIndexJobs.attempts,
    });
  if (!job) return "SKIPPED" as const;
  try {
    await indexPublicDocumentVersion(job.versionId, job.requestedBy);
    await db
      .update(aiIndexJobs)
      .set({ status: "INDEXED", completedAt: new Date(), lastError: null })
      .where(eq(aiIndexJobs.id, jobId));
    return "COMPLETED" as const;
  } catch {
    await db
      .update(aiIndexJobs)
      .set({
        status: "FAILED",
        completedAt: new Date(),
        lastError: "Indexing failed; a retry may be queued.",
      })
      .where(eq(aiIndexJobs.id, jobId));
    return job.attempts < 3 ? ("RETRIED" as const) : ("FAILED" as const);
  }
}

export async function processQueuedPublicIndexJobs(limit = 10) {
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  const retryBefore = new Date(Date.now() - 2 * 60 * 1000);
  const jobs = await db
    .select({ id: aiIndexJobs.id })
    .from(aiIndexJobs)
    .where(
      or(
        eq(aiIndexJobs.status, "QUEUED"),
        and(
          eq(aiIndexJobs.status, "INDEXING"),
          lt(aiIndexJobs.startedAt, staleBefore),
        ),
        and(
          eq(aiIndexJobs.status, "FAILED"),
          lt(aiIndexJobs.updatedAt, retryBefore),
          sql`${aiIndexJobs.attempts} < 3`,
        ),
      ),
    )
    .orderBy(aiIndexJobs.createdAt)
    .limit(Math.max(1, Math.min(limit, 10)));
  const outcomes = [];
  for (const job of jobs) outcomes.push(await processPublicIndexJob(job.id));
  return {
    processed: jobs.length,
    completed: outcomes.filter((outcome) => outcome === "COMPLETED").length,
    failed: outcomes.filter((outcome) => outcome === "FAILED").length,
    retried: outcomes.filter((outcome) => outcome === "RETRIED").length,
    skipped: outcomes.filter((outcome) => outcome === "SKIPPED").length,
  };
}
