"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cadets, studyPrograms } from "@/db/schema";
import { requireCurrentAdmin } from "@/lib/admin/rbac";
import { canAccessAdminModule } from "@/lib/admin/roles";
import { takeNumber, takeString } from "@/lib/admin/form-helpers";
import { slugify } from "@/lib/slugify";
import { ActionResult, ok, err } from "@/lib/actions/result";

export async function updateCadetCourseAction(input: {
  cadetId: number;
  studyProgramId: number | null;
}): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "courses")) {
      return err("Access denied.");
    }

    if (admin.intakeId) {
      const [cadet] = await db
        .select({ id: cadets.id, intakeId: cadets.intakeId })
        .from(cadets)
        .where(eq(cadets.id, input.cadetId));

      if (!cadet || cadet.intakeId !== admin.intakeId) {
        return err("Cadet not found in your intake scope.");
      }
    }

    if (input.studyProgramId !== null) {
      const [program] = await db
        .select({ id: studyPrograms.id })
        .from(studyPrograms)
        .where(eq(studyPrograms.id, input.studyProgramId));

      if (!program) {
        return err("Selected course does not exist.");
      }
    }

    await db
      .update(cadets)
      .set({
        studyProgramId: input.studyProgramId,
        updatedAt: new Date(),
      })
      .where(eq(cadets.id, input.cadetId));

    revalidatePath("/admin/academic/courses");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update cadet course.");
  }
}

export async function createCourseAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "courses")) {
      return err("Access denied.");
    }

    const name = takeString(formData.get("name"));
    if (!name || name.trim().length === 0) {
      return err("Course name is required.");
    }

    const completionYear = takeNumber(formData.get("completionYear")) ?? 3;
    if (completionYear < 1 || completionYear > 8) {
      return err("Completion year must be between 1 and 8.");
    }

    const isSupportedRaw = formData.get("isSupported");
    const isSupported = isSupportedRaw === "true" || isSupportedRaw === "on";

    const slug = slugify(name);

    const [existing] = await db
      .select({ id: studyPrograms.id })
      .from(studyPrograms)
      .where(sql`${studyPrograms.slug} = ${slug} OR ${studyPrograms.name} = ${name}`);

    if (existing) {
      return err("A course with this name already exists.");
    }

    await db.insert(studyPrograms).values({
      name: name.trim().toUpperCase(),
      slug,
      completionYear,
      isSupported,
    });

    revalidatePath("/admin/academic/courses");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to create course.");
  }
}

export async function updateCourseAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "courses")) {
      return err("Access denied.");
    }

    const id = takeNumber(formData.get("id"));
    if (!id) {
      return err("Course ID is required.");
    }

    const name = takeString(formData.get("name"));
    if (!name || name.trim().length === 0) {
      return err("Course name is required.");
    }

    const completionYear = takeNumber(formData.get("completionYear")) ?? 3;
    if (completionYear < 1 || completionYear > 8) {
      return err("Completion year must be between 1 and 8.");
    }

    const isSupportedRaw = formData.get("isSupported");
    const isSupported = isSupportedRaw === "true" || isSupportedRaw === "on";

    const [existing] = await db
      .select({ id: studyPrograms.id })
      .from(studyPrograms)
      .where(
        and(
          sql`(${studyPrograms.name} = ${name})`,
          sql`${studyPrograms.id} != ${id}`
        )
      );

    if (existing) {
      return err("Another course with this name already exists.");
    }

    await db
      .update(studyPrograms)
      .set({
        name: name.trim().toUpperCase(),
        completionYear,
        isSupported,
        updatedAt: new Date(),
      })
      .where(eq(studyPrograms.id, id));

    revalidatePath("/admin/academic/courses");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to update course.");
  }
}

export async function deleteCourseAction(id: number): Promise<ActionResult> {
  try {
    const admin = await requireCurrentAdmin();
    if (!canAccessAdminModule(admin.role, "courses")) {
      return err("Access denied.");
    }

    const [cadetCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cadets)
      .where(eq(cadets.studyProgramId, id));

    const enrolledCount = cadetCountRow?.count ?? 0;
    if (enrolledCount > 0) {
      return err(`Cannot delete this course because ${enrolledCount} cadet(s) are currently enrolled. Reassign them first.`);
    }

    await db.delete(studyPrograms).where(eq(studyPrograms.id, id));

    revalidatePath("/admin/academic/courses");
    return ok();
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete course.");
  }
}
