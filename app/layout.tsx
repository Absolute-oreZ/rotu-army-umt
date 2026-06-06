import { headers } from "next/headers";
import "./globals.css";
import { RootDocument } from "@/components/root-document";
import { isTheme } from "@/lib/theme";

export default async function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storedTheme = (await headers()).get("x-theme") ?? undefined;
  const initialTheme = isTheme(storedTheme) ? storedTheme : "system";

  return <RootDocument initialTheme={initialTheme}>{children}</RootDocument>;
}
