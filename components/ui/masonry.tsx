"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export type MasonryItem = {
  id: string;
  img: string;
  url: string;
  width: number;
  height: number;
  title: string;
};

type MasonryProps = {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "top" | "bottom" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  className?: string;
};

const useMeasure = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
};

export default function Masonry({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  className,
}: MasonryProps) {
  const [containerRef, { width }] = useMeasure();
  const hasMounted = useRef(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const columns = useMemo(() => {
    if (width >= 1500) return 5;
    if (width >= 1000) return 4;
    if (width >= 600) return 3;
    if (width >= 400) return 2;
    return 1;
  }, [width]);

  const { grid, totalHeight } = useMemo(() => {
    if (!width || items.length === 0) {
      return { grid: [] as Array<MasonryItem & { x: number; y: number; w: number; h: number }>, totalHeight: 0 };
    }

    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;

    const nextGrid = items.map((item) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      const h = item.width > 0 ? (columnWidth / item.width) * item.height : 200;
      const y = colHeights[col];

      colHeights[col] += h;

      return { ...item, x, y, w: columnWidth, h };
    });

    return { grid: nextGrid, totalHeight: Math.max(...colHeights, 0) };
  }, [columns, items, width]);

  useLayoutEffect(() => {
    if (grid.length === 0) {
      return;
    }

    for (let index = 0; index < grid.length; index += 1) {
      const item = grid[index];
      const element = itemRefs.current[item.id];
      if (!element) {
        continue;
      }

      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (!hasMounted.current) {
        let initialPosition = { x: item.x, y: item.y + 100 };

        if (animateFrom === "top") {
          initialPosition = { x: item.x, y: -200 };
        } else if (animateFrom === "bottom") {
          initialPosition = { x: item.x, y: window.innerHeight + 200 };
        } else if (animateFrom === "left") {
          initialPosition = { x: -200, y: item.y };
        } else if (animateFrom === "right") {
          initialPosition = { x: window.innerWidth + 200, y: item.y };
        } else if (animateFrom === "center" && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          initialPosition = {
            x: rect.width / 2 - item.w / 2,
            y: rect.height / 2 - item.h / 2,
          };
        } else if (animateFrom === "random") {
          const directions = ["top", "bottom", "left", "right"] as const;
          const direction = directions[Math.floor(Math.random() * directions.length)];
          if (direction === "top") initialPosition = { x: item.x, y: -200 };
          if (direction === "bottom") initialPosition = { x: item.x, y: window.innerHeight + 200 };
          if (direction === "left") initialPosition = { x: -200, y: item.y };
          if (direction === "right") initialPosition = { x: window.innerWidth + 200, y: item.y };
        }

        gsap.fromTo(
          element,
          {
            opacity: 0,
            x: initialPosition.x,
            y: initialPosition.y,
            width: item.w,
            height: item.h,
            ...(blurToFocus ? { filter: "blur(10px)" } : {}),
          },
          {
            opacity: 1,
            ...animationProps,
            ...(blurToFocus ? { filter: "blur(0px)" } : {}),
            duration: 0.8,
            ease: "power3.out",
            delay: index * stagger,
          },
        );
      } else {
        gsap.to(element, {
          ...animationProps,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    }

    hasMounted.current = true;
  }, [animateFrom, blurToFocus, containerRef, duration, ease, grid, stagger]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={{ height: totalHeight }}>
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          ref={(node) => {
            itemRefs.current[item.id] = node;
          }}
          className="absolute left-0 top-0 p-1.5 will-change-transform"
          onMouseEnter={(event) => {
            if (scaleOnHover) {
              gsap.to(event.currentTarget, {
                scale: hoverScale,
                duration: 0.3,
                ease: "power2.out",
              });
            }
            if (colorShiftOnHover) {
              const overlay = event.currentTarget.querySelector("[data-color-overlay='true']");
              if (overlay instanceof HTMLElement) {
                gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
              }
            }
          }}
          onMouseLeave={(event) => {
            if (scaleOnHover) {
              gsap.to(event.currentTarget, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out",
              });
            }
            if (colorShiftOnHover) {
              const overlay = event.currentTarget.querySelector("[data-color-overlay='true']");
              if (overlay instanceof HTMLElement) {
                gsap.to(overlay, { opacity: 0, duration: 0.3 });
              }
            }
          }}
        >
          <Link
            href={item.url}
            className="group relative block h-full w-full overflow-hidden rounded-xl"
          >
            <Image
              src={item.img}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {colorShiftOnHover ? (
              <div
                data-color-overlay="true"
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0"
                style={{
                  background: "linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5))",
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {item.title}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
