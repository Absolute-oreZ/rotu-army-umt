"use client";

import { useEffect } from "react";

export function ReceiptPreviewDialog({
  url,
  onOpenChange,
}: {
  url: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    if (!url) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [url, onOpenChange]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div className="flex h-[80vh] w-[80vw] max-h-225 max-w-300 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Receipt preview"
          className="max-h-full max-w-full object-contain"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
