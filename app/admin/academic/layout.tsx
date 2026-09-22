import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function AcademicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="academic">{children}</AdminRoleLayout>;
}
