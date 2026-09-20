export type UploadKind = "image" | "pdf";

export type DetectedFile = {
  kind: UploadKind;
  ext: "jpg" | "png" | "webp" | "pdf";
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const MAX_BYTES_BY_KIND: Record<UploadKind, number> = {
  image: MAX_IMAGE_BYTES,
  pdf: MAX_DOCUMENT_BYTES,
};

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

  return null;
}

export function describeAllowedKinds(kinds: readonly UploadKind[]): string {
  const allowsImage = kinds.includes("image");
  const allowsPdf = kinds.includes("pdf");

  if (allowsImage && allowsPdf) return "File must be a JPG, PNG, or WebP image or a PDF.";
  if (allowsPdf) return "File must be a PDF.";
  return "File must be a JPG, PNG, or WebP image.";
}

export function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}
