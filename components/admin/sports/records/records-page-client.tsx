"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { RecordsTable, type RecordListRow } from "./records-table";
import { CreateRecordDialog } from "./create-record-dialog";
import { DeleteRecordDialog } from "./delete-record-dialog";

type DialogIntakeOption = {
  id: number;
  intakeNo: string;
};

type RecordsPageClientProps = {
  recordType: "UKA" | "APFA";
  searchParams: Record<string, string | string[] | undefined>;
  records: RecordListRow[];
  totalCount: number;
  isIntakeScoped: boolean;
  intakeOptions: DialogIntakeOption[];
  intakeFilterOptions: IntakeOption[];
};

export function RecordsPageClient({
  recordType,
  searchParams,
  records,
  totalCount,
  isIntakeScoped,
  intakeOptions,
  intakeFilterOptions,
}: RecordsPageClientProps) {
  const [deleteTarget, setDeleteTarget] = useState<RecordListRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{recordType} Records</h1>
        <CreateRecordDialog
          recordType={recordType}
          intakeOptions={intakeOptions}
          isAdminIntakeScoped={isIntakeScoped}
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" data-icon="inline-start" />
              New Record
            </Button>
          }
        />
      </div>

      <RecordsTable
        recordType={recordType}
        rows={records}
        searchParams={searchParams}
        totalCount={totalCount}
        isIntakeScoped={isIntakeScoped}
        intakeFilterOptions={intakeFilterOptions}
        onDelete={(row) => {
          setDeleteError(null);
          setDeleteTarget(row);
        }}
      />

      {deleteTarget && (
        <DeleteRecordDialog
          recordType={recordType}
          record={{
            id: deleteTarget.id,
            label: `${recordType}-${deleteTarget.session}-${deleteTarget.year}`,
          }}
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