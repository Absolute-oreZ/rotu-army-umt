import "server-only";
import { getIntakeScope, type CurrentAdmin } from "@/lib/admin/rbac";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import type { ConversationMessage } from "@/lib/ai/core/request";
import { validateAIAnswer } from "@/lib/ai/core/structured-output";
import type { AIStreamEvent } from "@/lib/ai/core/stream-events";
import {
  openRouterProvider,
  getAdminAIModel,
} from "@/lib/ai/provider/openrouter";
import {
  selectAdminTool,
  runAdminTool,
  getAdminToolLabel,
} from "@/lib/ai/admin/tools/registry";
import { ADMIN_SYSTEM_PROMPT } from "@/lib/ai/admin/prompts";
import { refusesPrivateQuery } from "@/lib/ai/admin/redaction";
import {
  logAIRequest,
  newAIRequestId,
  describeAIError,
  type AIRequestTelemetry,
} from "@/lib/ai/core/telemetry";

const REFUSAL =
  "I can provide authorized aggregate statistics, but this assistant does not retrieve full identity, bank, authentication, contact, or private file details.";
const NO_TOOL =
  "I can summarize authorized cadet, academic, intake, sports, welfare, and treasury statistics.";
const DENIED = "Your role does not have access to that operational data.";

function staticEvents(
  text: string,
  scopeLabel: string,
  toolName: string | null,
): AIStreamEvent[] {
  return [
    { type: "replace", text },
    { type: "metadata", scopeLabel, toolName },
    { type: "done" },
  ];
}

async function* answerEvents(
  admin: CurrentAdmin,
  question: string,
  messages: ConversationMessage[],
  telemetry: AIRequestTelemetry,
  signal: AbortSignal,
): AsyncGenerator<AIStreamEvent> {
  yield { type: "start" };
  const intakeScope = getIntakeScope(admin);
  const tool = selectAdminTool(question);
  telemetry.intent =
    tool?.name ??
    (refusesPrivateQuery(question) ? "PRIVATE_INFORMATION" : "NO_TOOL");
  const scopeLabel =
    tool?.name === "get_intake_statistics" && intakeScope === null
      ? "Global intake registry (Intakes module)"
      : intakeScope === null
        ? "All intakes allowed by your role"
        : `Assigned intake #${intakeScope}`;
  if (refusesPrivateQuery(question)) {
    yield* staticEvents(REFUSAL, scopeLabel, null);
    return;
  }
  // One deterministic tool per turn; AI_LIMITS.maxToolCallsPerTurn is the
  // server-side cap and is always 1.
  if (!tool || AI_LIMITS.maxToolCallsPerTurn < 1) {
    yield* staticEvents(NO_TOOL, scopeLabel, null);
    return;
  }

  const result = await runAdminTool(admin, tool, intakeScope, question);
  telemetry.sourceCount = result.allowed && result.data ? 1 : 0;
  if (!result.allowed || !result.data) {
    yield* staticEvents(DENIED, scopeLabel, null);
    return;
  }

  telemetry.model = getAdminAIModel();
  const llmStarted = Date.now();
  let completed = false;
  for await (const event of openRouterProvider.streamStructuredOutput(
    {
      model: telemetry.model,
      temperature: 0.1,
      maxTokens: AI_LIMITS.adminMaxOutputTokens,
      signal,
      messages: [
        { role: "system", content: ADMIN_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Recent conversation (context only):\n${messages
            .slice(-AI_LIMITS.conversationTurns * 2)
            .map((message) => `${message.role}: ${message.content}`)
            .join(
              "\n",
            )}\n\nCurrent request: ${question}\nScope enforced by application: ${scopeLabel}\nAuthorized tool: ${getAdminToolLabel(tool)}\nAggregate result: ${JSON.stringify(result.data)}\nReturn citations as an empty array.`,
        },
      ],
    },
    (value) =>
      validateAIAnswer(value, new Set(), AI_LIMITS.adminMaxOutputTokens),
  )) {
    if (event.type === "result") {
      completed = true;
      telemetry.promptTokens = event.promptTokens ?? null;
      telemetry.completionTokens = event.completionTokens ?? null;
      yield { type: "replace", text: event.output.answer };
    }
  }
  if (!completed)
    throw new Error("AI stream finished without validated output");
  telemetry.llmMs = Date.now() - llmStarted;
  yield { type: "metadata", scopeLabel, toolName: tool.name };
  yield { type: "done" };
}

export async function* streamAdminQuestion(
  admin: CurrentAdmin,
  question: string,
  messages: ConversationMessage[],
  signal: AbortSignal,
): AsyncGenerator<AIStreamEvent> {
  const telemetry: AIRequestTelemetry = {
    requestId: newAIRequestId(),
    assistant: "admin",
    locale: null,
    intent: null,
    retrievalMs: 0,
    llmMs: 0,
    sourceCount: 0,
    model: null,
    success: false,
  };
  try {
    yield* answerEvents(admin, question, messages, telemetry, signal);
    telemetry.success = !signal.aborted;
  } catch (error) {
    telemetry.failureReason = describeAIError(error);
    throw error;
  } finally {
    await logAIRequest(telemetry);
  }
}
