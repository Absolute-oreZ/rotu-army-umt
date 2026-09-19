"use client";

import { useCallback, useMemo } from "react";
import { BookOpenIcon } from "lucide-react";
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
import { isTableStateDefault, type RawSearchParams } from "@/lib/admin/table-search-params";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buildCoursesManagementTableConfig } from "./table-config";
import { CourseManagementTableRow } from "./courses-management-table-row";

export type CourseManagementRow = {
  id: number;
  slug: string;
  name: string;
  completionYear: number;
  isSupported: boolean;
  enrolledCount: number;
};

type CoursesManagementTableProps = {
  courses: CourseManagementRow[];
  searchParams: RawSearchParams;
  totalCount: number;
  editingCourseId: number | null;
  inlineEnabled: boolean;
  onEditStartInline: (courseId: number) => void;
  onEditRequest: (course: CourseManagementRow) => void;
  onEditEnd: () => void;
  onDeleteRequest: (course: CourseManagementRow) => void;
};

export function CoursesManagementTable({
  courses,
  searchParams,
  totalCount,
  editingCourseId,
  inlineEnabled,
  onEditStartInline,
  onEditRequest,
  onEditEnd,
  onDeleteRequest,
}: CoursesManagementTableProps) {
  const config = useMemo(() => buildCoursesManagementTableConfig("c_"), []);

  const { state, update, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);
  const hasUnsavedEdit = editingCourseId !== null;

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
        searchPlaceholder="Search by course name…"
        totalCount={totalCount}
        shownCount={courses.length}
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

      {courses.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No courses found."
              : "No courses match the current filters. Try clearing some."
          }
          icon={<BookOpenIcon className="size-5 text-muted-foreground" />}
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
              <SortableHead columnKey="name" label="Course Name" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="completionYear" label="Duration" state={state} onChange={guardedUpdate} />
              <SortableHead columnKey="isSupported" label="Supported" state={state} onChange={guardedUpdate} />
              <TableHead>Cadets Enrolled</TableHead>
              <TableHead className="pr-5 text-right w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => {
              const isEditing = inlineEnabled && course.id === editingCourseId;

              return (
                <CourseManagementTableRow
                  key={`${course.id}:${isEditing ? "edit" : "view"}`}
                  course={course}
                  isEditing={isEditing}
                  editDisabled={hasUnsavedEdit && !isEditing}
                  onEditRequest={() =>
                    inlineEnabled ? onEditStartInline(course.id) : onEditRequest(course)
                  }
                  onEditEnd={onEditEnd}
                  onDeleteRequest={() => onDeleteRequest(course)}
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
