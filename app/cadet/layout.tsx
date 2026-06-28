import "server-only";
import { headers } from "next/headers";
import { getCurrentCadet } from "@/lib/auth/cadet";
import { CadetShell } from "@/components/cadet/cadet-shell";

export default async function CadetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname");
  const cadet = await getCurrentCadet();

  if (!cadet || pathname === "/cadet/login") {
    return children;
  }

  return <CadetShell cadet={cadet}>{children}</CadetShell>;
}
