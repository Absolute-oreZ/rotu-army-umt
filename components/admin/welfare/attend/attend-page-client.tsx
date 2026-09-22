"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { AttendTable, type AttendRecordRow } from "./attend-table";
import { AddAttendDialog } from "./add-attend-dialog";
import { DeleteAttendDialog } from "./delete-attend-dialog";

type AttendPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  records: AttendRecordRow[];
  totalCount: number;
  isIntakeScoped: boolean;
  sourceFilterOptions: { value: string; label: string }[];
  intakeFilterOptions: IntakeOption[];
};

export function AttendPageClient({
  searchParams,
  records,
  totalCount,
  isIntakeScoped,
  sourceFilterOptions,
  intakeFilterOptions,
}: AttendPageClientProps) {
  const [deleteTarget, setDeleteTarget] = useState<AttendRecordRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Attend</h1>
        <AddAttendDialog
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
        onDelete={(record) => {
          setDeleteError(null);
          setDeleteTarget(record);
        }}
      />

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