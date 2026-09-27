"use client";

import { useEffect, useRef, useState } from "react";

type ConversationMessage = { role: "user" | "assistant" };

export function useAssistantConversation<T extends ConversationMessage>(
  greeting: string,
  busy: boolean,
  open: boolean,
) {
  const [messages, setMessages] = useState<T[]>(() => [
    { role: "assistant", text: greeting } as unknown as T,
  ]);
  const [showJump, setShowJump] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const previousCountRef = useRef(messages.length);

  useEffect(() => {
    if (stickToBottomRef.current)
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    else if (messages.length > previousCountRef.current)
      setUnread((count) => count + messages.length - previousCountRef.current);
    previousCountRef.current = messages.length;
  }, [messages, busy, open]);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottomRef.current = distance < 48;
    setShowJump(distance > 120);
    if (distance < 48) setUnread(0);
  }

  function jumpToLatest() {
    stickToBottomRef.current = true;
    setUnread(0);
    setShowJump(false);
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }

  function newChat() {
    setMessages([{ role: "assistant", text: greeting } as unknown as T]);
    setUnread(0);
    setShowJump(false);
    stickToBottomRef.current = true;
  }

  return {
    messages,
    setMessages,
    listRef,
    bottomRef,
    showJump,
    unread,
    handleScroll,
    jumpToLatest,
    newChat,
  };
}
