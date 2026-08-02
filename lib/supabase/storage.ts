import "server-only";
import { getPublicEnv } from "@/lib/env/public";
import type { SupabaseClient } from "@supabase/supabase-js";

function bucket() {
  return getPublicEnv().supabaseStorageRootPath;
}

/**
 * Generate a short-lived signed URL for a private/sensitive object. Use this
 * instead of storageUrl for documents that must not be world-readable (receipts,
 * claims). Requires the service-role admin client and must run server-side only.
 */
export async function signedStorageUrl(
  supabase: SupabaseClient,
  path: string | null,
  expiresIn = 60,
): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket())
      .createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function uploadToStorage(
  supabase: SupabaseClient,
  file: File,
  path: string,
  contentType?: string,
): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error } = await supabase.storage
      .from(bucket())
      .upload(path, buffer, {
        contentType: contentType || file.type || "application/octet-stream",
        upsert: true,
      });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

export async function deleteFromStorage(supabase: SupabaseClient, path: string): Promise<void> {
  try {
    await supabase.storage.from(bucket()).remove([path]);
  } catch {
  }
}
