"use client";

import { FilterPill } from "./filter-pill";
import { FilterBuilder } from "./filter-builder";
import { SortControl } from "./sort-control";
import type {
  FilterColumn,
  FilterCondition,
  SortRule,
} from "@/lib/admin/table-search-params";

export function GlobalFilterBar({
  filters,
  sortRules,
  filterColumns,
  sortKeys,
  sortLabels,
  onFilterUpdate,
  onSortUpdate,
}: {
  filters: Record<string, FilterCondition[]>;
  sortRules: SortRule[];
  filterColumns: FilterColumn[];
  sortKeys: string[];
  sortLabels?: Record<string, string>;
  onFilterUpdate: (filters: Record<string, FilterCondition[]>) => void;
  onSortUpdate: (sortRules: SortRule[]) => void;
}) {
  const columnLabels: Record<string, string> = { ...sortLabels };
  for (const col of filterColumns) {
    columnLabels[col.key] = col.label;
  }

  function handleFilterCommit(columnKey: string, operator: string, value: string) {
    const next = { ...filters };
    if (!next[columnKey]) {
      next[columnKey] = [];
    }
    next[columnKey] = [...next[columnKey], { operator, value }];
    onFilterUpdate(next);
  }

  function handleFilterRemove(columnKey: string, index: number) {
    const next = { ...filters };
    if (next[columnKey]) {
      next[columnKey] = next[columnKey].filter((_, i) => i !== index);
      if (next[columnKey].length === 0) {
        delete next[columnKey];
      }
    }
    onFilterUpdate(next);
  }

  const activeFilters: Array<{
    columnKey: string;
    columnLabel: string;
    operator: string;
    value: string;
    index: number;
  }> = [];

  for (const [columnKey, conditions] of Object.entries(filters)) {
    const col = filterColumns.find((c) => c.key === columnKey);
    if (!col) continue;
    conditions.forEach((cond, index) => {
      activeFilters.push({
        columnKey,
        columnLabel: col.label,
        operator: cond.operator,
        value: cond.value,
        index,
      });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {activeFilters.map((filter) => (
          <FilterPill
            key={`${filter.columnKey}-${filter.index}`}
            columnLabel={filter.columnLabel}
            operator={filter.operator}
            value={filter.value}
            onRemove={() => handleFilterRemove(filter.columnKey, filter.index)}
          />
        ))}
        <FilterBuilder filterColumns={filterColumns} onCommit={handleFilterCommit} />
      </div>
      <SortControl
        sortRules={sortRules}
        sortKeys={sortKeys}
        columnLabels={columnLabels}
        onUpdate={onSortUpdate}
      />
    </div>
  );
}
