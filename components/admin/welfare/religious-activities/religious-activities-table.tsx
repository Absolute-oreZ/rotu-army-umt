"use client";

import { useCallback, useMemo } from "react";
import { CalendarHeartIcon } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTableEditGuard } from "@/lib/admin/use-table-edit-guard";
import { buildReligiousActivitiesTableConfig } from "./table-config";
import { ReligiousActivitiesTableRow } from "./religious-activities-table-row";

export type ReligiousActivityRow = {
  id: number;
  type: string;
  recordDate: string;
  title: string;
  remarks: string | null;
  location: string;
  meetingLink: string | null;
  createdAt: string;
};

export function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

type ReligiousActivitiesTableProps = {
  activities: ReligiousActivityRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  typeOptions: { value: string; label: string }[];
  inlineEnabled: boolean;
  editingId: number | null;
  onViewPhotos: (activity: ReligiousActivityRow) => void;
  onEditStartInline: (id: number) => void;
  onEditRequest: (activity: ReligiousActivityRow) => void;
  onEditEnd: () => void;
  onDelete: (activity: ReligiousActivityRow) => void;
};

export function ReligiousActivitiesTable({
  activities,
  searchParams,
  totalCount,
  typeOptions,
  inlineEnabled,
  editingId,
  onViewPhotos,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
  onDelete,
}: ReligiousActivitiesTableProps) {
  const config = useMemo(
    () => buildReligiousActivitiesTableConfig(typeOptions),
    [typeOptions],
  );

  const { state, update, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);
  const hasUnsavedEdit = editingId !== null;

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
        searchPlaceholder="Search by title..."
        totalCount={totalCount}
        shownCount={activities.length}
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
          onFilterUpdate={(filters) => guardedUpdate({ filters })}
          onSortUpdate={(sortRules) => guardedUpdate({ sortRules })}
        />
      </div>

      {activities.length === 0 ? (
        <Empty
          title="No religious activities"
          description={
            totalCount === 0
              ? "No religious activities have been recorded yet."
              : "No religious activities match the current filters. Try clearing some."
          }
          icon={<CalendarHeartIcon className="size-5 text-muted-foreground" />}
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
              <SortableHead columnKey="title" label="Title" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="type" label="Type" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="date" label="Date" state={state} onChange={guardedUpdate} />
              <TableHead>Remarks</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-28 pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => {
              const isEditing = inlineEnabled && activity.id === editingId;

              return (
                <ReligiousActivitiesTableRow
                  key={`${activity.id}:${isEditing ? "edit" : "view"}`}
                  activity={activity}
                  typeOptions={typeOptions}
                  isEditing={isEditing}
                  editDisabled={hasUnsavedEdit && !isEditing}
                  onViewPhotos={onViewPhotos}
                  onEditRequest={() =>
                    inlineEnabled ? onEditStartInline(activity.id) : onEditRequest(activity)
                  }
                  onDelete={onDelete}
                  onEditEnd={onEditEnd}
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
        description="You have an unsaved activity edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}