"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip() {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip compound components must be used within <Tooltip>");
  return ctx;
}

function Tooltip({ children, delayDuration = 200 }: { children: React.ReactNode; delayDuration?: number }) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetOpen = React.useCallback(
    (next: boolean) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (next) {
        timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
      } else {
        setOpen(false);
      }
    },
    [delayDuration],
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen: handleSetOpen }}>
      <div className="relative inline-flex justify-center">{children}</div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { setOpen } = useTooltip();

  return (
    <div
      data-slot="tooltip-trigger"
      className={className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
}

function TooltipContent({
  className,
  side = "right",
  children,
  ...props
}: React.ComponentProps<"div"> & { side?: "right" | "top" | "bottom" | "left" }) {
  const { open } = useTooltip();

  if (!open) return null;

  const positionClasses: Record<string, string> = {
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  };

  return (
    <div
      data-slot="tooltip-content"
      data-state={open ? "open" : "closed"}
      data-side={side}
      role="tooltip"
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0",
        positionClasses[side],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
