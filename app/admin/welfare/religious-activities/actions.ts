"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { religiousActivities, religiousActivityPhotos } from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { getReligiousActivityTypes } from "@/lib/welfare/religious-activity-types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteManyFromStorage, saveImage } from "@/lib/supabase/storage";
import {
  takeString,
  takeFile,
} from "@/lib/admin/form-helpers";
import { getAllowedImageExtension } from "@/lib/storage/files";

function parseRecordDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : value;
}

function buildTitle(type: string, recordDate: string): string {
  return `${type.toUpperCase()}-${recordDate}`;
}

function resolveType(value: FormDataEntryValue | null): string | null {
  const type = takeString(value);
  if (type === null) return null;
  const upper = type.toUpperCase();
  return getReligiousActivityTypes().includes(upper) ? upper : null;
}

function validateMeetingLink(value: string | null): string | null | { error: string } {
  if (value === null) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "Meeting link must be an http or https URL." };
    }
    return value;
  } catch {
    return { error: "Meeting link must be a valid URL." };
  }
}

function validatePhotos(formData: FormData): { files: File[] } | { error: string } {
  const files: File[] = [];
  const entries = formData.getAll("photos");
  for (const entry of entries) {
    const file = takeFile(entry);
    if (!file) continue;
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Photos must be under 5 MB each." };
    }
    if (!getAllowedImageExtension(file)) {
      return { error: "Photos must be JPG, PNG, or WebP images." };
    }
    files.push(file);
  }
  return { files };
}

async function uploadPhotos(
  supabase: Awaited<ReturnType<typeof createSupabaseAdminClient>>,
  activityId: number,
  files: File[],
): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  const paths: string[] = [];

  for (const [index, file] of files.entries()) {
    const saved = await saveImage({
      supabase,
      file,
      prefix: `religious-activities/${activityId}/photos`,
      stem: `photo-${index + 1}`,
    });

    if (!saved.ok) {
      await deleteManyFromStorage(supabase, paths);
      return { ok: false, error: saved.error };
    }

    paths.push(saved.path);
  }

  return { ok: true, paths };
}

function duplicateError(type: string, recordDate: string, title: string) {
  return `A ${type} record for ${recordDate} already exists (title: ${title}).`;
}

export async function createReligiousActivity(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "religion")) {
    return { error: "You do not have permission to manage religious activities." };
  }

  const type = resolveType(formData.get("type"));
  if (type === null) return { error: "Valid type is required." };

  const recordDate = parseRecordDate(takeString(formData.get("recordDate")));
  if (recordDate === null) return { error: "Valid date is required." };

  const title = buildTitle(type, recordDate);
  const remarks = takeString(formData.get("remarks"));
  const location = takeString(formData.get("location"));
  if (location === null) return { error: "Location is required." };
  if (location.length > 500) return { error: "Location must be 500 characters or fewer." };

  const meetingLinkResult = validateMeetingLink(takeString(formData.get("meetingLink")));
  if (meetingLinkResult !== null && typeof meetingLinkResult === "object") {
    return { error: meetingLinkResult.error };
  }
  const meetingLink = meetingLinkResult;

  const photosResult = validatePhotos(formData);
  if ("error" in photosResult) return { error: photosResult.error };

  const supabase = createSupabaseAdminClient();
  let activityId: number | null = null;
  let uploadedPhotoPaths: string[] = [];

  try {
    const inserted = await db
      .insert(religiousActivities)
      .values({
        type,
        recordDate,
        title,
        remarks,
        location,
        meetingLink,
      })
      .onConflictDoNothing({ target: religiousActivities.title })
      .returning({ id: religiousActivities.id });

    const activity = inserted[0];
    if (!activity) {
      return { error: duplicateError(type, recordDate, title) };
    }

    activityId = activity.id;

    if (photosResult.files.length > 0) {
      const uploaded = await uploadPhotos(supabase, activity.id, photosResult.files);
      if (!uploaded.ok) {
        await db.delete(religiousActivities).where(eq(religiousActivities.id, activity.id));
        return { error: uploaded.error };
      }

      uploadedPhotoPaths = uploaded.paths;

      await db
        .insert(religiousActivityPhotos)
        .values(uploaded.paths.map((photoPath) => ({ activityId: activity.id, photoPath })));
    }
  } catch (err) {
    console.error("createReligiousActivity failed", err);
    await deleteManyFromStorage(supabase, uploadedPhotoPaths);
    if (activityId !== null) {
      await db.delete(religiousActivities).where(eq(religiousActivities.id, activityId));
    }
    return { error: "Failed to create religious activity." };
  }

  revalidatePath("/admin/welfare/religious-activities");
  return { success: true as const };
}

export async function updateReligiousActivity(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "religion")) {
    return { error: "You do not have permission to manage religious activities." };
  }

  const rawId = takeString(formData.get("activityId"));
  const activityId = rawId ? Number(rawId) : null;
  if (activityId === null || !Number.isInteger(activityId) || activityId <= 0) {
    return { error: "Invalid activity." };
  }

  const type = resolveType(formData.get("type"));
  if (type === null) return { error: "Valid type is required." };

  const recordDate = parseRecordDate(takeString(formData.get("recordDate")));
  if (recordDate === null) return { error: "Valid date is required." };

  const title = buildTitle(type, recordDate);
  const remarks = takeString(formData.get("remarks"));
  const location = takeString(formData.get("location"));
  if (location === null) return { error: "Location is required." };
  if (location.length > 500) return { error: "Location must be 500 characters or fewer." };

  const meetingLinkResult = validateMeetingLink(takeString(formData.get("meetingLink")));
  if (meetingLinkResult !== null && typeof meetingLinkResult === "object") {
    return { error: meetingLinkResult.error };
  }
  const meetingLink = meetingLinkResult;

  const [existing] = await db
    .select({ id: religiousActivities.id })
    .from(religiousActivities)
    .where(eq(religiousActivities.id, activityId))
    .limit(1);

  if (!existing) return { error: "Activity not found." };

  try {
    await db
      .update(religiousActivities)
      .set({
        type,
        recordDate,
        title,
        remarks,
        location,
        meetingLink,
        updatedAt: new Date(),
      })
      .where(eq(religiousActivities.id, activityId));
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { error: duplicateError(type, recordDate, title) };
    }
    console.error("updateReligiousActivity failed", err);
    return { error: "Failed to update religious activity." };
  }

  revalidatePath("/admin/welfare/religious-activities");
  return { success: true as const };
}

export async function deleteReligiousActivity(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "religion")) {
    return { error: "You do not have permission to manage religious activities." };
  }

  const rawId = takeString(formData.get("activityId"));
  const activityId = rawId ? Number(rawId) : null;
  if (activityId === null || !Number.isInteger(activityId) || activityId <= 0) {
    return { error: "Invalid activity." };
  }

  const [existing] = await db
    .select({ id: religiousActivities.id })
    .from(religiousActivities)
    .where(eq(religiousActivities.id, activityId))
    .limit(1);

  if (!existing) return { error: "Activity not found." };

  try {
    const photoRows = await db
      .select({ photoPath: religiousActivityPhotos.photoPath })
      .from(religiousActivityPhotos)
      .where(eq(religiousActivityPhotos.activityId, activityId));

    await db.delete(religiousActivities).where(eq(religiousActivities.id, activityId));

    await deleteManyFromStorage(
      createSupabaseAdminClient(),
      photoRows.map((row) => row.photoPath),
    );
  } catch (err) {
    console.error("deleteReligiousActivity failed", err);
    return { error: "Failed to delete religious activity." };
  }

  revalidatePath("/admin/welfare/religious-activities");
  return { success: true as const };
}

export async function getReligiousActivityPhotos(activityId: number): Promise<{
  data: Array<{ id: number; photoPath: string }>;
  error: string | null;
}> {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "religion")) {
    return { data: [], error: "You do not have permission to view religious activities." };
  }

  if (!Number.isInteger(activityId) || activityId <= 0) {
    return { data: [], error: "Invalid activity." };
  }

  const rows = await db
    .select({ id: religiousActivityPhotos.id, photoPath: religiousActivityPhotos.photoPath })
    .from(religiousActivityPhotos)
    .where(eq(religiousActivityPhotos.activityId, activityId))
    .orderBy(religiousActivityPhotos.id);

  return { data: rows, error: null };
}