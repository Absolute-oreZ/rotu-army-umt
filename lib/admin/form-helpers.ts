export function takeString(value: FormDataEntryValue | null): string | null {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return null;
}

export function takeNumber(value: FormDataEntryValue | null): number | null {
  const str = takeString(value);
  if (str === null) return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

export function takeFile(value: FormDataEntryValue | null): File | null {
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export function getFileExtension(file: File): string {
  const name = file.name;
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === name.length - 1) return "jpg";
  return name.slice(dotIndex + 1).toLowerCase();
}

/**
 * Strip every non-digit character from a string.
 * Use as an onChange sanitizer for numeric-only fields (army no, account no, etc).
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
