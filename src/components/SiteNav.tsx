"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ZaiqIcon } from '@/components/icons';

export interface NavLink {
  href: string;
  label: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/privacy', label: 'Privacy Policy' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="17" y2="6" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="14" x2="17" y2="14" />
        </>
      )}
    </svg>
  );
}

/**
 * Shared site navigation: logo + links + auth actions on desktop,
 * logo + Get started + hamburger menu on phones.
 */
export function SiteNav({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark"><ZaiqIcon size={29} /></span>
          Zaiq
        </Link>
        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/auth?mode=signin" className="btn-ghost nav-signin">Sign in</Link>
          <Link href="/auth?mode=signup" className="btn-primary nav-cta" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
            Get started
          </Link>
          <button
            type="button"
            className="nav-menu-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-menu-panel">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link nav-menu-link" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
