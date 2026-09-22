import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function TreasurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="treasurer">{children}</AdminRoleLayout>;
}
