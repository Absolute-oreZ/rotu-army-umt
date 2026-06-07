import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("sports");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
