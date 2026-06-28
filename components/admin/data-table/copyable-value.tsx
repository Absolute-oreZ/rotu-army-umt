"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyableValueProps = {
  value?: string | number | null;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
  buttonClassName?: string;
  ariaLabel?: string;
};

export function CopyableValue({
  value,
  children,
  className,
  valueClassName,
  buttonClassName,
  ariaLabel = "Copy value",
}: CopyableValueProps) {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<number | null>(null);
  const copyText = value === null || value === undefined ? "" : String(value);
  const canCopy = copyText.length > 0;

  useEffect(() => {
    return () => {
      if (resetRef.current !== null) {
        window.clearTimeout(resetRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);

      if (resetRef.current !== null) {
        window.clearTimeout(resetRef.current);
      }

      resetRef.current = window.setTimeout(() => {
        setCopied(false);
        resetRef.current = null;
      }, 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("group flex min-w-0 items-center gap-2", className)}>
      <div className={cn("min-w-0 flex-1", valueClassName)}>{children ?? copyText}</div>
      {canCopy ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={ariaLabel}
          title={copied ? "Copied" : ariaLabel}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100",
            copied && "opacity-100 text-emerald-600",
            buttonClassName,
          )}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      ) : null}
    </div>
  );
}
