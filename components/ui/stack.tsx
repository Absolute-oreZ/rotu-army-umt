"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { cn } from "@/lib/utils";

type StackItem = {
  id: number;
  content: React.ReactNode;
  rotation: number;
};

export type StackCard = StackItem;

type CardRotateProps = {
  children: React.ReactNode;
  disableDrag?: boolean;
  onSendToBack: () => void;
  sensitivity: number;
};

function CardRotate({
  children,
  disableDrag = false,
  onSendToBack,
  sensitivity,
}: CardRotateProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
      return;
    }

    x.set(0);
    y.set(0);
  };

  if (disableDrag) {
    return <motion.div className="absolute inset-0 cursor-pointer">{children}</motion.div>;
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

type StackProps = {
  animationConfig?: { damping: number; stiffness: number };
  autoplay?: boolean;
  autoplayDelay?: number;
  cards?: React.ReactNode[];
  onCardDoubleClick?: (card: StackCard) => void;
  mobileBreakpoint?: number;
  mobileClickOnly?: boolean;
  pauseOnHover?: boolean;
  randomRotation?: boolean;
  sensitivity?: number;
  sendToBackOnClick?: boolean;
  rotationStep?: number;
};

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  rotationStep = 4,
  onCardDoubleClick,
}: StackProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const clickTimerRef = React.useRef<number | null>(null);

  const normalizedCards = React.useMemo<StackItem[]>(
    () =>
      cards.map((content, index) => ({
        id: index + 1,
        content,
        rotation: randomRotation ? ((index % 5) - 2) * 1.6 : 0,
      })),
    [cards, randomRotation],
  );

  const [order, setOrder] = React.useState<number[]>(() =>
    normalizedCards.map((item) => item.id),
  );

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  const sendToBack = React.useCallback((id: number) => {
    setOrder((prev) => {
      const next = [...prev];
      const index = next.findIndex((itemId) => itemId === id);
      if (index < 0) return prev;
      const [itemId] = next.splice(index, 1);
      next.unshift(itemId);
      return next;
    });
  }, []);

  const stack = React.useMemo(
    () => order.map((id) => normalizedCards.find((item) => item.id === id)).filter(Boolean) as StackItem[],
    [normalizedCards, order],
  );

  React.useEffect(() => {
    if (!autoplay || stack.length < 2 || isPaused) return;

    const interval = window.setInterval(() => {
      const topCardId = stack[stack.length - 1]?.id;
      if (topCardId) {
        sendToBack(topCardId);
      }
    }, autoplayDelay);

    return () => window.clearInterval(interval);
  }, [autoplay, autoplayDelay, isPaused, sendToBack, stack]);

  React.useEffect(
    () => () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    },
    [],
  );

  return (
    <div
      className="relative h-full w-full"
      style={{ perspective: 600 }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => (
        <CardRotate
          key={card.id}
          onSendToBack={() => sendToBack(card.id)}
          sensitivity={sensitivity}
          disableDrag={shouldDisableDrag}
        >
          <motion.div
            className={cn("h-full w-full overflow-hidden rounded-[inherit]")}
            onClick={() => {
              if (!shouldEnableClick) return;

              if (clickTimerRef.current !== null) {
                window.clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
                onCardDoubleClick?.(stack[stack.length - 1]);
                return;
              }

              clickTimerRef.current = window.setTimeout(() => {
                sendToBack(card.id);
                clickTimerRef.current = null;
              }, 300);
            }}
            animate={{
              rotateZ: (stack.length - index - 1) * rotationStep + card.rotation,
              scale: 1 + index * 0.06 - stack.length * 0.06,
              transformOrigin: "90% 90%",
            }}
            initial={false}
            transition={{
              type: "spring",
              stiffness: animationConfig.stiffness,
              damping: animationConfig.damping,
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {card.content}
          </motion.div>
        </CardRotate>
      ))}
    </div>
  );
}
