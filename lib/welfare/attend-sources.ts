import "server-only";

const DEFAULT_ATTEND_SOURCES = ["RSAK", "PKU", "HOSPITAL", "OTHER"];

export function getAttendSources(): string[] {
  const raw = process.env.WELFARE_ATTEND_SOURCES;
  if (!raw) return DEFAULT_ATTEND_SOURCES;

  const parsed = Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  return parsed.length > 0 ? parsed : DEFAULT_ATTEND_SOURCES;
}