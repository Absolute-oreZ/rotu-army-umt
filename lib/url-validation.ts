export type UrlValidationOptions = {
  allowedSchemes?: string[];
  allowedHosts?: string[];
  allowRelative?: boolean;
};

export type UrlValidationResult = 
  | { success: true; url: URL }
  | { success: false; error: string };

const DEFAULT_ALLOWED_SCHEMES = ["http:", "https:"];

/**
 * Validates and normalizes a URL string.
 * Rejects dangerous schemes (javascript:, data:, vbscript:, etc.)
 * Optionally restricts to allowed hosts.
 */
export function validateUrl(
  input: string | null | undefined,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const { allowedSchemes = DEFAULT_ALLOWED_SCHEMES, allowedHosts, allowRelative = true } = options;

  if (!input || typeof input !== "string") {
    return { success: false, error: "URL is required" };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: "URL cannot be empty" };
  }

  // Reject javascript: and data: schemes immediately (before URL parsing)
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return { success: false, error: "Dangerous URL scheme not allowed" };
  }

  let parsed: URL;
  try {
    // Try to parse as absolute URL
    parsed = new URL(trimmed);
  } catch {
    if (allowRelative && trimmed.startsWith("/")) {
      // Valid relative path
      return { success: true, url: new URL(trimmed, "http://localhost") };
    }
    return { success: false, error: "Invalid URL format" };
  }

  // Validate scheme
  if (!allowedSchemes.includes(parsed.protocol)) {
    return { success: false, error: `URL scheme '${parsed.protocol}' not allowed` };
  }

  // Validate host if allowlist provided
  if (allowedHosts && allowedHosts.length > 0) {
    if (!allowedHosts.includes(parsed.hostname)) {
      return { success: false, error: `URL host '${parsed.hostname}' not allowed` };
    }
  }

  return { success: true, url: parsed };
}

/**
 * Validates a Google Maps embed URL specifically.
 * Only allows https://www.google.com/maps/embed/... or https://www.google.com/maps/...
 */
export function validateGoogleMapsEmbedUrl(input: string | null | undefined): UrlValidationResult {
  const result = validateUrl(input, {
    allowedSchemes: ["https:"],
    allowedHosts: ["www.google.com", "maps.google.com"],
    allowRelative: false,
  });

  if (!result.success) return result;

  // Additional check: must be a maps embed or maps path
  const pathname = result.url.pathname;
  if (!pathname.startsWith("/maps/")) {
    return { success: false, error: "Google Maps URL must start with /maps/" };
  }

  return result;
}

/**
 * Validates social media URLs for known platforms.
 */
export function validateSocialMediaUrl(
  input: string | null | undefined,
  platform: "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "linkedin"
): UrlValidationResult {
  const platformHosts: Record<string, string[]> = {
    facebook: ["www.facebook.com", "facebook.com", "m.facebook.com"],
    instagram: ["www.instagram.com", "instagram.com"],
    youtube: ["www.youtube.com", "youtube.com", "youtu.be"],
    tiktok: ["www.tiktok.com", "tiktok.com", "vt.tiktok.com"],
    x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
    linkedin: ["www.linkedin.com", "linkedin.com"],
  };

  return validateUrl(input, {
    allowedSchemes: ["https:"],
    allowedHosts: platformHosts[platform],
    allowRelative: false,
  });
}

/**
 * Sanitizes a URL for safe use in HTML attributes (href, src).
 * Returns the URL string if valid, or empty string if invalid.
 */
export function sanitizeUrlForHtml(
  input: string | null | undefined,
  options: UrlValidationOptions = {}
): string {
  const result = validateUrl(input, options);
  return result.success ? result.url.toString() : "";
}