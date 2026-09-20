export type StorageVisibility = "public" | "private";

export const PUBLIC_STORAGE_PREFIXES = [
  "events",
  "hero-images",
  "images",
  "intakes",
  "placeholder",
  "religious-activities",
  "webapp",
] as const;

const MAX_STORAGE_PATH_LENGTH = 512;

export function assertSafeStoragePath(path: string): void {
  if (!path || path.length > MAX_STORAGE_PATH_LENGTH) {
    throw new Error("Invalid storage path length.");
  }

  if (path.startsWith("/") || path.includes("\\") || path.includes("\0")) {
    throw new Error("Invalid storage path.");
  }

  const segments = path.split("/");

  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error("Invalid storage path.");
  }
}

export function resolveVisibility(path: string): StorageVisibility {
  const firstSegment = path.split("/")[0] ?? "";

  return (PUBLIC_STORAGE_PREFIXES as readonly string[]).includes(firstSegment)
    ? "public"
    : "private";
}
