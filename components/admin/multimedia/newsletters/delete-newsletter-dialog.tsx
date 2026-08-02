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
import { deleteCampaign } from "@/app/admin/multimedia/newsletters/actions";

type DeleteNewsletterDialogProps = {
  campaign: { id: number; subject: string } | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteNewsletterDialog({
  campaign,
  error,
  onError,
  onOpenChange,
}: DeleteNewsletterDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!campaign) return;
    onError("");

    startTransition(async () => {
      const result = await deleteCampaign(campaign.id);
      if (result.success) {
        onOpenChange(false);
      } else {
        onError(result.error ?? "Failed to delete campaign.");
      }
    });
  }

  if (!campaign) return null;

  return (
    <Dialog open={!!campaign} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Trash2Icon className="mx-auto mb-2 size-10 text-destructive" />
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{campaign.subject}</strong>? This action cannot be
            undone.
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