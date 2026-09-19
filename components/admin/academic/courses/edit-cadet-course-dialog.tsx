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
import { updateCadetCourseAction } from "@/app/admin/academic/courses/actions";
import { Loader2Icon } from "lucide-react";

export type CourseOptionItem = {
  id: number;
  name: string;
  completionYear: number;
  isSupported: boolean;
};

type EditCadetCourseDialogProps = {
  cadet: {
    id: number;
    name: string;
    armyNo: number;
    studyProgramId: number | null;
    courseName?: string | null;
  } | null;
  courses: CourseOptionItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function EditCadetCourseDialog({
  cadet,
  courses,
  open,
  onOpenChange,
  onSuccess,
}: EditCadetCourseDialogProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    cadet?.studyProgramId ? String(cadet.studyProgramId) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cadet) return;

    setError(null);
    startTransition(async () => {
      const progId = selectedProgramId ? parseInt(selectedProgramId, 10) : null;
      const res = await updateCadetCourseAction({
        cadetId: cadet.id,
        studyProgramId: progId,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onSuccess?.();
      onOpenChange(false);
    });
  }

  const selectedCourse = courses.find((c) => String(c.id) === selectedProgramId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Course</DialogTitle>
            <DialogDescription>
              Select an academic course for {cadet?.name} (Army No: {cadet?.armyNo}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="course-select" className="text-sm font-medium text-foreground">
                Study Program / Course
              </label>
              <select
                id="course-select"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Unassigned —</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.completionYear} Years
                    {!course.isSupported ? " • Unsupported" : ""})
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration to Complete:</span>
                  <span className="font-medium text-foreground">
                    {selectedCourse.completionYear} Years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium ${
                      selectedCourse.isSupported
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {selectedCourse.isSupported ? "Supported" : "Unsupported"}
                  </span>
                </div>
              </div>
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
