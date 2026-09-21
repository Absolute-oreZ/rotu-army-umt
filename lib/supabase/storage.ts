import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";
import {
  assertSafeStoragePath,
  resolveVisibility,
  type StorageVisibility,
} from "@/lib/storage/visibility";
import {
  MAX_BYTES_BY_KIND,
  describeAllowedKinds,
  detectFileKind,
  formatMegabytes,
  type UploadKind,
} from "@/lib/storage/files";

export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60;

export const SIGNED_URL_TTL_BY_PURPOSE = {
  // Short TTL for sensitive operations
  verification: 60,
  // Medium TTL for document viewing (1 hour)
  document: 3600,
  // Long TTL for QR codes and images in lists (1 day)
  image: 86400,
} as const;

export function bucketFor(visibility: StorageVisibility): string {
  return visibility === "private"
    ? getServerEnv().supabasePrivateStorageRootPath
    : getPublicEnv().supabaseStorageRootPath;
}

function bucketForPath(path: string): string {
  assertSafeStoragePath(path);
  return bucketFor(resolveVisibility(path));
}

/**
 * Generate a short-lived signed URL for a private/sensitive object. Use this
 * instead of storageUrl for documents that must not be world-readable (receipts,
 * claims). Requires the service-role admin client and must run server-side only.
 */
export async function signedStorageUrl(
  supabase: SupabaseClient,
  path: string | null,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
  purpose?: keyof typeof SIGNED_URL_TTL_BY_PURPOSE,
): Promise<string | null> {
  if (!path) return null;
  
  // Use purpose-based TTL if provided
  const ttl = purpose ? SIGNED_URL_TTL_BY_PURPOSE[purpose] : expiresIn;
  
  try {
    const { data, error } = await supabase
      .storage
      .from(bucketForPath(path))
      .createSignedUrl(path, ttl);
    if (error || !data?.signedUrl) {
      const message = error?.message ?? "Empty signed URL";
      console.error(`Storage signing failed for "${path}": ${message}`);
      return null;
    }
    return data.signedUrl;
  } catch (error) {
    console.error(`Storage signing failed for "${path}": ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
  }
}

export async function deleteFromStorage(supabase: SupabaseClient, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucketForPath(path)).remove([path]);
    if (error) console.error("Storage deletion failed", { path, message: error.message });
  } catch (error) {
    console.error("Storage deletion failed", { path, message: error instanceof Error ? error.message : "Unknown error" });
  }
}

export async function deleteManyFromStorage(
  supabase: SupabaseClient,
  paths: ReadonlyArray<string | null | undefined>,
): Promise<void> {
  const byBucket = new Map<string, string[]>();

  for (const path of paths) {
    if (!path) continue;
    try {
      const bucket = bucketForPath(path);
      byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
    } catch (error) {
      console.error("Storage deletion skipped", { path, message: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  for (const [bucket, bucketPaths] of byBucket) {
    try {
      const { error } = await supabase.storage.from(bucket).remove(bucketPaths);
      if (error) {
        console.error("Storage deletion failed", { bucket, count: bucketPaths.length, message: error.message });
      }
    } catch (error) {
      console.error("Storage deletion failed", { bucket, count: bucketPaths.length, message: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}

/**
 * Batch signed URLs for multiple paths. Uses Supabase's createSignedUrls for efficiency.
 * All paths must be in the same bucket (same visibility).
 */
export async function batchSignedStorageUrls(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<(string | null)[]> {
  const validPaths = paths.filter((p): p is string => !!p);
  if (validPaths.length === 0) return paths.map(() => null);

  // Group paths by bucket (visibility)
  const pathsByBucket = new Map<string, string[]>();
  for (const path of validPaths) {
    try {
      const bucket = bucketForPath(path);
      if (!pathsByBucket.has(bucket)) pathsByBucket.set(bucket, []);
      pathsByBucket.get(bucket)!.push(path);
    } catch {
      // Invalid path - will return null for this entry
    }
  }

  const resultMap = new Map<string, string | null>();

  for (const [bucket, bucketPaths] of pathsByBucket) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(bucketPaths, expiresIn);

      if (error || !data) {
        console.error(`Batch signing failed for bucket ${bucket}:`, error?.message);
        for (const path of bucketPaths) resultMap.set(path, null);
      } else {
              for (const item of data) {
                if (item.path) {
                  resultMap.set(item.path, item.signedUrl ?? null);
                }
              }
            }
    } catch (error) {
      console.error(`Batch signing failed for bucket ${bucket}:`, error instanceof Error ? error.message : "Unknown error");
      for (const path of bucketPaths) resultMap.set(path, null);
    }
  }

  // Return results in original order
  return paths.map((path) => (path ? resultMap.get(path) ?? null : null));
}

export type SaveUploadInput = {
  supabase: SupabaseClient;
  file: File;
  prefix: string;
  stem?: string;
  kinds: readonly UploadKind[];
  maxBytes?: number;
};

export type SaveUploadResult =
  | { ok: true; path: string; contentType: string; size: number }
  | { ok: false; error: string };

function sanitizeStem(stem: string | undefined): string {
  const cleaned = (stem ?? "file")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.slice(0, 40) || "file";
}

function defaultMaxBytes(kinds: readonly UploadKind[]): number {
  return Math.max(...kinds.map((kind) => MAX_BYTES_BY_KIND[kind]));
}

export async function saveUpload(input: SaveUploadInput): Promise<SaveUploadResult> {
  const { supabase, file, prefix, kinds } = input;
  const maxBytes = input.maxBytes ?? defaultMaxBytes(kinds);

  if (kinds.length === 0) {
    throw new Error("saveUpload requires at least one allowed file kind.");
  }

  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new Error("maxBytes must be a positive finite number.");
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "A file is required." };
  }

  if (file.size > maxBytes) {
    return { ok: false, error: `File must be under ${formatMegabytes(maxBytes)}.` };
  }

  try {
    assertSafeStoragePath(prefix);
  } catch {
    return { ok: false, error: "Invalid storage location." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (bytes.byteLength > maxBytes) {
      return { ok: false, error: `File must be under ${formatMegabytes(maxBytes)}.` };
    }

    const detected = detectFileKind(bytes);

    if (!detected || !kinds.includes(detected.kind)) {
      return { ok: false, error: describeAllowedKinds(kinds) };
    }

    const path = `${prefix}/${sanitizeStem(input.stem)}-${randomUUID()}.${detected.ext}`;
    assertSafeStoragePath(path);

    const visibility = resolveVisibility(path);

    const { error } = await supabase.storage
      .from(bucketFor(visibility))
      .upload(path, Buffer.from(bytes), {
        contentType: detected.contentType,
        upsert: false,
        cacheControl: visibility === "public" ? "31536000" : "3600",
      });

    if (error) {
      console.error("Storage upload failed", { path, message: error.message });
      return { ok: false, error: "Failed to upload file." };
    }

    return { ok: true, path, contentType: detected.contentType, size: bytes.byteLength };
  } catch (error) {
    console.error("Storage upload failed", { prefix, message: error instanceof Error ? error.message : "Unknown error" });
    return { ok: false, error: "Failed to upload file." };
  }
}

export function saveImage(input: Omit<SaveUploadInput, "kinds">): Promise<SaveUploadResult> {
  return saveUpload({ ...input, kinds: ["image"] });
}

export function saveDocument(input: Omit<SaveUploadInput, "kinds">): Promise<SaveUploadResult> {
  return saveUpload({ ...input, kinds: ["pdf"] });
}

