"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoriesTable, type StoryRow } from "@/components/admin/multimedia/stories/stories-table";
import { StoryDialog } from "@/components/admin/multimedia/stories/add-story-dialog";
import { StoryDetailsSheet } from "@/components/admin/multimedia/stories/story-details-sheet";
import { DeleteStoryDialog } from "@/components/admin/multimedia/stories/delete-story-dialog";
import { setStoryStatus, type AvailableStoryTag } from "@/app/admin/multimedia/stories/actions";

type StoriesPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  stories: StoryRow[];
  totalCount: number;
  availableTags: AvailableStoryTag[];
};

export function StoriesPageClient({
  searchParams,
  stories,
  totalCount,
  availableTags,
}: StoriesPageClientProps) {
  const [detailTarget, setDetailTarget] = useState<{ story: StoryRow | null; mode: "view" | "edit" }>({
    story: null,
    mode: "view",
  });
  const [deleteTarget, setDeleteTarget] = useState<StoryRow | null>(null);
  // Holds any error message from delete operations or other actions.
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(story: StoryRow, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    startTransition(async () => {
      const result = await setStoryStatus(story.id, status);
      if (result.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stories</h1>
        <StoryDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              Add Story
            </Button>
          }
          availableTags={availableTags}
        />
      </div>

      <StoriesTable
        stories={stories}
        searchParams={searchParams}
        totalCount={totalCount}
        onStatusChange={handleStatusChange}
        isPending={isPending}
        onView={(story) => {
          setError(null);
          setDetailTarget({ story, mode: "view" });
        }}
        onEdit={(story) => {
          setError(null);
          setDetailTarget({ story, mode: "edit" });
        }}
        onDelete={(story) => {
          setError(null);
          setDeleteTarget(story);
        }}
      />

      {error && !deleteTarget && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <StoryDetailsSheet
        key={`${detailTarget.story?.id ?? "none"}-${detailTarget.mode}`}
        storyId={detailTarget.story?.id ?? null}
        initialMode={detailTarget.mode}
        open={!!detailTarget.story}
        onOpenChange={(open) => {
          if (!open) setDetailTarget({ story: null, mode: "view" });
        }}
        availableTags={availableTags}
      />

      <DeleteStoryDialog
        story={deleteTarget}
        error={error}
        onError={setError}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}
