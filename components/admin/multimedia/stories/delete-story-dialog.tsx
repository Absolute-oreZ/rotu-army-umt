"use client";

import { useTransition } from "react";
import { Loader2Icon, AlertCircleIcon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteStory } from "@/app/admin/multimedia/stories/actions";

type DeleteStoryDialogProps = {
  story: { id: number; name: string; slug: string } | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteStoryDialog({
  story,
  error,
  onError,
  onOpenChange,
}: DeleteStoryDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!story) return;
    onError("");

    startTransition(async () => {
      const result = await deleteStory(story.id);
      if (result.success) {
        onOpenChange(false);
      } else {
        onError(result.error ?? "Failed to delete story.");
      }
    });
  }

  if (!story) return null;

  return (
    <Dialog open={!!story} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Trash2Icon className="mx-auto mb-2 size-10 text-destructive" />
          <DialogTitle>Delete Story</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{story.name}</strong>? This action cannot be
            undone. All translations, tags, and associated photos will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}