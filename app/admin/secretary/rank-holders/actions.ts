"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  adminUsers,
  adminInvitations,
  adminRoleAuditLogs,
  cadets,
  members,
  treasuryAccounts,
} from "@/db/schema";
import { requireCurrentAdmin, getIntakeScope } from "@/lib/admin/rbac";
import { canAccessAdminModule, isFullAccessAdminRole, isAdminRole, type AdminRole } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendAdminInvitationEmail, sendAdminRoleChangeEmail, sendAdminRemovalEmail } from "@/lib/admin/email";

export async function addAdminUser(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "rank-holders")) {
    return { error: "You do not have permission to manage admin users." };
  }

  const rawMemberId = formData.get("memberId");
  const rawRole = formData.get("role");

  if (typeof rawMemberId !== "string" || !rawMemberId) {
    return { error: "Please select a member." };
  }

  const memberId = Number(rawMemberId);
  if (!Number.isInteger(memberId)) {
    return { error: "Invalid member selection." };
  }

  if (typeof rawRole !== "string" || !isAdminRole(rawRole)) {
    return { error: "Please select a valid role." };
  }

  const role: AdminRole = rawRole;

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) {
    return { error: "Member not found." };
  }

  const [cadet] = await db
    .select({ intakeId: cadets.intakeId })
    .from(cadets)
    .where(eq(cadets.memberId, memberId))
    .limit(1);

  if (!cadet) {
    return { error: "Only cadets can be invited as admin users." };
  }

  if (intakeScope !== null && cadet.intakeId !== intakeScope) {
    return { error: "You can only invite cadets from your intake." };
  }

  const [existingAdmin] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.memberId, memberId))
    .limit(1);

  if (existingAdmin) {
    return { error: "This person is already an admin." };
  }

  const [existingInvitation] = await db
    .select({ id: adminInvitations.id })
    .from(adminInvitations)
    .where(
      and(
        eq(adminInvitations.memberId, memberId),
        isNull(adminInvitations.acceptedAt),
      ),
    )
    .limit(1);

  if (existingInvitation) {
    return { error: "This person already has a pending invitation." };
  }

  const email = member.eduEmail ?? member.personalEmail;
  if (!email) {
    return { error: "Member has no email on record." };
  }

  try {
    await db.insert(adminInvitations).values({
      memberId: member.id,
      email,
      role,
      intakeId: cadet.intakeId,
      invitedByAuthUserId: admin.authUserId,
    });
  } catch {
    return { error: "Failed to create invitation. A conflicting record may already exist." };
  }

  await db.insert(adminRoleAuditLogs).values({
    action: "INVITED",
    changedByAdminUserId: admin.authUserId,
    targetMemberName: member.name,
    newRole: role,
  });

  try {
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "";
    await sendAdminInvitationEmail({
      to: email,
      memberName: member.name,
      role,
      loginUrl: `${origin}/admin/login`,
    });
  } catch {
    // Email failure doesn't block — invitation record exists, email can be retried.
  }

  revalidatePath("/admin/secretary/rank-holders");
  return { success: true };
}

export async function changeAdminRole(formData: FormData) {
  const admin = await requireCurrentAdmin();

  if (!isFullAccessAdminRole(admin.role)) {
    return { error: "Only Officers and Instructors can change admin roles." };
  }

  const adminUserId = formData.get("adminUserId");
  const rawNewRole = formData.get("newRole");

  if (typeof adminUserId !== "string" || !adminUserId) {
    return { error: "Invalid admin user." };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUserId)) {
    return { error: "Invalid admin user." };
  }

  if (typeof rawNewRole !== "string" || !isAdminRole(rawNewRole)) {
    return { error: "Please select a valid role." };
  }

  const newRole: AdminRole = rawNewRole;

  const [target] = await db
    .select({
      id: adminUsers.id,
      authUserId: adminUsers.authUserId,
      role: adminUsers.role,
      email: adminUsers.email,
      memberName: members.name,
    })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .where(eq(adminUsers.id, adminUserId))
    .limit(1);

  if (!target) {
    return { error: "Admin user not found." };
  }

  if (target.id === admin.id) {
    return { error: "You cannot change your own role." };
  }

  if (target.role === newRole) {
    return { error: "The selected role is the same as the current role." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(adminUsers)
        .set({ role: newRole })
        .where(eq(adminUsers.id, adminUserId));

      if (target.role === "TREASURER" && newRole !== "TREASURER") {
        await tx
          .delete(treasuryAccounts)
          .where(eq(treasuryAccounts.treasurerId, adminUserId));
      }

      await tx.insert(adminRoleAuditLogs).values({
        action: "ROLE_CHANGED",
        changedByAdminUserId: admin.authUserId,
        targetAdminUserId: target.authUserId,
        targetMemberName: target.memberName,
        oldRole: target.role,
        newRole,
      });
    });
  } catch {
    return { error: "Failed to change role. Please try again." };
  }

  try {
    await sendAdminRoleChangeEmail({
      to: target.email,
      memberName: target.memberName,
      oldRole: target.role,
      newRole,
    });
  } catch {
    // Email failure doesn't block — role change is already persisted.
  }

  revalidatePath("/admin/secretary/rank-holders");
  return { success: true };
}

export async function dropAdminUser(formData: FormData) {
  const admin = await requireCurrentAdmin();
  const intakeScope = getIntakeScope(admin);

  if (!canAccessAdminModule(admin.role, "rank-holders")) {
    return { error: "You do not have permission to manage admin users." };
  }

  const adminUserId = formData.get("adminUserId");

  if (typeof adminUserId !== "string" || !adminUserId) {
    return { error: "Invalid admin user." };
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUserId)) {
    return { error: "Invalid admin user." };
  }

  if (adminUserId === admin.id) {
    return { error: "You cannot remove yourself." };
  }

  const [target] = await db
    .select({
      id: adminUsers.id,
      authUserId: adminUsers.authUserId,
      role: adminUsers.role,
      email: adminUsers.email,
      intakeId: adminUsers.intakeId,
      memberName: members.name,
    })
    .from(adminUsers)
    .innerJoin(members, eq(adminUsers.memberId, members.id))
    .where(eq(adminUsers.id, adminUserId))
    .limit(1);

  if (!target) {
    return { error: "Admin user not found." };
  }

  if (isFullAccessAdminRole(target.role) && !isFullAccessAdminRole(admin.role)) {
    return { error: "Only Officers and Instructors can remove full-access admins." };
  }

  if (intakeScope !== null && target.intakeId !== intakeScope) {
    return { error: "You can only remove admin users from your intake." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(adminRoleAuditLogs).values({
        action: "DROPPED",
        changedByAdminUserId: admin.authUserId,
        targetAdminUserId: target.authUserId,
        targetMemberName: target.memberName,
        oldRole: target.role,
      });

      await tx.delete(adminUsers).where(eq(adminUsers.id, adminUserId));
    });
  } catch {
    return { error: "Failed to remove admin user. Please try again." };
  }

  try {
    await sendAdminRemovalEmail({
      to: target.email,
      memberName: target.memberName,
      role: target.role,
    });
  } catch {
    // Email failure doesn't block — admin record is already removed.
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.auth.admin.deleteUser(target.authUserId);
  } catch {
    // Auth deletion failure doesn't block — the admin record is already removed.
  }

  revalidatePath("/admin/secretary/rank-holders");
  return { success: true };
}
