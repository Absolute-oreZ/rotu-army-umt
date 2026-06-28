import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { cadets, members } from "@/db/schema";

function getSafeNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/cadet";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/cadet/login?error=auth-code-missing", requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(
      new URL("/cadet/login?error=auth-exchange-failed", requestUrl.origin),
    );
  }

  const email = user.email?.toLowerCase();
  const emailVerified = user.email_confirmed_at || user.user_metadata?.email_verified;
  if (!email || !email.endsWith("@ocean.umt.edu.my") || !emailVerified) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/cadet/login?error=not-umt-email", requestUrl.origin),
    );
  }

  const [member] = await db
    .select({ id: members.id, role: members.role })
    .from(members)
    .where(eq(members.eduEmail, email))
    .limit(1);

  if (!member) {
    return NextResponse.redirect(
      new URL("/cadet/login?error=member-not-found", requestUrl.origin),
    );
  }

  if (member.role !== "CADET") {
    return NextResponse.redirect(
      new URL("/cadet/login?error=not-a-cadet", requestUrl.origin),
    );
  }

  const [cadet] = await db
    .select({ id: cadets.id })
    .from(cadets)
    .where(eq(cadets.memberId, member.id))
    .limit(1);

  if (!cadet) {
    return NextResponse.redirect(
      new URL("/cadet/login?error=member-not-found", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
