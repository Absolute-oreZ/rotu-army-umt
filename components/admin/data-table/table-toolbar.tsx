"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon, RefreshCcwIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TableState } from "@/lib/admin/table-search-params";

export type TableToolbarProps = {
  showRefreshButton?: boolean;
  searchPlaceholder?: string;
  totalCount: number;
  shownCount: number;
  state: TableState;
  onChange: (patch: Partial<TableState>) => void;
  onReset: () => void;
  isDefault: boolean;
  searchDebounceMs?: number;
  actions?: ReactNode;
};

export function TableToolbar({
  showRefreshButton,
  searchPlaceholder = "Search…",
  totalCount,
  shownCount,
  state,
  onChange,
  onReset,
  isDefault,
  searchDebounceMs = 200,
  actions,
}: TableToolbarProps) {
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const displayQuery = pendingQuery ?? state.q;

  function handleQueryChange(value: string) {
    setPendingQuery(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPendingQuery(null);
      onChange({ q: value, page: 1 });
    }, searchDebounceMs);
  }

  function handleQueryClear() {
    setPendingQuery(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    onChange({ q: "", page: 1 });
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const router = useRouter();
  const start = shownCount === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const end = Math.min(state.page * state.pageSize, totalCount);

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={displayQuery}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8 pr-8"
            aria-label="Search"
          />
          {displayQuery && (
            <button
              type="button"
              onClick={handleQueryClear}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {!isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 sm:ml-4 sm:shrink-0">
        {showRefreshButton ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        ) : null}
        {actions}
        <p
          className="text-xs text-muted-foreground"
          aria-live="polite"
        >
          {shownCount === 0
            ? "No results"
            : `${start.toLocaleString()}–${end.toLocaleString()} of ${totalCount.toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}
