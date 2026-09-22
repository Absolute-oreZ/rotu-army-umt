"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createAttendRecord } from "@/app/admin/welfare/attend/actions";
import { searchCadets } from "@/app/admin/welfare/attend/search-actions";
import { getMalaysiaDateISO } from "@/lib/time/malaysia";

interface CadetSearchResult {
  id: number;
  label: string;
  armyNo: number;
}

type SourceOption = { value: string; label: string };

export function AddAttendDialog({
  sourceOptions,
  trigger,
}: {
  sourceOptions: SourceOption[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cadetId, setCadetId] = useState("");
  const [cadetQuery, setCadetQuery] = useState("");
  const [cadetResults, setCadetResults] = useState<CadetSearchResult[]>([]);
  const [recordDate, setRecordDate] = useState(() => getMalaysiaDateISO());
  const [attendType, setAttendType] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const searchRequestRef = useRef(0);
  const recordDateValue = new Date(`${recordDate}T00:00:00`);

  const formValid = cadetId !== "" && recordDate !== "" && attendType !== "" && source !== "";

  function resetForm() {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    searchRequestRef.current += 1;
    setCadetId("");
    setCadetQuery("");
    setCadetResults([]);
    setIsSearching(false);
    setRecordDate(getMalaysiaDateISO());
    setAttendType("");
    setSource("");
    setError(null);
  }

  function handleCadetQueryChange(value: string) {
    setCadetQuery(value);
    setCadetId("");

    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    const trimmed = value.trim();

    if (trimmed.length < 2) {
      searchRequestRef.current += 1;
      setCadetResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;

      try {
        const result = await searchCadets(trimmed);
        if (requestId === searchRequestRef.current && result.success) {
          setCadetResults(result.data);
        }
      } catch (err) {
        console.error("Cadet search failed", err);
      } finally {
        if (requestId === searchRequestRef.current) {
          setIsSearching(false);
        }
      }
    }, 300);
  }

  function handleCadetSelect(result: CadetSearchResult) {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    searchRequestRef.current += 1;
    setIsSearching(false);
    setCadetId(String(result.id));
    setCadetQuery(result.label);
    setCadetResults([]);
  }

  function handleCreate() {
    if (!formValid) return;
    setError(null);

    const fd = new FormData();
    fd.set("cadetId", cadetId);
    fd.set("recordDate", recordDate);
    fd.set("attendType", attendType);
    fd.set("source", source);

    startTransition(async () => {
      const result = await createAttendRecord(fd);
      if (result.success) {
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create attend record.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
      {trigger ? <div onClick={() => setOpen(true)}>{trigger}</div> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Attend Record</DialogTitle>
          <DialogDescription>
            Log a cadet&apos;s absence from training.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Cadet" required>
            <div className="relative">
              <Input
                value={cadetQuery}
                onChange={(e) => handleCadetQueryChange(e.target.value)}
                placeholder="Search by name, army no, or matric no..."
                disabled={isPending}
              />
              {isSearching && <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />}
              {cadetResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                  {cadetResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => handleCadetSelect(result)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>

          <Field label="Date" required>
            <DatePicker
              value={recordDate ? recordDateValue : undefined}
              onChange={(date) => setRecordDate(date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "")}
              maxDate={new Date()}
              placeholder="Select date"
            />
          </Field>

          <Field label="Attend Type" required>
            <Select value={attendType} onValueChange={setAttendType}>
              <SelectTrigger>
                {attendType === "B" ? "Attend B" : attendType === "C" ? "Attend C" : "Select type"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B">Attend B</SelectItem>
                <SelectItem value="C">Attend C</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Source" required>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                {source || "Select source"}
              </SelectTrigger>
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

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setOpen(false); }}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isPending || !formValid}>
            {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            Create Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}