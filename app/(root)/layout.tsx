import "../globals.css";
import { RootDocument } from "@/components/root-document";

export default function RootRedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootDocument>{children}</RootDocument>;
}
