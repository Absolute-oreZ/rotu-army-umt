import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="secretary">{children}</AdminRoleLayout>;
}
