"use client";

import { useState, useMemo, useRef, type ReactNode } from "react";
import {
  ChevronDownIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CADET_RANKS } from "@/db/schema";

export const RANK_OPTIONS = CADET_RANKS;
export const GENDER_OPTIONS = ["MALE", "FEMALE"] as const;
export const RELIGION_OPTIONS = ["ISLAM", "CHRISTIAN", "HINDU", "BUDDHIST", "OTHER"] as const;
export const RACE_OPTIONS = ["MALAY", "CHINESE", "INDIAN", "OTHER"] as const;

export const MIN_AGE = 18;
export const MAX_AGE = 24;
export const DEFAULT_AGE = 21;

export function defaultBirthdate(): Date {
  const d = new Date();
  return new Date(d.getFullYear() - DEFAULT_AGE, 0, 1);
}

export type DropdownOption = { value: string; label: string };

export function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export function Field({ label, children, error }: { label: ReactNode; children: ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  onBlur?: () => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
        className,
      )}
    />
  );
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                value === option.value && "bg-muted font-medium",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FileField({
  label,
  file,
  onChange,
  existingUrl,
  className,
}: {
  label: ReactNode;
  file: File | null;
  onChange: (f: File | null) => void;
  existingUrl?: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const newPreviewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  const previewUrl = newPreviewUrl ?? existingUrl ?? null;

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function triggerFilePicker() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  return (
    <Field label={label}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {previewUrl ? (
        <div className={cn("relative group aspect-square w-full overflow-hidden rounded-lg border border-border", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="size-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
          >
            <XIcon className="size-3" />
          </button>
          <button
            type="button"
            onClick={triggerFilePicker}
            className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center pb-1 pt-4 bg-linear-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              Change
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFilePicker}
          className={cn("flex aspect-square w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 text-sm transition-colors hover:border-primary/50", className)}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <UploadIcon className="size-4" />
            <span className="text-[10px]">Choose file</span>
          </div>
        </button>
      )}
    </Field>
  );
}
