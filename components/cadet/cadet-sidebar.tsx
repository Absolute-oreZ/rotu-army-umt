"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoinsIcon, FileTextIcon } from "lucide-react";
import type { CurrentCadet } from "@/lib/auth/cadet";
import { CadetUserMenu } from "@/components/cadet/cadet-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { title: "Collections", href: "/cadet/collections", icon: CoinsIcon },
  { title: "My Claims", href: "/cadet/claims", icon: FileTextIcon },
] as const;

function CadetBrand() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <Link href="/cadet" className="flex min-w-0 items-center gap-3">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border bg-background">
        <Image
          src="/icons/logo.png"
          alt=""
          width={40}
          height={40}
          className="size-full object-contain p-0.5"
          priority
        />
      </span>
      {!isCollapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground">
            ROTU Army UMT
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/60">
            Cadet portal
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function isPathActive(pathname: string, href: string) {
  if (href === "/cadet/collections") {
    return pathname === "/cadet/collections" || pathname.startsWith("/cadet/collections/");
  }
  if (href === "/cadet/claims") {
    return pathname === "/cadet/claims" || pathname.startsWith("/cadet/claims/");
  }
  return pathname === href;
}

export function CadetSidebar({ cadet }: { cadet: CurrentCadet }) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar>
      <SidebarHeader>
        <CadetBrand />
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-4">
        <SidebarGroup className="py-0">
          {NAV_ITEMS.map((item) => {
            const active = isPathActive(pathname, item.href);
            const button = (
              <SidebarMenuButton
                key={item.href}
                href={item.href}
                icon={item.icon}
                isActive={active}
                tooltip={isCollapsed ? item.title : undefined}
              >
                {item.title}
              </SidebarMenuButton>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger>{button}</TooltipTrigger>
                  <TooltipContent>{item.title}</TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <CadetUserMenu cadet={cadet} />
      </SidebarFooter>
    </Sidebar>
  );
}
