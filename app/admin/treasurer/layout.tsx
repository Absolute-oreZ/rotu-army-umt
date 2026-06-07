import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function TreasurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("treasurer");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
