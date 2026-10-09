"use client";

// Compact version of the container-scroll idea: as the reader scrolls a
// section into view, its card eases from a tilted 3D perspective to flat.
// Same rotate-on-scroll language as ContainerScroll, sized for sections.
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export function TiltOnScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.42"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.35, 1]);

  return (
    <div ref={ref} style={{ perspective: "1100px" }} className={className}>
      <motion.div
        style={{
          rotateX,
          scale,
          opacity,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
