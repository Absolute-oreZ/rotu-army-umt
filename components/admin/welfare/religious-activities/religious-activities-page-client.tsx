"use client";

import { useMemo, useState } from "react";
import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { ReligiousActivitiesTable, type ReligiousActivityRow } from "./religious-activities-table";
import { AddActivityDialog } from "./add-activity-dialog";
import { EditActivityDialog } from "./edit-activity-dialog";
import { ViewPhotosDialog } from "./view-photos-dialog";
import { DeleteActivityDialog } from "./delete-activity-dialog";
import { buildReligiousActivitiesTableConfig } from "./table-config";

type ReligiousActivitiesPageClientProps = {
  searchParams: Record<string, string | string[] | undefined>;
  activities: ReligiousActivityRow[];
  totalCount: number;
  typeOptions: { value: string; label: string }[];
};

export function ReligiousActivitiesPageClient({
  searchParams,
  activities,
  totalCount,
  typeOptions,
}: ReligiousActivitiesPageClientProps) {
  const isMobile = useIsMobile();
  const tableConfig = useMemo(
    () => buildReligiousActivitiesTableConfig(typeOptions),
    [typeOptions],
  );
  const inlineEnabled = tableConfig.editMode === "INLINE" && !isMobile;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<ReligiousActivityRow | null>(null);
  const [photosTarget, setPhotosTarget] = useState<ReligiousActivityRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReligiousActivityRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Religious Activities</h1>
        <AddActivityDialog
          typeOptions={typeOptions}
          trigger={
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              Add Activity
            </Button>
          }
        />
      </div>

      <ReligiousActivitiesTable
        activities={activities}
        searchParams={searchParams}
        totalCount={totalCount}
        typeOptions={typeOptions}
        inlineEnabled={inlineEnabled}
        editingId={editingId}
        onViewPhotos={(activity) => {
          if (editingId !== null) return;
          setError(null);
          setPhotosTarget(activity);
        }}
        onEditStartInline={setEditingId}
        onEditRequest={(activity) => {
          setError(null);
          setEditTarget(activity);
        }}
        onEditEnd={() => setEditingId(null)}
        onDelete={(activity) => {
          if (editingId !== null) return;
          setError(null);
          setDeleteTarget(activity);
        }}
      />

      {error && !deleteTarget && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editTarget && (
        <EditActivityDialog
          key={`edit-${editTarget.id}`}
          activity={editTarget}
          typeOptions={typeOptions}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}

      <ViewPhotosDialog
        key={`photos-${photosTarget?.id ?? "none"}`}
        activity={photosTarget}
        onOpenChange={(open) => {
          if (!open) setPhotosTarget(null);
        }}
      />

      <DeleteActivityDialog
        activity={deleteTarget}
        error={error}
        onError={setError}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}