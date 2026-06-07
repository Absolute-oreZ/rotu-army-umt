import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers, members } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canAccessAdminModule,
  canAccessRoleGroup,
  getDefaultAdminRoute,
  isFullAccessAdminRole,
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
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [admin] = await db
    .select({
      authUserId: adminUsers.authUserId,
      email: adminUsers.email,
      fullName: members.name,
      redBgPhotoPath: members.redBgPhotoPath,
      blueBgPhotoPath: members.blueBgPhotoPath,
      id: adminUsers.id,
      isActive: adminUsers.isActive,
      role: adminUsers.role,
    })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .where(eq(adminUsers.authUserId, user.id))
    .limit(1);

  if (!admin?.isActive) {
    return null;
  }

  return {
    authUserId: admin.authUserId,
    email: admin.email,
    fullName: admin.fullName,
    id: admin.id,
    redBgPhotoPath: admin.redBgPhotoPath,
    blueBgPhotoPath: admin.blueBgPhotoPath,
    role: admin.role,
  };
}

export async function requireCurrentAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
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
