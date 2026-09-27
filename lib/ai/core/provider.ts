export type ChatInput = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  webSearch?: {
    allowedDomains: string[];
    maxResults: number;
    maxTotalResults: number;
  };
  signal?: AbortSignal;
};

export type ModelCapabilities = {
  supportsStructuredOutput: boolean;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
};

export type ChatResult = {
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  webCitations: Array<{ url: string; title: string; content: string }>;
};

export type StructuredChatResult<T> = { output: T } & Pick<
  ChatResult,
  "promptTokens" | "completionTokens" | "webCitations"
>;

export type StructuredChatStreamEvent<T> =
  | { type: "delta"; text: string }
  | ({ type: "result" } & StructuredChatResult<T>);

export interface AIProvider {
  generateChat(input: ChatInput): Promise<ChatResult>;
  generateStructuredOutput<T>(
    input: ChatInput,
    validate: (value: unknown) => T,
  ): Promise<StructuredChatResult<T>>;
  streamStructuredOutput<T>(
    input: ChatInput,
    validate: (value: unknown) => T,
  ): AsyncGenerator<StructuredChatStreamEvent<T>>;
  generateEmbedding(
    texts: string[],
    inputType: "query" | "document",
  ): Promise<number[][]>;
}
