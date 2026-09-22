"use client";

import { useRef } from "react";
import { FileUpIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentFileField({
  file,
  onChange,
  accept = ".pdf,application/pdf",
  helperText = "PDF only, maximum 5 MB.",
  maxBytes = 5 * 1024 * 1024,
  error,
  className,
}: {
  file: File | null;
  onChange: (file: File | null, error?: string) => void;
  accept?: string;
  helperText?: string;
  maxBytes?: number;
  error?: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!nextFile) return;

    if (nextFile.size > maxBytes) {
      onChange(null, `File must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }

    if (accept.includes("pdf") && nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      onChange(null, "Please select a valid PDF file.");
      return;
    }

    onChange(nextFile);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileUpIcon className="size-5" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Browse document
          </Button>
          <p className="text-xs text-muted-foreground">{helperText}</p>
        </div>
      </div>
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs">
          <span className="truncate font-mono text-foreground">{file.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(null)} aria-label="Remove document">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}