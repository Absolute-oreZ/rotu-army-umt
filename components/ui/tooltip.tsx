"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
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
  const triggerRef = React.useRef<HTMLDivElement | null>(null);

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
    <TooltipContext.Provider value={{ open, setOpen: handleSetOpen, triggerRef }}>
      <div className="relative inline-flex justify-center">{children}</div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { setOpen, triggerRef } = useTooltip();

  return (
    <div
      ref={triggerRef}
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
  const { open, triggerRef } = useTooltip();
  const mounted = useMounted();
  const [pos, setPos] = React.useState<React.CSSProperties | null>(null);

  React.useEffect(() => {
    if (!open || !mounted || !triggerRef.current) {
      setPos(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    setPos({
      position: "fixed",
      ...(side === "top" && { bottom: window.innerHeight - rect.top + gap, left: rect.left + rect.width / 2, transform: "translateX(-50%)" }),
      ...(side === "bottom" && { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: "translateX(-50%)" }),
      ...(side === "left" && { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + gap, transform: "translateY(-50%)" }),
      ...(side === "right" && { top: rect.top + rect.height / 2, left: rect.right + gap, transform: "translateY(-50%)" }),
    });
  }, [open, mounted, side, triggerRef]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      data-slot="tooltip-content"
      data-state="open"
      data-side={side}
      role="tooltip"
      className={cn(
        "z-50 overflow-hidden rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0",
        className,
      )}
      style={pos}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

export { Tooltip, TooltipTrigger, TooltipContent };
