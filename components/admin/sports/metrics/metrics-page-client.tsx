"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulseIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Empty } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { MetricsTable, type MetricRow } from "./metrics-table";
import { CreateRecordDialog } from "./create-record-dialog";
import { EditMetricDialog } from "./edit-metric-dialog";
import { DeleteRecordDialog } from "./delete-record-dialog";
import { buildMetricsTableConfig } from "./table-config";
import { SearchableSelect } from "@/components/admin/academic/shared/searchable-select";

export type RecordOption = {
  id: number;
  label: string;
};

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

type MetricsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  records: RecordOption[];
  recordId: number | null;
  rows: MetricRow[];
  totalCount: number;
  isIntakeScoped: boolean;
  intakeOptions: DialogIntakeOption[];
  intakeFilterOptions: IntakeOption[];
  platoonFilterOptions: IntakeOption[];
};

export function MetricsPageClient({
  searchParams,
  records,
  recordId,
  rows,
  totalCount,
  isIntakeScoped,
  intakeOptions,
  intakeFilterOptions,
  platoonFilterOptions,
}: MetricsPageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const tableConfig = useMemo(
    () => buildMetricsTableConfig(intakeFilterOptions, platoonFilterOptions),
    [intakeFilterOptions, platoonFilterOptions],
  );
  const inlineEnabled = tableConfig.editMode === "INLINE" && !isMobile;

  const [editingCadetId, setEditingCadetId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<MetricRow | null>(null);
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecordOption | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedRecord = records.find((r) => r.id === recordId) ?? null;
  const hasUnsavedEdit = editingCadetId !== null || editTarget !== null;

  const navigateToRecord = useCallback(
    (value: string) => {
      const current = new URLSearchParams(window.location.search);
      if (value) {
        current.set("recordId", value);
      } else {
        current.delete("recordId");
      }
      const qs = current.toString();
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const requestRecordNavigation = useCallback(
    (value: string) => {
      if (hasUnsavedEdit) {
        setPendingRecordId(value);
        return;
      }
      navigateToRecord(value);
    },
    [hasUnsavedEdit, navigateToRecord],
  );

  const handleDiscardAndNavigate = useCallback(() => {
    setEditingCadetId(null);
    setEditTarget(null);
    if (pendingRecordId !== null) navigateToRecord(pendingRecordId);
    setPendingRecordId(null);
  }, [navigateToRecord, pendingRecordId]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Metrics</h1>
        <CreateRecordDialog
          intakeOptions={intakeOptions}
          isAdminIntakeScoped={isIntakeScoped}
          onCreated={(id) => requestRecordNavigation(String(id))}
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" data-icon="inline-start" />
              New Record
            </Button>
          }
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="w-64">
                <SearchableSelect
                  value={recordId !== null ? String(recordId) : ""}
                  options={records.map((r) => ({ value: String(r.id), label: r.label }))}
                  onChange={requestRecordNavigation}
                  placeholder="Select record…"
                  searchPlaceholder="Search record…"
                  emptyLabel="No records found"
                  ariaLabel="Select health record"
                />
              </div>

        {selectedRecord && (
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className="hover:text-red-600"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteTarget(selectedRecord);
                }}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Delete record</TooltipContent>
          </Tooltip>
        )}
      </div>

      {records.length === 0 ? (
        <Empty
          title="No records"
          description="Create a health record to start recording cadet metrics."
          icon={<HeartPulseIcon className="size-5 text-muted-foreground" />}
        />
      ) : recordId === null ? (
        <Empty
          title="No record selected"
          description="Select a health record above to view and edit cadet metrics."
          icon={<HeartPulseIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <MetricsTable
          rows={rows}
          searchParams={searchParams}
          totalCount={totalCount}
          recordId={recordId}
          isIntakeScoped={isIntakeScoped}
          intakeFilterOptions={intakeFilterOptions}
          platoonFilterOptions={platoonFilterOptions}
          editingCadetId={editingCadetId}
          inlineEnabled={inlineEnabled}
          onEditStartInline={setEditingCadetId}
          onEditRequest={setEditTarget}
          onEditEnd={() => setEditingCadetId(null)}
        />
      )}

      {editTarget && recordId !== null && (
        <EditMetricDialog
          key={editTarget.cadetId}
          row={editTarget}
          recordId={recordId}
          open
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
        />
      )}

      <ConfirmDialog
        open={pendingRecordId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRecordId(null);
        }}
        title="Discard unsaved changes?"
        description="You have an unsaved metric edit. Switching records will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={handleDiscardAndNavigate}
      />

      {deleteTarget && (
        <DeleteRecordDialog
          record={deleteTarget}
          error={deleteError}
          onError={setDeleteError}
          open
          onOpenChange={(v) => {
            if (!v) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        />
      )}
    </>
  );
}
