"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import type { CurrentAdmin } from "@/lib/admin/rbac";
import {
  getDashboardNavItem,
  getDefaultOpenGroupKey,
  getNavConfig,
  type NavGroup,
} from "@/lib/admin/nav-config";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function AdminBrand() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <Link href="/admin" className="flex min-w-0 justif0 items-center gap-3">
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
            Admin dashboard
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function AdminSidebarGroup({
  group,
  isOpen,
  onToggle,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: (groupKey: string) => void;
}) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const groupContent = (
    <button
      type="button"
      onClick={() => (isCollapsed ? toggleSidebar() : onToggle(group.key))}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed ? "mx-auto w-9 justify-center px-0" : "justify-between",
        isOpen ? "bg-sidebar-accent/70 text-sidebar-accent-foreground" : "text-sidebar-foreground/80",
      )}
      aria-expanded={isOpen}
      aria-label={group.title}
    >
      <span className="flex min-w-0 items-center gap-2">
        <group.icon className="size-5 shrink-0" />
        {!isCollapsed ? <span className="truncate text-[0.8125rem] font-medium">{group.title}</span> : null}
      </span>
      {!isCollapsed ? (
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      ) : null}
    </button>
  );

  return (
    <SidebarGroup>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger>{groupContent}</TooltipTrigger>
          <TooltipContent>{group.title}</TooltipContent>
        </Tooltip>
      ) : (
        groupContent
      )}

      {isOpen && !isCollapsed ? (
        <SidebarMenuSub className="ml-2 mt-1 border-l border-sidebar-border/70 pl-3">
          {group.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton
                href={item.href}
                icon={item.icon}
                disabled={!item.isAccessible}
              >
                {item.title}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarGroup>
  );
}

export function AdminSidebar({ admin }: { admin: CurrentAdmin }) {
  const pathname = usePathname();
  const navGroups = useMemo(() => getNavConfig(admin.role), [admin.role]);
  const dashboardItem = useMemo(() => getDashboardNavItem(admin.role), [admin.role]);
  const activeGroupKey = getDefaultOpenGroupKey(admin.role, pathname);
  const [manualOpenGroups, setManualOpenGroups] = useState<Set<string>>(() => new Set());
  const openGroups = useMemo(() => {
    const next = new Set(manualOpenGroups);

    if (activeGroupKey) {
      next.add(activeGroupKey);
    }

    return next;
  }, [activeGroupKey, manualOpenGroups]);

  function toggleGroup(groupKey: string) {
    setManualOpenGroups((current) => {
      const next = new Set(current);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <AdminBrand />
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-4">
        <SidebarGroup className="py-0">
          <SidebarMenuButton
            href={dashboardItem.href}
            icon={dashboardItem.icon}
            disabled={!dashboardItem.isAccessible}
            tooltip={
              dashboardItem.isAccessible
                ? dashboardItem.title
                : "Dashboard unavailable for this role"
            }
          >
            {dashboardItem.title}
          </SidebarMenuButton>
        </SidebarGroup>

        {navGroups.map((group, index) => (
          <div key={group.key}>
            {index > 0 ? <SidebarSeparator className="my-1" /> : null}
            <AdminSidebarGroup
              group={group}
              isOpen={openGroups.has(group.key)}
              onToggle={toggleGroup}
            />
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <AdminUserMenu admin={admin} />
      </SidebarFooter>
    </Sidebar>
  );
}
