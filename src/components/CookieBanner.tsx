'use client';

import { useEffect, useState } from 'react';

// ── Cookie banner ─────────────────────────────────────────────────
// Simple consent banner. Persists choice to localStorage.

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('nutriq-cookie-consent')) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value: string) => {
    localStorage.setItem('nutriq-cookie-consent', value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        maxWidth: '28rem',
        margin: '0 auto',
        zIndex: 9999,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        padding: '1rem 1.25rem',
      }}
    >
      <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
        We use cookies to keep you signed in and remember your preferences.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" onClick={() => choose('declined')}
          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
          Decline
        </button>
        <button type="button" className="btn-primary" onClick={() => choose('accepted')}
          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
          Accept
        </button>
      </div>
    </div>
  );
}
