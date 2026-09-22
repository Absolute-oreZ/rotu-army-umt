import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function WelfareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="welfare">{children}</AdminRoleLayout>;
}
