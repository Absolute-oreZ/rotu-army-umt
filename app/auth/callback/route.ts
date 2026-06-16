import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { adminUsers, adminInvitations, adminRoleAuditLogs, members } from "@/db/schema";

function getSafeNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

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

  const [admin] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.authUserId, user.id))
    .limit(1);

  if (admin) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const userEmail = user.email?.toLowerCase();
  if (userEmail) {
    const [invitation] = await db
      .select({
        id: adminInvitations.id,
        memberId: adminInvitations.memberId,
        email: adminInvitations.email,
        role: adminInvitations.role,
        intakeId: adminInvitations.intakeId,
        invitedByAuthUserId: adminInvitations.invitedByAuthUserId,
        memberName: members.name,
      })
      .from(adminInvitations)
      .innerJoin(members, eq(members.id, adminInvitations.memberId))
      .where(
        and(
          eq(adminInvitations.email, userEmail),
          isNull(adminInvitations.acceptedAt),
        ),
      )
      .limit(1);

    if (invitation) {
      await db.transaction(async (tx) => {
        await tx.insert(adminUsers).values({
          authUserId: user.id,
          memberId: invitation.memberId,
          email: invitation.email,
          role: invitation.role,
          intakeId: invitation.intakeId,
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
          targetMemberName: invitation.memberName,
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
