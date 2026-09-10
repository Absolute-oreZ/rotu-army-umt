"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ClipboardCheckIcon, ClipboardListIcon, EditIcon, Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
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
import { updateAssessmentRecord } from "@/app/admin/sports/assessments/actions";
import { DatePicker } from "@/components/ui/date-picker";

function parseRecordDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatRecordDateInput(value: Date | undefined) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayAfter(value: string) {
  const date = parseRecordDate(value);
  date.setDate(date.getDate() + 1);
  return date;
}

export type RecordListRow = {
  id: number;
  intakeId: number;
  intakeNo: string;
  recordDate: string;
  previousSessionDate: string | null;
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
        searchPlaceholder="Search by title..."
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
  const [editingId, setEditingId] = useState<number | null>(null);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
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
            isEditing={editingId === row.id}
            editDisabled={editingId !== null && editingId !== row.id}
            onEdit={() => setEditingId(row.id)}
            onEditEnd={() => setEditingId(null)}
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
  isEditing,
  editDisabled,
  onEdit,
  onEditEnd,
  onDelete,
  onEnter,
}: {
  recordType: "UKA" | "APFA";
  row: RecordListRow;
  isIntakeScoped: boolean;
  isEditing: boolean;
  editDisabled: boolean;
  onEdit: () => void;
  onEditEnd: () => void;
  onDelete: (row: RecordListRow) => void;
  onEnter: (href: string) => void;
}) {
  const router = useRouter();
  const label = `${recordType}-${row.session}-${row.year}`;
  const [recordDate, setRecordDate] = useState(row.recordDate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!recordDate || isPending) return;
    setError(null);
    const formData = new FormData();
    formData.set("recordType", recordType);
    formData.set("recordId", String(row.id));
    formData.set("recordDate", recordDate);
    startTransition(async () => {
      const result = await updateAssessmentRecord(formData);
      if (result.success) {
        onEditEnd();
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update record.");
      }
    });
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        {!isIntakeScoped && <TableCell>{row.intakeNo}</TableCell>}
        <TableCell>
          <div className="flex flex-col gap-1">
            <DatePicker
              value={parseRecordDate(recordDate)}
              onChange={(date) => setRecordDate(formatRecordDateInput(date))}
              minDate={row.previousSessionDate ? dayAfter(row.previousSessionDate) : new Date(row.year, 0, 1)}
              maxDate={new Date(row.year, 11, 31)}
              className="h-8 w-36"
              disabled={isPending}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </TableCell>
        <TableCell className="tabular-nums">{row.session}</TableCell>
        <TableCell className="tabular-nums">{row.year}</TableCell>
        <TableCell className="tabular-nums">{row.recordedCount}</TableCell>
        <TableCell className="pr-5">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-xs" className="hover:text-emerald-600" onClick={handleSave} disabled={isPending || !recordDate} aria-label="Save record">
              {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
            </Button>
            <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={onEditEnd} disabled={isPending} aria-label="Cancel record edit">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

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
              <Button variant="ghost" size="icon-xs" className="hover:text-sky-600" onClick={onEdit} disabled={editDisabled}>
                <EditIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit record</TooltipContent>
          </Tooltip>
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