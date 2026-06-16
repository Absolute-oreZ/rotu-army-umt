"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/seperator";
import {
  PanelLeftIcon,
  PanelLeftCloseIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "4rem";
const SIDEBAR_STORAGE_KEY = "sidebar-state";

type SidebarState = "expanded" | "collapsed";

type SidebarContextValue = {
  state: SidebarState;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("Sidebar compound components must be used within <SidebarProvider>");
  return ctx;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    requestAnimationFrame(() => setMatches(mql.matches));
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function SidebarProvider({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<SidebarState>(defaultOpen ? "expanded" : "collapsed");
  const [openMobile, setOpenMobile] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  React.useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "collapsed" || stored === "expanded") {
      requestAnimationFrame(() => setState(stored));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, state);
  }, [state]);

  React.useEffect(() => {
    if (isMobile) {
      requestAnimationFrame(() => setOpenMobile(false));
    }
  }, [isMobile]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
    }
  }, [isMobile]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <SidebarContext.Provider
      value={{ state, isMobile, openMobile, setOpenMobile, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"aside">) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} side="left">
        <SheetContent className="w-64 p-0">
          <div
            data-slot="sidebar"
            data-state="expanded"
            data-mobile="true"
            className="flex h-full flex-col bg-sidebar text-sidebar-foreground"
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const sidebarWidth = state === "collapsed" ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <aside
      data-slot="sidebar"
      data-state={state}
      data-mobile="false"
      className={cn(
        "hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear md:flex",
        className,
      )}
      style={{ width: mounted ? sidebarWidth : SIDEBAR_WIDTH }}
      {...props}
    >
      {children}
    </aside>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "flex h-16 items-center gap-3 border-b border-sidebar-border p-3",
        className,
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-1.5",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-1 border-t border-sidebar-border px-2 py-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("flex flex-col gap-1 py-1", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  if (isCollapsed) return null;

  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-sidebar-foreground/50",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group-content" className={cn("flex flex-col", className)} {...props} />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

type SidebarMenuButtonProps = {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
};

function SidebarMenuButton({
  href,
  icon: Icon,
  isActive: isActiveProp,
  disabled,
  tooltip,
  children,
}: SidebarMenuButtonProps) {
  const { state, isMobile } = useSidebar();
  const pathname = usePathname();
  const isCollapsed = state === "collapsed" && !isMobile;

  const isActive = isActiveProp ?? (
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`)
  );

  const label = typeof children === "string" ? children : tooltip ?? "";

  const linkContent = (
    <div
      data-slot="sidebar-menu-button"
      data-active={isActive || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "flex min-h-8 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
        disabled
          ? "cursor-not-allowed text-sidebar-foreground/40"
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && !disabled
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80",
        isCollapsed && "mx-auto w-9 justify-center px-0",
      )}
    >
      {Icon && <Icon className="size-5 shrink-0" />}
      {!isCollapsed && <span className="truncate">{children}</span>}
    </div>
  );

  const content = disabled ? (
    <div aria-disabled="true">{linkContent}</div>
  ) : (
    <Link href={href} className="block">
      {linkContent}
    </Link>
  );

  if (isCollapsed && label) {
    return (
      <Tooltip>
        <TooltipTrigger>{content}</TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn("ml-6 flex flex-col gap-0.5 border-l border-sidebar-border pl-2", className)}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={className} {...props} />;
}

function SidebarMenuSubButton({
  href,
  isActive: isActiveProp,
  disabled,
  icon: Icon,
  children,
}: {
  href: string;
  isActive?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = isActiveProp ?? (pathname === href || pathname.startsWith(`${href}/`));

  const content = (
    <div
      data-slot="sidebar-menu-sub-button"
      data-active={isActive || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "flex min-h-7 items-center gap-2 rounded-md px-2.5 py-1.25 text-[0.78rem] transition-colors",
        disabled
          ? "cursor-not-allowed text-sidebar-foreground/40"
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && !disabled
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70",
      )}
    >
      {Icon && <Icon className="size-4.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </div>
  );

  const item = disabled ? (
    <div aria-disabled="true">{content}</div>
  ) : (
    <Link href={href} className="block">
      {content}
    </Link>
  );

  return item;
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      className={cn("bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
  const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className,
      )}
      aria-label={isMobile ? (openMobile ? "Close sidebar" : "Open sidebar") : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      {...props}
    >
      {isMobile ? (
        openMobile ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />
      ) : isCollapsed ? (
        <PanelLeftIcon className="size-5" />
      ) : (
        <PanelLeftCloseIcon className="size-5" />
      )}
    </button>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn("flex flex-1 flex-col", className)}
      {...props}
    />
  );
}

export {
  useSidebar,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
};
