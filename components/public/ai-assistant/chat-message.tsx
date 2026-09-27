import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PublicSource } from "@/lib/ai/core/types";
import type { Locale } from "@/lib/i18n/config";
import { SourceList } from "@/components/public/ai-assistant/source-list";

export type PublicChatMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt?: number;
  sources?: PublicSource[];
  crossLanguage?: boolean;
};

export function PublicChatMessage({
  message,
  copy,
  locale,
  announce = false,
}: {
  message: PublicChatMessage;
  copy: Dictionary["aiAssistant"];
  locale: Locale;
  announce?: boolean;
}) {
  return (
    <article
      aria-label={
        message.role === "assistant" ? copy.assistantLabel : undefined
      }
      aria-live={announce ? "polite" : "off"}
      className={`max-w-[92%] rounded-sm border px-3 py-2 text-sm ${message.role === "user" ? "ml-auto border-transparent bg-muted text-foreground" : "mr-auto border-border bg-card"}`}
    >
      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
      {message.createdAt && (
        <time
          className="mt-1 block text-right text-[0.65rem] text-muted-foreground"
          dateTime={new Date(message.createdAt).toISOString()}
        >
          {new Intl.DateTimeFormat(locale, {
            hour: "numeric",
            minute: "2-digit",
          }).format(message.createdAt)}
        </time>
      )}
      {message.crossLanguage && (
        <p className="mt-2 text-xs opacity-75">{copy.crossLanguage}</p>
      )}
      {message.sources && <SourceList copy={copy} sources={message.sources} />}
    </article>
  );
}
