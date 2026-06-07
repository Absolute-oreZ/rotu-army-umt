import { requireRoleGroup } from "@/lib/admin/rbac";
import { AccessDenied } from "@/components/admin/access-denied";

export default async function MultimediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireRoleGroup("multimedia");

  if (!result.authorized) {
    return <AccessDenied admin={result.admin} />;
  }

  return <>{children}</>;
}
