"use client";

import { useCallback, useMemo } from "react";
import { ClipboardCheckIcon } from "lucide-react";
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
import type { IntakeOption } from "@/lib/admin/table-search-params";
import type { AssessmentStandard } from "@/lib/assessment/types";
import { buildAssessmentsTableConfig, getAssessmentItems, type AssessmentItemColumn } from "./table-config";
import { AssessmentTableRow } from "./assessment-table-row";

export type AssessmentItemValue = {
  value: number | null;
  pass: boolean | null;
};

export type AssessmentRow = {
  cadetId: number;
  memberId: number;
  armyNo: number;
  rank: string;
  name: string;
  gender: "MALE" | "FEMALE";
  avatarPath: string | null;
  platoonName: string | null;
  intakeNo: string | null;
  assessmentId: number | null;
  result: string | null;
  items: Record<string, AssessmentItemValue>;
};

type StandardsByGender = {
  MALE: AssessmentStandard[];
  FEMALE: AssessmentStandard[];
};

type AssessmentsTableProps = {
  recordType: "UKA" | "APFA";
  standards: StandardsByGender | null;
  rows: AssessmentRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  recordId: number;
  isIntakeScoped: boolean;
  intakeFilterOptions: IntakeOption[];
  platoonFilterOptions: IntakeOption[];
  editingCadetId: number | null;
  inlineEnabled: boolean;
  onEditStartInline: (cadetId: number) => void;
  onEditRequest: (row: AssessmentRow) => void;
  onEditEnd: () => void;
};

export function AssessmentsTable({
  recordType,
  standards,
  rows,
  searchParams,
  totalCount,
  recordId,
  isIntakeScoped,
  intakeFilterOptions,
  platoonFilterOptions,
  editingCadetId,
  inlineEnabled,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
}: AssessmentsTableProps) {
  const config = useMemo(
    () => buildAssessmentsTableConfig(recordType, intakeFilterOptions, platoonFilterOptions),
    [recordType, intakeFilterOptions, platoonFilterOptions],
  );
  const items = useMemo(() => getAssessmentItems(recordType), [recordType]);
  const { state, update, totalPages } = useTableURL({ searchParams, config, totalCount });

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
              ? "No active cadets found for this intake yet."
              : "No cadets match the current filters. Try clearing some."
          }
          icon={<ClipboardCheckIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={guardedReset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <AssessmentsTableBody
          recordType={recordType}
          standards={standards}
          rows={rows}
          items={items}
          recordId={recordId}
          isIntakeScoped={isIntakeScoped}
          state={state}
          onChange={guardedUpdate}
          editingCadetId={editingCadetId}
          inlineEnabled={inlineEnabled}
          onEditStartInline={onEditStartInline}
          onEditRequest={onEditRequest}
          onEditEnd={onEditEnd}
        />
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
        description="You have an unsaved assessment edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}

function AssessmentsTableBody({
  recordType,
  standards,
  rows,
  items,
  recordId,
  isIntakeScoped,
  state,
  onChange,
  editingCadetId,
  inlineEnabled,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
}: {
  recordType: "UKA" | "APFA";
  standards: StandardsByGender | null;
  rows: AssessmentRow[];
  items: AssessmentItemColumn[];
  recordId: number;
  isIntakeScoped: boolean;
  state: ReturnType<typeof useTableURL>["state"];
  onChange: (patch: Parameters<ReturnType<typeof useTableURL>["update"]>[0]) => void;
  editingCadetId: number | null;
  inlineEnabled: boolean;
  onEditStartInline: (cadetId: number) => void;
  onEditRequest: (row: AssessmentRow) => void;
  onEditEnd: () => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={onChange} />
          <SortableHead columnKey="rank" label="Rank" state={state} onChange={onChange} />
          <SortableHead columnKey="name" label="Name" state={state} onChange={onChange} />
          {!isIntakeScoped && <TableHead>Intake</TableHead>}
          <SortableHead columnKey="platoon" label="Platoon" state={state} onChange={onChange} />
          {items.map((item) => (
            <SortableHead
              key={item.key}
              columnKey={item.key}
              label={item.label}
              state={state}
              onChange={onChange}
            />
          ))}
          <SortableHead columnKey="result" label="Result" state={state} onChange={onChange} />
          <TableHead className="w-16 pr-5 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const isEditing = inlineEnabled && row.cadetId === editingCadetId;
          const nextIncomplete =
            rows.slice(index + 1).find((candidate) => candidate.result === null) ?? null;

          return (
            <AssessmentTableRow
              key={`${row.cadetId}:${row.assessmentId ?? "none"}:${isEditing ? "edit" : "view"}`}
              row={row}
              recordType={recordType}
              standards={standards}
              recordId={recordId}
              isEditing={isEditing}
              isIntakeScoped={isIntakeScoped}
              nextIncompleteCadetId={nextIncomplete?.cadetId ?? null}
              editDisabled={editingCadetId !== null && !isEditing}
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
  );
}