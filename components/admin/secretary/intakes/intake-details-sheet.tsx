"use client";

import { useState, useTransition, useEffect } from "react";
import { PencilIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getIntakeDetails,
  updateIntake,
  type IntakeDetails,
} from "@/app/admin/secretary/intakes/actions";
import { Field } from "@/components/ui/field";

const INTAKE_NO_RE = /^\d+\/\d+$/;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-blue-500/15 text-blue-400",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400",
  ARCHIVED: "bg-orange-500/15 text-orange-400",
};

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function IntakeDetailsSheet({
  intakeId,
  initialMode,
  open,
  onOpenChange,
}: {
  intakeId: number;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-125 max-w-[calc(100vw-2rem)] p-0">
        {open && (
          <SheetInner
            key={`${intakeId}-${refreshKey}`}
            intakeId={intakeId}
            initialMode={initialMode}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  intakeId,
  initialMode,
  onRefresh,
}: {
  intakeId: number;
  initialMode: "view" | "edit";
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<IntakeDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getIntakeDetails(intakeId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
      } else {
        setDetails(res.data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [intakeId]);

  if (loading) {
    return (
      <SheetSkeleton />
    );
  }

  if (fetchError || !details) {
    return (
      <>
        <SheetHeader><SheetTitle>Error</SheetTitle></SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Intake not found."}
        </div>
      </>
    );
  }

  if (mode === "view") {
    return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  }

  return (
    <EditMode
      details={details}
      onCancel={() => setMode("view")}
      onSaved={() => { setMode("view"); onRefresh(); }}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ViewMode({ details: d, onEdit }: { details: IntakeDetails; onEdit: () => void }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{d.displayName}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Basic Information
            </h3>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? ""}`}>
                {STATUS_LABELS[d.status] ?? d.status}
              </span>
              <span className="text-xs text-muted-foreground">{d.cadetCount} active cadets</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Intake No" value={d.intakeNo} />
              <DetailRow label="Start Year" value={String(d.startYear)} />
              <DetailRow label="Slug" value={d.slug} />
            </div>
            {d.tagLine && <DetailRow label="Tagline" value={d.tagLine} />}
          </section>
        </div>
      </div>

      <SheetFooter>
        <Button onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditMode({
  details: initial,
  onCancel,
  onSaved,
}: {
  details: IntakeDetails;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [intakeNo, setIntakeNo] = useState(initial.intakeNo);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [startYear, setStartYear] = useState(String(initial.startYear));
  const [tagLine, setTagLine] = useState(initial.tagLine ?? "");
  const [status, setStatus] = useState<Status>(initial.status);

  const formValid =
    INTAKE_NO_RE.test(intakeNo) &&
    displayName.trim() !== "" &&
    Number.isFinite(Number(startYear)) &&
    Number(startYear) >= 2000 &&
    Number(startYear) <= 2100;

  function handleSubmit() {
    if (!formValid) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("intakeId", String(initial.id));
      fd.append("intakeNo", intakeNo);
      fd.append("displayName", displayName);
      fd.append("startYear", startYear);
      if (tagLine) fd.append("tagLine", tagLine);
      fd.append("status", status);

      const result = await updateIntake(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit {initial.displayName}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Intake No" required>
              <Input value={intakeNo} onChange={(e) => setIntakeNo(e.target.value)} />
              <span className="text-[11px] text-muted-foreground/60">Format: X/Y</span>
            </Field>
            <Field label="Display Name" required>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Start Year" required>
              <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger>{STATUS_LABELS[status]}</SelectTrigger>
                <SelectContent>
                  {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tagline">
              <Input value={tagLine} onChange={(e) => setTagLine(e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!formValid || isPending}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
