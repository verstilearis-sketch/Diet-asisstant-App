"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
 * Site header — full-width bar: brand + links on the left,
 * Sign in + Get Started on the right; hamburger drawer on phones.
 */
export function SiteNav({ links = DEFAULT_LINKS }: { links?: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Tapping the logo scrolls to top (replaces the old back-to-top button)
  const onLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <div className="nav-left">
          <Link href="/" className="brand" onClick={onLogoClick} aria-label="Zaiq home">
            <span className="brand-mark"><ZaiqIcon size={26} /></span>
            Zaiq
          </Link>
          <div className="nav-links">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="nav-right">
          <Link href="/auth?mode=signin" className="btn-ghost nav-signin">Sign in</Link>
          <Link href="/auth?mode=signup" className="nav-cta-solid">
            Get Started
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
          <div className="nav-menu-actions">
            <Link href="/auth?mode=signin" className="btn-ghost" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/auth?mode=signup" className="nav-cta-solid" onClick={() => setOpen(false)}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
