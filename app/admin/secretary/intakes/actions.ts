"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  intakes,
  intakeTranslations,
  intakePatchExplanations,
  intakePatchExplanationTranslations,
  intakeDisplayPhotos,
  cadets,
} from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteManyFromStorage, saveImage } from "@/lib/supabase/storage";
import { slugify } from "@/lib/slugify";
import { takeString, takeNumber, takeFile } from "@/lib/admin/form-helpers";

type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Locale = "en" | "ms" | "zh" | "ta";
type ExplanationKey = "ANIMAL" | "COLOR" | "PHILOSOPHY";

const LOCALES: Locale[] = ["en", "ms", "zh", "ta"];
const EXPLANATION_KEYS: ExplanationKey[] = ["ANIMAL", "COLOR", "PHILOSOPHY"];
const VALID_STATUSES: PublicationStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const INTAKE_NO_RE = /^\d+\/\d+$/;

export type IntakeDetails = {
  id: number;
  intakeNo: string;
  displayName: string;
  slug: string;
  status: PublicationStatus;
  startYear: number;
  color: string | null;
  tagLine: string | null;
  coverPhotoPath: string | null;
  patchPhotoPath: string | null;
  innerPhotoPath: string | null;
  tshirtPhotoPath: string | null;
  translations: Record<string, { summary: string | null; }>;
  patchExplanations: Record<string, Record<string, string>>;
  displayPhotos: { id: number; photoPath: string }[];
  cadetCount: number;
};

export async function getIntakeDetails(intakeId: number): Promise<{ data: IntakeDetails | null; error: string | null }> {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "intakes")) {
    return { data: null, error: "You do not have permission to view intakes." };
  }

  if (!Number.isInteger(intakeId) || intakeId <= 0) {
    return { data: null, error: "Invalid intake." };
  }

  const [row] = await db
    .select()
    .from(intakes)
    .where(eq(intakes.id, intakeId))
    .limit(1);

  if (!row) return { data: null, error: "Intake not found." };

  const [transRows, patchRows, photoRows, cadetCountRow] = await Promise.all([
    db.select().from(intakeTranslations).where(eq(intakeTranslations.intakeId, intakeId)),
    db
      .select({
        id: intakePatchExplanations.id,
        key: intakePatchExplanations.key,
        locale: intakePatchExplanationTranslations.locale,
        value: intakePatchExplanationTranslations.value,
      })
      .from(intakePatchExplanations)
      .leftJoin(
        intakePatchExplanationTranslations,
        eq(intakePatchExplanationTranslations.patchExplanationId, intakePatchExplanations.id),
      )
      .where(eq(intakePatchExplanations.intakeId, intakeId)),
    db.select().from(intakeDisplayPhotos).where(eq(intakeDisplayPhotos.intakeId, intakeId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cadets)
      .where(eq(cadets.intakeId, intakeId)),
  ]);

  const translations: IntakeDetails["translations"] = {};
  for (const t of transRows) {
    translations[t.locale] = {
      summary: t.summary,
    };
  }

  const patchExplanations: IntakeDetails["patchExplanations"] = {};
  for (const p of patchRows) {
    if (!patchExplanations[p.key]) patchExplanations[p.key] = {};
    if (p.locale && p.value) {
      patchExplanations[p.key][p.locale] = p.value;
    }
  }

  return {
    data: {
      id: row.id,
      intakeNo: row.intakeNo,
      displayName: row.displayName,
      slug: row.slug,
      status: row.status,
      startYear: row.startYear,
      color: row.color,
      tagLine: row.tagLine,
      coverPhotoPath: row.coverPhotoPath,
      patchPhotoPath: row.patchPhotoPath,
      innerPhotoPath: row.innerPhotoPath,
      tshirtPhotoPath: row.tshirtPhotoPath,
      translations,
      patchExplanations,
      displayPhotos: photoRows.map((p) => ({ id: p.id, photoPath: p.photoPath })),
      cadetCount: cadetCountRow[0]?.count ?? 0,
    },
    error: null,
  };
}

export async function createIntake(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "intakes")) {
    return { error: "You do not have permission to manage intakes." };
  }

  const intakeNo = takeString(formData.get("intakeNo"));
  const displayName = takeString(formData.get("displayName"));
  const startYear = takeNumber(formData.get("startYear"));
  const tagLine = takeString(formData.get("tagLine"));
  const rawStatus = takeString(formData.get("status"));

  if (!intakeNo || !INTAKE_NO_RE.test(intakeNo)) {
    return { error: "Intake number must be in format X/Y (e.g. 1/43)." };
  }
  if (!displayName) return { error: "Display name is required." };
  const slug = slugify(displayName);
  if (!startYear || startYear < 2000 || startYear > 2100) {
    return { error: "Start year must be a valid year." };
  }

  const status: PublicationStatus =
    rawStatus && VALID_STATUSES.includes(rawStatus as PublicationStatus)
      ? (rawStatus as PublicationStatus)
      : "DRAFT";

  const translationData: Record<string, { summary: string | null; }> = {};
  for (const locale of LOCALES) {
    translationData[locale] = {
      summary: takeString(formData.get(`translation_${locale}_summary`)),
    };
  }

  const patchData: Record<string, Record<string, string>> = {};
  for (const key of EXPLANATION_KEYS) {
    patchData[key] = {};
    for (const locale of LOCALES) {
      const val = takeString(formData.get(`patchExplanation_${key}_${locale}`));
      if (val) patchData[key][locale] = val;
    }
  }

  const coverFile = takeFile(formData.get("coverPhoto"));
  const patchFile = takeFile(formData.get("patchPhoto"));
  const innerFile = takeFile(formData.get("innerPhoto"));
  const tshirtFile = takeFile(formData.get("tshirtPhoto"));

  const galleryFiles: File[] = [];
  let i = 0;
  while (true) {
    const f = takeFile(formData.get(`galleryPhoto_${i}`));
    if (!f) break;
    galleryFiles.push(f);
    i++;
  }

  let intakeId: number;

  try {
    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(intakes)
        .values({
          intakeNo,
          displayName,
          slug,
          status,
          startYear,
          tagLine,
        })
        .returning({ id: intakes.id });

      const id = inserted.id;

      for (const locale of LOCALES) {
        const t = translationData[locale];
        if (t.summary) {
          await tx.insert(intakeTranslations).values({
            intakeId: id,
            locale,
            summary: t.summary,
          });
        }
      }

      for (const key of EXPLANATION_KEYS) {
        const values = patchData[key];
        if (Object.keys(values).length > 0) {
          const [patchRow] = await tx
            .insert(intakePatchExplanations)
            .values({ intakeId: id, key })
            .returning({ id: intakePatchExplanations.id });

          for (const [locale, value] of Object.entries(values)) {
            await tx.insert(intakePatchExplanationTranslations).values({
              patchExplanationId: patchRow.id,
              locale: locale as Locale,
              value,
            });
          }
        }
      }

      return id;
    });

    intakeId = result;
  } catch (err: unknown) {
    if (err instanceof Error && err.message?.includes("duplicate key")) {
      return { error: "An intake with this number, name, or slug already exists." };
    }
    return { error: "Failed to create intake. Please try again." };
  }

  const supabase = createSupabaseAdminClient();
  const pendingPaths: string[] = [];
  const photoUpdates: Record<string, string> = {};

  const photoFields = [
    { file: coverFile, stem: "cover", key: "coverPhotoPath" },
    { file: patchFile, stem: "patch", key: "patchPhotoPath" },
    { file: innerFile, stem: "inner", key: "innerPhotoPath" },
    { file: tshirtFile, stem: "tshirt", key: "tshirtPhotoPath" },
  ] as const;

  for (const field of photoFields) {
    if (!field.file) continue;

    const saved = await saveImage({
      supabase,
      file: field.file,
      prefix: `intakes/${intakeId}/${field.stem}`,
      stem: field.stem,
    });

    if (!saved.ok) {
      await deleteManyFromStorage(supabase, pendingPaths);
      return { error: saved.error };
    }

    pendingPaths.push(saved.path);
    photoUpdates[field.key] = saved.path;
  }

  if (Object.keys(photoUpdates).length > 0) {
    try {
      await db.update(intakes).set(photoUpdates).where(eq(intakes.id, intakeId));
    } catch (err) {
      console.error("Failed to save intake photos", {
        intakeId,
        paths: pendingPaths,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      await deleteManyFromStorage(supabase, pendingPaths);
      return { error: "Failed to save intake photos. Please try again." };
    }
  }

  for (const [index, file] of galleryFiles.entries()) {
    const saved = await saveImage({
      supabase,
      file,
      prefix: `intakes/${intakeId}/gallery`,
      stem: `gallery-${index + 1}`,
    });

    if (!saved.ok) {
      return { error: saved.error };
    }

    try {
      await db.insert(intakeDisplayPhotos).values({ intakeId, photoPath: saved.path });
    } catch (err) {
      console.error("Failed to record intake gallery photo", {
        intakeId,
        path: saved.path,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      await deleteManyFromStorage(supabase, [saved.path]);
      return { error: "Failed to save intake gallery photo. Please try again." };
    }
  }

  revalidatePath("/admin/secretary/intakes");
  return { success: true };
}

export async function updateIntake(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "intakes")) {
    return { error: "You do not have permission to manage intakes." };
  }

  const rawId = formData.get("intakeId");
  const intakeId = typeof rawId === "string" ? Number(rawId) : NaN;
  if (!Number.isInteger(intakeId) || intakeId <= 0) {
    return { error: "Invalid intake." };
  }

  const intakeNo = takeString(formData.get("intakeNo"));
  const displayName = takeString(formData.get("displayName"));
  const startYear = takeNumber(formData.get("startYear"));
  const tagLine = takeString(formData.get("tagLine"));
  const rawStatus = takeString(formData.get("status"));

  if (!intakeNo || !INTAKE_NO_RE.test(intakeNo)) {
    return { error: "Intake number must be in format X/Y (e.g. 1/43)." };
  }
  if (!displayName) return { error: "Display name is required." };
  const slug = slugify(displayName);
  if (!startYear || startYear < 2000 || startYear > 2100) {
    return { error: "Start year must be a valid year." };
  }

  const status: PublicationStatus =
    rawStatus && VALID_STATUSES.includes(rawStatus as PublicationStatus)
      ? (rawStatus as PublicationStatus)
      : "DRAFT";

  const translationData: Record<string, { summary: string | null; }> = {};
  for (const locale of LOCALES) {
    translationData[locale] = {
      summary: takeString(formData.get(`translation_${locale}_summary`)),
    };
  }

  const patchData: Record<string, Record<string, string>> = {};
  for (const key of EXPLANATION_KEYS) {
    patchData[key] = {};
    for (const locale of LOCALES) {
      const val = takeString(formData.get(`patchExplanation_${key}_${locale}`));
      if (val) patchData[key][locale] = val;
    }
  }

  const coverFile = takeFile(formData.get("coverPhoto"));
  const patchFile = takeFile(formData.get("patchPhoto"));
  const innerFile = takeFile(formData.get("innerPhoto"));
  const tshirtFile = takeFile(formData.get("tshirtPhoto"));

  const removeCoverPhoto = formData.get("removeCoverPhoto") === "true";
  const removePatchPhoto = formData.get("removePatchPhoto") === "true";
  const removeInnerPhoto = formData.get("removeInnerPhoto") === "true";
  const removeTshirtPhoto = formData.get("removeTshirtPhoto") === "true";

  const galleryFiles: File[] = [];
  let gi = 0;
  while (true) {
    const f = takeFile(formData.get(`galleryPhoto_${gi}`));
    if (!f) break;
    galleryFiles.push(f);
    gi++;
  }

  const removedGalleryIds: number[] = [];
  let ri = 0;
  while (true) {
    const raw = formData.get(`removeGalleryPhoto_${ri}`);
    if (!raw) break;
    const id = Number(raw);
    if (Number.isInteger(id) && id > 0) removedGalleryIds.push(id);
    ri++;
  }

  const [existingIntake] = await db
    .select({
      coverPhotoPath: intakes.coverPhotoPath,
      patchPhotoPath: intakes.patchPhotoPath,
      innerPhotoPath: intakes.innerPhotoPath,
      tshirtPhotoPath: intakes.tshirtPhotoPath,
    })
    .from(intakes)
    .where(eq(intakes.id, intakeId))
    .limit(1);

  if (!existingIntake) {
    return { error: "Intake not found." };
  }

  const supabase = createSupabaseAdminClient();
  const uploadedPaths: string[] = [];
  const obsoletePaths: string[] = [];
  const photoUpdates: Record<string, string | null> = {};

  const photoFields = [
    {
      file: coverFile,
      stem: "cover",
      key: "coverPhotoPath",
      current: existingIntake.coverPhotoPath,
      remove: removeCoverPhoto,
    },
    {
      file: patchFile,
      stem: "patch",
      key: "patchPhotoPath",
      current: existingIntake.patchPhotoPath,
      remove: removePatchPhoto,
    },
    {
      file: innerFile,
      stem: "inner",
      key: "innerPhotoPath",
      current: existingIntake.innerPhotoPath,
      remove: removeInnerPhoto,
    },
    {
      file: tshirtFile,
      stem: "tshirt",
      key: "tshirtPhotoPath",
      current: existingIntake.tshirtPhotoPath,
      remove: removeTshirtPhoto,
    },
  ] as const;

  for (const field of photoFields) {
    if (field.file) {
      const saved = await saveImage({
        supabase,
        file: field.file,
        prefix: `intakes/${intakeId}/${field.stem}`,
        stem: field.stem,
      });

      if (!saved.ok) {
        await deleteManyFromStorage(supabase, uploadedPaths);
        return { error: saved.error };
      }

      uploadedPaths.push(saved.path);
      photoUpdates[field.key] = saved.path;
      if (field.current) obsoletePaths.push(field.current);
      continue;
    }

    if (field.remove && field.current) {
      photoUpdates[field.key] = null;
      obsoletePaths.push(field.current);
    }
  }

  const galleryPaths: string[] = [];

  for (const [index, file] of galleryFiles.entries()) {
    const saved = await saveImage({
      supabase,
      file,
      prefix: `intakes/${intakeId}/gallery`,
      stem: `gallery-${index + 1}`,
    });

    if (!saved.ok) {
      await deleteManyFromStorage(supabase, [...uploadedPaths, ...galleryPaths]);
      return { error: saved.error };
    }

    galleryPaths.push(saved.path);
  }

  const galleryRowsToRemove =
    removedGalleryIds.length > 0
      ? await db
          .select({ id: intakeDisplayPhotos.id, photoPath: intakeDisplayPhotos.photoPath })
          .from(intakeDisplayPhotos)
          .where(
            and(
              eq(intakeDisplayPhotos.intakeId, intakeId),
              inArray(intakeDisplayPhotos.id, removedGalleryIds),
            ),
          )
      : [];

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(intakes)
        .set({ intakeNo, displayName, slug, status, startYear, tagLine, ...photoUpdates })
        .where(eq(intakes.id, intakeId));

      await tx.delete(intakeTranslations).where(eq(intakeTranslations.intakeId, intakeId));
      for (const locale of LOCALES) {
        const t = translationData[locale];
        if (t.summary) {
          await tx.insert(intakeTranslations).values({
            intakeId,
            locale,
            summary: t.summary,
          });
        }
      }

      const existingPatchRows = await tx
        .select()
        .from(intakePatchExplanations)
        .where(eq(intakePatchExplanations.intakeId, intakeId));

      for (const existing of existingPatchRows) {
        await tx
          .delete(intakePatchExplanationTranslations)
          .where(eq(intakePatchExplanationTranslations.patchExplanationId, existing.id));
      }
      await tx.delete(intakePatchExplanations).where(eq(intakePatchExplanations.intakeId, intakeId));

      for (const key of EXPLANATION_KEYS) {
        const values = patchData[key];
        if (Object.keys(values).length > 0) {
          const [patchRow] = await tx
            .insert(intakePatchExplanations)
            .values({ intakeId, key })
            .returning({ id: intakePatchExplanations.id });

          for (const [locale, value] of Object.entries(values)) {
            await tx.insert(intakePatchExplanationTranslations).values({
              patchExplanationId: patchRow.id,
              locale: locale as Locale,
              value,
            });
          }
        }
      }

      if (galleryRowsToRemove.length > 0) {
        await tx
          .delete(intakeDisplayPhotos)
          .where(
            and(
              eq(intakeDisplayPhotos.intakeId, intakeId),
              inArray(
                intakeDisplayPhotos.id,
                galleryRowsToRemove.map((row) => row.id),
              ),
            ),
          );
      }

      for (const photoPath of galleryPaths) {
        await tx.insert(intakeDisplayPhotos).values({ intakeId, photoPath });
      }
    });
  } catch (err: unknown) {
    await deleteManyFromStorage(supabase, [...uploadedPaths, ...galleryPaths]);
    if (err instanceof Error && err.message?.includes("duplicate key")) {
      return { error: "An intake with this number, name, or slug already exists." };
    }
    return { error: "Failed to update intake. Please try again." };
  }

  await deleteManyFromStorage(supabase, [
    ...obsoletePaths,
    ...galleryRowsToRemove.map((row) => row.photoPath),
  ]);

  revalidatePath("/admin/secretary/intakes");
  return { success: true };
}

export async function updateIntakeStatus(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, "intakes")) {
    return { error: "You do not have permission to manage intakes." };
  }

  const rawId = formData.get("intakeId");
  const intakeId = typeof rawId === "string" ? Number(rawId) : NaN;
  if (!Number.isInteger(intakeId) || intakeId <= 0) {
    return { error: "Invalid intake." };
  }

  const rawStatus = takeString(formData.get("status"));
  if (!rawStatus || !VALID_STATUSES.includes(rawStatus as PublicationStatus)) {
    return { error: "Invalid status." };
  }

  const status = rawStatus as PublicationStatus;

  try {
    await db.update(intakes).set({ status }).where(eq(intakes.id, intakeId));
  } catch {
    return { error: "Failed to update status." };
  }

  revalidatePath("/admin/secretary/intakes");
  return { success: true };
}
