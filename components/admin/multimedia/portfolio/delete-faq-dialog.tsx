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
import { deleteFAQ } from "@/app/admin/multimedia/portfolio/actions";

type DeleteFAQDialogProps = {
  faq: { id: number; translations: Record<string, { question: string }> } | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFAQDialog({ faq, error, onError, onOpenChange }: DeleteFAQDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!faq) return;
    startTransition(async () => {
      const result = await deleteFAQ(faq.id);
      if (!result.success) onError(result.error ?? "Failed to delete FAQ.");
      else onOpenChange(false);
    });
  }

  if (!faq) return null;

  const enQuestion = faq.translations.en?.question ?? "this FAQ";

  return (
    <Dialog open={!!faq} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete FAQ</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{enQuestion}</strong>? This action cannot be undone.
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