"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilterColumn } from "@/lib/admin/table-search-params";

const VALID_OPS: Record<FilterColumn["type"], string[]> = {
  enum: ["in", "notIn"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte"],
  string: ["contains", "startsWith", "endsWith"],
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
    if (!value.trim() || !selectedColumn) return;
    onCommit(columnKey, operator, value.trim());
    reset();
  }

  function reset() {
    setOpen(false);
    setStep("column");
    setColumnKey("");
    setOperator("");
    setValue("");
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
          <input
            ref={columnRef}
            type="text"
            placeholder="Select column..."
            className="h-8 w-40 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
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
          <select
            value={operator}
            onChange={(e) => handleOperatorSelect(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          >
            {VALID_OPS[selectedColumn.type].map((op) => (
              <option key={op} value={op}>
                {OP_LABELS[op]}
              </option>
            ))}
          </select>

          {selectedColumn.type === "enum" ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleValueSubmit();
                if (e.key === "Escape") reset();
              }}
            >
              <option value="">Select value...</option>
              {selectedColumn.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={valueRef}
              type={selectedColumn.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value..."
              className="h-8 w-32 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
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
