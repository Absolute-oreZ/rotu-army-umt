import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers, cadets, members } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canAccessAdminModule,
  canAccessRoleGroup,
  getDefaultAdminRoute,
  isFullAccessAdminRole,
  isIntakeScopedRole,
  type AdminModule,
  type AdminRole,
} from "@/lib/admin/roles";

export type CurrentAdmin = {
  authUserId: string;
  email: string;
  fullName: string | null;
  redBgPhotoPath: string | null;
  id: string;
  blueBgPhotoPath: string | null;
  role: AdminRole;
  intakeId: number | null;
  gender: "MALE" | "FEMALE";
};

export type AdminAccess =
  | { status: "ok"; admin: CurrentAdmin }
  | { status: "not-admin" }
  | { status: "inactive-cadet" }
  | { status: "missing-intake" };

export async function resolveAdminAccess(authUserId: string): Promise<AdminAccess> {
  const [row] = await db
    .select({
      authUserId: adminUsers.authUserId,
      email: adminUsers.email,
      fullName: members.name,
      redBgPhotoPath: members.redBgPhotoPath,
      blueBgPhotoPath: members.blueBgPhotoPath,
      id: adminUsers.id,
      role: adminUsers.role,
      intakeId: adminUsers.intakeId,
      gender: members.gender,
      cadetIsActive: cadets.isActive,
    })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .leftJoin(cadets, eq(cadets.memberId, members.id))
    .where(eq(adminUsers.authUserId, authUserId))
    .limit(1);

  if (!row) {
    return { status: "not-admin" };
  }

  if (row.cadetIsActive === false) {
    return { status: "inactive-cadet" };
  }

  const scoped = isIntakeScopedRole(row.role);

  if (scoped && row.intakeId === null) {
    console.error(`Admin ${row.id} (${row.role}) is intake-scoped but has no intake assigned; access denied.`);
    return { status: "missing-intake" };
  }

  return {
    status: "ok",
    admin: {
      authUserId: row.authUserId,
      email: row.email,
      fullName: row.fullName,
      id: row.id,
      redBgPhotoPath: row.redBgPhotoPath,
      blueBgPhotoPath: row.blueBgPhotoPath,
      role: row.role,
      intakeId: scoped ? row.intakeId : null,
      gender: row.gender,
    },
  };
}

export async function getCurrentAdminAccess(): Promise<AdminAccess> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "not-admin" };
  }

  return cachedResolveAdminAccess(user.id);
}

const cachedResolveAdminAccess = cache(resolveAdminAccess);
const cachedGetCurrentAdminAccess = cache(getCurrentAdminAccess);

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const access = await cachedGetCurrentAdminAccess();

  return access.status === "ok" ? access.admin : null;
}

function adminLoginPath(access: AdminAccess): string {
  if (access.status === "inactive-cadet" || access.status === "missing-intake") {
    return `/admin/login?error=${access.status}`;
  }

  return "/admin/login";
}

export async function requireCurrentAdmin() {
  const access = await cachedGetCurrentAdminAccess();

  if (access.status !== "ok") {
    redirect(adminLoginPath(access));
  }

  return access.admin;
}

export async function requireAdminModule(module: AdminModule) {
  const admin = await requireCurrentAdmin();

  if (!canAccessAdminModule(admin.role, module)) {
    notFound();
  }

  return admin;
}

export async function redirectAdminRoot() {
  const admin = await requireCurrentAdmin();

  if (isFullAccessAdminRole(admin.role)) {
    return admin;
  }

  redirect(getDefaultAdminRoute(admin.role));
}

export type RoleGroupResult = {
  admin: CurrentAdmin;
  authorized: boolean;
};

export async function requireRoleGroup(group: string): Promise<RoleGroupResult> {
  const admin = await requireCurrentAdmin();

  if (!canAccessRoleGroup(admin.role, group)) {
    return { admin, authorized: false };
  }

  return { admin, authorized: true };
}

export function getIntakeScope(admin: CurrentAdmin): number | null {
  if (!isIntakeScopedRole(admin.role)) {
    return null;
  }

  if (admin.intakeId === null) {
    throw new Error(`Invariant violated: intake-scoped admin ${admin.id} has no intake assignment.`);
  }

  return admin.intakeId;
}

