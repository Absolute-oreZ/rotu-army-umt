import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canAccessAdminModule,
  getDefaultAdminRoute,
  isFullAccessAdminRole,
  type AdminModule,
  type AdminRole,
} from "@/lib/admin/roles";

export type CurrentAdmin = {
  authUserId: string;
  email: string;
  fullName: string | null;
  id: string;
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
      fullName: adminUsers.fullName,
      id: adminUsers.id,
      isActive: adminUsers.isActive,
      role: adminUsers.role,
    })
    .from(adminUsers)
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
