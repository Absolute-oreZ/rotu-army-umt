import type { Locale } from "@/lib/i18n/config";

export type TranslationCandidate = {
  language: Locale;
  title: string;
  markdown: string;
};
const PLACEHOLDER =
  /\b(todo|tbd|lorem ipsum|replace this|translation pending|insert here)\b|\[(?:translation|placeholder)[^\]]*\]/i;
const LINKS = (markdown: string) =>
  markdown.match(/\[[^\]]+\]\(([^)]+)\)/g) ?? [];
const EN_WORDS = /\b(the|and|with|for|from|this|that|are|you|your)\b/gi;
const MS_WORDS =
  /\b(yang|dan|dengan|untuk|daripada|ini|adalah|boleh|tidak|akan|juga)\b/gi;

export function translationWarnings(versions: TranslationCandidate[]) {
  const warnings: Array<{ language: Locale; message: string }> = [];
  const expectedSections = Math.max(
    0,
    ...versions.map(
      (version) => (version.markdown.match(/^#{2,6}\s+/gm) ?? []).length,
    ),
  );
  for (const version of versions) {
    if (!version.title.trim())
      warnings.push({
        language: version.language,
        message: "Title is missing.",
      });
    const headingCount = (version.markdown.match(/^#{2,6}\s+/gm) ?? []).length;
    if (expectedSections > 0 && headingCount < expectedSections)
      warnings.push({
        language: version.language,
        message:
          "This translation appears to have fewer sections than another language version.",
      });
    if (PLACEHOLDER.test(version.markdown))
      warnings.push({
        language: version.language,
        message: "The content contains a placeholder or translation note.",
      });
    const links = LINKS(version.markdown);
    const expectedLinks = Math.max(
      0,
      ...versions.map((candidate) => LINKS(candidate.markdown).length),
    );
    if (links.length < expectedLinks)
      warnings.push({
        language: version.language,
        message:
          "Some links present in another language version may be missing.",
      });
    const body = version.markdown.replace(/^#{1,6}\s+.*$/gm, " ");
    if (version.language === "zh" && !/[\u3400-\u9fff]/u.test(body))
      warnings.push({
        language: version.language,
        message: "No Chinese-script content was detected.",
      });
    if (version.language === "ta" && !/[\u0b80-\u0bff]/u.test(body))
      warnings.push({
        language: version.language,
        message: "No Tamil-script content was detected.",
      });
    if (
      version.language === "ms" &&
      !MS_WORDS.test(body) &&
      EN_WORDS.test(body)
    )
      warnings.push({
        language: version.language,
        message:
          "This may contain English text rather than Malay; please review it.",
      });
    if (
      version.language === "en" &&
      !EN_WORDS.test(body) &&
      MS_WORDS.test(body)
    )
      warnings.push({
        language: version.language,
        message:
          "This may contain Malay text rather than English; please review it.",
      });
    EN_WORDS.lastIndex = 0;
    MS_WORDS.lastIndex = 0;
  }
  return warnings;
}
