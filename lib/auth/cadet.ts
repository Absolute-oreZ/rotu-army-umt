import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cadets, members } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentCadet = {
  authUserId: string;
  email: string;
  memberId: number;
  name: string;
  intakeId: number;
};

export async function getCurrentCadet(): Promise<CurrentCadet | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const email = user.email?.toLowerCase();
  const emailVerified = user.email_confirmed_at || user.user_metadata?.email_verified;
  if (!email || !email.endsWith("@ocean.umt.edu.my") || !emailVerified) {
    return null;
  }

  const [member] = await db
    .select({
      id: members.id,
      name: members.name,
      role: members.role,
    })
    .from(members)
    .where(eq(members.eduEmail, email))
    .limit(1);

  if (!member || member.role !== "CADET") {
    return null;
  }

  const [cadet] = await db
    .select({ intakeId: cadets.intakeId })
    .from(cadets)
    .where(eq(cadets.memberId, member.id))
    .limit(1);

  if (!cadet) {
    return null;
  }

  return {
    authUserId: user.id,
    email,
    memberId: member.id,
    name: member.name,
    intakeId: cadet.intakeId,
  };
}

export async function requireCurrentCadet(): Promise<CurrentCadet> {
  const cadet = await getCurrentCadet();

  if (!cadet) {
    redirect("/cadet/login");
  }

  return cadet;
}
