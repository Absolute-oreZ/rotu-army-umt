"use client";

import type { CurrentAdmin } from "@/lib/admin/rbac";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/seperator";

export function AdminShell({
  admin,
  children,
}: {
  admin: CurrentAdmin;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <AdminSidebar admin={admin} />
        <SidebarInset className="min-w-0 overflow-y-auto bg-background">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5 bg-border/80 my-auto" />
            <AdminBreadcrumb admin={admin} />
          </header>
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
