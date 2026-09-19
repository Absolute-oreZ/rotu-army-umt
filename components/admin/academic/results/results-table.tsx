"use client";

import { useCallback, useMemo } from "react";
import { GraduationCapIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { useTableEditGuard } from "@/lib/admin/use-table-edit-guard";
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildResultsTableConfig } from "./table-config";
import { ResultsTableRow, type ResultRow } from "./results-table-row";

export type { ResultRow };

type ResultsTableProps = {
  rows: ResultRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  showIntakeColumn: boolean;
  editingResultId: number | null;
  onEditStart: (resultId: number) => void;
  onEditEnd: () => void;
  onViewSlip: (row: ResultRow) => void;
  onUploadSlip: (row: ResultRow) => void;
};

export function ResultsTable({
  rows,
  searchParams,
  totalCount,
  showIntakeColumn,
  editingResultId,
  onEditStart,
  onEditEnd,
  onViewSlip,
  onUploadSlip,
}: ResultsTableProps) {
  const config = useMemo(
    () => buildResultsTableConfig(),
    [],
  );

  const { state, update, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);
  const hasUnsavedEdit = editingResultId !== null;

  const { guardedUpdate, confirmOpen, confirmDiscard, dismissConfirm } = useTableEditGuard({
    update,
    hasUnsavedEdit,
    onDiscard: onEditEnd,
  });

  const guardedReset = useCallback(() => {
    guardedUpdate({ ...config.defaults, filters: {} });
  }, [config.defaults, guardedUpdate]);

  return (
    <>
      <TableToolbar
        searchPlaceholder="Search by name or army no…"
        totalCount={totalCount}
        shownCount={rows.length}
        state={state}
        onChange={guardedUpdate}
        onReset={guardedReset}
        isDefault={isDefault}
      />

      <div className="mb-4">
        <GlobalFilterBar
          filters={state.filters}
          sortRules={state.sortRules}
          filterColumns={config.filterColumns}
          sortKeys={config.sortKeys}
          sortLabels={config.sortLabels}
          onFilterUpdate={(filters) => guardedUpdate({ filters, page: 1 })}
          onSortUpdate={(sortRules) => guardedUpdate({ sortRules, page: 1 })}
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="name" label="Name" state={state} onChange={guardedUpdate} />
              {showIntakeColumn && <TableHead>Intake</TableHead>}
              <SortableHead columnKey="gpa" label="GPA" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="cgpa" label="CGPA" state={state} onChange={guardedUpdate} />
              <TableHead className="w-16 pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showIntakeColumn ? 8 : 7}>
                  <Empty
                    title="No results"
                    description="No cadets match the current filters. Try clearing some."
                    icon={<GraduationCapIcon className="size-5 text-muted-foreground" />}
                    action={
                      !isDefault ? (
                        <Button variant="outline" size="sm" onClick={guardedReset}>
                          Reset filters
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isEditing = row.resultId === editingResultId;

                return (
                  <ResultsTableRow
                    key={`${row.resultId}:${isEditing ? "edit" : "view"}`}
                    row={row}
                    isEditing={isEditing}
                    editDisabled={hasUnsavedEdit && !isEditing}
                    showIntakeColumn={showIntakeColumn}
                    onEditRequest={onEditStart}
                    onEditEnd={onEditEnd}
                    onViewSlip={onViewSlip}
                    onUploadSlip={onUploadSlip}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border p-4">
        <Pagination
          state={state}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSizeOptions={config.pageSizeOptions}
          onChange={guardedUpdate}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) dismissConfirm();
        }}
        title="Discard unsaved changes?"
        description="You have an unsaved score edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}