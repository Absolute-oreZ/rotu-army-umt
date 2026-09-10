"use client";

import { useCallback, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
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
import { isTableStateDefault } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { buildIntakesTableConfig, formatStatus } from "@/components/admin/secretary/intakes/table-config";
import { ChangeIntakeStatusDialog } from "./change-intake-status-dialog";
import { IntakeTableRow } from "./intake-table-row";
import { useTableEditGuard } from "@/lib/admin/use-table-edit-guard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type IntakeRow = {
  id: number;
  intakeNo: string;
  displayName: string;
  slug: string;
  status: string;
  startYear: number;
  tagLine: string | null;
  coverPhotoPath: string | null;
  patchPhotoPath: string | null;
  cadetCount: number;
};

type IntakesTableProps = {
  intakes: IntakeRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
};

export function IntakesTable({
  intakes,
  searchParams,
  totalCount,
}: IntakesTableProps) {
  const config = useMemo(
    () => buildIntakesTableConfig(),
    [],
  );

  const { state, update, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const [editingIntakeId, setEditingIntakeId] = useState<number | null>(null);
  const [statusTarget, setStatusTarget] = useState<IntakeRow | null>(null);

  const isDefault = isTableStateDefault(state, config);
  const hasUnsavedEdit = editingIntakeId !== null;
  const { guardedUpdate, confirmOpen, confirmDiscard, dismissConfirm } = useTableEditGuard({
    update,
    hasUnsavedEdit,
    onDiscard: () => setEditingIntakeId(null),
  });
  const guardedReset = useCallback(() => {
    guardedUpdate({ ...config.defaults, filters: {} });
  }, [config.defaults, guardedUpdate]);

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-500/10 text-emerald-600";
      case "ARCHIVED":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name or intake no…"
        totalCount={totalCount}
        shownCount={intakes.length}
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

      {intakes.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No intakes found."
              : "No intakes match the current filters. Try clearing some."
          }
          icon={<SearchIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={guardedReset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <SortableHead
                    columnKey="intakeNo"
                    label="Intake No"
                    state={state}
                    onChange={guardedUpdate}
                  />
                  <SortableHead
                    columnKey="displayName"
                    label="Display Name"
                    state={state}
                    onChange={guardedUpdate}
                  />
                  <SortableHead
                    columnKey="startYear"
                    label="Start Year"
                    state={state}
                    onChange={guardedUpdate}
                  />
                  <TableHead>Status</TableHead>
                  <TableHead>Active Cadets</TableHead>
                  <TableHead>Tagline</TableHead>
                  <TableHead className="pr-5 text-right w-35">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intakes.map((intake) => (
                  <IntakeTableRow
                    key={intake.id}
                    intake={intake}
                    isEditing={editingIntakeId === intake.id}
                    editDisabled={hasUnsavedEdit && editingIntakeId !== intake.id}
                    onEditRequest={() => setEditingIntakeId(intake.id)}
                    onEditEnd={() => setEditingIntakeId(null)}
                    onSaved={() => setEditingIntakeId(null)}
                    statusBadgeColor={statusBadgeColor}
                    formatStatus={formatStatus}
                    onStatusChange={() => setStatusTarget(intake)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {intakes.map((intake) => (
              <IntakeTableRow
                key={intake.id}
                intake={intake}
                mobile
                isEditing={editingIntakeId === intake.id}
                editDisabled={hasUnsavedEdit && editingIntakeId !== intake.id}
                onEditRequest={() => setEditingIntakeId(intake.id)}
                onEditEnd={() => setEditingIntakeId(null)}
                onSaved={() => setEditingIntakeId(null)}
                statusBadgeColor={statusBadgeColor}
                formatStatus={formatStatus}
                onStatusChange={() => setStatusTarget(intake)}
              />
            ))}
          </div>

          <Pagination state={state} totalPages={totalPages} totalCount={totalCount} onChange={update} />
        </>
      )}

      {statusTarget && (
        <ChangeIntakeStatusDialog
          intake={statusTarget}
          open={statusTarget !== null}
          onOpenChange={(open) => { if (!open) setStatusTarget(null); }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => { if (!open) dismissConfirm(); }}
        title="Discard unsaved changes?"
        description="You have an unsaved intake edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}
