"use client";

import { useMemo } from "react";
import { CalendarXIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CopyableValue } from "@/components/admin/data-table/copyable-value";
import { TableToolbar } from "@/components/admin/data-table/table-toolbar";
import { GlobalFilterBar } from "@/components/admin/data-table/global-filter-bar";
import { SortableHead } from "@/components/admin/data-table/sortable-head";
import { Pagination } from "@/components/admin/data-table/pagination";
import { useTableURL } from "@/lib/admin/use-table-url";
import { isTableStateDefault, type IntakeOption } from "@/lib/admin/table-search-params";
import { Empty } from "@/components/ui/empty";
import { CadetProfileCell } from "@/components/admin/sports/cadet-profile-cell";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";
import { cn } from "@/lib/utils";
import { buildAttendTableConfig } from "./table-config";

export type AttendRecordRow = {
  id: number;
  cadetId: number;
  armyNo: number;
  rank: string;
  name: string;
  avatarPath: string | null;
  intakeNo: string;
  recordDate: string;
  attendType: "B" | "C";
  source: string;
  createdAt: string;
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  B: "bg-sky-600/15 text-sky-600",
  C: "bg-violet-600/15 text-violet-600",
};

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

type AttendTableProps = {
  records: AttendRecordRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  isIntakeScoped: boolean;
  sourceFilterOptions: { value: string; label: string }[];
  intakeFilterOptions: IntakeOption[];
  onView: (record: AttendRecordRow) => void;
  onEdit: (record: AttendRecordRow) => void;
  onDelete: (record: AttendRecordRow) => void;
};

export function AttendTable({
  records,
  searchParams,
  totalCount,
  isIntakeScoped,
  sourceFilterOptions,
  intakeFilterOptions,
  onView,
  onEdit,
  onDelete,
}: AttendTableProps) {
  const config = useMemo(
    () => buildAttendTableConfig(sourceFilterOptions, intakeFilterOptions),
    [sourceFilterOptions, intakeFilterOptions],
  );

  const { state, update, reset, totalPages } = useTableURL({
    searchParams,
    config,
    totalCount,
  });

  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by name or army no..."
        totalCount={totalCount}
        shownCount={records.length}
        state={state}
        onChange={update}
        onReset={reset}
        isDefault={isDefault}
      />

      <div className="mb-4">
        <GlobalFilterBar
          filters={state.filters}
          sortRules={state.sortRules}
          filterColumns={config.filterColumns}
          sortKeys={config.sortKeys}
          sortLabels={config.sortLabels}
          onFilterUpdate={(filters) => update({ filters, page: 1 })}
          onSortUpdate={(sortRules) => update({ sortRules })}
        />
      </div>

      {records.length === 0 ? (
        <Empty
          title="No results"
          description={
            isDefault
              ? "No attend records yet."
              : "No records match the current filters. Try clearing some."
          }
          icon={<CalendarXIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
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
              <SortableHead columnKey="armyNo" label="Army No" state={state} onChange={update} />
              <SortableHead columnKey="rank" label="Rank" state={state} onChange={update} />
              <SortableHead columnKey="name" label="Name" state={state} onChange={update} />
              {!isIntakeScoped && (
                <SortableHead columnKey="intakeNo" label="Intake" state={state} onChange={update} />
              )}
              <SortableHead columnKey="recordDate" label="Date" state={state} onChange={update} />
              <SortableHead columnKey="attendType" label="Attend Type" state={state} onChange={update} />
              <SortableHead columnKey="source" label="Source" state={state} onChange={update} />
              <TableHead className="w-28 pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <AttendRecordRowView
                key={record.id}
                record={record}
                isIntakeScoped={isIntakeScoped}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        state={state}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSizeOptions={config.pageSizeOptions}
        onChange={update}
      />
    </>
  );
}

function AttendRecordRowView({
  record,
  isIntakeScoped,
  onView,
  onEdit,
  onDelete,
}: {
  record: AttendRecordRow;
  isIntakeScoped: boolean;
  onView: (record: AttendRecordRow) => void;
  onEdit: (record: AttendRecordRow) => void;
  onDelete: (record: AttendRecordRow) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <CadetProfileCell name={record.name} avatarPath={record.avatarPath} />
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        <CopyableValue value={record.armyNo} valueClassName="font-mono tabular-nums">
          {record.armyNo}
        </CopyableValue>
      </TableCell>
      <TableCell>{formatRank(record.rank)}</TableCell>
      <TableCell className="font-medium">
        <CopyableValue value={record.name} valueClassName="font-medium">
          {record.name}
        </CopyableValue>
      </TableCell>
      {!isIntakeScoped && <TableCell>{record.intakeNo}</TableCell>}
      <TableCell className="tabular-nums">{formatRecordDate(record.recordDate)}</TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            TYPE_BADGE_STYLES[record.attendType],
          )}
        >
          {record.attendType}
        </span>
      </TableCell>
      <TableCell>
        <CopyableValue value={record.source}>{record.source}</CopyableValue>
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-sky-600"
                onClick={() => onView(record)}
                aria-label={`View attend record for ${record.name}`}
              >
                <EyeIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-sky-600"
                onClick={() => onEdit(record)}
                aria-label={`Edit attend record for ${record.name}`}
              >
                <PencilIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-red-600"
                onClick={() => onDelete(record)}
                aria-label={`Delete attend record for ${record.name}`}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}