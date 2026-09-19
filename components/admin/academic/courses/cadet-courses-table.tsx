"use client";

import { useCallback, useMemo } from "react";
import { SearchIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { useTableEditGuard } from "@/lib/admin/use-table-edit-guard";
import { isTableStateDefault, type IntakeOption, type RawSearchParams } from "@/lib/admin/table-search-params";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildCadetCoursesTableConfig, type CourseOption } from "./table-config";
import { CadetCoursesTableRow } from "./cadet-courses-table-row";
import type { CourseOptionItem } from "./edit-cadet-course-dialog";

export type CadetCourseRow = {
  id: number;
  armyNo: number;
  rank: string;
  name: string;
  matricNo: string;
  avatarPath: string | null;
  intakeNo: string;
  intakeStartYear: number;
  studyProgramId: number | null;
  courseName: string | null;
  completionYear: number;
  currentYear: number;
};

type CadetCoursesTableProps = {
  cadets: CadetCourseRow[];
  courses: CourseOptionItem[];
  searchParams: RawSearchParams;
  totalCount: number;
  intakeOptions?: IntakeOption[];
  courseOptions?: CourseOption[];
  showIntakeColumn?: boolean;
  editingCadetId: number | null;
  inlineEnabled: boolean;
  onEditStartInline: (cadetId: number) => void;
  onEditRequest: (row: CadetCourseRow) => void;
  onEditEnd: () => void;
};

export function CadetCoursesTable({
  cadets,
  courses,
  searchParams,
  totalCount,
  intakeOptions,
  courseOptions,
  showIntakeColumn = false,
  editingCadetId,
  inlineEnabled,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
}: CadetCoursesTableProps) {
  const config = useMemo(
    () =>
      buildCadetCoursesTableConfig({
        intakeOptions,
        courseOptions,
      }),
    [intakeOptions, courseOptions],
  );

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
        searchPlaceholder="Search by name, army no, or matric no…"
        totalCount={totalCount}
        shownCount={cadets.length}
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

      {cadets.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No cadets found."
              : "No cadets match the current filters. Try clearing some."
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="name" label="Name" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="matricNo" label="No. Matric" state={state} onChange={guardedUpdate} />
              {showIntakeColumn && (
                <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={guardedUpdate} />
              )}
              <SortableHead columnKey="course" label="Course" state={state} onChange={guardedUpdate} />
              <TableHead>Year</TableHead>
              <TableHead className="pr-5 text-right w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cadets.map((cadet) => {
              const isEditing = inlineEnabled && cadet.id === editingCadetId;

              return (
                <CadetCoursesTableRow
                  key={`${cadet.id}:${isEditing ? "edit" : "view"}`}
                  row={cadet}
                  courses={courses}
                  isEditing={isEditing}
                  editDisabled={hasUnsavedEdit && !isEditing}
                  showIntakeColumn={showIntakeColumn}
                  onEditRequest={() =>
                    inlineEnabled ? onEditStartInline(cadet.id) : onEditRequest(cadet)
                  }
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
        description="You have an unsaved course edit. Changing the table view will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={confirmDiscard}
      />
    </>
  );
}
