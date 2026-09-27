import type { ModelCapabilities } from "@/lib/ai/core/provider";

const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  "google/gemma-4-31b-it:free": {
    supportsStructuredOutput: true,
    supportsStreaming: true,
    supportsToolCalling: true,
  },
};

export function getModelCapabilities(model: string) {
  return MODEL_CAPABILITIES[model] ?? null;
}

export function requireModelCapabilities(
  model: string,
  required: Array<keyof ModelCapabilities>,
) {
  const capabilities = getModelCapabilities(model);
  if (!capabilities) {
    throw new Error(
      `AI model capabilities are not declared for configured model: ${model}`,
    );
  }
  const missing = required.filter((capability) => !capabilities[capability]);
  if (missing.length) {
    throw new Error(
      `Configured AI model lacks required capabilities: ${missing.join(", ")}`,
    );
  }
  return capabilities;
}
