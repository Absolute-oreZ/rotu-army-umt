export type UploadKind = "image" | "pdf" | "video";

export type DetectedFile = {
  kind: UploadKind;
  ext: "jpg" | "png" | "webp" | "pdf" | "mp4" | "mov" | "webm" | "avi";
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "video/mp4" | "video/quicktime" | "video/webm" | "video/x-msvideo";
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const MAX_BYTES_BY_KIND: Record<UploadKind, number> = {
  image: MAX_IMAGE_BYTES,
  pdf: MAX_DOCUMENT_BYTES,
  video: MAX_VIDEO_BYTES,
};

export const EXTENSIONS_BY_KIND: Record<UploadKind, readonly string[]> = {
  image: ["jpg", "jpeg", "png", "webp"],
  pdf: ["pdf"],
  video: ["mp4", "mov", "webm", "avi"],
};

export const CONTENT_TYPES_BY_KIND: Record<UploadKind, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"],
};

export const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
};

export function normalizeExtension(extension: string): string {
  return extension.toLowerCase().replace(/^\./, "");
}

export function isAllowedExtension(extension: string, kinds: readonly UploadKind[]): boolean {
  const normalized = normalizeExtension(extension);
  return kinds.some((kind) => EXTENSIONS_BY_KIND[kind].includes(normalized));
}

export function isAllowedContentType(contentType: string, kinds: readonly UploadKind[]): boolean {
  const normalized = contentType.toLowerCase().split(";")[0].trim();
  return kinds.some((kind) => CONTENT_TYPES_BY_KIND[kind].includes(normalized));
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function hasBytes(bytes: Uint8Array, expected: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + expected.length) return false;
  return expected.every((value, index) => bytes[offset + index] === value);
}

function hasAscii(bytes: Uint8Array, text: string, offset = 0): boolean {
  return hasBytes(
    bytes,
    Array.from(text, (char) => char.charCodeAt(0)),
    offset,
  );
}

export function detectFileKind(bytes: Uint8Array): DetectedFile | null {
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) {
    return { kind: "image", ext: "jpg", contentType: "image/jpeg" };
  }

  if (hasBytes(bytes, PNG_SIGNATURE)) {
    return { kind: "image", ext: "png", contentType: "image/png" };
  }

  if (hasAscii(bytes, "RIFF") && hasAscii(bytes, "WEBP", 8)) {
    return { kind: "image", ext: "webp", contentType: "image/webp" };
  }

  if (hasAscii(bytes, "%PDF-")) {
    return { kind: "pdf", ext: "pdf", contentType: "application/pdf" };
  }

  // Video detection (MP4, MOV, WebM, AVI)
  if (hasAscii(bytes, "ftyp", 4)) {
    if (hasAscii(bytes, "qt  ", 8)) {
      return { kind: "video", ext: "mov", contentType: "video/quicktime" };
    }
    if (hasAscii(bytes, "webm", 8)) {
      return { kind: "video", ext: "webm", contentType: "video/webm" };
    }
    return { kind: "video", ext: "mp4", contentType: "video/mp4" };
  }

  if (hasBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { kind: "video", ext: "webm", contentType: "video/webm" };
  }

  if (hasAscii(bytes, "RIFF") && hasAscii(bytes, "AVI ", 8)) {
    return { kind: "video", ext: "avi", contentType: "video/x-msvideo" };
  }

  return null;
}

export function describeAllowedKinds(kinds: readonly UploadKind[]): string {
  const allowsImage = kinds.includes("image");
  const allowsPdf = kinds.includes("pdf");
  const allowsVideo = kinds.includes("video");

  if (allowsImage && allowsPdf && allowsVideo) return "File must be a JPG, PNG, or WebP image, a PDF, or a video (MP4, MOV, WebM, AVI).";
  if (allowsImage && allowsVideo) return "File must be a JPG, PNG, or WebP image or a video (MP4, MOV, WebM, AVI).";
  if (allowsImage && allowsPdf) return "File must be a JPG, PNG, or WebP image or a PDF.";
  if (allowsPdf) return "File must be a PDF.";
  if (allowsVideo) return "File must be a video (MP4, MOV, WebM, AVI).";
  return "File must be a JPG, PNG, or WebP image.";
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}
