import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const dictionaries = {
  en: () => import("./dictionaries/en").then((module) => module.default),
  ms: () => import("./dictionaries/ms").then((module) => module.default),
  zh: () => import("./dictionaries/zh").then((module) => module.default),
  ta: () => import("./dictionaries/ta").then((module) => module.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

export type { Dictionary };
