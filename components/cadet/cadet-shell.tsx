"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import type { CurrentCadet } from "@/lib/auth/cadet";
import { CadetSidebar } from "@/components/cadet/cadet-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/seperator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function getCadetBreadcrumbLabels(pathname: string) {
  if (pathname.startsWith("/cadet/collections/")) {
    return ["Collections", "Details"];
  }
  if (pathname.startsWith("/cadet/collections")) {
    return ["Collections"];
  }
  if (pathname.startsWith("/cadet/claims")) {
    return ["Claims"];
  }
  return ["Cadet Portal"];
}

export function CadetShell({
  cadet,
  children,
}: {
  cadet: CurrentCadet;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const labels = getCadetBreadcrumbLabels(pathname);

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <CadetSidebar cadet={cadet} />
        <SidebarInset className="min-w-0 overflow-y-auto bg-background">
          <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6 sm:py-0">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5 bg-border/80 my-auto" />
            <Breadcrumb className="min-w-0 flex-1">
              <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden">
                {labels.map((label, index) => (
                  <Fragment key={`${label}-${index}`}>
                    {index > 0 ? <BreadcrumbSeparator /> : null}
                    <BreadcrumbItem className="min-w-0 shrink-0">
                      <BreadcrumbPage className="max-w-[12rem] truncate sm:max-w-[18rem]">
                        {label}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
