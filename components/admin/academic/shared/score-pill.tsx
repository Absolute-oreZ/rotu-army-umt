"use client";

import { getGpaTier, GPA_TIER_CLASSES } from "@/lib/academic/helpers";

type ScorePillProps = {
  score: number | null | undefined;
  className?: string;
};

export function ScorePill({ score, className }: ScorePillProps) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return <span className="font-mono text-muted-foreground">—</span>;
  }

  const tier = getGpaTier(score);
  const colorClass = GPA_TIER_CLASSES[tier];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold ${colorClass} ${
        className ?? ""
      }`}
    >
      {score.toFixed(2)}
    </span>
  );
}
