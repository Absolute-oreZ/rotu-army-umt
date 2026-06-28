import { getPublicEnv } from "@/lib/env/public";

export function storageUrl(path: string | null): string | null {
  if (!path) return null;
  const { supabaseUrl, supabaseStorageRootPath } = getPublicEnv();
  return `${supabaseUrl}/storage/v1/object/public/${supabaseStorageRootPath}/${path}`;
}

export function extractStoragePath(publicUrl: string): string | null {
  const rootPath = getPublicEnv().supabaseStorageRootPath;
  const marker = `/${rootPath}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
