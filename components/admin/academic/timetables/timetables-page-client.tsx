"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircleIcon,
  CalendarIcon,
  EyeIcon,
  FileUpIcon,
  PencilIcon,
} from "lucide-react";
import { Empty } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { PdfPreviewDialog } from "@/components/admin/academic/shared/pdf-preview-dialog";
import { TimetableSchedule } from "./timetable-schedule";
import { TimetableInlineEditor } from "./timetable-inline-editor";
import { UploadTimetablePdfDialog } from "./upload-timetable-pdf-dialog";
import { getTimetablePdfSignedUrlAction } from "@/app/admin/academic/timetables/actions";
import { storageUrl } from "@/lib/supabase/storage-public";
import type { AcademicSessionOption } from "@/lib/academic/helpers";
import { SearchableSelect } from "@/components/admin/academic/shared/searchable-select";
import { formatRank } from "@/components/admin/secretary/cadets/table-config";

export type CadetSummary = {
  cadetId: number;
  armyNo: number;
  rank: string;
  name: string;
  displayName: string;
  matricNo: string;
  avatarPath: string | null;
  courseName: string | null;
  currentYear: number;
  completionYear: number;
  isCourseCompleted: boolean;
};

export type TimetableRecord = {
  id: number;
  occupiedSlots: string[];
  timetablePdfPath: string | null;
};

type TimetablesPageClientProps = {
  sessions: AcademicSessionOption[];
  sessionId: number | null;
  cadets: CadetSummary[];
  cadetId: number | null;
  timetable: TimetableRecord | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TimetablesPageClient({
  sessions,
  sessionId,
  cadets,
  cadetId,
  timetable,
}: TimetablesPageClientProps) {
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCadet = cadets.find((c) => c.cadetId === cadetId) ?? null;
  const selectedSession = sessions.find((s) => s.id === sessionId) ?? null;

  const cadetOptions = useMemo(
    () =>
      cadets.map((cadet) => ({
        value: String(cadet.cadetId),
        label: `${cadet.name} (${cadet.armyNo} · ${cadet.matricNo})`,
      })),
    [cadets],
  );

  function navigate(params: { sessionId?: number | null; cadetId?: number | null }) {
    setEditMode(false);
    const current = new URLSearchParams(window.location.search);
    if (params.sessionId !== undefined) {
      if (params.sessionId !== null) current.set("sessionId", String(params.sessionId));
      else current.delete("sessionId");
    }
    if (params.cadetId !== undefined) {
      if (params.cadetId !== null) current.set("cadetId", String(params.cadetId));
      else current.delete("cadetId");
    }
    const qs = current.toString();
    router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleViewPdf() {
    if (!timetable?.timetablePdfPath || !selectedCadet || !selectedSession) return;
    setError(null);
    setPdfUrl(null);
    setPdfTitle(`Timetable — ${selectedCadet.name} (${selectedSession.title})`);

    startTransition(async () => {
      const res = await getTimetablePdfSignedUrlAction(timetable.id);
      if (!res.success || !res.data) {
        setError(res.success ? "Could not generate download URL." : res.error);
        setPdfTitle(null);
        return;
      }
      setPdfUrl(res.data.signedUrl);
    });
  }

  const avatar = selectedCadet?.avatarPath ? storageUrl(selectedCadet.avatarPath) : null;

  // Cadet info card component
      const cadetInfoCard = selectedCadet && (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 mb-4 w-full">
          <span className="relative inline-flex size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted mt-1">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={48}
                height={48}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-base font-semibold uppercase text-muted-foreground">
                {getInitials(selectedCadet.name)}
              </span>
            )}
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
                          <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                            #{selectedCadet.armyNo}
                          </span>
                          <span className="font-mono text-sm text-muted-foreground uppercase whitespace-nowrap">
                            {formatRank(selectedCadet.rank)}
                          </span>
                          <p className="font-mono text-sm text-muted-foreground uppercase whitespace-nowrap">
                            {selectedCadet.name}
                          </p>
                        </div>
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
                {selectedCadet.matricNo}
              </span>
            </div>
          </div>
          {selectedCadet.courseName ? (
            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary whitespace-nowrap shrink-0 self-start mt-1">
              {selectedCadet.courseName}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md border border-dashed border-border bg-muted/30 px-3 py-1 text-sm text-muted-foreground whitespace-nowrap shrink-0 self-start mt-1">
              Unassigned
            </span>
          )}
        </div>
      );

  // Timetable view/edit component
  const timetableContent = !timetable ? (
    <Empty
      title="No timetable record"
      description="No timetable record exists for this cadet in the selected session."
      icon={<CalendarIcon className="size-5 text-muted-foreground" />}
    />
  ) : editMode && selectedSession ? (
    <TimetableInlineEditor
      key={timetable.id}
      timetableId={timetable.id}
      occupiedSlots={timetable.occupiedSlots}
      onExit={() => setEditMode(false)}
    />
  ) : (
    <TimetableSchedule mode="view" occupiedSlots={timetable.occupiedSlots} />
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Timetables</h1>
      </div>

      {error && !editMode && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="w-72">
                <SearchableSelect
                  value={sessionId !== null ? String(sessionId) : ""}
                  options={sessions.map((s) => ({ value: String(s.id), label: s.title }))}
                  onChange={(value) => navigate({ sessionId: Number(value), cadetId: null })}
                  placeholder="Select session…"
                  searchPlaceholder="Search session…"
                  emptyLabel="No sessions found"
                  ariaLabel="Select academic session"
                />
              </div>

              {selectedSession && cadets.length > 0 && (
                <div className="w-64">
                  <SearchableSelect
                    value={cadetId !== null ? String(cadetId) : ""}
                    options={cadetOptions}
                    onChange={(value) => navigate({ cadetId: value ? Number(value) : null })}
                    placeholder="Select cadet…"
                    searchPlaceholder="Search name, army no, matric no…"
                    emptyLabel="No cadets found"
                    ariaLabel="Select cadet"
                  />
                </div>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {selectedCadet && timetable && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      <PencilIcon className="size-3.5" />
                      {editMode ? "Editing…" : "Edit Timetable"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleViewPdf}
                      disabled={timetable.timetablePdfPath === null || isPending}
                      className="gap-1.5"
                    >
                      <EyeIcon className="size-3.5" />
                      View Timetable PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                      className="gap-1.5"
                    >
                      <FileUpIcon className="size-3.5" />
                      {timetable.timetablePdfPath ? "Replace Timetable PDF" : "Upload Timetable PDF"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {cadetInfoCard}

            {sessions.length === 0 ? (
        <Empty
          title="No academic sessions"
          description="No sessions have been provisioned for this intake yet."
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
        />
      ) : sessionId === null ? (
        <Empty
          title="No session selected"
          description="Select an academic session above to manage cadet timetables."
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
        />
      ) : cadets.length === 0 ? (
        <Empty
          title="No active cadets"
          description="No active cadets found for this session's intake."
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
        />
      ) : !selectedCadet ? (
        <Empty
          title="No cadet selected"
          description="Select a cadet above to view and edit their timetable."
          icon={<CalendarIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        timetableContent
      )}

      {selectedCadet && timetable && selectedSession && (
              <UploadTimetablePdfDialog
                row={{
                  timetableId: timetable.id,
                  sessionId: selectedSession.id,
                  cadetId: selectedCadet.cadetId,
                  name: selectedCadet.name,
                  hasSlip: timetable.timetablePdfPath !== null,
                }}
                open={uploadOpen}
                onOpenChange={setUploadOpen}
              />
            )}

      {pdfTitle && (
        <PdfPreviewDialog
          title={pdfTitle}
          pdfUrl={pdfUrl}
          fileName={`timetable-${sessionId ?? "session"}.pdf`}
          open={Boolean(pdfUrl)}
          onOpenChange={(open) => {
            if (!open) {
              setPdfTitle(null);
              setPdfUrl(null);
            }
          }}
        />
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Loading timetable PDF…
        </p>
      )}
    </>
  );
}