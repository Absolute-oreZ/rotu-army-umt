import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("academic");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
