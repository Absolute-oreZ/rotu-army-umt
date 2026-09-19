"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteCourseAction } from "@/app/admin/academic/courses/actions";
import { AlertTriangleIcon, Loader2Icon, Trash2Icon } from "lucide-react";

type DeleteCourseDialogProps = {
  course: {
    id: number;
    name: string;
    enrolledCount: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function DeleteCourseDialog({
  course,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCourseDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!course) return null;

  const hasEnrolledCadets = course.enrolledCount > 0;

  function handleDelete() {
    if (!course || hasEnrolledCadets) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteCourseAction(course.id);
      if (!res.success) {
        setError(res.error);
        return;
      }

      onSuccess?.();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Delete Course
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">{course.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {error && (
            <div className="mb-3 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {hasEnrolledCadets ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium">Action Blocked</p>
              <p className="mt-1 text-xs">
                Cannot delete this course because <span className="font-bold">{course.enrolledCount} cadet(s)</span> are currently enrolled in it. Please reassign them to another course first.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This course will be permanently removed from the system.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || hasEnrolledCadets}
          >
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2Icon className="mr-1.5 h-4 w-4" />
            Delete Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
