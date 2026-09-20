
// Removed "server-only" directive to allow import by seed script (db/seed.ts)
// which runs outside the Next.js server context.

import type {
  AssessmentGender,
  AssessmentRecordType,
  AssessmentStandard,
} from "./types";

function readThreshold(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

export function getAssessmentStandards(
  recordType: AssessmentRecordType,
  gender: AssessmentGender,
): AssessmentStandard[] {
  const isMale = gender === "MALE";

  if (recordType === "UKA") {
    const runMinutes = isMale
      ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_RUN_MALE, 12)
      : readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_RUN_FEMALE, 14);
    return [
      {
        key: "pushUp",
        label: "Push-up",
        unit: "count",
        direction: "min",
        threshold: isMale
          ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_PUSHUP_MALE, 40)
          : readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_PUSHUP_FEMALE, 40),
      },
      {
        key: "sitUp",
        label: "Sit-up",
        unit: "count",
        direction: "min",
        threshold: isMale
          ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_SITUP_MALE, 60)
          : readThreshold(process.env.NEXT_PUBLIC_SPORTS_UKA_SITUP_FEMALE, 40),
      },
      {
        key: "run",
        label: "2.4km Run",
        unit: "seconds",
        direction: "max",
        threshold: minutesToSeconds(runMinutes),
      },
    ];
  }

  const runMinutes = isMale
    ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_RUN_MALE, 6)
    : readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_RUN_FEMALE, 8);
  const floatingMinutes = isMale
    ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_FLOATING_MALE, 3)
    : readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_FLOATING_FEMALE, 2);

  return [
    {
      key: "run",
      label: "1.6km Run",
      unit: "seconds",
      direction: "max",
      threshold: minutesToSeconds(runMinutes),
    },
    {
      key: "pullUp",
      label: "Pull-up",
      unit: "count",
      direction: "min",
      threshold: isMale
        ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_PULLUP_MALE, 20)
        : readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_PULLUP_FEMALE, 10),
    },
    {
      key: "swimming",
      label: "Swimming",
      unit: "metres",
      direction: "min",
      threshold: isMale
        ? readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_SWIMMING_MALE, 100)
        : readThreshold(process.env.NEXT_PUBLIC_SPORTS_APFA_SWIMMING_FEMALE, 100),
    },
    {
      key: "floating",
      label: "Floating",
      unit: "seconds",
      direction: "min",
      threshold: minutesToSeconds(floatingMinutes),
    },
  ];
}

export function evaluatePass(value: number, standard: AssessmentStandard): boolean {
  return standard.direction === "min" ? value >= standard.threshold : value <= standard.threshold;
}
