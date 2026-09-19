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
import { updateCourseAction } from "@/app/admin/academic/courses/actions";
import { Loader2Icon } from "lucide-react";

type CourseItem = {
  id: number;
  name: string;
  completionYear: number;
  isSupported: boolean;
};

type EditCourseDialogProps = {
  course: CourseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditCourseDialog({
  course,
  open,
  onOpenChange,
  onSuccess,
}: EditCourseDialogProps) {
  const [name, setName] = useState(course?.name ?? "");
  const [completionYear, setCompletionYear] = useState(course?.completionYear ?? 3);
  const [isSupported, setIsSupported] = useState(course?.isSupported ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;

    setError(null);
    const formData = new FormData();
    formData.set("id", String(course.id));
    formData.set("name", name);
    formData.set("completionYear", String(completionYear));
    formData.set("isSupported", String(isSupported));

    startTransition(async () => {
      const res = await updateCourseAction(formData);
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update study program details and graduation requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="edit-course-name" className="text-sm font-medium text-foreground">
                Course Name <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-course-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-course-duration" className="text-sm font-medium text-foreground">
                Completion Duration (Years) <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-course-duration"
                type="number"
                min={1}
                max={8}
                required
                value={completionYear}
                onChange={(e) => setCompletionYear(parseInt(e.target.value, 10) || 3)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="edit-course-supported"
                type="checkbox"
                checked={isSupported}
                onChange={(e) => setIsSupported(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="edit-course-supported" className="text-sm font-medium text-foreground cursor-pointer">
                Supported Degree Program
              </label>
            </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
