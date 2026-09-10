"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { updateReligiousActivity } from "@/app/admin/welfare/religious-activities/actions";
import type { ReligiousActivityRow } from "./religious-activities-table";

type EditActivityDialogProps = {
  activity: ReligiousActivityRow | null;
  typeOptions: { value: string; label: string }[];
  onOpenChange: (open: boolean) => void;
};

export function EditActivityDialog({
  activity,
  typeOptions,
  onOpenChange,
}: EditActivityDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState(activity?.type ?? "");
  const [recordDate, setRecordDate] = useState(activity?.recordDate ?? "");
  const [remarks, setRemarks] = useState(activity?.remarks ?? "");
  const [location, setLocation] = useState(activity?.location ?? "");
  const [meetingLink, setMeetingLink] = useState(activity?.meetingLink ?? "");

  const titlePreview = type && recordDate ? `${type.toUpperCase()}-${recordDate}` : "";

  function handleSubmit() {
    if (!activity) return;

    if (!type) {
      setError("Type is required.");
      return;
    }
    if (!recordDate) {
      setError("Date is required.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (meetingLink.trim() && !/^https?:\/\//.test(meetingLink.trim())) {
      setError("Meeting link must start with http:// or https://.");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.set("activityId", String(activity.id));
    formData.set("type", type);
    formData.set("recordDate", recordDate);
    formData.set("remarks", remarks);
    formData.set("location", location);
    formData.set("meetingLink", meetingLink);

    startTransition(async () => {
      const result = await updateReligiousActivity(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  if (!activity) return null;

  return (
    <Dialog open={!!activity} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Religious Activity</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Type" required>
            <Select value={type} onValueChange={(value) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date" required>
            <Input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </Field>
          {titlePreview && (
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Title: <span className="font-mono font-medium text-foreground">{titlePreview}</span>
            </p>
          )}
          <Field label="Remarks">
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
              rows={3}
            />
          </Field>
          <Field label="Location" required>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Activity location"
            />
          </Field>
          <Field label="Meeting link">
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}