"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getReligiousActivityPhotos } from "@/app/admin/welfare/religious-activities/actions";
import { storageUrl } from "@/lib/supabase/storage-public";
import type { ReligiousActivityRow } from "./religious-activities-table";

type ViewPhotosDialogProps = {
  activity: ReligiousActivityRow | null;
  onOpenChange: (open: boolean) => void;
};

export function ViewPhotosDialog({ activity, onOpenChange }: ViewPhotosDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<Array<{ id: number; photoPath: string }>>([]);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activity) return;

    let cancelled = false;

    startTransition(async () => {
      const result = await getReligiousActivityPhotos(activity.id);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      setPhotos(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [activity]);

  if (!activity) return null;

  const hasPhotos = photos.length > 0;

  return (
    <Dialog open={!!activity} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{activity.title} — Photos</DialogTitle>
          <DialogDescription>
            {hasPhotos
              ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"} recorded for this activity.`
              : isPending
                ? "Loading photos..."
                : "No photos were uploaded for this activity."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <span>{error}</span>
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Loading photos...
          </div>
        )}

        {!isPending && hasPhotos && (
          <>
            <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  key={photos[position].id}
                  src={storageUrl(photos[position].photoPath)}
                  alt={`${activity.title} – photo ${position + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 576px"
                />
              </div>
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => setPosition((p) => Math.max(0, p - 1))}
                    disabled={position === 0}
                    className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setPosition((p) => Math.min(photos.length - 1, p + 1))}
                    disabled={position === photos.length - 1}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background disabled:opacity-40"
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </>
              )}
            </div>

            {photos.length > 1 && (
              <>
                <p className="text-center text-xs text-muted-foreground">
                  {position + 1} / {photos.length}
                </p>
                <div className="flex justify-center gap-1">
                  {photos.map((photo, i) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Go to photo ${i + 1}`}
                      onClick={() => setPosition(i)}
                      className="p-1"
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          i === position
                            ? "w-4 bg-foreground"
                            : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {!isPending && !hasPhotos && !error && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <ImageIcon className="size-8" />
            <p className="text-sm">No photos available.</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}