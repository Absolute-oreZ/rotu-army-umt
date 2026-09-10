"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { AttendTable, type AttendRecordRow } from "./attend-table";
import { AttendDetailsSheet } from "./attend-details-sheet";
import { AddAttendDialog } from "./add-attend-dialog";
import { DeleteAttendDialog } from "./delete-attend-dialog";

export type CadetOption = {
  id: number;
  label: string;
};

type AttendPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  records: AttendRecordRow[];
  totalCount: number;
  isIntakeScoped: boolean;
  sourceFilterOptions: { value: string; label: string }[];
  intakeFilterOptions: IntakeOption[];
  cadetOptions: CadetOption[];
};

export function AttendPageClient({
  searchParams,
  records,
  totalCount,
  isIntakeScoped,
  sourceFilterOptions,
  intakeFilterOptions,
  cadetOptions,
}: AttendPageClientProps) {
  const [detailsTarget, setDetailsTarget] = useState<{
    record: AttendRecordRow;
    mode: "view" | "edit";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendRecordRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Attend</h1>
        <AddAttendDialog
          cadetOptions={cadetOptions}
          sourceOptions={sourceFilterOptions}
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" data-icon="inline-start" />
              Add Record
            </Button>
          }
        />
      </div>

      <AttendTable
        records={records}
        searchParams={searchParams}
        totalCount={totalCount}
        isIntakeScoped={isIntakeScoped}
        sourceFilterOptions={sourceFilterOptions}
        intakeFilterOptions={intakeFilterOptions}
        onView={(record) => setDetailsTarget({ record, mode: "view" })}
        onEdit={(record) => setDetailsTarget({ record, mode: "edit" })}
        onDelete={(record) => {
          setDeleteError(null);
          setDeleteTarget(record);
        }}
      />

      {detailsTarget && (
        <AttendDetailsSheet
          key={`${detailsTarget.record.id}:${detailsTarget.mode}`}
          record={detailsTarget.record}
          initialMode={detailsTarget.mode}
          sourceOptions={sourceFilterOptions}
          open
          onOpenChange={(v) => {
            if (!v) setDetailsTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteAttendDialog
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