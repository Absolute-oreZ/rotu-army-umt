"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { PencilIcon, Loader2Icon, AlertCircleIcon, TagIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SingleFileField } from "@/components/ui/single-file-field";
import { storageUrl } from "@/lib/supabase/storage-public";
import { getAllowedImageExtension } from "@/lib/admin/form-helpers";
import {
  getStoryDetails,
  updateStory,
  type StoryDetails,
} from "@/app/admin/multimedia/stories/actions";
import { locales } from "@/lib/i18n/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryTagSelector } from "@/components/admin/multimedia/stories/story-tag-selector";
import type { AvailableStoryTag } from "@/app/admin/multimedia/stories/actions";

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

export function StoryDetailsSheet({
  storyId,
  initialMode,
  open,
  onOpenChange,
  availableTags,
}: {
  storyId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTags: AvailableStoryTag[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        {open && storyId != null && (
          <SheetInner
            key={`${storyId}-${initialMode}`}
            storyId={storyId}
            initialMode={initialMode}
            availableTags={availableTags}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  storyId,
  initialMode,
  availableTags,
  onClose,
}: {
  storyId: number;
  initialMode: "view" | "edit";
  availableTags: AvailableStoryTag[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<StoryDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getStoryDetails(storyId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
      } else {
        setDetails(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  if (loading) {
    return <SheetSkeleton className="w-140 max-w-[calc(100vw-2rem)] p-0" />;
  }

  if (fetchError || !details) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Error</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Story not found."}
        </div>
      </>
    );
  }

  if (mode === "view") {
    return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  }

  return <EditMode details={details} onCancel={() => setMode("view")} onClose={onClose} availableTags={availableTags} />;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground wrap-break-word">{value}</span>
    </div>
  );
}

function ViewMode({ details, onEdit }: { details: StoryDetails; onEdit: () => void }) {
  const d = details;
  const coverUrl = d.coverPhotoPath ? storageUrl(d.coverPhotoPath) : null;
  const videoUrl = d.videoPath ? storageUrl(d.videoPath) : null;
  return (
    <>
      <SheetHeader>
        <SheetTitle>Story Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailRow label="Internal Name" value={d.name} />
              <DetailRow label="Slug" value={d.slug} />
              <DetailRow label="Start Date" value={format(new Date(d.startDate), "dd MMM yyyy HH:mm")} />
              <DetailRow label="End Date" value={format(new Date(d.endDate), "dd MMM yyyy HH:mm")} />
              <DetailRow label="Location" value={d.location} />
              <DetailRow label="Participant Count" value={d.participantCount ?? "—"} />
              <DetailRow label="Video URL" value={d.videoPath ?? "—"} />
              <DetailRow
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${d.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-800"
                      : d.status === "DRAFT"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1).toLowerCase()}
                  </span>
                }
              />
              <DetailRow label="Created" value={format(new Date(d.createdAt), "dd MMM yyyy")} />
              <DetailRow label="Updated" value={format(new Date(d.updatedAt), "dd MMM yyyy")} />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Video
            </h3>
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full rounded-lg border border-border bg-black" />
            ) : (
              <span className="text-sm text-muted-foreground">No video uploaded.</span>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cover Photo
            </h3>
            {coverUrl ? (
              <div className="relative max-w-64">
                <Image
                  width={240}
                  height={240}
                  src={coverUrl}
                  alt="Cover photo"
                  className="w-full rounded-lg border border-border object-contain"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No cover photo uploaded.</span>
            )}
          </section>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Translations
            </h3>
            <div className="space-y-4">
              {locales.map((locale) => (
                <div key={locale} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {locale.toUpperCase()}
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div><strong>Title:</strong> {d.translations[locale]?.title ?? "—"}</div>
                    <div><strong>Summary:</strong> {d.translations[locale]?.summary ?? "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tags
            </h3>
            {d.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {d.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-800"
                  >
                    <TagIcon className="size-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No tags assigned.</span>
            )}
          </section>
        </div>
      </div>

      <SheetFooter>
        <Button onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditMode({
  details,
  onCancel,
  onClose,
  availableTags,
}: {
  details: StoryDetails;
  onCancel: () => void;
  onClose: () => void;
  availableTags: AvailableStoryTag[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverPhotoWidth, setCoverPhotoWidth] = useState<number | null>(details.coverPhotoWidth);
  const [coverPhotoHeight, setCoverPhotoHeight] = useState<number | null>(details.coverPhotoHeight);
  const [removeVideo, setRemoveVideo] = useState(false);

  const [formData, setFormData] = useState({
    name: details.name,
    startDate: new Date(details.startDate).toISOString().slice(0, 16),
    endDate: new Date(details.endDate).toISOString().slice(0, 16),
    location: details.location,
    participantCount: details.participantCount ?? "",
    status: details.status,
    translations: details.translations,
    tagIds: details.tags.map((t) => t.id),
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(() =>
    details.videoPath ? storageUrl(details.videoPath) : null,
  );

  useEffect(() => {
    return () => {
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const STATUS_OPTIONS: { value: "DRAFT" | "PUBLISHED" | "ARCHIVED"; label: string }[] = [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  function handleUpdate() {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.location) {
      setError("Name, dates, and location are required.");
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
    setError(null);

    const fd = new FormData();
    fd.set("storyId", String(details.id));
    fd.set("name", formData.name);
    fd.set("slug", details.slug);
    fd.set("startDate", formData.startDate);
    fd.set("endDate", formData.endDate);
    fd.set("location", formData.location);
    // Ensure participantCount is sent as a string; FormData only accepts string or Blob.
    if (formData.participantCount) fd.set("participantCount", String(formData.participantCount));
    fd.set("status", formData.status);
    fd.set("translations", JSON.stringify(formData.translations));
    fd.set("tagIds", JSON.stringify(formData.tagIds));
    if (removeCover) fd.set("removeCoverPhoto", "true");
    if (coverFile) {
      fd.set("coverPhoto", coverFile);
      if (coverPhotoWidth && coverPhotoHeight) {
        fd.set("coverPhotoWidth", String(coverPhotoWidth));
        fd.set("coverPhotoHeight", String(coverPhotoHeight));
      }
    }
    if (removeVideo) fd.set("removeVideo", "true");
    if (videoFile) fd.set("video", videoFile);

    startTransition(async () => {
      const result = await updateStory(details.id, fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update story.");
      }
    });
  }

  async function handleCoverPhotoChange(file: File | null) {
    setCoverFile(file);
    if (file) {
      const ext = getAllowedImageExtension(file);
      if (!ext) {
        setError("Cover photo must be a JPG, PNG, or WebP image.");
        setCoverFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Cover photo must be under 5 MB.");
        setCoverFile(null);
        return;
      }
      try {
        const dimensions = await readImageDimensions(file);
        setCoverPhotoWidth(dimensions.width);
        setCoverPhotoHeight(dimensions.height);
      } catch {
        setCoverFile(null);
        setError("Unable to read cover photo dimensions.");
        return;
      }
      setError(null);
      setRemoveCover(false);
    } else {
      setCoverPhotoWidth(null);
      setCoverPhotoHeight(null);
      setRemoveCover(Boolean(details.coverPhotoPath));
    }
  }

  function handleVideoChange(file: File | null) {
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!file.type.startsWith("video/") || !["mp4", "mov", "webm", "avi"].includes(extension ?? "")) {
        setError("Video must be an MP4, MOV, WebM, or AVI file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("Video must be under 100 MB.");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }
      setError(null);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setRemoveVideo(false);
    } else {
      setVideoFile(null);
      setVideoPreview(null);
      setRemoveVideo(true);
    }
  }

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>Edit Story</SheetTitle>
      </SheetHeader>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Internal Name" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Field>
            <Field label="Location" required>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Field>
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
            <Field label="Participant Count">
              <Input
                value={formData.participantCount}
                onChange={(e) => setFormData({ ...formData, participantCount: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}>
                <SelectTrigger>
                  {STATUS_OPTIONS.find((o) => o.value === formData.status)?.label ?? "Select status"}
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Video">
              <SingleFileField
                file={videoFile}
                onChange={handleVideoChange}
                existingUrl={removeVideo ? null : videoPreview}
                previewType="video"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                onRemove={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                  setRemoveVideo(true);
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                MP4, MOV, WebM, or AVI. Max 100 MB.
              </p>
            </Field>
            <Field label="Cover Photo">
              <SingleFileField
                file={coverFile}
                onChange={handleCoverPhotoChange}
                existingUrl={removeCover || !details.coverPhotoPath ? null : storageUrl(details.coverPhotoPath)}
                accept="image/*"
                className="max-w-64"
                onRemove={() => {
                  setRemoveCover(true);
                  setCoverFile(null);
                  setCoverPhotoWidth(null);
                  setCoverPhotoHeight(null);
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, or WebP. Max 5 MB. Leave empty to keep current.
              </p>
            </Field>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold">Translations</h3>
            <Tabs defaultValue={locales[0]}>
              <TabsList className="w-full overflow-x-auto">
                {locales.map((locale) => <TabsTrigger key={locale} value={locale} className="min-w-20 uppercase">{locale}</TabsTrigger>)}
              </TabsList>
              {locales.map((locale) => (
                <TabsContent key={locale} value={locale} className="mt-4 rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-3">
                    <Field label="Title" required>
                      <Input
                        value={formData.translations[locale].title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [locale]: { ...formData.translations[locale], title: e.target.value },
                            },
                          })
                        }
                        placeholder={locale === "en" ? "Required for English" : "Optional"}
                      />
                    </Field>
                    <Field label="Summary">
                      <Textarea
                        value={formData.translations[locale].summary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            translations: {
                              ...formData.translations,
                              [locale]: { ...formData.translations[locale], summary: e.target.value },
                            },
                          })
                        }
                        rows={2}
                      />
                    </Field>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold">Tags</h3>
            <StoryTagSelector
              tags={availableTags}
              selectedIds={formData.tagIds}
              onChange={(tagIds) => setFormData({ ...formData, tagIds })}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleUpdate} disabled={isPending || !formData.name}>
          {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </>
  );
}
