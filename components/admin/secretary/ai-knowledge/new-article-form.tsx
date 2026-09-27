"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPublicKnowledgeDocument } from "@/app/admin/secretary/ai-knowledge/actions";
import { Button } from "@/components/ui/button";

const TOPICS = [
  "joining",
  "benefits",
  "what-to-expect",
  "cadet-journey",
  "activities",
  "training",
] as const;

export function NewArticleForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createPublicKnowledgeDocument(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const title = String(data.get("title") ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      const slug = String(data.get("slug") || title);
      router.push(`/admin/secretary/ai-knowledge/${slug}`);
      router.refresh();
    });
  }

  return (
    <div className="mb-5">
      <Button onClick={() => setOpen((value) => !value)} type="button">
        {open ? "Cancel" : "New article"}
      </Button>
      {open && (
        <form
          className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={submit}
        >
          <label className="grid gap-1 text-sm font-medium">
            Article title
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-normal"
              name="title"
              maxLength={240}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Slug
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-normal"
              name="slug"
              placeholder="joining"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Topic
            <select
              className="rounded-md border border-input bg-background px-3 py-2 font-normal"
              name="category"
            >
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Language
            <select
              className="rounded-md border border-input bg-background px-3 py-2 font-normal"
              name="language"
            >
              <option value="en">English</option>
              <option value="ms">Bahasa Melayu</option>
              <option value="zh">中文</option>
              <option value="ta">தமிழ்</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Initial Markdown
            <textarea
              className="min-h-32 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm font-normal"
              name="markdown"
              placeholder="# Article title\n\nWrite reviewed public information here."
              required
            />
          </label>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button disabled={pending} type="submit">
              {pending ? "Creating…" : "Create draft"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
