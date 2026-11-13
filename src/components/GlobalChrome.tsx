'use client';

import { useEffect } from 'react';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollProgress } from '@/components/ScrollProgress';
import { captureUtmParams } from '@/lib/utm';

// ── Global UI chrome ──────────────────────────────────────────────
// Site-wide floating elements: cookie banner, back-to-top, scroll
// progress. Also captures UTM params on first visit.
// (The floating contact button was removed Nov 13, 2026 at Salik's word —
// the component file is kept so it can be restored with one line.)

export function GlobalChrome() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          zIndex: 10000,
          padding: '0.75rem 1.25rem',
          background: 'var(--color-accent)',
          color: '#fff',
          borderRadius: '0 0 0.5rem 0',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '0';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
        }}
      >
        Skip to content
      </a>
      <ScrollProgress />
      <CookieBanner />
    </>
  );
}
