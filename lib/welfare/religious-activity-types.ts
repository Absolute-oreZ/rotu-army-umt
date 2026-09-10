import "server-only";

const DEFAULT_RELIGIOUS_ACTIVITY_TYPES = ["YASIN", "TAHLIL"];

export function getReligiousActivityTypes(): string[] {
  const raw = process.env.WELFARE_REGLIGIOUS_ACTIVITIES_TYPES;
  if (!raw) return DEFAULT_RELIGIOUS_ACTIVITY_TYPES;

  const parsed = Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  return parsed.length > 0 ? parsed : DEFAULT_RELIGIOUS_ACTIVITY_TYPES;
}
