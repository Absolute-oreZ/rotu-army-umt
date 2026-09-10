"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createAttendRecord } from "@/app/admin/welfare/attend/actions";

type CadetOption = {
  id: number;
  label: string;
};

export function AddAttendDialog({
  cadetOptions,
  sourceOptions,
  trigger,
}: {
  cadetOptions: CadetOption[];
  sourceOptions: { value: string; label: string }[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cadetId, setCadetId] = useState("");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendType, setAttendType] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formValid = cadetId !== "" && recordDate !== "" && attendType !== "" && source !== "";

  function resetForm() {
    setCadetId("");
    setRecordDate(new Date().toISOString().slice(0, 10));
    setAttendType("");
    setSource("");
    setError(null);
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
            <Select value={cadetId} onValueChange={setCadetId}>
              <SelectTrigger>
                {cadetId
                  ? cadetOptions.find((c) => String(c.id) === cadetId)?.label ?? "Select cadet"
                  : "Select cadet"}
              </SelectTrigger>
              <SelectContent>
                {cadetOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date" required>
            <Input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
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