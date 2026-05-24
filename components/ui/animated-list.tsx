"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedListProps = {
  items?: React.ReactNode[];
  showGradients?: boolean;
  className?: string;
  displayScrollbar?: boolean;
};

function AnimatedItem({
  children,
  delay = 0,
  index,
}: {
  children: React.ReactNode;
  delay?: number;
  index: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      initial={{ scale: 0.92, opacity: 0, y: 12 }}
      animate={inView ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.92, opacity: 0, y: 12 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedList({
  items = [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
    "Item 9",
    "Item 10",
  ],
  showGradients = true,
  className = "",
  displayScrollbar = true,
}: AnimatedListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      setTopGradientOpacity(Math.min(scrollTop / 50, 1));
      const bottomDistance = scrollHeight - (scrollTop + clientHeight);
      setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    },
    [],
  );

  const listItems = useMemo(
    () =>
      items.map((item, index) => (
        <AnimatedItem key={`${index}`} delay={index * 0.04} index={index}>
          <div className="mb-3">{item}</div>
        </AnimatedItem>
      )),
    [items],
  );

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={listRef}
        className={cn(
          "max-h-104 overflow-y-auto px-1 py-2",
          displayScrollbar ? "" : "no-scrollbar",
        )}
        onScroll={handleScroll}
      >
        {listItems}
      </div>
      {showGradients ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-background to-transparent transition-opacity duration-300"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent transition-opacity duration-300"
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      ) : null}
    </div>
  );
}
