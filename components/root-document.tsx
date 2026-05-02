import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isServerDark ? " dark" : ""}`}
      style={{ colorScheme: isServerDark ? "dark" : "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
