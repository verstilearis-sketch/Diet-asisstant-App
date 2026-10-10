"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FloatingHeroImage {
  src: string;
  alt: string;
  className?: string;
}

export interface FloatingFoodHeroProps {
  title: string;
  description: string;
  badge?: string;
  images?: FloatingHeroImage[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * FloatingFoodHero — central text block surrounded by gently floating images.
 * Responsive and theme-aware (follows the app's light/dark tokens).
 * Image positions/sizes come from each image's className (see demo below).
 * Optional `badge` renders a small pill above the title; children animate in
 * with a staggered rise on mount.
 */
export function FloatingFoodHero({
  title,
  description,
  badge,
  images = [],
  children,
  className,
}: FloatingFoodHeroProps) {
  return (
    <section
      aria-label="Introduction"
      className={cn(
        "floating-hero relative flex min-h-[92svh] w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      {/* Floating images */}
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          loading={i < 2 ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className={cn(
            "animate-float pointer-events-none absolute select-none",
            img.className,
          )}
        />
      ))}

      {/* Central text block */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        {badge ? (
          <div className="hero-anim" style={{ animationDelay: "0ms" }}>
            <span className="hero-badge">{badge}</span>
          </div>
        ) : null}
        <h1
          className="hero-anim font-bold leading-[1.05] tracking-[-0.03em] text-[var(--color-text)]"
          style={{ fontSize: "clamp(2.4rem, 6vw, 4.25rem)", animationDelay: "90ms" }}
        >
          {title}
        </h1>
        <p
          className="hero-anim mx-auto mt-6 max-w-xl text-[var(--color-muted)]"
          style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", lineHeight: 1.7, animationDelay: "180ms" }}
        >
          {description}
        </p>
        {children ? (
          <div className="hero-anim mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "270ms" }}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
