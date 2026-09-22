import { AccessDenied } from "@/components/admin/access-denied";
import { requireRoleGroup } from "@/lib/admin/rbac";

export async function AdminRoleLayout({
  group,
  children,
}: {
  group: string;
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup(group);

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}