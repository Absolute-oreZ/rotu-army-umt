export const locales = ["en", "ms", "zh", "ta"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ms: "MS",
  zh: "ZH",
  ta: "TA",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function assertLocale(value: string): Locale {
  if (isLocale(value)) {
    return value;
  }

  return defaultLocale;
}
