"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PublicStoryDisplayPhoto } from "@/lib/public/content";

const GAP = 12;
const VELOCITY_THRESHOLD = 500;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 } as const;

type Props = {
  photos: PublicStoryDisplayPhoto[];
  alt: string;
  className?: string;
};

function CarouselPhoto({
  photo,
  index,
  alt,
  itemWidth,
  trackItemOffset,
  x,
}: {
  photo: PublicStoryDisplayPhoto;
  index: number;
  alt: string;
  itemWidth: number;
  trackItemOffset: number;
  x: ReturnType<typeof useMotionValue<number>>;
}) {
  const range = [
    -(index + 1) * trackItemOffset,
    -index * trackItemOffset,
    -(index - 1) * trackItemOffset,
  ];
  const rotateY = useTransform(x, range, [90, 0, -90], { clamp: false });

  return (
    <motion.div
      style={{ width: itemWidth, rotateY }}
      transition={SPRING_OPTIONS}
      className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
    >
      <div className="relative aspect-square w-full">
        <Image
          src={photo.photoPath}
          alt={`${alt} – ${index + 1}`}
          fill
          draggable={false}
          className="pointer-events-none object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 55vw, 380px"
        />
      </div>
    </motion.div>
  );
}

export function StoryPhotoCarousel({ photos, alt, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const containerPadding = 12;
  const itemWidth = Math.max(containerWidth - containerPadding * 2, 0);
  const trackItemOffset = itemWidth + GAP;

  const [position, setPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const x = useMotionValue(0);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const { offset, velocity } = info;
    const direction =
      offset.x < 0 || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > 0 || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;
    if (direction === 0) return;
    setPosition((prev) => Math.max(0, Math.min(prev + direction, photos.length - 1)));
  };

  if (photos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("rounded-2xl border border-border bg-background", className)}
      style={{ padding: containerPadding }}
    >
      {containerWidth > 0 && (
        <>
          <div
            style={{ width: itemWidth }}
            className="overflow-hidden mx-auto"
          >
            <motion.div
              className="flex cursor-grab active:cursor-grabbing select-none"
              drag={isAnimating ? false : "x"}
              dragConstraints={{
                left: -trackItemOffset * Math.max(photos.length - 1, 0),
                right: 0,
              }}
              dragElastic={0.1}
              style={{
                width: itemWidth * photos.length + GAP * (photos.length - 1),
                gap: GAP,
                perspective: 1000,
                perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
                x,
              }}
              animate={{ x: -(position * trackItemOffset) }}
              transition={SPRING_OPTIONS}
              onDragEnd={handleDragEnd}
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={() => setIsAnimating(false)}
            >
              {photos.map((photo, i) => (
                <CarouselPhoto
                  key={photo.id}
                  photo={photo}
                  index={i}
                  alt={alt}
                  itemWidth={itemWidth}
                  trackItemOffset={trackItemOffset}
                  x={x}
                />
              ))}
            </motion.div>
          </div>

          {photos.length > 1 && (
            <div className="flex justify-center gap-1" style={{ marginTop: containerPadding }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPosition(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className="flex items-center justify-center p-2"
                >
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-150",
                      i === position
                        ? "w-4 bg-foreground"
                        : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70",
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}