"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheckIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Empty } from "@/components/ui/empty";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import type { AssessmentStandard } from "@/lib/assessment/types";
import { AssessmentsTable, type AssessmentRow } from "./assessments-table";
import { EditAssessmentDialog } from "./edit-assessment-dialog";
import { buildAssessmentsTableConfig } from "./table-config";

export type AssessmentRecordOption = {
  key: string;
  type: "UKA" | "APFA";
  label: string;
};

type StandardsByGender = {
  MALE: AssessmentStandard[];
  FEMALE: AssessmentStandard[];
};

type AssessmentsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  records: AssessmentRecordOption[];
  recordKey: string | null;
  recordId: number | null;
  recordType: "UKA" | "APFA" | null;
  isIntakeScoped: boolean;
  intakeFilterOptions: IntakeOption[];
  platoonFilterOptions: IntakeOption[];
  rows: AssessmentRow[];
  totalCount: number;
  standards: StandardsByGender | null;
};

export function AssessmentsPageClient({
  searchParams,
  records,
  recordKey,
  recordId,
  recordType,
  isIntakeScoped,
  intakeFilterOptions,
  platoonFilterOptions,
  rows,
  totalCount,
  standards,
}: AssessmentsPageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const tableConfig = useMemo(
    () => buildAssessmentsTableConfig(recordType ?? "UKA"),
    [recordType],
  );
  const inlineEnabled = tableConfig.editMode === "INLINE" && !isMobile;

  const [editingCadetId, setEditingCadetId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<AssessmentRow | null>(null);
  const [pendingRecordId, setPendingRecordId] = useState<string | null>(null);

  const selectedRecord = records.find((r) => r.key === recordKey) ?? null;
  const hasUnsavedEdit = editingCadetId !== null || editTarget !== null;

  const navigateToRecord = useCallback(
    (value: string) => {
      const current = new URLSearchParams(window.location.search);
      if (value) {
        current.set("record", value);
      } else {
        current.delete("record");
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
        <h1 className="text-2xl font-semibold">Assessments</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-72">
          <Select
            value={recordKey ?? ""}
            onValueChange={requestRecordNavigation}
          >
            <SelectTrigger>
              {selectedRecord?.label ?? "Select record"}
            </SelectTrigger>
            <SelectContent>
              {records.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {records.length === 0 ? (
        <Empty
          title="No assessment records"
          description="Create a UKA or APFA record from the UKA or APFA page to start recording results."
          icon={<ClipboardCheckIcon className="size-5 text-muted-foreground" />}
        />
      ) : recordKey === null || recordType === null || recordId === null ? (
        <Empty
          title="No record selected"
          description="Select a UKA or APFA record above to enter cadet results."
          icon={<ClipboardCheckIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <AssessmentsTable
          recordType={recordType}
          standards={standards}
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

      {editTarget && recordId !== null && recordType !== null && (
        <EditAssessmentDialog
          key={editTarget.cadetId}
          row={editTarget}
          recordType={recordType}
          recordId={recordId}
          standards={standards}
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
        description="You have an unsaved assessment edit. Switching records will discard it."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={handleDiscardAndNavigate}
      />
    </>
  );
}