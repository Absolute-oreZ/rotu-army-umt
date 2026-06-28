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

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export type AllowedImageExtension = (typeof ALLOWED_IMAGE_EXTENSIONS)[number];

export function getFileExtension(file: File): string {
  const name = file.name;
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === name.length - 1) return "jpg";
  return name.slice(dotIndex + 1).toLowerCase();
}

/**
 * Return the file extension only if it is in the safe image allow-list,
 * otherwise null. Use instead of getFileExtension for user uploads so a
 * spoofed .svg/.html payload cannot be stored and served.
 */
export function getAllowedImageExtension(file: File): AllowedImageExtension | null {
  const ext = getFileExtension(file);
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as AllowedImageExtension)
    : null;
}

/**
 * Coerce a user-supplied money value to a 2-decimal string within sane bounds.
 * Returns null when the value is missing, non-finite, non-positive, or too large.
 * Guards against ledger corruption from absurd/negative self-reported amounts.
 */
export function sanitizeMoney(value: FormDataEntryValue | null, max = 1_000_000): string | null {
  const num = takeNumber(value);
  if (num === null || !Number.isFinite(num) || num <= 0 || num > max) return null;
  return (Math.round(num * 100) / 100).toFixed(2);
}

/**
 * Resolve the intake id a scoped admin may act on. For intake-scoped roles the
 * scope always wins (the client value is rejected if it disagrees). Returns the
 * validated intake id or an error string suitable for a server action response.
 */
export function resolveScopedIntakeId(
  formData: FormData,
  intakeScope: number | null,
): { ok: true; intakeId: number } | { ok: false; error: string } {
  const rawIntakeId = takeNumber(formData.get("intakeId"));
  const effectiveIntakeId = intakeScope !== null ? intakeScope : rawIntakeId;

  if (effectiveIntakeId === null || !Number.isInteger(effectiveIntakeId) || effectiveIntakeId <= 0) {
    return { ok: false, error: "Valid intake is required." };
  }

  if (intakeScope !== null && rawIntakeId !== null && rawIntakeId !== intakeScope) {
    return { ok: false, error: "You can only manage data from your intake." };
  }

  return { ok: true, intakeId: effectiveIntakeId };
}

/**
 * Guard for update/delete actions: confirm the row's intake matches the admin's
 * scope. Returns null when allowed, or an error string when the admin is scoped
 * and the row belongs to another intake.
 */
export function assertIntakeOwnership(
  rowIntakeId: number,
  intakeScope: number | null,
): string | null {
  if (intakeScope !== null && rowIntakeId !== intakeScope) {
    return "You can only manage data from your intake.";
  }
  return null;
}

/**
 * Strip every non-digit character from a string.
 * Use as an onChange sanitizer for numeric-only fields (army no, account no, etc).
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Sanitize a money/price input: keep digits and at most one decimal point,
 * strip everything else, and drop leading zeros (e.g. "007.5" -> "7.5").
 * Use as an onChange sanitizer for currency fields instead of digitsOnly,
 * which would strip the decimal and prevent cents.
 */
export function currencyOnly(value: string): string {
  let result = "";
  let hasDot = false;

  for (const char of value) {
    if (char >= "0" && char <= "9") {
      result += char;
    } else if (char === "." && !hasDot) {
      hasDot = true;
      result += char;
    }
  }

  return result.replace(/^0+(?=\d)/, "");
}
