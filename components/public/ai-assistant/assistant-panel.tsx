"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  MessageCircleIcon,
  SendIcon,
  XIcon,
  ArrowDownIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AI_LIMITS } from "@/lib/ai/core/limits";
import {
  PublicChatMessage,
  type PublicChatMessage as Message,
} from "@/components/public/ai-assistant/chat-message";
import { useAssistantConversation } from "@/components/ai-assistant/use-assistant-conversation";
import { PublicSuggestionChips } from "@/components/public/ai-assistant/suggestion-chips";
import { readAssistantEventStream } from "@/components/ai-assistant/read-event-stream";

type AssistantCopy = Dictionary["aiAssistant"];

export function AssistantPanel({
  locale,
  copy,
}: {
  locale: Locale;
  copy: AssistantCopy;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const {
    messages,
    setMessages,
    showJump,
    unread,
    listRef,
    bottomRef,
    handleScroll,
    jumpToLatest,
    newChat: resetConversation,
  } = useAssistantConversation<Message>(copy.greeting, busy, open);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const turnCount = messages.filter(
    (message) => message.role === "user",
  ).length;
  const turnLimitReached = turnCount >= AI_LIMITS.conversationTurns;

  function newChat() {
    requestRef.current?.abort();
    requestRef.current = null;
    resetConversation();
    setQuestion("");
  }

  async function sendQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || busy || turnLimitReached) return;
    setQuestion("");
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed, createdAt: Date.now() },
      { role: "assistant", text: "", createdAt: Date.now(), sources: [] },
    ]);
    const messageIndex = messages.length + 1;
    setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/ai/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          locale,
          messages: [
            ...messages
              .slice(1)
              .filter((message) => message.text.trim())
              .map((message) => ({
                role: message.role,
                content: message.text,
              })),
            { role: "user", content: trimmed },
          ].slice(-AI_LIMITS.conversationTurns * 2),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("assistant unavailable");
      await readAssistantEventStream(response, (event) => {
        setMessages((current) =>
          current.map((message, index) => {
            if (index !== messageIndex || message.role !== "assistant")
              return message;
            if (event.type === "delta")
              return { ...message, text: message.text + event.text };
            if (event.type === "replace")
              return { ...message, text: event.text, sources: [] };
            if (event.type === "sources")
              return {
                ...message,
                sources: event.sources,
                crossLanguage: event.crossLanguage,
              };
            return message;
          }),
        );
      });
    } catch {
      if (!controller.signal.aborted)
        setMessages((current) =>
          current.map((message, index) =>
            index === messageIndex && message.role === "assistant"
              ? { ...message, text: copy.error, sources: [] }
              : message,
          ),
        );
    } finally {
      if (controller.signal.aborted)
        setMessages((current) =>
          current.filter(
            (message, index) =>
              index !== messageIndex ||
              message.role !== "assistant" ||
              message.text.length > 0,
          ),
        );
      if (requestRef.current === controller) requestRef.current = null;
      setBusy(false);
      if (!controller.signal.aborted) inputRef.current?.focus();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      requestRef.current?.abort();
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (event.key !== "Tab") return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggle() {
    if (open) {
      requestRef.current?.abort();
      setOpen(false);
      triggerRef.current?.focus();
    } else {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  return (
    <div className="ai-assistant">
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
          onClick={() => {
            requestRef.current?.abort();
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
      {open && (
        <section
          aria-labelledby="public-assistant-title"
          aria-modal="true"
          className="ai-assistant fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-t-xl border border-border bg-background text-foreground shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-7rem))] sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-lg"
          onKeyDown={handleDialogKeyDown}
          role="dialog"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground"
              >
                A
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold" id="public-assistant-title">
                  {copy.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.role}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                aria-label={copy.newChat}
                className="size-9"
                onClick={newChat}
                size="icon"
                title={copy.newChat}
                variant="ghost"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
              <Button
                aria-label={copy.close}
                className="size-9"
                onClick={toggle}
                size="icon"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </header>
          <div
            aria-live="off"
            className="relative flex min-h-0 flex-1 flex-col"
          >
            <div
              className="flex-1 space-y-3 overflow-y-auto p-4"
              onScroll={handleScroll}
              ref={listRef}
            >
              <div className="flex min-h-full flex-col justify-end gap-3">
                {messages.map((message, index) => (
                  <PublicChatMessage
                    copy={copy}
                    key={`${message.role}-${index}`}
                    locale={locale}
                    message={message}
                    announce={
                      busy &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
                {messages.length === 1 && (
                  <PublicSuggestionChips
                    onSelect={(suggestion) => void sendQuestion(suggestion)}
                    suggestions={copy.suggestions}
                  />
                )}
                {turnLimitReached && (
                  <p className="rounded border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {copy.turnLimit}
                  </p>
                )}
                {busy && (
                  <p
                    aria-label={copy.thinking}
                    aria-live="polite"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    role="status"
                  >
                    <span
                      aria-hidden="true"
                      className="flex gap-1 motion-reduce:hidden"
                    >
                      <i className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <i className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <i className="size-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                    <span className="hidden motion-reduce:inline">
                      {copy.thinking}
                    </span>
                  </p>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
            {showJump && (
              <Button
                aria-label={
                  unread
                    ? copy.unreadCount.replace("{count}", String(unread))
                    : copy.jumpToLatest
                }
                className="absolute bottom-3 right-4 z-10 h-9 rounded-full shadow-md"
                onClick={jumpToLatest}
                size="sm"
                type="button"
                variant="secondary"
              >
                <ArrowDownIcon className="size-4" />
                {unread
                  ? copy.unreadCount.replace("{count}", String(unread))
                  : copy.jumpToLatest}
              </Button>
            )}
          </div>
          <form
            className="shrink-0 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={submit}
          >
            <label className="sr-only" htmlFor="public-assistant-question">
              {copy.placeholder}
            </label>
            <div className="flex items-end gap-2">
              <textarea
                className="min-h-10 max-h-32 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={busy || turnLimitReached}
                id="public-assistant-question"
                maxLength={AI_LIMITS.publicMessageCharacters}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={copy.placeholder}
                ref={inputRef}
                rows={1}
                value={question}
              />
              <Button
                aria-label={copy.send}
                className="size-11"
                disabled={
                  busy || turnLimitReached || question.trim().length === 0
                }
                size="icon"
                type="submit"
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
          </form>
        </section>
      )}
      <Tooltip delayDuration={200}>
        <TooltipTrigger
          className={`fixed right-4 z-[60] group sm:bottom-6 sm:right-6 ${open ? "bottom-[calc(100dvh-4rem)]" : "bottom-4"}`}
        >
          <Button
            aria-expanded={open}
            aria-label={open ? copy.close : copy.open}
            className={`ai-assistant flex h-14 w-14 items-center justify-start overflow-hidden rounded-full bg-primary px-4 text-primary-foreground shadow-lg transition-[width,border-radius] duration-[180ms] ease-out motion-reduce:transition-none ${open ? "" : "sm:hover:w-52 sm:focus-visible:w-52"}`}
            onClick={toggle}
            ref={triggerRef}
            size="icon"
          >
            <span className="shrink-0">
              {open ? (
                <XIcon className="size-5" />
              ) : (
                <MessageCircleIcon className="size-5" />
              )}
            </span>
            {!open && (
              <span
                aria-hidden="true"
                className="hidden whitespace-nowrap sm:ml-2 sm:inline sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                {copy.open}
              </span>
            )}
            <span className="sr-only">{open ? copy.close : copy.open}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {open ? copy.close : copy.role}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
