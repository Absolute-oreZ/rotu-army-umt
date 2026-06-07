import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function WelfareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("welfare");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
