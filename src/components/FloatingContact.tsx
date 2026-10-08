'use client';

import { useState } from 'react';

// ── Floating contact button ───────────────────────────────────────
// Opens the user's mail app to contact support.

const SUPPORT_EMAIL = 'support@nutriq.app';

export function FloatingContact() {
  const [hover, setHover] = useState(false);

  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=Nutriq%20support`}
      aria-label="Contact support"
      title="Contact support"
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{
        position: 'fixed',
        bottom: '4.5rem',
        right: '1.25rem',
        zIndex: 9000,
        width: '2.75rem',
        height: '2.75rem',
        borderRadius: '50%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-card)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.15s ease',
      }}
    >
      ✉️
    </a>
  );
}
