"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
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
import { SingleFileField } from "@/components/ui/single-file-field";
import { MultiFileField, type MultiFileFieldItem } from "@/components/ui/multi-file-field";
import {
  createStory,
  requestStoryVideoUpload,
  finalizeStoryVideo,
} from "@/app/admin/multimedia/stories/actions";
import { MAX_VIDEO_BYTES, formatMegabytes } from "@/lib/storage/files";
import { slugify } from "@/lib/slugify";
import { digitsOnly, getAllowedImageExtension } from "@/lib/admin/form-helpers";
import { Field } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { locales } from "@/lib/i18n/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryTagSelector } from "@/components/admin/multimedia/stories/story-tag-selector";
import type { AvailableStoryTag } from "@/app/admin/multimedia/stories/actions";

type StoryDialogProps = {
  trigger?: React.ReactNode;
  availableTags: AvailableStoryTag[];
};

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image dimensions."));
    };
    image.src = url;
  });
}

export function StoryDialog({ trigger, availableTags }: StoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Video thumbnail state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [createdStoryId, setCreatedStoryId] = useState<number | null>(null);

  // Cover photo state
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoWidth, setCoverPhotoWidth] = useState<number | null>(null);
  const [coverPhotoHeight, setCoverPhotoHeight] = useState<number | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);

  // Display photo state
  const [displayPhotos, setDisplayPhotos] = useState<File[]>([]);
  const displayPhotoItems = useMemo<MultiFileFieldItem[]>(
    () => displayPhotos.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      url: URL.createObjectURL(file),
    })),
    [displayPhotos],
  );

  useEffect(() => {
    return () => {
      displayPhotoItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [displayPhotoItems]);

  useEffect(() => {
    return () => {
      if (coverPhotoPreview) URL.revokeObjectURL(coverPhotoPreview);
    };
  }, [coverPhotoPreview]);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    endDate: "",
    participantCount: "",
    status: "DRAFT",
    translations: locales.reduce((acc, locale) => ({
      ...acc,
      [locale]: {
        title: "",
        summary: "",
      },
    }), {} as Record<string, { title: string; summary: string }>),
    tagIds: [] as number[],
  });

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const steps = [
    { label: "Basic Info" },
    { label: "Dates & Media" },
    { label: "Translations" },
  ];

  function handleVideoChange(file: File | null) {
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!file.type.startsWith("video/") || !["mp4", "mov", "webm", "avi"].includes(extension ?? "")) {
        setError("Video must be an MP4, MOV, WebM, or AVI file.");
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        setError(`Video must be under ${formatMegabytes(MAX_VIDEO_BYTES)}.`);
        return;
      }
    }
    setError(null);
    setVideoFile(file);

    // Generate thumbnail
    if (file) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setVideoThumbnail(canvas.toDataURL("image/jpeg", 0.7));
        }
        video.remove();
        URL.revokeObjectURL(url);
      };
      video.onerror = () => {
        video.remove();
        URL.revokeObjectURL(url);
      };
      document.body.appendChild(video);
    } else {
      setVideoThumbnail(null);
    }
  }

  async function handleCoverPhotoChange(file: File | null) {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Cover photo must be under 5 MB.");
        return;
      }
    }
    setError(null);
    setCoverPhoto(file);
    setCoverPhotoPreview(file ? URL.createObjectURL(file) : null);
    if (file) {
      try {
        const dimensions = await readImageDimensions(file);
        setCoverPhotoWidth(dimensions.width);
        setCoverPhotoHeight(dimensions.height);
      } catch {
        setCoverPhoto(null);
        setCoverPhotoPreview(null);
        setError("Unable to read cover photo dimensions.");
        return;
      }
    } else {
      setCoverPhotoWidth(null);
      setCoverPhotoHeight(null);
    }
  }

  function handleNameChange(value: string) {
    setFormData((prev) => ({ ...prev, name: value }));
  }

  function resetForm() {
    setFormData({
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      participantCount: "",
      status: "DRAFT",
      translations: locales.reduce((acc, locale) => ({
        ...acc,
        [locale]: { title: "", summary: "" }
      }), {} as Record<string, { title: string; summary: string }>),
      tagIds: [],
    });
    setVideoFile(null);
    setVideoThumbnail(null);
    setCreatedStoryId(null);
    setCoverPhoto(null);
    setCoverPhotoWidth(null);
    setCoverPhotoHeight(null);
    setCoverPhotoPreview(null);
    setDisplayPhotos([]);
    setError(null);
    setCurrentStep(0);
  }

  function validateStep(step: number): string | null {
    if (step === 0) {
      if (!formData.name.trim()) return "Story name is required.";
      if (!formData.location.trim()) return "Location is required.";
    }
    if (step === 1) {
      if (!formData.startDate) return "Start date is required.";
      if (!formData.endDate) return "End date is required.";
      if (new Date(formData.startDate) > new Date()) return "Start date cannot be after now.";
      if (new Date(formData.endDate) > new Date()) return "End date cannot be after now.";
      if (new Date(formData.endDate) < new Date(formData.startDate)) return "End date cannot be before start date.";
    }
    if (step === 2 && !formData.translations.en?.title?.trim()) return "English title is required.";
    return null;
  }

  function handleNextStep() {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
  }

  async function handleSubmit() {
    setError(null);

    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!formData.name.trim()) {
      setError("Story name is required.");
      return;
    }
    if (!formData.location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!formData.startDate) {
      setError("Start date is required.");
      return;
    }
    if (!formData.endDate) {
      setError("End date is required.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }
    if (new Date(formData.startDate) > new Date()) {
      setError("Start date cannot be after now.");
      return;
    }
    if (new Date(formData.endDate) > new Date()) {
      setError("End date cannot be after now.");
      return;
    }

    const fd = new FormData();
    fd.set("name", formData.name.trim());
    fd.append("slug", slugify(formData.name));
    fd.set("location", formData.location.trim());
    fd.set("startDate", new Date(formData.startDate).toISOString());
    fd.set("endDate", new Date(formData.endDate).toISOString());
    if (formData.participantCount) fd.set("participantCount", formData.participantCount);
    fd.set("status", formData.status);
    if (coverPhoto) fd.set("coverPhoto", coverPhoto);
    if (coverPhoto && coverPhotoWidth && coverPhotoHeight) {
      fd.set("coverPhotoWidth", String(coverPhotoWidth));
      fd.set("coverPhotoHeight", String(coverPhotoHeight));
    }
    displayPhotos.forEach((photo) => fd.append("displayPhotos", photo));
    fd.set("translations", JSON.stringify(formData.translations));
    fd.set("tagIds", JSON.stringify(formData.tagIds));

    startTransition(async () => {
      const isRetry = createdStoryId !== null;
      let storyId = createdStoryId;

      if (storyId === null) {
        const result = await createStory(fd);
        if (!result.success) {
          setError(result.error ?? "Failed to save story.");
          return;
        }
        storyId = result.data.id;
        setCreatedStoryId(storyId);
      }

      if (videoFile) {
        setError("Uploading video...");
        try {
          const ticket = await requestStoryVideoUpload(storyId, videoFile.name);
          if (!ticket.success) {
            throw new Error(ticket.error);
          }
          const response = await fetch(ticket.data.signedUrl, {
            method: "PUT",
            body: videoFile,
            headers: {
              "Content-Type": videoFile.type || "video/mp4",
            },
          });
          if (!response.ok) {
            throw new Error(`Video upload failed (${response.status}).`);
          }
          const finalized = await finalizeStoryVideo(storyId, ticket.data.path);
          if (!finalized.success) {
            throw new Error(finalized.error);
          }
        } catch (err) {
          console.error("Video upload failed:", err);
          setError(
            isRetry
              ? "Video upload failed. Please try again."
              : "Story saved, but the video upload failed. Submit again to retry the video upload only."
          );
          return;
        }
      }

      resetForm();
      setUncontrolledOpen(false);
    });
  }

  return (
    <>
      {trigger && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setUncontrolledOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setUncontrolledOpen(true); }}
          className="inline-flex"
        >
          {trigger}
        </div>
      )}
      <Dialog open={uncontrolledOpen} onOpenChange={setUncontrolledOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>

          <div className="mb-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          <div className="flex-1 overflow-y-auto px-1 py-2">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {currentStep === 0 && (
              <div className="space-y-4">
                <Field label="Story Name" required>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter story name..."
                  />
                </Field>
                <Field label="Location" required>
                  <Input
                    placeholder="Enter location..."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status">
                        {formData.status === "DRAFT" && "Draft"}
                        {formData.status === "PUBLISHED" && "Published"}
                        {formData.status === "ARCHIVED" && "Archived"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Date" required>
                    <Input
                      type="datetime-local"
                      value={formData.startDate}
                      max={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </Field>
                  <Field label="End Date" required>
                    <Input
                      type="datetime-local"
                      value={formData.endDate}
                      min={formData.startDate || undefined}
                      max={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                    {formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate) && (
                      <p className="mt-1 text-xs text-destructive">End date cannot be before start date.</p>
                    )}
                  </Field>
                </div>
                <Field label="Participant Count">
                  <Input
                    type="text"
                    value={formData.participantCount}
                    onChange={(e) => setFormData({ ...formData, participantCount: digitsOnly(e.target.value) })}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Media" className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Cover Photo</label>
                      <SingleFileField
                        file={coverPhoto}
                        onChange={handleCoverPhotoChange}
                        existingUrl={coverPhotoPreview}
                        accept="image/*"
                        helperText="JPG, PNG, or WebP. Max 5 MB. Recommended 16:9."
                        className="max-w-64"
                        onRemove={() => {
                          setCoverPhoto(null);
                          setCoverPhotoPreview(null);
                          setCoverPhotoWidth(null);
                          setCoverPhotoHeight(null);
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Video</label>
                      <SingleFileField
                        file={videoFile}
                        onChange={handleVideoChange}
                        existingUrl={videoThumbnail}
                        accept="video/*"
                        helperText="MP4, MOV, or AVI. Max 100 MB."
                        className="max-w-64"
                        onRemove={() => {
                          setVideoFile(null);
                          setVideoThumbnail(null);
                        }}
                      />
                    </div>
                  </div>
                </Field>

                <MultiFileField
                  label="Display Photos"
                  items={displayPhotoItems}
                  onAddFiles={(files) => {
                    const valid = files.filter((file) => file.size <= 5 * 1024 * 1024 && !!getAllowedImageExtension(file));
                    if (files.length !== valid.length) {
                      setError("Display photos must be JPG, PNG, or WebP images under 5 MB each.");
                      return;
                    }
                    setDisplayPhotos((current) => [...current, ...valid]);
                    setError(null);
                  }}
                  onReplaceFile={(id, file) => {
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024 || !getAllowedImageExtension(file)) {
                      setError("Display photos must be JPG, PNG, or WebP images under 5 MB each.");
                      return;
                    }
                    setDisplayPhotos((current) => current.map((currentFile, index) =>
                      `${currentFile.name}-${currentFile.lastModified}-${index}` === id ? file : currentFile,
                    ));
                    setError(null);
                  }}
                  onRemoveFile={(id) => {
                    setDisplayPhotos((current) => current.filter((file, index) =>
                      `${file.name}-${file.lastModified}-${index}` !== id,
                    ));
                  }}
                  helperText="JPG, PNG, or WebP. Max 5 MB each."
                  addLabel="Add display photos"
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <Tabs defaultValue={locales[0]}>
                  <TabsList className="w-full overflow-x-auto">
                    {locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}
                  </TabsList>
                  {locales.map((locale) => (
                    <TabsContent key={locale} value={locale} className="mt-4 rounded-lg border bg-muted/50 p-4">
                      <div className="space-y-3">
                        <Field label="Title" required>
                          <Input value={formData.translations[locale]?.title ?? ""} onChange={(e) => setFormData({ ...formData, translations: { ...formData.translations, [locale]: { ...formData.translations[locale], title: e.target.value } } })} placeholder={`Title (${locale})`} />
                        </Field>
                        <Field label="Summary">
                          <Textarea value={formData.translations[locale]?.summary ?? ""} onChange={(e) => setFormData({ ...formData, translations: { ...formData.translations, [locale]: { ...formData.translations[locale], summary: e.target.value } } })} placeholder={`Summary (${locale})`} rows={3} />
                        </Field>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <Field label="Tags">
                  <StoryTagSelector tags={availableTags} selectedIds={formData.tagIds} onChange={(tagIds) => setFormData({ ...formData, tagIds })} />
                </Field>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full justify-end">
            {currentStep > 0 && <Button variant="outline" size="sm" onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}>Back</Button>}
            {currentStep < steps.length - 1 ? (
              <Button size="sm" onClick={handleNextStep}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                Create Story
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
