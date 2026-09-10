"use client";

import { useMemo, useState } from "react";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import type { IntakeOption } from "@/lib/admin/table-search-params";
import { AccommodationsTable, type AccommodationRow } from "./accommodations-table";
import { EditAccommodationDialog } from "./edit-accommodation-dialog";
import { buildAccommodationsTableConfig } from "./table-config";

type AccommodationsPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  rows: AccommodationRow[];
  totalCount: number;
  isIntakeScoped: boolean;
  intakeFilterOptions: IntakeOption[];
};

export function AccommodationsPageClient({
  searchParams,
  rows,
  totalCount,
  isIntakeScoped,
  intakeFilterOptions,
}: AccommodationsPageClientProps) {
  const isMobile = useIsMobile();
  const tableConfig = useMemo(() => buildAccommodationsTableConfig(), []);
  const inlineEnabled = tableConfig.editMode === "INLINE" && !isMobile;

  const [editingCadetId, setEditingCadetId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<AccommodationRow | null>(null);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Accommodations</h1>
      </div>

      <AccommodationsTable
        rows={rows}
        searchParams={searchParams}
        totalCount={totalCount}
        isIntakeScoped={isIntakeScoped}
        intakeFilterOptions={intakeFilterOptions}
        inlineEnabled={inlineEnabled}
        editingCadetId={editingCadetId}
        onEditStartInline={setEditingCadetId}
        onEditRequest={setEditTarget}
        onEditEnd={() => setEditingCadetId(null)}
      />

      {editTarget && (
        <EditAccommodationDialog
          key={editTarget.cadetId}
          row={editTarget}
          open
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
        />
      )}
    </>
  );
}