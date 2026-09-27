import { headers } from "next/headers";
import { getCurrentAdmin } from "@/lib/admin/rbac";
import { AdminShell } from "@/components/admin/admin-shell";
import { getDictionary } from "@/lib/i18n/dictionaries";

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

  const dictionary = await getDictionary("en");
  return (
    <AdminShell admin={admin} assistantCopy={dictionary.aiAssistant}>
      {children}
    </AdminShell>
  );
}
