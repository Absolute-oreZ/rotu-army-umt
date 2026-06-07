import Link from "next/link";
import type { CurrentAdmin } from "@/lib/admin/rbac";
import { getDefaultAdminRoute } from "@/lib/admin/roles";
import { buttonClasses } from "@/components/ui/button";
import { ShieldXIcon } from "lucide-react";

export function AccessDenied({ admin }: { admin: CurrentAdmin }) {
  const defaultRoute = getDefaultAdminRoute(admin.role);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <ShieldXIcon className="size-12 text-muted-foreground" />
      <div>
        <h1 className="text-2xl font-semibold">403 - Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to access this module.
        </p>
      </div>
      <Link
        href={defaultRoute}
        className={buttonClasses({ size: "sm", variant: "outline" })}
      >
        Go to your dashboard
      </Link>
    </div>
  );
}
