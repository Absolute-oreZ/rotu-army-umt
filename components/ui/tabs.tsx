"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

export function Tabs({
  children,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
}: React.PropsWithChildren<{
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const setValue = React.useCallback(
    (nextValue: string) => {
      onValueChange?.(nextValue);
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue);
      }
    },
    [controlledValue, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-auto items-center gap-1 rounded-2xl border border-border bg-muted p-1 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  disabled,
  className,
}: React.PropsWithChildren<{ value: string; disabled?: boolean; className?: string }>) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:cursor-pointer hover:bg-background/60 hover:text-foreground",
        className,
      )}
      onClick={() => {
        if (disabled) return;
        setValue(value);
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  children,
  value,
  className,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={cn("outline-none", !isActive && "hidden", className)}
    >
      {children}
    </div>
  );
}
