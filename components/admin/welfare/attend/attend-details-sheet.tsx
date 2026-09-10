"use client";

import { useState, useTransition } from "react";
import { AlertCircleIcon, Loader2Icon, PencilIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateAttendRecord } from "@/app/admin/welfare/attend/actions";
import { CadetProfileCell } from "@/components/admin/sports/cadet-profile-cell";
import type { AttendRecordRow } from "./attend-table";

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatLoggedAt(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type AttendDetailsSheetProps = {
  record: AttendRecordRow;
  initialMode: "view" | "edit";
  sourceOptions: { value: string; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttendDetailsSheet({
  record,
  initialMode,
  sourceOptions,
  open,
  onOpenChange,
}: AttendDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        <SheetInner
          key={`${record.id}:${initialMode}`}
          record={record}
          initialMode={initialMode}
          sourceOptions={sourceOptions}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  record,
  initialMode,
  sourceOptions,
  onClose,
}: {
  record: AttendRecordRow;
  initialMode: "view" | "edit";
  sourceOptions: { value: string; label: string }[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [recordDate, setRecordDate] = useState(record.recordDate);
  const [attendType, setAttendType] = useState<"B" | "C">(record.attendType);
  const [source, setSource] = useState(record.source);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = recordDate.trim() !== "" && source !== "";

  function handleSave() {
    if (!formValid || isPending) return;
    setError(null);

    const fd = new FormData();
    fd.set("recordId", String(record.id));
    fd.set("recordDate", recordDate.trim());
    fd.set("attendType", attendType);
    fd.set("source", source);

    startTransition(async () => {
      const result = await updateAttendRecord(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update attend record.");
      }
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{mode === "edit" ? "Edit Attend Record" : "Attend Record"}</SheetTitle>
        <div className="flex items-center gap-3 pt-1">
          <CadetProfileCell name={record.name} avatarPath={record.avatarPath} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{record.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatRank(record.rank)} · #{record.armyNo}
            </p>
          </div>
        </div>
      </SheetHeader>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === "view" ? (
        <div className="flex flex-col gap-4 overflow-y-auto px-6">
          <DetailRow label="Date" value={formatRecordDate(record.recordDate)} />
          <DetailRow label="Attend Type" value={`Attend ${record.attendType}`} />
          <DetailRow label="Source" value={record.source} />
          <DetailRow label="Logged" value={formatLoggedAt(record.createdAt)} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto px-6">
          <Field label="Date" required>
            <Input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              disabled={isPending}
            />
          </Field>
          <Field label="Attend Type" required>
            <Select value={attendType} onValueChange={(v) => setAttendType(v as "B" | "C")}>
              <SelectTrigger>{attendType === "B" ? "Attend B" : "Attend C"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="B">Attend B</SelectItem>
                <SelectItem value="C">Attend C</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Source" required>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>{source}</SelectTrigger>
              <SelectContent>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      {mode === "view" ? (
        <SheetFooter>
          <Button onClick={() => setMode("edit")}>
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
        </SheetFooter>
      ) : (
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setMode("view")} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !formValid}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function formatRank(rank: string) {
  return rank.replace(/_/g, " ");
}