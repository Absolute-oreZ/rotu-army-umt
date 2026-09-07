"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheckIcon, ClipboardListIcon, Trash2Icon } from "lucide-react";
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
import { buildRecordsTableConfig } from "./table-config";

export type RecordListRow = {
  id: number;
  intakeNo: string;
  recordDate: string;
  session: number;
  year: number;
  recordedCount: number;
};

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

type RecordsTableProps = {
  recordType: "UKA" | "APFA";
  rows: RecordListRow[];
  searchParams: Record<string, string | string[] | undefined>;
  totalCount: number;
  isIntakeScoped: boolean;
  intakeFilterOptions: IntakeOption[];
  onDelete: (row: RecordListRow) => void;
};

export function RecordsTable({
  recordType,
  rows,
  searchParams,
  totalCount,
  isIntakeScoped,
  intakeFilterOptions,
  onDelete,
}: RecordsTableProps) {
  const router = useRouter();
  const config = useMemo(
    () => buildRecordsTableConfig(intakeFilterOptions),
    [intakeFilterOptions],
  );
  const { state, update, reset, totalPages } = useTableURL({ searchParams, config, totalCount });
  const isDefault = isTableStateDefault(state, config);

  return (
    <>
      <TableToolbar
        showRefreshButton
        searchPlaceholder="Search by intake..."
        totalCount={totalCount}
        shownCount={rows.length}
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

      {rows.length === 0 ? (
        <Empty
          title="No records"
          description={
            isDefault
              ? `No ${recordType} records yet. Create one to start recording assessments.`
              : "No records match the current filters. Try clearing some."
          }
          icon={<ClipboardCheckIcon className="size-5 text-muted-foreground" />}
          action={
            !isDefault ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <RecordsTableBody
          recordType={recordType}
          rows={rows}
          state={state}
          onChange={update}
          isIntakeScoped={isIntakeScoped}
          onDelete={onDelete}
          onEnter={(href) => router.push(href)}
        />
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

function RecordsTableBody({
  recordType,
  rows,
  state,
  onChange,
  isIntakeScoped,
  onDelete,
  onEnter,
}: {
  recordType: "UKA" | "APFA";
  rows: RecordListRow[];
  state: ReturnType<typeof useTableURL>["state"];
  onChange: (patch: Parameters<ReturnType<typeof useTableURL>["update"]>[0]) => void;
  isIntakeScoped: boolean;
  onDelete: (row: RecordListRow) => void;
  onEnter: (href: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          {!isIntakeScoped && <TableHead>Intake</TableHead>}
          <SortableHead columnKey="recordDate" label="Record Date" state={state} onChange={onChange} />
          <SortableHead columnKey="session" label="Session" state={state} onChange={onChange} />
          <SortableHead columnKey="year" label="Year" state={state} onChange={onChange} />
          <TableHead>Recorded</TableHead>
          <TableHead className="w-24 pr-5 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <RecordRow
            key={row.id}
            recordType={recordType}
            row={row}
            isIntakeScoped={isIntakeScoped}
            onDelete={onDelete}
            onEnter={onEnter}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function RecordRow({
  recordType,
  row,
  isIntakeScoped,
  onDelete,
  onEnter,
}: {
  recordType: "UKA" | "APFA";
  row: RecordListRow;
  isIntakeScoped: boolean;
  onDelete: (row: RecordListRow) => void;
  onEnter: (href: string) => void;
}) {
  const label = `${recordType}-${row.session}-${row.year}`;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <CopyableValue value={label} valueClassName="font-medium">
          {label}
        </CopyableValue>
      </TableCell>
      {!isIntakeScoped && <TableCell>{row.intakeNo}</TableCell>}
      <TableCell className="tabular-nums">{formatRecordDate(row.recordDate)}</TableCell>
      <TableCell className="tabular-nums">{row.session}</TableCell>
      <TableCell className="tabular-nums">{row.year}</TableCell>
      <TableCell className="tabular-nums">{row.recordedCount}</TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-sky-600"
                onClick={() => onEnter(`/admin/sports/assessments?record=${recordType}:${row.id}`)}
              >
                <ClipboardListIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Enter results</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-red-600"
                onClick={() => onDelete(row)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete record</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}