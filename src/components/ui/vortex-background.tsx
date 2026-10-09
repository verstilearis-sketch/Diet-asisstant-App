"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface Vortex {
  x: number;
  y: number;
  strength: number;
  dir: 1 | -1;
  radius: number;
}

/**
 * VortexBackground — full-bleed animated canvas that sheds a von Karman
 * vortex street of drifting particle streaks as the pointer moves.
 * Tapping/clicking drops a decaying counter-rotating vortex pair.
 *
 * - pointer-events: none (never blocks clicks), window-level listeners
 * - Respects prefers-reduced-motion (renders nothing)
 * - Pauses when the tab is hidden; lighter particle load on small screens
 * - Theme-aware: particle tint follows --color-accent
 */
export function VortexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const isSmall = () => Math.min(window.innerWidth, window.innerHeight) < 640;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle tint follows the theme accent.
    let tint = "23, 114, 69";
    const readTint = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim();
      const m = v.match(/#([0-9a-f]{6})/i);
      if (m) {
        const n = parseInt(m[1], 16);
        tint = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
      }
    };
    readTint();
    const themeObs = new MutationObserver(readTint);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });

    const particles: Particle[] = [];
    const vortices: Vortex[] = [];
    const MAX = () => (isSmall() ? 70 : 160);

    const spawn = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      life: number,
      size: number,
    ) => {
      if (particles.length >= MAX()) particles.shift();
      particles.push({ x, y, vx, vy, life, maxLife: life, size });
    };

    // Ambient drift.
    const seedAmbient = () => {
      const n = Math.floor(MAX() * 0.45);
      for (let i = 0; i < n; i++) {
        spawn(
          Math.random() * w,
          Math.random() * h,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.25,
          240 + Math.random() * 240,
          0.8 + Math.random() * 1.6,
        );
      }
    };
    seedAmbient();

    // Pointer trail → von Karman street (alternating sides + curl).
    let lastX = -1;
    let lastY = -1;
    let lastT = 0;
    let side: 1 | -1 = 1;

    const onMove = (x: number, y: number) => {
      const now = performance.now();
      if (lastX >= 0 && now - lastT < 90) {
        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          const nx = dx / dist;
          const ny = dy / dist;
          // Perpendicular offset, alternating sides → staggered vortices.
          side = side === 1 ? -1 : 1;
          const off = 10 * side;
          const px = -ny * off;
          const py = nx * off;
          const steps = Math.min(4, Math.floor(dist / 14) + 1);
          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            // Curl: tangential kick around the shed point.
            const curl = 0.9 * side;
            spawn(
              lastX + dx * t + px,
              lastY + dy * t + py,
              nx * 1.4 + -ny * curl,
              ny * 1.4 + nx * curl,
              70 + Math.random() * 60,
              1 + Math.random() * 1.8,
            );
          }
          // The cursor itself drags a small live vortex.
          vortices.push({ x, y, strength: 2.2, dir: side, radius: 90 });
          if (vortices.length > 24) vortices.splice(0, vortices.length - 24);
        }
      }
      lastX = x;
      lastY = y;
      lastT = now;
    };

    const onPointerMove = (e: PointerEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };

    // Click/tap → decaying counter-rotating vortex pair.
    const onDown = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const gap = 26;
      vortices.push(
        { x: x - gap, y, strength: 9, dir: 1, radius: 150 },
        { x: x + gap, y, strength: 9, dir: -1, radius: 150 },
      );
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 6 + Math.random() * 30;
        spawn(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          Math.cos(a) * (1 + Math.random() * 2),
          Math.sin(a) * (1 + Math.random() * 2),
          50 + Math.random() * 50,
          1 + Math.random() * 2,
        );
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    const onVis = () => {
      const hidden = document.hidden;
      if (hidden && running) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!hidden && !running) {
        running = true;
        lastT = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = () => {
      if (!running) return;

      // Decay + prune vortices.
      for (let i = vortices.length - 1; i >= 0; i--) {
        vortices[i].strength *= 0.965;
        if (vortices[i].strength < 0.08) vortices.splice(i, 1);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Vortex influence: tangential swirl.
        for (const v of vortices) {
          const dx = p.x - v.x;
          const dy = p.y - v.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < v.radius * v.radius && d2 > 4) {
            const d = Math.sqrt(d2);
            const fall = 1 - d / v.radius;
            const s = ((v.strength * v.dir * fall) / d) * 22;
            p.vx += -dy * s * 0.016;
            p.vy += dx * s * 0.016;
          }
        }

        // Gentle drag + drift.
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        if (p.life <= 0) {
          // Recycle as ambient drift instead of dying visibly.
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.vx = (Math.random() - 0.5) * 0.25;
          p.vy = (Math.random() - 0.5) * 0.25;
          p.maxLife = p.life = 240 + Math.random() * 240;
          p.size = 0.8 + Math.random() * 1.6;
          continue;
        }

        const fade = Math.min(1, p.life / 60);
        const alpha = 0.34 * fade;

        // Streak: short line along velocity → motion-blur feel.
        ctx.strokeStyle = `rgba(${tint}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
      themeObs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="vortex-bg"
    />
  );
}
