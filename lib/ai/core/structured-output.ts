import { AI_ERRORS } from "@/lib/ai/core/errors";

export type AIAnswer = {
  answer: string;
  citations: string[];
  usedCurrentInfo: boolean;
};

export function parseStructuredResponse<T>(
  content: string,
  validate: (value: unknown) => T,
) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(AI_ERRORS.invalidStructuredOutput);
  }
  return validate(parsed);
}

export function validateAIAnswer(
  value: unknown,
  validSourceIds: ReadonlySet<string>,
  maxOutputTokens: number,
): AIAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid AI answer");
  const candidate = value as Record<string, unknown>;
  if (
    Object.keys(candidate).some(
      (key) => !["answer", "citations", "usedCurrentInfo"].includes(key),
    )
  )
    throw new Error("Invalid AI answer fields");
  const answer = candidate.answer;
  const citations = candidate.citations;
  const cjkCharacters =
    typeof answer === "string"
      ? (answer.match(/[\u3400-\u9fff\u0b80-\u0bff]/gu) ?? []).length
      : 0;
  const otherCharacters =
    typeof answer === "string"
      ? Array.from(answer.replace(/[\u3400-\u9fff\u0b80-\u0bff]/gu, " ")).length
      : 0;
  const estimatedTokens = cjkCharacters + Math.ceil(otherCharacters / 3.6);
  if (
    typeof answer !== "string" ||
    !answer.trim() ||
    estimatedTokens > maxOutputTokens
  )
    throw new Error("Invalid AI answer");
  if (
    !Array.isArray(citations) ||
    !citations.every((id) => typeof id === "string")
  )
    throw new Error("Invalid AI citations");
  if (typeof candidate.usedCurrentInfo !== "boolean")
    throw new Error("Invalid AI metadata");
  return {
    answer: answer.trim(),
    citations: [
      ...new Set(
        citations.filter(
          (id): id is string =>
            typeof id === "string" && validSourceIds.has(id),
        ),
      ),
    ],
    usedCurrentInfo: candidate.usedCurrentInfo,
  };
}
