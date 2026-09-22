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

export function takeFiles(values: FormDataEntryValue[]): File[] {
  return values.filter((value): value is File => value instanceof File && value.size > 0);
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
