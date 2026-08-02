"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PencilLineIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SingleFileField({
  file,
  existingUrl,
  onChange,
  onRemove,
  accept = "image/*",
  helperText,
  buttonLabel = "Choose file",
  className,
  caption,
  previewType = "image",
}: {
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  helperText?: ReactNode;
  buttonLabel?: string;
  className?: string;
  caption?: ReactNode;
  previewType?: "image" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) {
      return null;
    }

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const isImageFile = file?.type.startsWith("image/") ?? false;
  const isVideoFile = file?.type.startsWith("video/") ?? false;
  const isImageOrVideoPreview = isImageFile || isVideoFile;
  const previewUrl = (file && isImageOrVideoPreview ? objectUrl : null) ?? existingUrl ?? null;
  const hasSelection = file !== null || (existingUrl !== null && existingUrl !== undefined);
  const showImagePreview = previewUrl !== null && (file ? isImageOrVideoPreview : true);

  function triggerFilePicker() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0] ?? null;
    onChange(nextFile);
    e.currentTarget.value = "";
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onRemove?.();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {hasSelection ? (
        showImagePreview ? (
          <div className="grid gap-2">
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted aspect-square">
              {previewType === "video" ? (
                <video src={previewUrl} controls className="size-full object-cover" />
              ) : (
                <Image
                  src={previewUrl}
                  alt={file?.name ?? "Selected file"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              )}
            </div>

            {caption ? (
              <p className="text-xs text-muted-foreground truncate">{caption}</p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={triggerFilePicker}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted"
              >
                <PencilLineIcon className="size-4" />
                Change
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/10"
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm">
                <UploadIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {file?.name ?? "Selected file"}
                </p>
                {file ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                ) : null}
              </div>
            </div>

            {caption ? (
              <p className="text-xs text-muted-foreground">{caption}</p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={triggerFilePicker}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted"
              >
                <PencilLineIcon className="size-4" />
                Change
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/10"
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={triggerFilePicker}
          className={cn(
            "group relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-background text-left transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_35%,rgba(255,255,255,0.02))] opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center gap-4 px-4 py-4 sm:px-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground shadow-sm transition-colors group-hover:text-primary">
              <UploadIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{buttonLabel}</span>
              </div>
              {helperText ? (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{helperText}</p>
              ) : null}
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
