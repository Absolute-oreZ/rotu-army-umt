"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function cadetSignInWithGoogle() {
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (!origin) {
    redirect("/cadet/login?error=missing-origin");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback/cadet?next=/cadet`,
    },
  });

  if (error || !data.url) {
    redirect("/cadet/login?error=oauth-start-failed");
  }

  redirect(data.url);
}
