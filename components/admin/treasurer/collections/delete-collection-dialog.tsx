"use client";

import { useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";
import { deleteCollection } from "@/app/admin/treasurer/collections/actions";
import type { Collection } from "@/components/admin/treasurer/collections/collections-table";

export function DeleteCollectionDialog({
  collection,
  error,
  onError,
  onOpenChange,
}: {
  collection: Collection | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!collection) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("collectionId", String(collection.id));
      const result = await deleteCollection(fd);
      if (result?.error) {
        onError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={!!collection} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{collection?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && collection && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
