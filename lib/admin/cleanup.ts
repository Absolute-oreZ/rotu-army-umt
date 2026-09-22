import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteManyFromStorage, saveImage, saveUpload } from "@/lib/supabase/storage";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Multi-step operation with automatic cleanup on failure.
 * 
 * Usage:
 * ```typescript
 * const result = await withCleanup(async (cleanup) => {
 *   const saved1 = await saveImage({...});
 *   cleanup.addUpload(saved1.path); // Will be deleted if later step fails
 *   
 *   const saved2 = await saveImage({...});
 *   cleanup.addUpload(saved2.path);
 *   
 *   await db.insert(...); // If this throws, both images are deleted
 *   
 *   cleanup.commit(); // Suppresses cleanup on success
 * });
 * ```
 */
export interface CleanupTracker {
  uploads: string[];
  obsolete: string[];
  addUpload(path: string | null | undefined): void;
  addObsolete(path: string | null | undefined): void;
  commit(): void;
  execute(supabase: SupabaseClient): Promise<void>;
}

export function createCleanupTracker(): CleanupTracker {
  const uploads: string[] = [];
  const obsolete: string[] = [];
  let committed = false;

  return {
    uploads,
    obsolete,
    addUpload(path: string | null | undefined) {
      if (path) uploads.push(path);
    },
    addObsolete(path: string | null | undefined) {
      if (path) obsolete.push(path);
    },
    commit() {
      committed = true;
    },
    async execute(supabase: SupabaseClient) {
      if (committed) return;
      await Promise.all([
        deleteManyFromStorage(supabase, uploads),
        deleteManyFromStorage(supabase, obsolete),
      ]);
    },
  };
}

/**
 * Execute a multi-step operation with automatic rollback of uploads on failure.
 * The cleanup runs for both uploads (new files) and obsolete (replaced files).
 */
export async function withCleanup<T>(
  operation: (cleanup: CleanupTracker) => Promise<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const supabase = createSupabaseAdminClient();
  const cleanup = createCleanupTracker();

  try {
    const data = await operation(cleanup);
    cleanup.commit();
    return { success: true, data };
  } catch (err) {
    console.error("Operation failed after upload cleanup", err);
    try {
      await cleanup.execute(supabase);
    } catch {
      console.error("Cleanup failed after operation error:", err);
    }
    return { success: false, error: "Failed to complete the operation." };
  }
}

/**
 * Wrapper for saveImage that auto-registers with cleanup tracker.
 */
export async function saveImageWithCleanup(
  cleanup: CleanupTracker,
  params: Parameters<typeof saveImage>[0],
): Promise<ReturnType<typeof saveImage>> {
  const result = await saveImage(params);
  if (result.ok) {
    cleanup.addUpload(result.path);
  }
  return result;
}

/**
 * Wrapper for saveUpload that auto-registers with cleanup tracker.
 */
export async function saveUploadWithCleanup(
  cleanup: CleanupTracker,
  params: Parameters<typeof saveUpload>[0],
): Promise<ReturnType<typeof saveUpload>> {
  const result = await saveUpload(params);
  if (result.ok) {
    cleanup.addUpload(result.path);
  }
  return result;
}

/**
 * Wrapper for saveDocument that auto-registers with cleanup tracker.
 */
export async function saveDocumentWithCleanup(
  cleanup: CleanupTracker,
  params: Parameters<typeof saveUpload>[0], // saveDocument has same signature as saveUpload
): Promise<ReturnType<typeof saveUpload>> {
  const result = await saveUpload(params);
  if (result.ok) {
    cleanup.addUpload(result.path);
  }
  return result;
}