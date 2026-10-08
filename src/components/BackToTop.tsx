'use client';

import { useEffect, useState } from 'react';

// ── Back to top button ────────────────────────────────────────────
// Appears after scrolling down; smooth-scrolls to top.

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9000,
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--color-accent)',
        color: '#fff',
        fontSize: '1.2rem',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.15s ease, background 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.background = 'var(--color-accent-hover)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'var(--color-accent)';
      }}
    >
      ↑
    </button>
  );
}
