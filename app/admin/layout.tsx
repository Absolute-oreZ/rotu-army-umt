import { headers } from "next/headers";
import { getCurrentAdmin } from "@/lib/admin/rbac";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname");
  const admin = await getCurrentAdmin();

  if (!admin || pathname === "/admin/login") {
    return children;
  }

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
