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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

            <Field label="Course Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="uppercase" required />
            </Field>

            <Field label="Completion Duration (Years)" required>
              <Input type="number" min={1} max={8} value={completionYear} onChange={(e) => setCompletionYear(parseInt(e.target.value, 10) || 3)} required />
            </Field>

            <Field label="Supported Status" required>
              <Select value={String(isSupported)} onValueChange={(value) => setIsSupported(value === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Supported</SelectItem>
                  <SelectItem value="false">Unsupported</SelectItem>
                </SelectContent>
              </Select>
            </Field>
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
