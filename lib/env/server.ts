import "server-only";
import { getPublicEnv } from "@/lib/env/public";

export function getServerEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const supabasePrivateStorageRootPath = process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH;

  if (!databaseUrl || !supabaseSecretKey || !supabasePrivateStorageRootPath) {
    const missing: string[] = [];
    if (!databaseUrl) missing.push("DATABASE_URL");
    if (!supabaseSecretKey) missing.push("SUPABASE_SECRET_KEY");
    if (!supabasePrivateStorageRootPath) missing.push("NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH");
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  return {
    ...getPublicEnv(),
    databaseUrl,
    supabaseSecretKey,
    supabasePrivateStorageRootPath,
  };
}

