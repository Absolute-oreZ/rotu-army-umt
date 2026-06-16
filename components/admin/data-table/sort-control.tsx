"use client";

import { useState } from "react";
import { ArrowDownUpIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, GripVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { SortRule } from "@/lib/admin/table-search-params";

export function SortControl({
  sortRules,
  sortKeys,
  columnLabels,
  onUpdate,
}: {
  sortRules: SortRule[];
  sortKeys: string[];
  columnLabels: Record<string, string>;
  onUpdate: (rules: SortRule[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function toggleDirection(index: number) {
    const next = sortRules.map((r, i) =>
      i === index
        ? { ...r, direction: (r.direction === "asc" ? "desc" : "asc") as "asc" | "desc" }
        : r
    );
    onUpdate(next);
  }

  function moveRule(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= sortRules.length) return;
    const next = [...sortRules];
    const [rule] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, rule);
    onUpdate(next);
  }

  function removeRule(index: number) {
    onUpdate(sortRules.filter((_, i) => i !== index));
  }

  function addRule(columnKey: string) {
    if (sortRules.some((r) => r.columnKey === columnKey)) return;
    onUpdate([...sortRules, { columnKey, direction: "asc" }]);
  }

  function clearAll() {
    onUpdate([]);
  }

  const availableKeys = sortKeys.filter((k) => !sortRules.some((r) => r.columnKey === k));
  const ruleCount = sortRules.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
        >
          <ArrowDownUpIcon className="size-3.5" />
          {ruleCount === 0 ? "Sort" : `Sorted by ${ruleCount}`}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold text-foreground">Sort Rules</h3>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {sortRules.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No sort rules. Click a column header to sort.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {sortRules.map((rule, index) => (
                <div
                  key={`${rule.columnKey}-${index}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIndex === null || dragIndex === index) return;
                    setDropIndex(index);
                  }}
                  onDrop={() => {
                    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
                      moveRule(dragIndex, dropIndex);
                    }
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDropIndex(null);
                  }}
                  className={`flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1.5 transition-opacity ${dragIndex === index ? "opacity-50" : ""} ${dropIndex === index ? "ring-2 ring-primary/40" : ""}`}
                >
                  <GripVerticalIcon className="size-3.5 shrink-0 cursor-grab text-muted-foreground" />
                  <span className="flex-1 truncate text-xs font-medium">
                    {columnLabels[rule.columnKey] || rule.columnKey}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleDirection(index)}
                      className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      {rule.direction === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )}
                      {rule.direction.toUpperCase()}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-red-500"
                    >
                      <TrashIcon className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {availableKeys.length > 0 && (
          <div className="border-t border-border p-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Add Rule
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addRule(e.target.value);
                  e.target.value = "";
                }
              }}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              defaultValue=""
            >
              <option value="" disabled>
                Select column...
              </option>
              {availableKeys.map((key) => (
                <option key={key} value={key}>
                  {columnLabels[key] || key}
                </option>
              ))}
            </select>
          </div>
        )}

        {sortRules.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="w-full gap-1.5 text-xs"
            >
              <TrashIcon className="size-3" />
              Clear All
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
