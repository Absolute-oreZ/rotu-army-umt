import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSafeStoragePath, resolveVisibility } from "@/lib/storage/visibility";
import { bucketFor } from "@/lib/supabase/storage";
import {
  CONTENT_TYPE_BY_EXTENSION,
  MAX_BYTES_BY_KIND,
  describeAllowedKinds,
  detectFileKind,
  formatMegabytes,
  isAllowedExtension,
  normalizeExtension,
  type UploadKind,
} from "@/lib/storage/files";

export interface UploadTicket {
  signedUrl: string;
  path: string;
  contentType: string | null;
  maxBytes: number;
  kinds: UploadKind[];
}

export interface CreateUploadTicketInput {
  supabase: SupabaseClient;
  prefix: string;
  filename: string;
  kinds: readonly UploadKind[];
  maxBytes?: number;
}

export interface VerifyUploadInput {
  path: string;
  kinds: readonly UploadKind[];
  maxBytes?: number;
}

const VERIFY_PREFIX_BYTES = 64 * 1024;

function isCompatibleExtension(path: string, detectedExt: string): boolean {
  const pathExtension = normalizeExtension(path.slice(path.lastIndexOf(".") + 1));
  const normalizedDetectedExt = normalizeExtension(detectedExt);
  if (normalizedDetectedExt === "jpg" && pathExtension === "jpeg") return true;
  if (normalizedDetectedExt === "jpeg" && pathExtension === "jpg") return true;
  return pathExtension === normalizedDetectedExt;
}

async function readVerificationPrefix(response: Response): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < VERIFY_PREFIX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = VERIFY_PREFIX_BYTES - total;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
      if (total >= VERIFY_PREFIX_BYTES) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const prefix = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    prefix.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return prefix;
}

function resolveMaxBytes(kinds: readonly UploadKind[], maxBytes?: number): number {
  const resolved = maxBytes ?? Math.max(...kinds.map((kind) => MAX_BYTES_BY_KIND[kind]));

  if (!Number.isFinite(resolved) || resolved <= 0) {
    throw new Error("Invalid upload size limit.");
  }

  return resolved;
}

export async function createUploadTicket(input: CreateUploadTicketInput): Promise<UploadTicket> {
  const { supabase, prefix, filename, kinds } = input;

  if (kinds.length === 0) {
    throw new Error("At least one upload kind is required.");
  }

  const maxBytes = resolveMaxBytes(kinds, input.maxBytes);
  const extension = normalizeExtension(filename.split(".").pop() ?? "");

  if (!isAllowedExtension(extension, kinds)) {
    throw new Error(describeAllowedKinds(kinds));
  }

  const path = `${prefix}/${randomUUID()}.${extension}`;

  assertSafeStoragePath(prefix);
  assertSafeStoragePath(path);

  const bucket = bucketFor(resolveVisibility(path));

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed upload URL: ${error?.message ?? "unknown error"}`);
  }

  return {
    signedUrl: data.signedUrl,
    path,
    contentType: CONTENT_TYPE_BY_EXTENSION[extension] ?? null,
    maxBytes,
    kinds: [...kinds],
  };
}

export async function verifyUpload(
  supabase: SupabaseClient,
  input: VerifyUploadInput,
): Promise<
  | { success: true; size: number | null; contentType: string | null }
  | { success: false; error: string }
> {
  const { path, kinds } = input;

  try {
    assertSafeStoragePath(path);
  } catch {
    return { success: false, error: "Invalid storage path." };
  }

  let maxBytes: number;
  try {
    maxBytes = resolveMaxBytes(kinds, input.maxBytes);
  } catch {
    return { success: false, error: "Invalid upload size limit." };
  }

  const separator = path.lastIndexOf("/");
  const directory = separator === -1 ? "" : path.slice(0, separator);
  const name = separator === -1 ? path : path.slice(separator + 1);

  try {
    const bucket = bucketFor(resolveVisibility(path));
    const { data, error } = await supabase.storage.from(bucket).list(directory, { search: name, limit: 1 });

    if (error) {
      console.error("Failed to list uploaded object", error);
      return { success: false, error: "Failed to verify upload. Please try again." };
    }

    const stored = data?.find((entry) => entry.name === name);

    if (!stored) {
      return { success: false, error: "Uploaded file was not found." };
    }

    const size = typeof stored.metadata?.size === "number" ? stored.metadata.size : null;
    if (size === null) {
      return { success: false, error: "Uploaded file size could not be verified." };
    }

    if (size > maxBytes) {
      return { success: false, error: `File must be under ${formatMegabytes(maxBytes)}.` };
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60);

    if (signedError || !signed?.signedUrl) {
      console.error("Failed to create upload verification URL", signedError);
      return { success: false, error: "Failed to verify upload. Please try again." };
    }

    const response = await fetch(signed.signedUrl, {
      headers: { Range: `bytes=0-${VERIFY_PREFIX_BYTES - 1}` },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to verify upload. Please try again." };
    }

    const detected = detectFileKind(await readVerificationPrefix(response));
    if (!detected || !kinds.includes(detected.kind) || !isCompatibleExtension(path, detected.ext)) {
      return { success: false, error: describeAllowedKinds(kinds) };
    }

    return { success: true, size, contentType: detected.contentType };
  } catch (error) {
    console.error("Upload verification failed", error);
    return { success: false, error: "Failed to verify upload. Please try again." };
  }
}

export async function deleteUpload(supabase: SupabaseClient, path: string): Promise<void> {
  try {
    assertSafeStoragePath(path);
    const bucket = bucketFor(resolveVisibility(path));
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.error("Failed to delete uploaded object", { path, message: error.message });
  } catch {
    console.error("Failed to delete uploaded object", { path });
  }
}