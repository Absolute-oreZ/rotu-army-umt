"use client";

import React from "react";
import { gsap } from "gsap";

interface MenuItemProps {
  image: string;
  link: string;
  text: string;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

export default function FlowingMenu({ items = [] }: FlowingMenuProps) {
  return (
    <div className="h-full min-h-52 w-full overflow-hidden border-y border-border dark:border-border">
      <nav className="m-0 flex h-full min-h-152 flex-col p-0">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
}

function MenuItem({ link, text, image }: MenuItemProps) {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number,
  ): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) {
      return;
    }

    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" })
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" });
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) {
      return;
    }

    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height,
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }).to(
      marqueeInnerRef.current,
      { y: edge === "top" ? "101%" : "-101%" },
    );
  };

  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 4 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="p-[1.2vh_1.6vw_0] text-[clamp(2rem,5.5vh,4.6rem)] leading-[1.05] font-semibold uppercase text-background dark:text-background">
          {text}
        </span>
        <div
          className="mx-[2.8vw] my-[2.4em] h-[clamp(4rem,10vh,6rem)] w-[clamp(220px,24vw,420px)] rounded-[999px] bg-cover bg-center shadow-[0_14px_35px_rgba(0,0,0,0.28)]"
          style={{ backgroundImage: `url(${image})` }}
        />
      </React.Fragment>
    ));
  }, [text, image]);

  return (
    <div
      className="group relative min-h-[clamp(9rem,14vh,12rem)] flex-1 overflow-hidden border-b border-border text-center shadow-[0_-1px_0_0_var(--border)] last:border-b-0 dark:border-border dark:shadow-[0_-1px_0_0_var(--border)]"
      ref={itemRef}
    >
      <a
        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-background px-[clamp(1rem,2vw,2rem)] text-[clamp(2rem,5.5vh,4.6rem)] leading-none font-semibold uppercase no-underline text-foreground hover:text-background focus:text-foreground focus-visible:text-background"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        target="_blank"
        rel="noreferrer"
      >
        {text}
      </a>
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-full translate-y-[101%] overflow-hidden bg-foreground text-background dark:bg-foreground dark:text-background"
        ref={marqueeRef}
      >
        <div className="flex h-full w-[200%]" ref={marqueeInnerRef}>
          <div className="animate-marquee relative flex h-full w-[200%] items-center will-change-transform">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
}
