export type EnvSource = Record<string, string | undefined>;

export type EnvIssue = {
  key: string;
  message: string;
};

export type EnvCheckOptions = {
  production: boolean;
};

export const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_STORAGE_ROOT_PATH",
] as const;

export const PRODUCTION_REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_RESEND_FROM_EMAIL",
  "CRON_SECRET",
  "NEWSLETTER_UNSUBSCRIBE_SECRET",
] as const;

export const THRESHOLD_ENV_KEYS = [
  "NEXT_PUBLIC_SPORTS_UKA_RUN_MALE",
  "NEXT_PUBLIC_SPORTS_UKA_RUN_FEMALE",
  "NEXT_PUBLIC_SPORTS_UKA_PUSHUP_MALE",
  "NEXT_PUBLIC_SPORTS_UKA_PUSHUP_FEMALE",
  "NEXT_PUBLIC_SPORTS_UKA_SITUP_MALE",
  "NEXT_PUBLIC_SPORTS_UKA_SITUP_FEMALE",
  "NEXT_PUBLIC_SPORTS_APFA_RUN_MALE",
  "NEXT_PUBLIC_SPORTS_APFA_RUN_FEMALE",
  "NEXT_PUBLIC_SPORTS_APFA_PULLUP_MALE",
  "NEXT_PUBLIC_SPORTS_APFA_PULLUP_FEMALE",
  "NEXT_PUBLIC_SPORTS_APFA_SWIMMING_MALE",
  "NEXT_PUBLIC_SPORTS_APFA_SWIMMING_FEMALE",
  "NEXT_PUBLIC_SPORTS_APFA_FLOATING_MALE",
  "NEXT_PUBLIC_SPORTS_APFA_FLOATING_FEMALE",
] as const;

export const LIST_ENV_KEYS = [
  "NEXT_PUBLIC_WELFARE_ATTEND_SOURCES",
  "NEXT_PUBLIC_WELFARE_REGLIGIOUS_ACTIVITIES_TYPES",
] as const;

const MIN_SECRET_LENGTH = 32;

const FROM_EMAIL_PATTERN =
  /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

function read(env: EnvSource, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isHttpUrl(url: URL | null): url is URL {
  return url !== null && (url.protocol === "http:" || url.protocol === "https:");
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export function collectEnvIssues(env: EnvSource, options: EnvCheckOptions): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const push = (key: string, message: string) => {
    issues.push({ key, message });
  };

  for (const key of REQUIRED_ENV_KEYS) {
    if (!read(env, key)) push(key, "is required");
  }

  if (options.production) {
    for (const key of PRODUCTION_REQUIRED_ENV_KEYS) {
      if (!read(env, key)) push(key, "is required in production");
    }
  }

  const supabaseUrl = read(env, "NEXT_PUBLIC_SUPABASE_URL");
  if (supabaseUrl && !isHttpUrl(parseUrl(supabaseUrl))) {
    push("NEXT_PUBLIC_SUPABASE_URL", "must be a valid http(s) URL");
  }

  const publicBucket = read(env, "NEXT_PUBLIC_SUPABASE_STORAGE_ROOT_PATH");
  const privateBucket = read(env, "NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH");
  if (publicBucket && privateBucket && publicBucket === privateBucket) {
    push(
      "NEXT_PUBLIC_SUPABASE_PRIVATE_STORAGE_ROOT_PATH",
      "must name a different bucket than NEXT_PUBLIC_SUPABASE_STORAGE_ROOT_PATH",
    );
  }

  const siteUrl = read(env, "NEXT_PUBLIC_SITE_URL");
  if (siteUrl) {
    const parsed = parseUrl(siteUrl);
    if (!isHttpUrl(parsed)) {
      push("NEXT_PUBLIC_SITE_URL", "must be a valid http(s) URL");
    } else if (options.production && (parsed.protocol !== "https:" || isLocalHostname(parsed.hostname))) {
      push("NEXT_PUBLIC_SITE_URL", "must be a public https URL in production");
    }
  }

  const cronSecret = read(env, "CRON_SECRET");
  const unsubscribeSecret = read(env, "NEWSLETTER_UNSUBSCRIBE_SECRET");
  if (cronSecret && cronSecret.length < MIN_SECRET_LENGTH) {
    push("CRON_SECRET", `must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (unsubscribeSecret && unsubscribeSecret.length < MIN_SECRET_LENGTH) {
    push("NEWSLETTER_UNSUBSCRIBE_SECRET", `must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (cronSecret && unsubscribeSecret && cronSecret === unsubscribeSecret) {
    push("NEWSLETTER_UNSUBSCRIBE_SECRET", "must differ from CRON_SECRET");
  }

  const fromEmail = read(env, "NEXT_PUBLIC_RESEND_FROM_EMAIL");
  if (fromEmail && !FROM_EMAIL_PATTERN.test(fromEmail)) {
    push("NEXT_PUBLIC_RESEND_FROM_EMAIL", 'must look like "Name <address@example.com>" or "address@example.com"');
  }

  for (const key of THRESHOLD_ENV_KEYS) {
    const raw = read(env, key);
    if (raw === undefined) continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      push(key, "must be a positive number");
    }
  }

  for (const key of LIST_ENV_KEYS) {
    const raw = read(env, key);
    if (raw === undefined) continue;
    const items = raw.split(",").map((item) => item.trim()).filter(Boolean);
    if (items.length === 0) {
      push(key, "must contain at least one comma-separated value");
    }
  }

  return issues;
}
