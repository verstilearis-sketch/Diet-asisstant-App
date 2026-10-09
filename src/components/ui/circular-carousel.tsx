"use client";

// An animated orbital carousel that arcs cards along a curved track with
// smooth active-card transitions, autoplay, dot indicators, and keyboard
// navigation.
//
// Adapted from nexus-ui's circular-carousel for Zaiq: theme tokens use the
// app's CSS variables, cards can carry rich content (not just title/text),
// geometry scales down on phones, and autoplay yields to the reader after
// their first manual interaction.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  tag?: string;
  /** Rich card content. When set, replaces the default title/description body. */
  content?: React.ReactNode;
}

export interface CircularCarouselProps {
  items: CarouselItem[];
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const VISIBLE_COUNT = 5;

function useGeometry() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    const read = () => setMobile(q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);
  return useMemo(
    () =>
      mobile
        ? { RX: 135, RY: 84, CW: 248, CH: 208 }
        : { RX: 265, RY: 118, CW: 330, CH: 244 },
    [mobile]
  );
}

function getItemPosition(
  index: number,
  activeIndex: number,
  total: number,
  RX: number,
  RY: number
) {
  const offset = index - activeIndex;
  const half = Math.floor(VISIBLE_COUNT / 2);
  let adjustedOffset = offset;

  if (offset > half) adjustedOffset = offset - total;
  if (offset < -half) adjustedOffset = offset + total;

  if (Math.abs(adjustedOffset) > half * 2) return null;

  const angle = (adjustedOffset / VISIBLE_COUNT) * Math.PI;
  const x = Math.sin(angle) * RX;
  const y = -Math.cos(angle) * RY;

  const distance = Math.abs(adjustedOffset);
  const maxDistance = half + 1;
  const scale = Math.max(0, 1 - (distance / maxDistance) * 0.3);
  const opacity = Math.max(0.3, 1 - (distance / maxDistance) * 0.7);
  const zIndex = VISIBLE_COUNT - distance;

  return { x, y, scale, opacity, zIndex, adjustedOffset };
}

export function CircularCarousel({
  items,
  activeIndex: controlledIndex,
  onActiveChange,
  autoPlay = true,
  autoPlayInterval = 6000,
  className,
}: CircularCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userTookOver, setUserTookOver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { RX, RY, CW, CH } = useGeometry();

  const activeIndex = controlledIndex ?? internalIndex;
  const total = items.length;

  const goTo = useCallback(
    (index: number, manual = false) => {
      const newIndex = ((index % total) + total) % total;
      if (manual) setUserTookOver(true);
      if (controlledIndex === undefined) {
        setInternalIndex(newIndex);
      }
      onActiveChange?.(newIndex);
    },
    [total, controlledIndex, onActiveChange]
  );

  const next = useCallback(
    (manual = false) => goTo(activeIndex + 1, manual),
    [activeIndex, goTo]
  );
  const prev = useCallback(
    (manual = false) => goTo(activeIndex - 1, manual),
    [activeIndex, goTo]
  );

  useEffect(() => {
    if (!autoPlay || isHovered || isFocused || userTookOver) return;
    intervalRef.current = setInterval(() => goTo(activeIndex + 1), autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, autoPlayInterval, isHovered, isFocused, userTookOver, activeIndex, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev(true);
      if (e.key === "ArrowRight") next(true);
    };
    const el = containerRef.current;
    el?.addEventListener("keydown", handler);
    return () => el?.removeEventListener("keydown", handler);
  }, [next, prev]);

  const activeItem = items[activeIndex];
  const trackH = CH + RY * 2 + 40;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Circular carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 outline-none",
        className
      )}
      style={{ color: "var(--color-text)" }}
    >
      {/* Circular track */}
      <div className="relative w-full max-w-2xl" style={{ height: trackH }}>
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const pos = getItemPosition(i, activeIndex, total, RX, RY);
            if (!pos) return null;

            const isActive = i === activeIndex;

            return (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: pos.scale,
                  opacity: pos.opacity,
                  zIndex: pos.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => goTo(i, true)}
                aria-label={item.title}
                aria-selected={isActive}
                role="option"
                className={cn(
                  "absolute left-1/2 top-1/2 cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-sm transition-shadow duration-300",
                  isActive
                    ? "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)]"
                    : "shadow-[0_8px_24px_-4px_rgba(0,0,0,0.35)]"
                )}
                style={{
                  width: CW,
                  height: CH,
                  marginLeft: -CW / 2,
                  marginTop: -CH / 2,
                  transformOrigin: "center center",
                  background:
                    "color-mix(in srgb, var(--color-surface) 88%, transparent)",
                  borderColor: isActive
                    ? "var(--color-border-strong)"
                    : "var(--color-border)",
                }}
              >
                {item.content ? (
                  <span className="block size-full text-left">{item.content}</span>
                ) : (
                  <span className="flex h-full w-full flex-col items-start justify-between p-4 text-left">
                    {item.tag && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "var(--color-muted)",
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                    <span className="w-full">
                      <span
                        className={cn(
                          "block font-semibold leading-tight",
                          isActive ? "text-base" : "text-sm"
                        )}
                        style={{ color: "var(--color-text)" }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="mt-1 line-clamp-2 block text-xs leading-relaxed"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {item.description}
                      </span>
                    </span>
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Center content */}
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className="text-5xl font-bold tracking-tight"
            style={{ color: "var(--color-text)", opacity: 0.92 }}
          >
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs" style={{ color: "var(--color-faint)" }}>
            of {String(total).padStart(2, "0")}
          </span>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => prev(true)}
          aria-label="Previous item"
          className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors"
          style={{
            borderColor: "var(--color-border)",
            background: "color-mix(in srgb, var(--color-surface) 70%, transparent)",
            color: "var(--color-muted)",
          }}
        >
          <ChevronLeft className="size-5" />
        </motion.button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5" role="tablist">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIndex}
              onClick={() => goTo(i, true)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6" : "w-1.5"
              )}
              style={{
                background:
                  i === activeIndex
                    ? "var(--color-text)"
                    : "color-mix(in srgb, var(--color-muted) 35%, transparent)",
              }}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => next(true)}
          aria-label="Next item"
          className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors"
          style={{
            borderColor: "var(--color-border)",
            background: "color-mix(in srgb, var(--color-surface) 70%, transparent)",
            color: "var(--color-muted)",
          }}
        >
          <ChevronRight className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}
