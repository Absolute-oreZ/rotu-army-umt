"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  eventTranslations,
  eventTags,
  eventTagTranslations,
  eventsToTags,
  eventDisplayPhotos,
} from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteManyFromStorage, saveImage, uploadToStorage } from "@/lib/supabase/storage";
import {
  takeString,
  takeNumber,
  takeFile,
  getAllowedImageExtension,
} from "@/lib/admin/form-helpers";
import { locales } from "@/lib/i18n/config";
import { slugify } from "@/lib/slugify";

export type AvailableStoryTag = { id: number; slug: string; name: string };

export type StoryDetails = {
  id: number;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  participantCount: number | null;
  videoPath: string | null;
  coverPhotoPath: string | null;
  coverPhotoWidth: number | null;
  coverPhotoHeight: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  displayPhotos: Array<{ id: number; photoPath: string }>;
  translations: {
    en: { title: string; summary: string };
    ms: { title: string; summary: string };
    zh: { title: string; summary: string };
    ta: { title: string; summary: string };
  };
  tags: Array<{ id: number; slug: string; name: string }>;
};

export type AddStoryData = {
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  participantCount: number | null;
  videoPath: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  translations: Record<
      string,
      { title: string; summary: string }
    >;
  tagIds: number[];
};

function validateStoryDates(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime())) return "Start date is invalid.";
  if (Number.isNaN(end.getTime())) return "End date is invalid.";
  const now = new Date();
  if (start > now) return "Start date cannot be after now.";
  if (end > now) return "End date cannot be after now.";
  if (end < start) return "End date cannot be before start date.";
  return null;
}

function isAllowedVideoFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["mp4", "mov", "webm", "avi"].includes(extension ?? "") && file.type.startsWith("video/");
}

// Helper query functions were previously defined but are no longer used after refactoring.
// They have been removed to eliminate unused code warnings.

export async function createStory(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "stories")) {
    return { error: "You do not have permission to manage stories." };
  }

  const name = takeString(formData.get("name"));
  const slug = takeString(formData.get("slug"));
  const startDate = takeString(formData.get("startDate"));
  const endDate = takeString(formData.get("endDate"));
  const location = takeString(formData.get("location"));
  const participantCount = takeNumber(formData.get("participantCount"));
  const videoFile = takeFile(formData.get("video"));
  const status = takeString(formData.get("status")) ?? "DRAFT";
  const translationsJson = takeString(formData.get("translations"));
  const tagIdsJson = takeString(formData.get("tagIds"));
  const coverPhotoFile = takeFile(formData.get("coverPhoto"));
  const coverPhotoWidth = takeNumber(formData.get("coverPhotoWidth"));
  const coverPhotoHeight = takeNumber(formData.get("coverPhotoHeight"));
  const displayPhotoEntries = formData.getAll("displayPhotos");
  const displayPhotoFiles = displayPhotoEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!name) return { error: "Internal name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!startDate) return { error: "Start date is required." };
  if (!endDate) return { error: "End date is required." };
  if (!location) return { error: "Location is required." };
  const dateError = validateStoryDates(startDate, endDate);
  if (dateError) return { error: dateError };

  let translations: AddStoryData["translations"];
  try {
    translations = translationsJson ? JSON.parse(translationsJson) : {};
  } catch {
    return { error: "Invalid translations data." };
  }

  if (!translations.en?.title) {
    return { error: "English title is required." };
  }

  let tagIds: number[] = [];
  try {
    tagIds = tagIdsJson ? JSON.parse(tagIdsJson) : [];
  } catch {
    tagIds = [];
  }

  if (coverPhotoFile) {
    if (coverPhotoFile.size > 5 * 1024 * 1024) {
      return { error: "Cover photo must be under 5 MB." };
    }
    if (!getAllowedImageExtension(coverPhotoFile)) {
      return { error: "Cover photo must be a JPG, PNG, or WebP image." };
    }
    if (coverPhotoWidth === null || coverPhotoHeight === null || !Number.isInteger(coverPhotoWidth) || !Number.isInteger(coverPhotoHeight) || coverPhotoWidth <= 0 || coverPhotoHeight <= 0) {
      return { error: "Cover photo dimensions could not be determined." };
    }
  }

  if (videoFile) {
    if (videoFile.size > 100 * 1024 * 1024) return { error: "Video must be under 100 MB." };
    if (!isAllowedVideoFile(videoFile)) return { error: "Video must be an MP4, MOV, WebM, or AVI file." };
  }

  const supabase = createSupabaseAdminClient();
  const uploadedPaths: string[] = [];

  let eventId: number | null = null;

  try {
    const [event] = await db
      .insert(events)
      .values({
        name,
        slug,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        participantCount,
        videoPath: null,
        status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        coverPhotoPath: null,
        coverPhotoWidth: null,
        coverPhotoHeight: null,
      })
      .returning({ id: events.id });

    if (!event) {
      return { error: "Failed to create story." };
    }

    eventId = event.id;

    const translationValues = locales.map((locale) => ({
      eventId: event.id,
      locale,
      title: translations[locale]?.title ?? "",
      summary: translations[locale]?.summary ?? null,
    }));
    await db.insert(eventTranslations).values(translationValues);

    if (tagIds.length > 0) {
      const tagValues = tagIds.map((tagId) => ({ eventId: event.id, tagId }));
      await db.insert(eventsToTags).values(tagValues);
    }

    if (coverPhotoFile) {
      const saved = await saveImage({
        supabase,
        file: coverPhotoFile,
        prefix: `events/${event.id}/cover`,
        stem: "cover",
      });

      if (!saved.ok) {
        await deleteManyFromStorage(supabase, uploadedPaths);
        await db.delete(events).where(eq(events.id, event.id));
        return { error: saved.error };
      }

      uploadedPaths.push(saved.path);

      await db
        .update(events)
        .set({ coverPhotoPath: saved.path, coverPhotoWidth, coverPhotoHeight })
        .where(eq(events.id, event.id));
    }

    if (videoFile) {
      const ext = videoFile.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const path = `events/${event.id}/video.${ext}`;
      const uploadedVideoPath = await uploadToStorage(supabase, videoFile, path, videoFile.type);
      if (!uploadedVideoPath) throw new Error("Video upload failed.");
      uploadedPaths.push(uploadedVideoPath);
      await db.update(events).set({ videoPath: uploadedVideoPath }).where(eq(events.id, event.id));
    }

    for (const [index, file] of displayPhotoFiles.entries()) {
      const saved = await saveImage({
        supabase,
        file,
        prefix: `events/${event.id}/gallery`,
        stem: `photo-${index + 1}`,
      });

      if (!saved.ok) {
        await deleteManyFromStorage(supabase, uploadedPaths);
        await db.delete(events).where(eq(events.id, event.id));
        return { error: saved.error };
      }

      uploadedPaths.push(saved.path);
      await db.insert(eventDisplayPhotos).values({ eventId: event.id, photoPath: saved.path });
    }
  } catch (err) {
    console.error("createStory failed", err);
    await deleteManyFromStorage(supabase, uploadedPaths);
    if (eventId !== null) {
      await db.delete(events).where(eq(events.id, eventId));
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { error: "A story with this slug already exists." };
    }
    if (message.toLowerCase().includes("body size limit")) {
      return { error: "Cover photo is too large. Max 5 MB." };
    }
    return { error: "Failed to create story. Please try again." };
  }

  revalidatePath("/admin/multimedia/stories");
  return { success: true };
}

export async function getStoryDetails(storyId: number): Promise<{ data: StoryDetails | null; error: string | null }> {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "stories")) {
    return { data: null, error: "You do not have permission to view stories." };
  }

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return { data: null, error: "Invalid story." };
  }

  const [eventRow] = await db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      participantCount: events.participantCount,
      videoPath: events.videoPath,
      coverPhotoPath: events.coverPhotoPath,
      coverPhotoWidth: events.coverPhotoWidth,
      coverPhotoHeight: events.coverPhotoHeight,
      status: events.status,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .where(eq(events.id, storyId))
    .limit(1);

  if (!eventRow) {
    return { data: null, error: "Story not found." };
  }

  // Fetch translations
  const translationRows = await db
    .select({
      locale: eventTranslations.locale,
      title: eventTranslations.title,
      summary: eventTranslations.summary,
    })
    .from(eventTranslations)
    .where(eq(eventTranslations.eventId, storyId));

  const translations: StoryDetails["translations"] = {
    en: { title: "", summary: "" },
    ms: { title: "", summary: "" },
    zh: { title: "", summary: "" },
    ta: { title: "", summary: "" },
  };

  for (const row of translationRows) {
    translations[row.locale as keyof typeof translations] = {
      title: row.title ?? "",
      summary: row.summary ?? "",
    };
  }

  const [tagRows, displayPhotoRows] = await Promise.all([
    db
      .select({
        id: eventTags.id,
        slug: eventTags.slug,
        name: eventTagTranslations.name,
      })
      .from(eventTags)
      .innerJoin(eventsToTags, eq(eventsToTags.tagId, eventTags.id))
      .innerJoin(eventTagTranslations, eq(eventTagTranslations.tagId, eventTags.id))
      .where(and(eq(eventsToTags.eventId, storyId), eq(eventTagTranslations.locale, "en"))),
    db
      .select({
        id: eventDisplayPhotos.id,
        photoPath: eventDisplayPhotos.photoPath,
      })
      .from(eventDisplayPhotos)
      .where(eq(eventDisplayPhotos.eventId, storyId))
      .orderBy(eventDisplayPhotos.id),
  ]);

  return {
    data: {
      ...eventRow,
      videoPath: eventRow.videoPath,
      startDate: eventRow.startDate.toISOString(),
      endDate: eventRow.endDate.toISOString(),
      createdAt: eventRow.createdAt.toISOString(),
      updatedAt: eventRow.updatedAt.toISOString(),
      displayPhotos: displayPhotoRows,
      translations,
      tags: tagRows,
    },
    error: null,
  };
}

export async function updateStory(storyId: number, formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "stories")) {
    return { error: "You do not have permission to manage stories." };
  }

  const [existing] = await db
    .select({
      id: events.id,
      coverPhotoPath: events.coverPhotoPath,
      videoPath: events.videoPath,
    })
    .from(events)
    .where(eq(events.id, storyId))
    .limit(1);

  if (!existing) {
    return { error: "Story not found." };
  }

  const name = takeString(formData.get("name"));
  const slug = takeString(formData.get("slug"));
  const startDate = takeString(formData.get("startDate"));
  const endDate = takeString(formData.get("endDate"));
  const location = takeString(formData.get("location"));
  const participantCount = takeNumber(formData.get("participantCount"));
  const videoFile = takeFile(formData.get("video"));
  const status = takeString(formData.get("status")) ?? "DRAFT";
  const translationsJson = takeString(formData.get("translations"));
  const tagIdsJson = takeString(formData.get("tagIds"));
  const removeCover = formData.get("removeCoverPhoto") === "true";
  const removeVideo = formData.get("removeVideo") === "true";
  const coverPhoto = takeFile(formData.get("coverPhoto"));
  const coverPhotoWidth = takeNumber(formData.get("coverPhotoWidth"));
  const coverPhotoHeight = takeNumber(formData.get("coverPhotoHeight"));
  const newDisplayPhotoEntries = formData.getAll("displayPhotos");
  const newDisplayPhotoFiles = newDisplayPhotoEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const removeDisplayPhotoIds = Array.from(new Set(
    formData.getAll("removeDisplayPhoto").map((value) => Number(value)).filter((id) => Number.isInteger(id) && id > 0),
  ));

  if (!name) return { error: "Internal name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!startDate) return { error: "Start date is required." };
  if (!endDate) return { error: "End date is required." };
  if (!location) return { error: "Location is required." };
  const dateError = validateStoryDates(startDate, endDate);
  if (dateError) return { error: dateError };

  let translations: AddStoryData["translations"];
  try {
    translations = translationsJson ? JSON.parse(translationsJson) : {};
  } catch {
    return { error: "Invalid translations data." };
  }

  if (!translations.en?.title) {
    return { error: "English title is required." };
  }

  let tagIds: number[] = [];
  try {
    tagIds = tagIdsJson ? JSON.parse(tagIdsJson) : [];
  } catch {
    tagIds = [];
  }

  if (coverPhoto) {
    if (coverPhoto.size > 5 * 1024 * 1024) {
      return { error: "Cover photo must be under 5 MB." };
    }
    if (!getAllowedImageExtension(coverPhoto)) {
      return { error: "Cover photo must be a JPG, PNG, or WebP image." };
    }
    if (coverPhotoWidth === null || coverPhotoHeight === null || !Number.isInteger(coverPhotoWidth) || !Number.isInteger(coverPhotoHeight) || coverPhotoWidth <= 0 || coverPhotoHeight <= 0) {
      return { error: "Cover photo dimensions could not be determined." };
    }
  }

  if (videoFile) {
    if (videoFile.size > 100 * 1024 * 1024) return { error: "Video must be under 100 MB." };
    if (!isAllowedVideoFile(videoFile)) return { error: "Video must be an MP4, MOV, WebM, or AVI file." };
  }

  const supabase = createSupabaseAdminClient();
  const uploadedPaths: string[] = [];
  const obsoletePaths: string[] = [];

  let newCoverPhotoPath: string | null = null;
  if (coverPhoto) {
    const saved = await saveImage({
      supabase,
      file: coverPhoto,
      prefix: `events/${storyId}/cover`,
      stem: "cover",
    });

    if (!saved.ok) {
      return { error: saved.error };
    }

    uploadedPaths.push(saved.path);
    newCoverPhotoPath = saved.path;
    if (existing.coverPhotoPath) obsoletePaths.push(existing.coverPhotoPath);
  } else if (removeCover && existing.coverPhotoPath) {
    obsoletePaths.push(existing.coverPhotoPath);
  }

  let newVideoPath: string | null = null;
  if (videoFile) {
    const ext = videoFile.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const path = `events/${storyId}/video.${ext}`;
    newVideoPath = await uploadToStorage(supabase, videoFile, path, videoFile.type);

    if (!newVideoPath) {
      await deleteManyFromStorage(supabase, uploadedPaths);
      return { error: "Video upload failed." };
    }

    if (existing.videoPath && existing.videoPath !== newVideoPath) {
      obsoletePaths.push(existing.videoPath);
    }
  } else if (removeVideo && existing.videoPath) {
    obsoletePaths.push(existing.videoPath);
  }

  const newGalleryPaths: string[] = [];
  for (const [index, file] of newDisplayPhotoFiles.entries()) {
    const saved = await saveImage({
      supabase,
      file,
      prefix: `events/${storyId}/gallery`,
      stem: `photo-${index + 1}`,
    });

    if (!saved.ok) {
      await deleteManyFromStorage(supabase, [...uploadedPaths, ...newGalleryPaths]);
      return { error: saved.error };
    }

    newGalleryPaths.push(saved.path);
  }

  const displayPhotosToRemove =
    removeDisplayPhotoIds.length > 0
      ? await db
          .select({ id: eventDisplayPhotos.id, photoPath: eventDisplayPhotos.photoPath })
          .from(eventDisplayPhotos)
          .where(
            and(
              eq(eventDisplayPhotos.eventId, storyId),
              inArray(eventDisplayPhotos.id, removeDisplayPhotoIds),
            ),
          )
      : [];

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({
          name,
          slug,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          participantCount,
          status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          ...(newCoverPhotoPath
            ? { coverPhotoPath: newCoverPhotoPath, coverPhotoWidth, coverPhotoHeight }
            : removeCover
              ? { coverPhotoPath: null, coverPhotoWidth: null, coverPhotoHeight: null }
              : {}),
          ...(newVideoPath ? { videoPath: newVideoPath } : removeVideo ? { videoPath: null } : {}),
        })
        .where(eq(events.id, storyId));

      // Update translations
      for (const locale of locales) {
        const t = translations[locale];
        await tx
          .insert(eventTranslations)
          .values({
            eventId: storyId,
            locale,
            title: t?.title ?? "",
            summary: t?.summary ?? null,
          })
          .onConflictDoUpdate({
            target: [eventTranslations.eventId, eventTranslations.locale],
            set: {
              title: t?.title ?? "",
              summary: t?.summary ?? null,
            },
          });
      }

      // Update tags
      await tx.delete(eventsToTags).where(eq(eventsToTags.eventId, storyId));
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((tagId) => ({ eventId: storyId, tagId }));
        await tx.insert(eventsToTags).values(tagValues);
      }

      if (displayPhotosToRemove.length > 0) {
        await tx
          .delete(eventDisplayPhotos)
          .where(inArray(eventDisplayPhotos.id, displayPhotosToRemove.map((row) => row.id)));
      }

      for (const photoPath of newGalleryPaths) {
        await tx.insert(eventDisplayPhotos).values({ eventId: storyId, photoPath });
      }
    });
  } catch (err) {
    console.error("updateStory failed", err);
    await deleteManyFromStorage(supabase, [...uploadedPaths, ...newGalleryPaths]);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { error: "A story with this slug already exists." };
    }
    if (message.toLowerCase().includes("body size limit")) {
      return { error: "Cover photo is too large. Max 5 MB." };
    }
    return { error: "Failed to update story. Please try again." };
  }

  await deleteManyFromStorage(supabase, [
    ...obsoletePaths,
    ...displayPhotosToRemove.map((row) => row.photoPath),
  ]);

  revalidatePath("/admin/multimedia/stories");
  return { success: true };
}

export async function getAvailableStoryTags(): Promise<{
  data: AvailableStoryTag[];
  error: string | null;
}> {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "stories")) {
    return { data: [], error: "You do not have permission to view tags." };
  }

  const rows = await db
    .select({ id: eventTags.id, slug: eventTags.slug, name: eventTagTranslations.name })
    .from(eventTags)
    .innerJoin(eventTagTranslations, eq(eventTagTranslations.tagId, eventTags.id))
    .where(eq(eventTagTranslations.locale, "en"))
    .orderBy(eventTagTranslations.name);

  return { data: rows, error: null };
}

export async function setStoryStatus(
  storyId: number,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "stories")) {
    return { error: "You do not have permission to manage stories." };
  }
  if (!Number.isInteger(storyId) || storyId <= 0) return { error: "Invalid story." };

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, storyId))
    .limit(1);
  if (!existing) return { error: "Story not found." };

  try {
    await db.update(events).set({ status, updatedAt: new Date() }).where(eq(events.id, storyId));
  } catch (err) {
    console.error("setStoryStatus failed", err);
    return { error: "Failed to update story status." };
  }

  revalidatePath("/admin/multimedia/stories");
  return { success: true };
}

export async function createStoryTag(nameValue: string): Promise<{
  data: AvailableStoryTag | null;
  error: string | null;
}> {
  const admin = await requireCurrentAdmin();
  if (!canAccessAdminModule(admin.role, "stories")) {
    return { data: null, error: "You do not have permission to create tags." };
  }

  const name = nameValue.trim();
  const slug = slugify(name);
  if (!name) return { data: null, error: "Tag name is required." };
  if (!slug) return { data: null, error: "Enter a valid tag name." };
  if (name.length > 100) return { data: null, error: "Tag name must be 100 characters or fewer." };

  try {
    const result = await db.transaction(async (tx) => {
      const [tag] = await tx.insert(eventTags).values({ slug }).returning({ id: eventTags.id, slug: eventTags.slug });
      if (!tag) return null;
      await tx.insert(eventTagTranslations).values(locales.map((locale) => ({ tagId: tag.id, locale, name })));
      return { ...tag, name };
    });

    if (!result) return { data: null, error: "Failed to create tag." };
    revalidatePath("/admin/multimedia/stories");
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { data: null, error: "A tag with this name already exists." };
    }
    return { data: null, error: "Failed to create tag. Please try again." };
  }
}

export async function deleteStory(storyId: number) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "stories")) {
    return { error: "You do not have permission to manage stories." };
  }

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return { error: "Invalid story." };
  }

  const [existing] = await db
    .select({ id: events.id, coverPhotoPath: events.coverPhotoPath, videoPath: events.videoPath })
    .from(events)
    .where(eq(events.id, storyId))
    .limit(1);

  if (!existing) {
    return { error: "Story not found." };
  }

  const displayPhotos = await db
    .select({ photoPath: eventDisplayPhotos.photoPath })
    .from(eventDisplayPhotos)
    .where(eq(eventDisplayPhotos.eventId, storyId));

  try {
    await db.delete(events).where(eq(events.id, storyId));
  } catch (err) {
    console.error("deleteStory failed", err);
    return { error: "Failed to delete story." };
  }

  await deleteManyFromStorage(createSupabaseAdminClient(), [
    existing.coverPhotoPath,
    existing.videoPath,
    ...displayPhotos.map((row) => row.photoPath),
  ]);

  revalidatePath("/admin/multimedia/stories");
  return { success: true };
}
