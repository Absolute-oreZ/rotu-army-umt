import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminUsers, adminInvitations, adminRoleAuditLogs, cadets, members } from "@/db/schema";
import { resolveAdminAccess } from "@/lib/admin/rbac";
import { isIntakeScopedRole } from "@/lib/admin/roles";

function isSafeNextPath(value: string | null, origin: string): string {
  if (!value) return "/admin";

  try {
    const parsed = new URL(value, origin);
    // Only allow same-origin redirects
    if (parsed.origin !== origin) return "/admin";
    // Only allow paths (no javascript:, data:, etc.)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "/admin";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/admin";
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = isSafeNextPath(requestUrl.searchParams.get("next"), requestUrl.origin);

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/login?error=auth-code-missing", requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(
      new URL("/admin/login?error=auth-exchange-failed", requestUrl.origin),
    );
  }

  const access = await resolveAdminAccess(user.id);

  if (access.status === "ok") {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  if (access.status === "inactive-cadet" || access.status === "missing-intake") {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`/admin/login?error=${access.status}`, requestUrl.origin),
    );
  }

  const userEmail = user.email?.toLowerCase();
  if (userEmail) {
    const [invitation] = await db
      .select({
        id: adminInvitations.id,
        memberId: adminInvitations.memberId,
        email: adminInvitations.email,
        role: adminInvitations.role,
        invitedByAuthUserId: adminInvitations.invitedByAuthUserId,
        memberName: members.name,
        memberRole: members.role,
        cadetId: cadets.id,
        cadetIsActive: cadets.isActive,
        cadetIntakeId: cadets.intakeId,
      })
      .from(adminInvitations)
      .leftJoin(members, eq(members.id, adminInvitations.memberId))
      .leftJoin(cadets, eq(cadets.memberId, adminInvitations.memberId))
      .where(
        and(
          eq(adminInvitations.email, userEmail),
          isNull(adminInvitations.acceptedAt),
        ),
      )
      .limit(1);

    if (invitation) {
      if (invitation.memberRole !== "CADET" || invitation.cadetId === null) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL("/admin/login?error=not-a-cadet", requestUrl.origin),
        );
      }

      if (invitation.cadetIsActive === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL("/admin/login?error=inactive-cadet", requestUrl.origin),
        );
      }

      const scoped = isIntakeScopedRole(invitation.role);
      const intakeId = scoped ? invitation.cadetIntakeId : null;

      if (scoped && intakeId === null) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL("/admin/login?error=missing-intake", requestUrl.origin),
        );
      }

      const memberName = invitation.memberName ?? "Unknown";

      await db.transaction(async (tx) => {
        await tx.insert(adminUsers).values({
          authUserId: user.id,
          memberId: invitation.memberId,
          email: invitation.email,
          role: invitation.role,
          intakeId,
          invitedByAuthUserId: invitation.invitedByAuthUserId,
        });

        await tx
          .update(adminInvitations)
          .set({ acceptedAt: new Date() })
          .where(eq(adminInvitations.id, invitation.id));

        await tx.insert(adminRoleAuditLogs).values({
          action: "ACCEPTED",
          changedByAdminUserId: user.id,
          targetAdminUserId: user.id,
          targetMemberName: memberName,
          newRole: invitation.role,
        });
      });

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/admin/login?error=not-authorized", requestUrl.origin),
  );
}

