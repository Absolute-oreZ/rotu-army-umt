"use client";

import { useState } from "react";
import Image from "next/image";

interface HeroImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
}

export function HeroImage({ src, fallbackSrc, alt }: HeroImageProps) {
  const source = src || fallbackSrc;
  const [erroredSource, setErroredSource] = useState<string | null>(null);
  const currentSrc = erroredSource === source ? fallbackSrc : source;

  const isRemote = currentSrc.startsWith("http://") || currentSrc.startsWith("https://");

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className="object-cover"
      priority
      sizes="100vw"
      unoptimized={isRemote}
      onError={() => {
        if (source !== fallbackSrc) {
          setErroredSource(source);
        }
      }}
    />
  );
}
