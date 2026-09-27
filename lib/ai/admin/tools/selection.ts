export type DetectableTool = { name: string; detect: RegExp };

export function selectBestAdminTool<T extends DetectableTool>(
  question: string,
  tools: T[],
) {
  const intakeCurrentIntent =
    /\b(new intake|intake deadline|application deadline|closing date|application dates)\b/i.test(
      question,
    );
  const scored = tools
    .map((entry) => ({
      entry,
      score:
        Number(entry.detect.test(question)) +
        Number(entry.name === "get_intake_statistics" && intakeCurrentIntent) *
          3,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(a.entry.name === "get_intake_statistics") -
          Number(b.entry.name === "get_intake_statistics"),
    );
  return scored[0]?.entry ?? null;
}
