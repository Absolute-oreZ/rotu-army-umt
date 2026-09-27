import type { Locale } from "@/lib/i18n/config";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type PublicSource = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
  language: Locale;
  publishedAt?: string;
  excerpt: string;
};

export type PublicRetrievalResult = {
  sources: PublicSource[];
  usedCrossLanguageFallback: boolean;
};
