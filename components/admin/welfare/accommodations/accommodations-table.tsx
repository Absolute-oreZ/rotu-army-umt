"use client";

import { useCallback, useMemo } from "react";
import { BedIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault, type IntakeOption } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTableEditGuard } from "@/lib/admin/use-table-edit-guard";
import { buildAccommodationsTableConfig } from "./table-config";
import { AccommodationsTableRow } from "./accommodations-table-row";

export type AccommodationRow = {
  cadetId: number;
  armyNo: number;
  rank: string;
  name: string;
  avatarPath: string | null;
  intakeNo: string;
  accommodationId: number | null;
  type: "HOSTEL" | "RENTAL" | null;
  address: string | null;
};

type AccommodationsTableProps = {
  rows: AccommodationRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  isIntakeScoped: boolean;
  intakeFilterOptions: IntakeOption[];
  editingCadetId: number | null;
  inlineEnabled: boolean;
  onEditStartInline: (cadetId: number) => void;
  onEditRequest: (row: AccommodationRow) => void;
  onEditEnd: () => void;
};

export function AccommodationsTable({
  rows,
  searchParams,
  totalCount,
  isIntakeScoped,
  intakeFilterOptions,
  editingCadetId,
  inlineEnabled,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
}: AccommodationsTableProps) {
  const config = useMemo(() => buildAccommodationsTableConfig(intakeFilterOptions), [
    intakeFilterOptions,
  ]);

  const { state, update, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);
  const hasUnsavedEdit = editingCadetId !== null;

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
        showRefreshButton
        searchPlaceholder="Search by name or army no..."
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
          onSortUpdate={(sortRules) => guardedUpdate({ sortRules })}
        />
      </div>

      {rows.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No active cadets found for this view yet."
              : "No cadets match the current filters. Try clearing some."
          }
          icon={<BedIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={guardedReset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="name" label="Name" state={state} onChange={guardedUpdate} />
              {!isIntakeScoped && (
                <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={guardedUpdate} />
              )}
              <SortableHead columnKey="type" label="Accommodation Type" state={state} onChange={guardedUpdate} />
              <TableHead>Address</TableHead>
              <TableHead className="w-20 pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const isEditing = inlineEnabled && row.cadetId === editingCadetId;
              const nextEditable =
                rows.slice(index + 1).find((candidate) => candidate.accommodationId === null) ??
                null;

              return (
                <AccommodationsTableRow
                  key={row.cadetId}
                  row={row}
                  isEditing={isEditing}
                  isIntakeScoped={isIntakeScoped}
                  nextEditableCadetId={nextEditable?.cadetId ?? null}
                  editDisabled={hasUnsavedEdit && !isEditing}
                  onEditRequest={() =>
                    inlineEnabled ? onEditStartInline(row.cadetId) : onEditRequest(row)
                  }
                  onEditEnd={onEditEnd}
                  onSaved={(nextCadetId) => {
                    if (nextCadetId !== null) {
                      onEditStartInline(nextCadetId);
                    } else {
                      onEditEnd();
                    }
                  }}
                />
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={guardedUpdate}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) dismissConfirm();
        }}
        title="Discard unsaved changes?"
        description="You have an unsaved accommodation edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}