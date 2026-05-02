import { cookies } from "next/headers";
import "../globals.css";
import { RootDocument } from "@/components/root-document";
import { isTheme, themeStorageKey } from "@/lib/theme";

export default async function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storedTheme = (await cookies()).get(themeStorageKey)?.value;
  const initialTheme = isTheme(storedTheme) ? storedTheme : "system";

  return <RootDocument initialTheme={initialTheme}>{children}</RootDocument>;
}
