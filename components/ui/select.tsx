"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type SelectContextValue = {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  panelPosition: { top: number; left: number; width: number; side: "bottom" | "top"; bottom?: number } | null;
  setPanelPosition: (pos: { top: number; left: number; width: number; side: "bottom" | "top"; bottom?: number } | null) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be used inside <Select>");
  return ctx;
}

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
};

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [panelPosition, setPanelPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
    side: "bottom" | "top";
    bottom?: number;
  } | null>(null);

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setPanelPosition(null);
  }, []);

  const handleSelect = React.useCallback(
    (next: string) => {
      onValueChange(next);
      setOpen(false);
      setPanelPosition(null);
    },
    [onValueChange],
  );

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      value,
      open,
      onOpenChange: handleOpenChange,
      onSelect: handleSelect,
      triggerRef,
      panelPosition,
      setPanelPosition,
    }),
    [value, open, handleOpenChange, handleSelect, panelPosition],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

type SelectTriggerProps = React.ComponentProps<"button"> & {
  placeholder?: string;
  size?: "default" | "sm";
};

const triggerSizes = {
  default: "h-9 px-3 text-sm gap-2",
  sm: "h-7 px-2.5 text-xs gap-1.5",
};

function SelectTrigger({
  className,
  children,
  placeholder,
  size = "default",
  ...props
}: SelectTriggerProps) {
  const { open, onOpenChange, triggerRef, setPanelPosition } = useSelectContext();
  const id = React.useId();

  function openPanel() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const side = spaceBelow < 200 && spaceAbove > spaceBelow ? "top" : "bottom";
      setPanelPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        side,
        bottom: side === "top" ? window.innerHeight - rect.top + 4 : undefined,
      });
    }
    onOpenChange(true);
  }

  function handleClick() {
    if (open) {
      onOpenChange(false);
    } else {
      openPanel();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) openPanel();
    }
  }

  const display = children ?? (
    <span className={cn(!placeholder && "text-muted-foreground", "truncate")}>
      {placeholder}
    </span>
  );

  return (
    <button
      ref={triggerRef}
      type="button"
      id={id}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex w-full items-center justify-between rounded-md border border-border bg-background text-foreground",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        triggerSizes[size],
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 text-left truncate">{display}</span>
      <ChevronDownIcon
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

type SelectValueProps = {
  children?: React.ReactNode;
  placeholder?: string;
};

function SelectValue({ children, placeholder }: SelectValueProps) {
  if (!children) {
    return (
      <span className="truncate text-muted-foreground">{placeholder}</span>
    );
  }
  return <span className="truncate">{children}</span>;
}

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
  minWidth?: number;
};

function SelectContent({
  children,
  className,
  minWidth = 160,
}: SelectContentProps) {
  const { open, onOpenChange, onSelect, panelPosition } = useSelectContext();
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [focusedValue, setFocusedValue] = React.useState<string | null>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  React.useEffect(() => {
    if (!open) return;

    function closeAndReset() {
      setFocusedValue(null);
      onOpenChange(false);
    }

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !(event.target instanceof Element &&
          event.target.closest('[data-slot="select-trigger"]'))
      ) {
        closeAndReset();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndReset();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = panelRef.current?.querySelectorAll<HTMLDivElement>(
          '[data-slot="select-item"]:not([data-disabled])',
        );
        if (!items || items.length === 0) return;
        const values = Array.from(items).map((i) => i.dataset.value ?? "");
        const current = focusedValue ?? null;
        const idx = current ? values.indexOf(current) : -1;
        let nextIdx = idx;
        if (event.key === "ArrowDown") {
          nextIdx = idx < values.length - 1 ? idx + 1 : 0;
        } else {
          nextIdx = idx > 0 ? idx - 1 : values.length - 1;
        }
        setFocusedValue(values[nextIdx]);
      } else if (event.key === "Enter" && focusedValue) {
        event.preventDefault();
        onSelect(focusedValue);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, onSelect, focusedValue]);

  if (!open || !mounted || !panelPosition) return null;

  const portal = (
    <div
      ref={panelRef}
      role="listbox"
      data-slot="select-content"
      className={cn(
        "fixed z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        "animate-in fade-in zoom-in-95 duration-100",
        className,
      )}
      style={{
        ...(panelPosition.side === "top" && panelPosition.bottom != null
          ? { bottom: panelPosition.bottom, left: panelPosition.left }
          : { top: panelPosition.top, left: panelPosition.left }),
        minWidth: Math.max(panelPosition.width, minWidth),
      }}
    >
      <div className="max-h-72 overflow-y-auto p-1">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement<SelectItemProps>(child)) return child;
          return React.cloneElement(child, {
            _focused: focusedValue === child.props.value,
          } as Partial<SelectItemProps>);
        })}
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}

type SelectItemProps = React.ComponentProps<"div"> & {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  _focused?: boolean;
};

function SelectItem({
  className,
  value,
  disabled = false,
  children,
  _focused,
  ...props
}: SelectItemProps) {
  const { value: selected, onSelect } = useSelectContext();
  const isSelected = selected === value;

  function handleClick() {
    if (disabled) return;
    onSelect(value);
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-slot="select-item"
      data-value={value}
      data-disabled={disabled ? "" : undefined}
      data-focused={_focused ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent/60 text-accent-foreground",
        _focused && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
