"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { Stepper } from "@/components/ui/stepper";
import { MultiFileField, type MultiFileFieldItem } from "@/components/ui/multi-file-field";
import { createReligiousActivity } from "@/app/admin/welfare/religious-activities/actions";
import { getAllowedImageExtension } from "@/lib/admin/form-helpers";

const STEPS = [
  { label: "Details" },
  { label: "Info" },
  { label: "Photos" },
];

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

type AddActivityDialogProps = {
  trigger?: React.ReactNode;
  typeOptions: { value: string; label: string }[];
};

export function AddActivityDialog({ trigger, typeOptions }: AddActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [type, setType] = useState<string>(typeOptions[0]?.value ?? "");
  const [recordDate, setRecordDate] = useState<string>(todayISO());
  const [remarks, setRemarks] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const photoItems = useMemo<MultiFileFieldItem[]>(
    () =>
      photos.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [photos],
  );

  useEffect(() => {
    return () => {
      photoItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [photoItems]);

  const titlePreview = type && recordDate ? `${type.toUpperCase()}-${recordDate}` : "";

  function resetForm() {
    setType(typeOptions[0]?.value ?? "");
    setRecordDate(todayISO());
    setRemarks("");
    setLocation("");
    setMeetingLink("");
    setPhotos([]);
    setError(null);
    setCurrentStep(0);
  }

  function validateStep(step: number): string | null {
    if (step === 0) {
      if (!type) return "Type is required.";
      if (!recordDate) return "Date is required.";
    }
    if (step === 1) {
      if (!location.trim()) return "Location is required.";
      if (meetingLink.trim() && !/^https?:\/\//.test(meetingLink.trim())) {
        return "Meeting link must start with http:// or https://.";
      }
    }
    return null;
  }

  function handleNextStep() {
    const stepError = validateStep(currentStep);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleSubmit() {
    for (let step = 0; step <= currentStep; step++) {
      const stepError = validateStep(step);
      if (stepError) {
        setError(stepError);
        setCurrentStep(step);
        return;
      }
    }

    const formData = new FormData();
    formData.set("type", type);
    formData.set("recordDate", recordDate);
    formData.set("remarks", remarks);
    formData.set("location", location);
    formData.set("meetingLink", meetingLink);
    photos.forEach((file) => formData.append("photos", file));

    startTransition(async () => {
      const result = await createReligiousActivity(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      resetForm();
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Religious Activity</DialogTitle>
          </DialogHeader>

          <Stepper steps={STEPS} currentStep={currentStep} className="mb-4" />

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {currentStep === 0 && (
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
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
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
            )}

            {currentStep === 2 && (
              <MultiFileField
                label="Photos"
                items={photoItems}
                onAddFiles={(files) => {
                  const valid = files.filter(
                    (file) => file.size <= 5 * 1024 * 1024 && getAllowedImageExtension(file),
                  );
                  if (valid.length !== files.length) {
                    setError("Photos must be JPG, PNG, or WebP images under 5 MB each.");
                  } else {
                    setError(null);
                  }
                  setPhotos((current) => [...current, ...valid]);
                }}
                onReplaceFile={(id, file) => {
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024 || !getAllowedImageExtension(file)) {
                    setError("Photos must be JPG, PNG, or WebP images under 5 MB each.");
                    return;
                  }
                  setPhotos((current) =>
                    current.map((currentFile, index) =>
                      `${currentFile.name}-${currentFile.lastModified}-${index}` === id ? file : currentFile,
                    ),
                  );
                  setError(null);
                }}
                onRemoveFile={(id) => {
                  setPhotos((current) =>
                    current.filter(
                      (file, index) => `${file.name}-${file.lastModified}-${index}` !== id,
                    ),
                  );
                }}
                helperText="JPG, PNG, or WebP. Max 5 MB each."
                addLabel="Add photos"
              />
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}>
                Back
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button size="sm" onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                Create Activity
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}