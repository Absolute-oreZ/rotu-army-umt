"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "left" | "right";
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("Sheet compound components must be used within <Sheet>");
  return ctx;
}

function Sheet({
  open = false,
  onOpenChange,
  side = "left",
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right";
  children: React.ReactNode;
}) {
  const handleOpenChange = React.useCallback(
    (next: boolean) => onOpenChange?.(next),
    [onOpenChange],
  );

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange, side }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetOverlay({ className, ...props }: React.ComponentProps<"div">) {
  const { open, onOpenChange } = useSheet();

  if (!open) return null;

  return (
    <div
      data-slot="sheet-overlay"
      data-state={open ? "open" : "closed"}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity",
        open ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, onOpenChange, side } = useSheet();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <SheetOverlay />
      <div
        data-slot="sheet-content"
        data-state="open"
        data-side={side}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 z-50 flex w-[18rem] flex-col bg-background shadow-lg transition-transform duration-200 ease-out",
          side === "left"
            ? "left-0 translate-x-0"
            : "right-0 translate-x-0",
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          data-slot="sheet-close"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>,
    document.body,
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-6 py-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-1.5 px-6 py-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetSkeleton({
  side = "left",
  className,
}: {
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />

      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-[18rem] flex-col bg-background shadow-lg",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
      >
        <div className="space-y-3 border-b px-6 py-4">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="flex-1 space-y-4 px-6 py-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t px-6 py-4">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </>
  );
}

export {
  Sheet,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton
};
