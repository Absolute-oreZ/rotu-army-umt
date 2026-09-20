"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, GraduationCapIcon } from "lucide-react";
import { Empty } from "@/components/ui/empty";
import type { RawSearchParams } from "@/lib/admin/table-search-params";
import type { AcademicSessionOption } from "@/lib/academic/helpers";
import { PdfPreviewDialog } from "@/components/admin/academic/shared/pdf-preview-dialog";
import { UploadResultSlipDialog } from "./upload-result-slip-dialog";
import { ResultsTable, type ResultRow } from "./results-table";
import { getResultSlipSignedUrlAction } from "@/app/admin/academic/results/actions";
import { SearchableSelect } from "@/components/admin/academic/shared/searchable-select";

export type ResultsPageClientProps = {
  searchParams: RawSearchParams;
  sessions: AcademicSessionOption[];
  sessionId: number | null;
  rows: ResultRow[];
  totalCount: number;
  showIntakeColumn: boolean;
};

type PdfTarget = {
  title: string;
  fileName: string;
};

export function ResultsPageClient({
  searchParams,
  sessions,
  sessionId,
  rows,
  totalCount,
  showIntakeColumn,
}: ResultsPageClientProps) {
  const router = useRouter();

  const [editingResultId, setEditingResultId] = useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = useState<ResultRow | null>(null);
  const [pdfTarget, setPdfTarget] = useState<PdfTarget | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedSession = sessions.find((s) => s.id === sessionId) ?? null;

  const navigateToSession = useCallback(
    (value: string) => {
      if (editingResultId !== null) return;
      const current = new URLSearchParams(window.location.search);
      if (value) {
        current.set("sessionId", value);
      } else {
        current.delete("sessionId");
      }
      const qs = current.toString();
      router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [editingResultId, router],
  );

  const handleViewSlip = useCallback(
    (row: ResultRow) => {
      setError(null);
      setPdfUrl(null);
      setPdfTarget({
        title: `Result Slip — ${row.name}`,
        fileName: `result-slip-${selectedSession?.title ?? sessionId ?? "session"}.pdf`,
      });

      startTransition(async () => {
        const res = await getResultSlipSignedUrlAction(row.resultId);
        if (!res.success || !res.data) {
          setError(res.success ? "Could not generate download URL." : res.error);
          setPdfTarget(null);
          return;
        }
        setPdfUrl(res.data.signedUrl);
      });
    },
    [selectedSession, sessionId],
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Results</h1>
      </div>

      {error && (
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
                  onChange={navigateToSession}
                  placeholder="Select session…"
                  searchPlaceholder="Search session…"
                  emptyLabel="No sessions found"
                  ariaLabel="Select academic session"
                />
              </div>
            </div>

      {sessions.length === 0 ? (
        <Empty
          title="No academic sessions"
          description="No sessions have been provisioned for this intake yet."
          icon={<GraduationCapIcon className="size-5 text-muted-foreground" />}
        />
      ) : sessionId === null ? (
        <Empty
          title="No session selected"
          description="Select an academic session above to view and record cadet results."
          icon={<GraduationCapIcon className="size-5 text-muted-foreground" />}
        />
      ) : (
        <ResultsTable
          rows={rows}
          searchParams={searchParams}
          totalCount={totalCount}
          showIntakeColumn={showIntakeColumn}
          editingResultId={editingResultId}
          onEditStart={setEditingResultId}
          onEditEnd={() => setEditingResultId(null)}
          onViewSlip={handleViewSlip}
          onUploadSlip={(row) => setUploadTarget(row)}
        />
      )}

      {uploadTarget && (
        <UploadResultSlipDialog
          row={{
            resultId: uploadTarget.resultId,
            name: uploadTarget.name,
            hasSlip: uploadTarget.resultSlipPath !== null,
          }}
          open
          onOpenChange={(open) => {
            if (!open) setUploadTarget(null);
          }}
        />
      )}

      {pdfTarget && (
              <PdfPreviewDialog
                title={pdfTarget.title}
                pdfUrl={pdfUrl}
                fileName={pdfTarget.fileName}
                open={Boolean(pdfUrl)}
                onOpenChange={(open) => {
                  if (!open) {
                    setPdfTarget(null);
                    setPdfUrl(null);
                  }
                }}
              />
            )}

            {isPending && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Loading result slip…
        </p>
      )}
    </>
  );
}
