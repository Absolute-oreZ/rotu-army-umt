"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { TableState } from "@/lib/admin/table-search-params";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/lib/admin/table-search-params";

export type PaginationProps = {
  state: TableState;
  totalPages: number;
  totalCount: number;
  pageSizeOptions?: number[];
  onChange: (patch: Partial<TableState>) => void;
};

export function Pagination({
  state,
  totalPages,
  totalCount,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onChange,
}: PaginationProps) {
  const atStart = state.page <= 1;
  const atEnd = state.page >= totalPages || totalCount === 0;

  return (
    <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(state.pageSize)}
          onValueChange={(value) => onChange({ pageSize: Number(value), page: 1 })}
        >
          <SelectTrigger size="sm" className="w-20">
            {state.pageSize}
          </SelectTrigger>
          <SelectContent minWidth={80}>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Page {totalCount === 0 ? 0 : state.page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onChange({ page: state.page - 1 })}
            disabled={atStart}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onChange({ page: state.page + 1 })}
            disabled={atEnd}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
