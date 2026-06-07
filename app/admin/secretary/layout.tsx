import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("secretary");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
