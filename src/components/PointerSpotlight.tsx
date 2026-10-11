'use client';

/* ── Pointer spotlight ───────────────────────────────────────────────────
   A soft light reflection that follows the pointer across the dashboard —
   like a spotlight sweeping each tab. Fine pointers only (never on touch).
------------------------------------------------------------------------ */

import { useEffect, useRef } from 'react';

export function PointerSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = -500, ty = -500, x = -500, y = -500;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) tick();
    };
    const tick = () => {
      // Ease toward the pointer for a smooth, light-like glide.
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (el) el.style.transform = `translate(${x - 260}px, ${y - 260}px)`;
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onLeave = () => {
      tx = -500; ty = -500;
      if (!raf) tick();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-spotlight"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: 520, height: 520,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
        mixBlendMode: 'soft-light',
        transform: 'translate(-500px, -500px)',
      }}
    />
  );
}
