"use client";

import Image from "next/image";
import { FileTextIcon } from "lucide-react";

export function ReceiptThumbnail({
  url,
  fileName,
  isPdf = false,
  sizes = "(min-width: 1024px) 130px, (min-width: 640px) 190px, calc(100vw - 6rem)",
}: {
  url: string | null;
  fileName: string | null;
  isPdf?: boolean;
  sizes?: string;
}) {
  if (!url) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        No preview
      </div>
    );
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-32 flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <FileTextIcon className="size-6" />
        <span className="max-w-full truncate px-3 text-xs">{fileName ?? "Receipt PDF"}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest">Open PDF</span>
      </a>
    );
  }

  return (
    <div className="relative h-32 w-full bg-muted">
      <Image
        src={url}
        alt={fileName ?? "Receipt"}
        fill
        sizes={sizes}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}