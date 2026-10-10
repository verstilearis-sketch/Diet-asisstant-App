'use client';

import { useState } from 'react';

// ── Floating contact button ───────────────────────────────────────
// Opens the user's mail app to contact support.
// Sits in a neat vertical stack above the AI coach button.

const SUPPORT_EMAIL = 'xycicdoctor@gmail.com';

export function FloatingContact() {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=Zaiq%20support`}
      aria-label="Contact support"
      title="Contact support"
      className="contact-fab"
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{
        transform: active ? 'scale(0.92)' : hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </a>
  );
}
