"use client";

import { useTransition } from "react";
import { AlertTriangleIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteTestimonial } from "@/app/admin/multimedia/portfolio/actions";

type DeleteTestimonialDialogProps = {
  testimonial: { id: number; memberName: string } | null;
  error: string | null;
  onError: (e: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteTestimonialDialog({ testimonial, error, onError, onOpenChange }: DeleteTestimonialDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!testimonial) return;
    startTransition(async () => {
      const result = await deleteTestimonial(testimonial.id);
      if (!result.success) onError(result.error ?? "Failed to delete testimonial.");
      else onOpenChange(false);
    });
  }

  if (!testimonial) return null;

  return (
    <Dialog open={!!testimonial} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Testimonial</DialogTitle>
          <DialogDescription>
            Delete testimonial by <strong>{testimonial.memberName}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DialogFooter className="flex justify-end gap-2">
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