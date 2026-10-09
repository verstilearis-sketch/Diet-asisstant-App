'use client';

import { useEffect, useState } from 'react';

// ── Scroll progress bar ───────────────────────────────────────────
// Thin brand-colored bar at the very top showing page scroll progress.

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        width: `${progress}%`,
        background: 'var(--color-accent)',
        zIndex: 9998,
        transition: 'width 0.1s linear',
      }}
    />
  );
}
