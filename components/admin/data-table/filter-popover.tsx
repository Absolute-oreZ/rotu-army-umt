"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FilterColumn, FilterCondition } from "@/lib/admin/table-search-params";

const NUMBER_OPS = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not equals" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less or equal" },
] as const;

const STRING_OPS = [
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
] as const;

const DATE_OPS = [
  { value: "eq", label: "Equals" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less or equal" },
] as const;

export type FilterPopoverProps = {
  column: FilterColumn;
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
};

export function FilterPopover({ column, conditions, onChange }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const isActive = conditions.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "size-5 shrink-0",
            isActive && "text-primary",
          )}
          aria-label={`Filter ${column.label}`}
        >
          <FilterIcon className={cn("size-3", isActive && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Filter by {column.label}
        </p>
        {column.type === "enum" && (
          <EnumFilterBody
            column={column}
            conditions={conditions}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        )}
        {column.type === "number" && (
          <ConditionFilterBody
            conditions={conditions}
            onChange={onChange}
            ops={NUMBER_OPS}
            inputType="number"
            onClose={() => setOpen(false)}
          />
        )}
        {column.type === "string" && (
          <ConditionFilterBody
            conditions={conditions}
            onChange={onChange}
            ops={STRING_OPS}
            inputType="text"
            onClose={() => setOpen(false)}
          />
        )}
        {column.type === "date" && (
          <ConditionFilterBody
            conditions={conditions}
            onChange={onChange}
            ops={DATE_OPS}
            inputType="date"
            onClose={() => setOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function EnumFilterBody({
  column,
  conditions,
  onChange,
  onClose,
}: {
  column: Extract<FilterColumn, { type: "enum" }>;
  conditions: FilterCondition[];
  onChange: (c: FilterCondition[]) => void;
  onClose: () => void;
}) {
  const selected = new Set(
    conditions.filter((c) => c.operator === "in").map((c) => c.value),
  );

  function toggle(value: string) {
    const next = selected.has(value)
      ? [...selected].filter((v) => v !== value)
      : [...selected, value];
    onChange(next.map((v) => ({ operator: "in", value: v })));
  }

  function selectAll() {
    onChange(column.options.map((o) => ({ operator: "in", value: o.value })));
  }

  function clear() {
    onChange([]);
    onClose();
  }

  return (
    <>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={selectAll}
        >
          Select all
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline"
          onClick={clear}
        >
          Clear
        </button>
      </div>
      <div className="max-h-52 space-y-0.5 overflow-y-auto">
        {column.options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent"
          >
            <input
              type="checkbox"
              checked={selected.has(opt.value)}
              onChange={() => toggle(opt.value)}
              className="size-3.5 rounded border-border accent-primary"
            />
            <span className="truncate">{opt.label}</span>
          </label>
        ))}
      </div>
    </>
  );
}

function ConditionFilterBody({
  conditions,
  onChange,
  ops,
  inputType,
  onClose,
}: {
  conditions: FilterCondition[];
  onChange: (c: FilterCondition[]) => void;
  ops: readonly { value: string; label: string }[];
  inputType: "number" | "text" | "date";
  onClose: () => void;
}) {
  const [op, setOp] = useState(ops[0].value);
  const [value, setValue] = useState("");

  function addCondition() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange([...conditions, { operator: op, value: trimmed }]);
    setValue("");
  }

  function removeCondition(index: number) {
    const next = conditions.filter((_, i) => i !== index);
    onChange(next);
    if (next.length === 0) onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") addCondition();
  }

  const opLabel = (opValue: string) =>
    ops.find((o) => o.value === opValue)?.label ?? opValue;

  return (
    <>
      {conditions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {conditions.map((cond, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs"
            >
              <span className="text-muted-foreground">{opLabel(cond.operator)}</span>
              <span className="font-medium">{cond.value}</span>
              <button
                type="button"
                onClick={() => removeCondition(i)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remove condition"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <Select value={op} onValueChange={setOp}>
          <SelectTrigger size="sm" className="w-28 shrink-0 text-xs">
            {opLabel(op)}
          </SelectTrigger>
          <SelectContent minWidth={120}>
            {ops.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type={inputType}
          size="sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Value"
          className="min-w-0"
        />
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={addCondition}
          disabled={!value.trim()}
        >
          Add
        </Button>
      </div>
    </>
  );
}
