import Link from "next/link";
import { asc, desc, inArray } from "drizzle-orm";
import { ArrowUpRightIcon, BookOpenCheckIcon } from "lucide-react";
import { db } from "@/db";
import {
  adminUsers,
  aiPublicDocumentVersions,
  aiPublicDocuments,
} from "@/db/schema";
import { requireAdminModule } from "@/lib/admin/rbac";
import { NewArticleForm } from "@/components/admin/secretary/ai-knowledge/new-article-form";
import type { Locale } from "@/lib/i18n/config";

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ms", label: "MS" },
  { code: "zh", label: "ZH" },
  { code: "ta", label: "TA" },
];

export default async function PublicAIKnowledgePage() {
  await requireAdminModule("ai-knowledge");
  const [documents, versions] = await Promise.all([
    db
      .select()
      .from(aiPublicDocuments)
      .orderBy(asc(aiPublicDocuments.canonicalTopic)),
    db
      .select({
        id: aiPublicDocumentVersions.id,
        documentId: aiPublicDocumentVersions.documentId,
        language: aiPublicDocumentVersions.language,
        title: aiPublicDocumentVersions.title,
        versionNumber: aiPublicDocumentVersions.versionNumber,
        status: aiPublicDocumentVersions.status,
        indexStatus: aiPublicDocumentVersions.indexStatus,
        publishedAt: aiPublicDocumentVersions.publishedAt,
        createdAt: aiPublicDocumentVersions.createdAt,
        createdBy: aiPublicDocumentVersions.createdBy,
        publishedBy: aiPublicDocumentVersions.publishedBy,
      })
      .from(aiPublicDocumentVersions)
      .orderBy(desc(aiPublicDocumentVersions.versionNumber)),
  ]);
  const latest = new Map<string, (typeof versions)[number]>();
  const published = new Map<string, (typeof versions)[number]>();
  for (const version of versions) {
    const key = `${version.documentId}:${version.language}`;
    if (!latest.has(key)) latest.set(key, version);
    if (version.status === "PUBLISHED" && !published.has(key))
      published.set(key, version);
  }
  const actorIds = [
    ...new Set(
      versions
        .flatMap((version) => [version.createdBy, version.publishedBy])
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-border bg-muted">
          <BookOpenCheckIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Public AI Knowledge</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage reviewed public programme articles and their English, Malay,
            Chinese, and Tamil versions. Publishing indexes the version before
            it becomes public.
          </p>
        </div>
      </header>
      <NewArticleForm />
      <div className="space-y-3">
        {documents.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No public knowledge articles have been imported yet.
          </div>
        )}
        {documents.map((document) => {
          const title =
            latest.get(`${document.id}:en`)?.title ??
            document.canonicalTopic.replaceAll("-", " ");
          const publishedCount = LOCALES.filter(({ code }) =>
            published.has(`${document.id}:${code}`),
          ).length;
          const fullyIndexed =
            publishedCount === 4 &&
            LOCALES.every(
              ({ code }) =>
                published.get(`${document.id}:${code}`)?.indexStatus ===
                "INDEXED",
            );
          return (
            <Link
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
              href={`/admin/secretary/ai-knowledge/${document.slug}`}
              key={document.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                    {document.canonicalTopic}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  Manage versions <ArrowUpRightIcon className="size-3.5" />
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {LOCALES.map(({ code, label }) => {
                  const current = latest.get(`${document.id}:${code}`);
                  const currentPublished = published.get(
                    `${document.id}:${code}`,
                  );
                  const state =
                    current?.status === "PUBLISHED"
                      ? "Published"
                      : current
                        ? "Draft"
                        : "Missing";
                  const indexed = currentPublished?.indexStatus === "INDEXED";
                  return (
                    <span
                      className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
                      key={code}
                    >
                      <span className="font-medium">{label}</span>
                      <span>{state}</span>
                      {indexed && <span aria-label="Indexed">✓</span>}
                      {current?.indexStatus === "FAILED" && (
                        <span className="text-destructive">Index failed</span>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{publishedCount}/4 published</span>
                <span>
                  {fullyIndexed
                    ? "Indexed ✓"
                    : publishedCount === 0
                      ? "Not published"
                      : "Translation or indexing incomplete"}
                </span>
                {document.updatedBy && (
                  <span>
                    Last updated by{" "}
                    {actorById.get(document.updatedBy) ?? "administrator"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
