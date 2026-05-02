import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import "../globals.css";
import { RootDocument } from "@/components/root-document";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isTheme, themeStorageKey } from "@/lib/theme";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const dictionary = await getDictionary(locale);

  return {
    title: {
      default: dictionary.metadata.title,
      template: `%s | ${dictionary.metadata.siteName}`,
    },
    description: dictionary.metadata.description,
    openGraph: {
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
      siteName: dictionary.metadata.siteName,
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const storedTheme = (await cookies()).get(themeStorageKey)?.value;
  const initialTheme = isTheme(storedTheme) ? storedTheme : "system";

  return (
    <RootDocument initialTheme={initialTheme} lang={locale}>
      {children}
    </RootDocument>
  );
}
