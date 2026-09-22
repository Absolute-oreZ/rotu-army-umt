"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No options found",
  disabled = false,
  className,
  ariaLabel,
  onKeyDown,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      setSearch("");
      return;
    }
    onKeyDown?.(event);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setSearch("");
          if (!open) {
            setTimeout(() => searchRef.current?.focus(), 50);
          }
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-sm ring-offset-background transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2">
              <SearchIcon className="size-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-7 w-full border-0 bg-transparent px-0 text-sm shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    option.value === value && "bg-muted font-medium",
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
