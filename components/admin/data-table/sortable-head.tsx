"use client";

import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TableState } from "@/lib/admin/table-search-params";

export type SortableHeadProps = {
  columnKey: string;
  label: string;
  state: TableState;
  onChange: (patch: Partial<TableState>) => void;
  className?: string;
};

export function SortableHead({
  columnKey,
  label,
  state,
  onChange,
  className,
}: SortableHeadProps) {
  const ruleIndex = state.sortRules.findIndex((r) => r.columnKey === columnKey);
  const isActive = ruleIndex !== -1;
  const rule = isActive ? state.sortRules[ruleIndex] : null;

  function handleClick() {
    const nextRules = [...state.sortRules];

    if (!isActive) {
      nextRules.push({ columnKey, direction: "asc" });
    } else if (rule && rule.direction === "asc") {
      nextRules[ruleIndex] = { ...rule, direction: "desc" };
    } else {
      nextRules.splice(ruleIndex, 1);
    }

    onChange({ sortRules: nextRules });
  }

  const Icon =
    rule?.direction === "asc"
      ? ArrowUpIcon
      : rule?.direction === "desc"
        ? ArrowDownIcon
        : ArrowUpDownIcon;

  return (
    <TableHead className={cn("px-0 py-0", className)}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex h-full w-full items-center gap-1.5 px-4 py-2.5 text-left transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label={`Sort by ${label}${isActive ? `, currently ${rule?.direction === "asc" ? "ascending" : "descending"}, priority ${ruleIndex + 1}` : ""}`}
      >
        <span>{label}</span>
        <Icon className={cn("size-3.5 shrink-0", !isActive && "opacity-50")} />
        {isActive && state.sortRules.length > 1 && (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {ruleIndex + 1}
          </span>
        )}
      </button>
    </TableHead>
  );
}
