"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { storageUrl } from "@/lib/supabase/storage-public";

const INITIALS_COLORS = [
  "bg-sky-600/15 text-sky-600",
  "bg-emerald-600/15 text-emerald-600",
  "bg-amber-600/15 text-amber-600",
  "bg-rose-600/15 text-rose-600",
  "bg-violet-600/15 text-violet-600",
  "bg-indigo-600/15 text-indigo-600",
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function initialsColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

export function CadetProfileCell({
  name,
  avatarPath,
}: {
  name: string;
  avatarPath: string | null;
}) {
  const photoUrl = avatarPath ? storageUrl(avatarPath) : null;

  return (
    <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes="32px" className="object-cover" />
      ) : (
        <div
          className={cn(
            "flex size-full items-center justify-center text-[10px] font-semibold",
            initialsColor(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}