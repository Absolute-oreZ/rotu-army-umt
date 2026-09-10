"use client";

import { useTransition } from "react";
import { AlertCircleIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteReligiousActivity } from "@/app/admin/welfare/religious-activities/actions";
import type { ReligiousActivityRow } from "./religious-activities-table";

type DeleteActivityDialogProps = {
  activity: ReligiousActivityRow | null;
  error: string | null;
  onError: (error: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteActivityDialog({
  activity,
  error,
  onError,
  onOpenChange,
}: DeleteActivityDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!activity) return;
    onError("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("activityId", String(activity.id));
      const result = await deleteReligiousActivity(formData);
      if ("error" in result && result.error) {
        onError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  if (!activity) return null;

  return (
    <Dialog open={!!activity} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Trash2Icon className="mx-auto mb-2 size-10 text-destructive" />
          <DialogTitle>Delete Religious Activity</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{activity.title}</strong>? This action cannot
            be undone. All associated photos will be permanently removed.
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