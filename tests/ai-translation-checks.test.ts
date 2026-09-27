import assert from "node:assert/strict";
import test from "node:test";
import { translationWarnings } from "../lib/ai/knowledge/translation-checks";

test("translation review warns about missing sections, placeholders, and script mismatch", () => {
  const warnings = translationWarnings([
    {
      language: "en",
      title: "Joining",
      markdown:
        "# Joining\n\n## Eligibility\n\nApplicants should review the official notice.\n\n## Process\n\n[Apply](https://example.org/apply)",
    },
    {
      language: "zh",
      title: "加入",
      markdown: "# 加入\n\n## TODO\n\nTranslation pending.",
    },
  ]);
  assert.ok(
    warnings.some(
      (warning) =>
        warning.language === "zh" && /fewer sections/u.test(warning.message),
    ),
  );
  assert.ok(
    warnings.some(
      (warning) =>
        warning.language === "zh" && /placeholder/u.test(warning.message),
    ),
  );
  assert.ok(
    warnings.some(
      (warning) =>
        warning.language === "zh" && /Chinese-script/u.test(warning.message),
    ),
  );
  assert.ok(
    warnings.some(
      (warning) => warning.language === "zh" && /links/u.test(warning.message),
    ),
  );
});
