"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (!origin) {
    redirect("/admin/login?error=missing-origin");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/admin`,
    },
  });

  if (error || !data.url) {
    redirect("/admin/login?error=oauth-start-failed");
  }

  redirect(data.url);
}
