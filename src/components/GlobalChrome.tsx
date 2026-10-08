'use client';

import { useEffect } from 'react';
import { CookieBanner } from '@/components/CookieBanner';
import { BackToTop } from '@/components/BackToTop';
import { ScrollProgress } from '@/components/ScrollProgress';
import { FloatingContact } from '@/components/FloatingContact';
import { captureUtmParams } from '@/lib/utm';

// ── Global UI chrome ──────────────────────────────────────────────
// Site-wide floating elements: cookie banner, back-to-top, scroll
// progress, contact button. Also captures UTM params on first visit.

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
      <BackToTop />
      <FloatingContact />
    </>
  );
}
