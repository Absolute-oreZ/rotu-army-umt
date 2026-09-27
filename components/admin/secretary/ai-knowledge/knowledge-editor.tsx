"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  Clock3Icon,
  LanguagesIcon,
  LoaderCircleIcon,
  SaveIcon,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import {
  archivePublicKnowledgeVersion,
  publishPublicKnowledgeVersion,
  restorePublicKnowledgeVersion,
  savePublicKnowledgeDraft,
} from "@/app/admin/secretary/ai-knowledge/actions";
import type { Locale } from "@/lib/i18n/config";
import { chunkMarkdown } from "@/lib/ai/knowledge/markdown-chunker";
import { translationWarnings } from "@/lib/ai/knowledge/translation-checks";

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "中文" },
  { code: "ta", label: "தமிழ்" },
];

export type KnowledgeVersion = {
  id: string;
  language: Locale;
  title: string;
  markdown: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  indexStatus: "UNINDEXED" | "INDEXING" | "INDEXED" | "FAILED" | "STALE";
  indexError: string | null;
  publishedAt: string | null;
  createdAt: string;
  createdByEmail: string | null;
  publishedByEmail: string | null;
};

type Props = {
  documentId: string;
  slug: string;
  topic: string;
  versions: KnowledgeVersion[];
};

function LocaleEditor({
  documentId,
  slug,
  locale,
  versions,
}: Props & { locale: Locale }) {
  const router = useRouter();
  const localeVersions = versions.filter(
    (version) => version.language === locale,
  );
  const current = localeVersions[0];
  const latestPublished = localeVersions.find(
    (version) => version.status === "PUBLISHED",
  );
  const [title, setTitle] = useState(current?.title ?? "");
  const [markdown, setMarkdown] = useState(current?.markdown ?? "");
  const [versionId, setVersionId] = useState(
    current?.status === "ARCHIVED" ? "" : (current?.id ?? ""),
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const previewChunks = useMemo(() => chunkMarkdown(markdown), [markdown]);
  const qaWarnings = translationWarnings([
    ...versions
      .filter((version) => version.language !== locale)
      .map(({ language, title, markdown: source }) => ({
        language,
        title,
        markdown: source,
      })),
    { language: locale, title, markdown },
  ]).filter((warning) => warning.language === locale);

  function saveDraft() {
    const data = new FormData();
    data.set("documentId", documentId);
    data.set("versionId", versionId);
    data.set("language", locale);
    data.set("title", title);
    data.set("markdown", markdown);
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await savePublicKnowledgeDraft(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setVersionId(result.versionId ?? "");
      setNotice("Draft saved.");
      router.refresh();
    });
  }

  function publish() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const draftData = new FormData();
      draftData.set("documentId", documentId);
      draftData.set("versionId", versionId);
      draftData.set("language", locale);
      draftData.set("title", title);
      draftData.set("markdown", markdown);
      const saved = await savePublicKnowledgeDraft(draftData);
      if (!saved.success || !saved.versionId) {
        setError("Save this language version as a draft before publishing.");
        return;
      }
      const publishData = new FormData();
      publishData.set("versionId", saved.versionId);
      const result = await publishPublicKnowledgeVersion(publishData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(
        "Version queued for indexing; it will become searchable after indexing succeeds.",
      );
      router.refresh();
    });
  }

  const indexStatus =
    current?.status === "DRAFT"
      ? current.indexStatus
      : latestPublished?.indexStatus;
  const latestStatus = current?.status ?? latestPublished?.status;
  const canPublish = versionId.length > 0 && latestStatus !== "ARCHIVED";

  function archivePublished() {
    if (!latestPublished) return;
    const data = new FormData();
    data.set("versionId", latestPublished.id);
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await archivePublicKnowledgeVersion(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(
        "Published version archived. It is no longer available to public retrieval.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1">
            <LanguagesIcon className="size-3.5" />
            {locale.toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3Icon className="size-3.5" />
            {latestStatus ?? "Not created"}
          </span>
          <span className="inline-flex items-center gap-1">
            Index: {indexStatus ?? "UNINDEXED"}
          </span>
          {latestPublished && (
            <span>
              Published v{latestPublished.versionNumber} ·{" "}
              {latestPublished.publishedByEmail ?? "Seed import"}
            </span>
          )}
          {current && (
            <span>
              Last edited by {current.createdByEmail ?? "Seed import"}
            </span>
          )}
        </div>
        {indexStatus === "INDEXED" && (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckIcon className="size-3.5" />
            Searchable
          </span>
        )}
      </div>
      {current?.indexError && (
        <p className="text-sm text-destructive">{current.indexError}</p>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Article title
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-base font-semibold"
          maxLength={240}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
      </label>
      <div className="grid min-h-[480px] gap-3 xl:grid-cols-2">
        <label className="flex min-h-[480px] flex-col gap-1 text-sm font-medium">
          Markdown
          <textarea
            className="min-h-[450px] flex-1 resize-y rounded-md border border-input bg-background p-3 font-mono text-sm font-normal leading-6"
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="# Article title\n\nWrite reviewed public information here."
            value={markdown}
          />
        </label>
        <section
          aria-label="Markdown preview"
          className="min-h-[480px] rounded-md border border-border bg-card p-4"
        >
          <h2 className="mb-3 border-b border-border pb-2 text-sm font-semibold">
            Preview
          </h2>
          <h1 className="mb-3 text-2xl font-bold">
            {title || "Untitled article"}
          </h1>
          <MarkdownPreview markdown={markdown} />
        </section>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview: {previewChunks.length} chunks · Language:{" "}
        {locale.toUpperCase()} · Searchable after publish and successful
        indexing.
      </p>
      {qaWarnings.length > 0 && (
        <aside
          className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
          aria-label="Translation review warnings"
        >
          <p className="font-medium">Translation review warnings</p>
          <ul className="mt-1 list-disc pl-5">
            {qaWarnings.map((warning, index) => (
              <li key={`${warning.language}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </aside>
      )}
      {error && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-emerald-700" role="status">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={saveDraft} type="button">
          <SaveIcon className="size-4" />
          Save draft
        </Button>
        <Button
          disabled={pending || !canPublish}
          onClick={publish}
          type="button"
        >
          <SendIcon className="size-4" />
          Publish and index
        </Button>
        {latestPublished && (
          <Button
            disabled={pending}
            onClick={archivePublished}
            type="button"
            variant="outline"
          >
            Unpublish current version
          </Button>
        )}
        {pending && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Working…
          </span>
        )}
        <Link
          className="ml-auto self-center text-sm underline"
          href={`/${locale}/knowledge/${slug}`}
          target="_blank"
        >
          View published page
        </Link>
      </div>
    </div>
  );
}

export function KnowledgeEditor(props: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  const [restoreError, setRestoreError] = useState("");
  const [restoring, startRestore] = useTransition();
  const statusByLocale = new Map<Locale, string>();
  for (const item of LOCALES) {
    const selected = props.versions.find(
      (version) => version.language === item.code,
    );
    statusByLocale.set(
      item.code,
      selected?.status === "PUBLISHED"
        ? "Published"
        : selected
          ? "Draft"
          : "Missing",
    );
  }
  return (
    <div>
      <header className="mb-5">
        <Link
          className="text-sm text-muted-foreground underline"
          href="/admin/secretary/ai-knowledge"
        >
          ← Public AI Knowledge
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {props.topic}
            </p>
            <h1 className="text-2xl font-semibold">{props.slug}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {props.versions.length} version
            {props.versions.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>
      <div
        aria-label="Article language"
        className="mb-4 flex flex-wrap gap-2"
        role="tablist"
      >
        {LOCALES.map((item) => (
          <button
            aria-selected={locale === item.code}
            className={`rounded-md border px-3 py-2 text-sm ${locale === item.code ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            key={item.code}
            onClick={() => setLocale(item.code)}
            role="tab"
            type="button"
          >
            {item.label}{" "}
            <span className="ml-1 opacity-75">
              {statusByLocale.get(item.code)}
            </span>
          </button>
        ))}
      </div>
      <LocaleEditor
        documentId={props.documentId}
        key={`${props.documentId}-${locale}-${props.versions.find((v) => v.language === locale)?.id ?? "new"}`}
        locale={locale}
        slug={props.slug}
        topic={props.topic}
        versions={props.versions}
      />
      {restoreError && (
        <p className="mt-5 text-sm text-destructive" role="alert">
          {restoreError}
        </p>
      )}
      {props.versions.length > 0 && (
        <section className="mt-8 border-t border-border pt-5">
          <h2 className="mb-3 text-lg font-semibold">Version history</h2>
          <ol className="space-y-2">
            {props.versions.map((version) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                key={version.id}
              >
                <span>
                  {version.language.toUpperCase()} · v{version.versionNumber} ·{" "}
                  {version.status} · {version.indexStatus}
                </span>
                <span className="text-xs text-muted-foreground">
                  {version.publishedAt
                    ? new Date(version.publishedAt).toLocaleString()
                    : `Draft updated ${new Date(version.createdAt).toLocaleString()}`}
                </span>
                {version.status === "ARCHIVED" && (
                  <Button
                    disabled={restoring}
                    onClick={() => {
                      const data = new FormData();
                      data.set("versionId", version.id);
                      setRestoreError("");
                      startRestore(async () => {
                        const result =
                          await restorePublicKnowledgeVersion(data);
                        if (!result.success) {
                          setRestoreError(result.error);
                          return;
                        }
                        setLocale(version.language);
                        router.refresh();
                      });
                    }}
                    size="sm"
                    type="button"
                  >
                    Restore as draft
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
