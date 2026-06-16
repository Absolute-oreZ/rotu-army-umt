import { getPublicEnv } from "@/lib/env/public";
import type { SupabaseClient } from "@supabase/supabase-js";

export function storageUrl(path: string | null): string | null {
  if (!path) return null;
  const { supabaseUrl, supabaseStorageRootPath } = getPublicEnv();
  return `${supabaseUrl}/storage/v1/object/public/${supabaseStorageRootPath}/${path}`;
}

function bucket() {
  return getPublicEnv().supabaseStorageRootPath;
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

export function getStoragePublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from(bucket()).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromStorage(supabase: SupabaseClient, path: string): Promise<void> {
  try {
    await supabase.storage.from(bucket()).remove([path]);
  } catch {
    // silent
  }
}

export function extractStoragePath(publicUrl: string): string | null {
  const rootPath = bucket();
  const marker = `/${rootPath}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
