import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="sports">{children}</AdminRoleLayout>;
}
