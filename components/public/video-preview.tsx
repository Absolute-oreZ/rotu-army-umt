"use client";

import { useRef, useState } from "react";
import { Play, X } from "lucide-react";

type Props = {
  url: string;
  label: string;
};

export function VideoPreview({ url, label }: Props) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    videoRef.current?.pause();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="group w-full overflow-hidden rounded-2xl border border-border bg-muted/30 text-left"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <video
            src={`${url}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 transition-colors duration-200 group-hover:bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
              <Play className="h-5 w-5 translate-x-0.5 fill-black text-black" />
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{url}</p>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-xl sm:rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              ref={videoRef}
              src={url}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}