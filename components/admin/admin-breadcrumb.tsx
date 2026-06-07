"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import type { CurrentAdmin } from "@/lib/admin/rbac";
import { getAdminBreadcrumbLabels } from "@/lib/admin/nav-config";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSidebar } from "@/components/ui/sidebar";

export function AdminBreadcrumb({ admin }: { admin: CurrentAdmin }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const labels = getAdminBreadcrumbLabels(admin.role, pathname);

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden">
        {labels.map((label, index) => (
          <Fragment key={`${label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem className="min-w-0 shrink-0">
              <BreadcrumbPage
                className={
                  isCollapsed
                    ? "max-w-[8rem] truncate sm:max-w-[12rem]"
                    : "max-w-[14rem] truncate sm:max-w-[18rem]"
                }
              >
                {label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
