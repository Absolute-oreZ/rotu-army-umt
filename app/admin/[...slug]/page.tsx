import { AdminNotFound } from "@/components/admin/admin-not-found";
import { getCurrentAdmin } from "@/lib/admin/rbac";
import { getAdminNotFoundBackLabel, getDefaultAdminRoute } from "@/lib/admin/roles";

export default async function AdminCatchAllPage() {
  const admin = await getCurrentAdmin();
  const backHref = admin ? getDefaultAdminRoute(admin.role) : "/admin";
  const backLabel = admin
    ? getAdminNotFoundBackLabel(admin.role)
    : "Back to dashboard";

  return <AdminNotFound backHref={backHref} backLabel={backLabel} />;
}
