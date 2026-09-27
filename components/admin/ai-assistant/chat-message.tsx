import { ToolStatus } from "@/components/admin/ai-assistant/tool-status";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type AdminChatMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt?: number;
  toolName?: string | null;
};

export function AdminChatMessage({
  message,
  copy,
  announce = false,
}: {
  message: AdminChatMessage;
  copy: Dictionary["aiAssistant"];
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
      {message.role === "assistant" && message.toolName && (
        <ToolStatus toolName={message.toolName} />
      )}
      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
      {message.createdAt && (
        <time
          className="mt-1 block text-right text-[0.65rem] text-muted-foreground"
          dateTime={new Date(message.createdAt).toISOString()}
        >
          {new Intl.DateTimeFormat("en", {
            hour: "numeric",
            minute: "2-digit",
          }).format(message.createdAt)}
        </time>
      )}
    </article>
  );
}
