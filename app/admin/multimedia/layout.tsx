import { AdminRoleLayout } from "@/components/admin/admin-role-layout";

export default async function MultimediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRoleLayout group="multimedia">{children}</AdminRoleLayout>;
}
