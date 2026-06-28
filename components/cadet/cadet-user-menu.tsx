"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/seperator";
import { cn } from "@/lib/utils";
import { signOutCadet } from "@/app/cadet/actions";
import type { CurrentCadet } from "@/lib/auth/cadet";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronUpIcon, ChevronDownIcon, LogOutIcon, MoonIcon, SunIcon, LaptopIcon } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: SunIcon },
  { value: "dark" as const, label: "Dark", icon: MoonIcon },
  { value: "system" as const, label: "System", icon: LaptopIcon },
];

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

export function CadetUserMenu({ cadet }: { cadet: CurrentCadet }) {
  const { state, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isCollapsed = state === "collapsed" && !isMobile;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      if (event.target instanceof Node && menuRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(
    () => getInitials(cadet.name, cadet.email),
    [cadet.name, cadet.email],
  );

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 px-2 py-2 text-left transition-colors hover:bg-sidebar-accent",
          isCollapsed ? "justify-center px-0" : "px-2",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={cadet.name}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sidebar-border bg-primary text-xs font-bold uppercase text-primary-foreground">
          {initials}
        </span>
        {!isCollapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              {cadet.name}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/60">
              {cadet.email}
            </span>
          </span>
        ) : null}
        {!isCollapsed ? (
          open ? (
            <ChevronDownIcon className="size-4 shrink-0 text-sidebar-foreground/60" />
          ) : (
            <ChevronUpIcon className="size-4 shrink-0 text-sidebar-foreground/60" />
          )
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-50 w-72 overflow-hidden rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl shadow-black/20",
            isMobile
              ? "bottom-full left-0 mb-3"
              : "left-full bottom-0 ml-3",
          )}
        >
          <div className="flex items-center gap-3 px-1 pb-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-primary text-sm font-bold uppercase text-primary-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{cadet.name}</p>
              <p className="truncate text-xs text-muted-foreground">{cadet.email}</p>
            </div>
          </div>

          <Separator className="my-3 bg-border/80" />

          <div className="rounded-xl border border-border/70 bg-background p-2">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="my-3 bg-border/80" />

          <form action={signOutCadet}>
            <Button
              type="submit"
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-border bg-background text-sm hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/15"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
