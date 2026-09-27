import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  adminUsers,
  aiPublicDocumentVersions,
  aiPublicDocuments,
} from "@/db/schema";
import { requireAdminModule } from "@/lib/admin/rbac";
import {
  KnowledgeEditor,
  type KnowledgeVersion,
} from "@/components/admin/secretary/ai-knowledge/knowledge-editor";

export default async function PublicAIKnowledgeEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminModule("ai-knowledge");
  const { slug } = await params;
  const [document] = await db
    .select()
    .from(aiPublicDocuments)
    .where(eq(aiPublicDocuments.slug, slug))
    .limit(1);
  if (!document) notFound();
  const versions = await db
    .select()
    .from(aiPublicDocumentVersions)
    .where(eq(aiPublicDocumentVersions.documentId, document.id))
    .orderBy(desc(aiPublicDocumentVersions.versionNumber));
  const actorIds = [
    ...new Set(
      versions
        .flatMap((version) => [version.updatedBy, version.publishedBy])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors = actorIds.length
    ? await db
        .select({ id: adminUsers.id, email: adminUsers.email })
        .from(adminUsers)
        .where(inArray(adminUsers.id, actorIds))
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor.email]));
  const viewVersions: KnowledgeVersion[] = versions.map((version) => ({
    id: version.id,
    language: version.language,
    title: version.title,
    markdown: version.markdown,
    versionNumber: version.versionNumber,
    status: version.status,
    indexStatus: version.indexStatus,
    indexError: version.indexError,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    createdAt: version.createdAt.toISOString(),
    createdByEmail: version.updatedBy
      ? (actorById.get(version.updatedBy) ?? null)
      : null,
    publishedByEmail: version.publishedBy
      ? (actorById.get(version.publishedBy) ?? null)
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <KnowledgeEditor
        documentId={document.id}
        slug={document.slug}
        topic={document.canonicalTopic}
        versions={viewVersions}
      />
    </main>
  );
}
