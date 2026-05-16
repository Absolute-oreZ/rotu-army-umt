"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
};

export function CountUp({
  end,
  duration = 1.4,
  className,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    let raf = 0;
    let started = false;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const animate = () => {
      if (prefersReducedMotion) {
        setValue(end);
        return;
      }

      const startTime = performance.now();

      const step = (now: number) => {
        if (!started) {
          started = true;
        }

        const elapsed = now - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const nextValue = Math.round(end * (1 - Math.pow(1 - progress, 3)));

        setValue(nextValue);

        if (progress < 1) {
          raf = window.requestAnimationFrame(step);
        }
      };

      raf = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          animate();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, [duration, end]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
