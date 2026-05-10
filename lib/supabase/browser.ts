import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  const { supabasePublishableKey, supabaseUrl } = getPublicEnv();

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
