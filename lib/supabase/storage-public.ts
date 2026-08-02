import { getPublicEnv } from "@/lib/env/public";

/** Builds a public URL for an object in the configured public Supabase bucket. */
export function storageUrl(path: string): string {
  const { supabaseUrl, supabaseStorageRootPath } = getPublicEnv();
  const encodedPath = path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${supabaseStorageRootPath}/${encodedPath}`;
}

export function extractStoragePath(publicUrl: string): string | null {
  const rootPath = getPublicEnv().supabaseStorageRootPath;
  const marker = `/${rootPath}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(publicUrl.slice(index + marker.length));
}
