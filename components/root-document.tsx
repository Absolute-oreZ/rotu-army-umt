import {
  Geist,
  Geist_Mono,
  Noto_Sans_SC,
  Noto_Sans_Tamil,
} from "next/font/google";
import type { Locale } from "@/lib/i18n/config";
import type { Theme } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansSc = Noto_Sans_SC({
  preload: false,
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700"],
});

const notoSansTamil = Noto_Sans_Tamil({
  preload: false,
  variable: "--font-noto-sans-tamil",
  weight: ["400", "500", "600", "700"],
});

type RootDocumentProps = Readonly<{
  children: React.ReactNode;
  initialTheme?: Theme;
  lang?: Locale;
}>;

export function RootDocument({
  children,
  initialTheme = "system",
  lang = "en",
}: RootDocumentProps) {
  const isServerDark = initialTheme === "dark";

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansSc.variable} ${notoSansTamil.variable} h-full antialiased${isServerDark ? " dark" : ""}`}
      style={{ colorScheme: isServerDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
