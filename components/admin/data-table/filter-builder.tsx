"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterColumn } from "@/lib/admin/table-search-params";

const VALID_OPS: Record<FilterColumn["type"], string[]> = {
  enum: ["in", "notIn"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte"],
  string: ["contains", "startsWith", "endsWith"],
  date: ["eq", "gt", "gte", "lt", "lte"],
  time: ["eq", "gt", "gte", "lt", "lte"],
};

const OP_LABELS: Record<string, string> = {
  eq: "equals",
  neq: "not equals",
  gt: "greater than",
  gte: "greater than or equal",
  lt: "less than",
  lte: "less than or equal",
  contains: "contains",
  startsWith: "starts with",
  endsWith: "ends with",
  in: "in",
  notIn: "not in",
};

export function FilterBuilder({
  filterColumns,
  onCommit,
}: {
  filterColumns: FilterColumn[];
  onCommit: (columnKey: string, operator: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"column" | "operator" | "value">("column");
  const [columnKey, setColumnKey] = useState("");
  const [operator, setOperator] = useState("");
  const [value, setValue] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");

  const columnRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const selectedColumn = filterColumns.find((c) => c.key === columnKey);

  useEffect(() => {
    if (open && step === "column") {
      columnRef.current?.focus();
    } else if (step === "value") {
      valueRef.current?.focus();
    }
  }, [open, step]);

  function handleColumnSelect(key: string) {
    setColumnKey(key);
    const col = filterColumns.find((c) => c.key === key);
    if (col) {
      const ops = VALID_OPS[col.type];
      setOperator(ops[0]);
      setStep("value");
    }
  }

  function handleOperatorSelect(op: string) {
    setOperator(op);
    setStep("value");
  }

  function handleValueSubmit() {
    if (!selectedColumn) return;
    if (selectedColumn.type === "time") {
      const minutes = Number(timeMinutes);
      const seconds = Number(timeSeconds);
      if (!Number.isFinite(minutes) && !Number.isFinite(seconds)) return;
      const totalSeconds = (Number.isFinite(minutes) ? minutes : 0) * 60 + (Number.isFinite(seconds) ? seconds : 0);
      onCommit(columnKey, operator, `${totalSeconds}s`);
      reset();
      return;
    }
    if (!value.trim()) return;
    onCommit(columnKey, operator, value.trim());
    reset();
  }

  function reset() {
    setOpen(false);
    setStep("column");
    setColumnKey("");
    setOperator("");
    setValue("");
    setTimeMinutes("");
    setTimeSeconds("");
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5"
      >
        <PlusIcon className="size-3.5" />
        Add filter
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {step === "column" && (
        <div className="relative">
          <Input
            ref={columnRef}
            type="text"
            placeholder="Select column..."
            className="h-8 w-40 px-2.5 text-xs"
            list="filter-columns"
            onChange={(e) => {
              const match = filterColumns.find((c) => c.label.toLowerCase() === e.target.value.toLowerCase());
              if (match) handleColumnSelect(match.key);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") reset();
            }}
          />
          <datalist id="filter-columns">
            {filterColumns.map((col) => (
              <option key={col.key} value={col.label} />
            ))}
          </datalist>
        </div>
      )}

      {step === "value" && selectedColumn && (
        <>
          <Select value={operator} onValueChange={handleOperatorSelect}>
            <SelectTrigger size="sm" className="w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VALID_OPS[selectedColumn.type].map((op) => <SelectItem key={op} value={op}>{OP_LABELS[op]}</SelectItem>)}
            </SelectContent>
          </Select>

          {selectedColumn.type === "enum" ? (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger size="sm" className="w-32 text-xs"><SelectValue placeholder="Select value..." /></SelectTrigger>
              <SelectContent>{selectedColumn.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
          ) : selectedColumn.type === "time" ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                placeholder="Min"
                aria-label="Minutes"
                className="h-8 w-16 px-2 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValueSubmit();
                  if (e.key === "Escape") reset();
                }}
              />
              <span className="text-xs text-muted-foreground">m</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={timeSeconds}
                onChange={(e) => setTimeSeconds(e.target.value)}
                placeholder="Sec"
                aria-label="Seconds"
                className="h-8 w-16 px-2 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValueSubmit();
                  if (e.key === "Escape") reset();
                }}
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          ) : (
            <Input
              ref={valueRef}
              type={selectedColumn.type === "number" ? "number" : selectedColumn.type === "date" ? "date" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value..."
              className="h-8 w-32 px-2.5 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleValueSubmit();
                if (e.key === "Escape") reset();
              }}
            />
          )}

          <Button type="button" size="sm" onClick={handleValueSubmit} className="h-8 px-3 text-xs">
            Apply
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset} className="h-8 px-3 text-xs">
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
