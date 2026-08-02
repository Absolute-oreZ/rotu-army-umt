"use client";

import { useRef, type ReactNode } from "react";
import { PencilLineIcon, UploadIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type MultiFileFieldItem = {
  id: string;
  file: File;
  url: string;
};

export function MultiFileField({
  label,
  items,
  onAddFiles,
  onReplaceFile,
  onRemoveFile,
  helperText = "Select one or more image files.",
  required,
  addLabel = "Add files",
  className,
}: {
  label: string;
  items: MultiFileFieldItem[];
  onAddFiles: (files: File[]) => void;
  onReplaceFile: (id: string, file: File | null) => void;
  onRemoveFile: (id: string) => void;
  helperText?: ReactNode;
  required?: boolean;
  addLabel?: string;
  className?: string;
}) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function triggerAddPicker() {
    addInputRef.current?.click();
  }

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement>) {
    onAddFiles(Array.from(e.currentTarget.files ?? []));
    e.currentTarget.value = "";
  }

  function handleReplaceChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    onReplaceFile(id, Array.from(e.currentTarget.files ?? [])[0] ?? null);
    e.currentTarget.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {required && <span className="text-red-400"> *</span>}
      <div className={cn("space-y-3", className)}>
        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerAddPicker}
          className="group relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-background text-left transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,rgba(255,255,255,0.02))] opacity-0 transition-opacity group-hover:opacity-100">
            <div className="relative flex items-center gap-4 px-4 py-4 sm:px-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground shadow-sm transition-colors group-hover:text-primary">
                <UploadIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{addLabel}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{helperText}</p>
              </div>
            </div>
          </div>
        </button>

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "file" : "files"} selected
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-background p-2 shadow-sm">
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={item.url}
                      alt={item.file.name}
                      width={320}
                      height={128}
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/20 to-transparent p-2">
                      <p className="truncate text-[11px] font-medium text-white/90">
                        {item.file.name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      ref={(el) => {
                        replaceInputRefs.current[item.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReplaceChange(item.id, e)}
                    />
                    <button
                      type="button"
                      onClick={() => replaceInputRefs.current[item.id]?.click()}
                      className="flex h-6 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-muted"
                    >
                      <PencilLineIcon className="size-3" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFile(item.id)}
                      className="flex size-6 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
