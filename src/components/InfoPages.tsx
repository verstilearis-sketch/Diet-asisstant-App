'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ZaiqIcon, ArrowRightIcon } from '@/components/icons';
import { SiteNav } from '@/components/SiteNav';

const TABS = [
  { href: '/numbers', label: 'How we hit your numbers' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
];

export function InfoPageTabs() {
  const pathname = usePathname();
  return (
    <div
      className="math-fade"
      style={{
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: '2.5rem',
      }}
      role="tablist"
      aria-label="Learn more"
    >
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: active ? 700 : 600,
              color: active ? '#fff' : 'var(--color-text)',
              background: active ? 'var(--color-accent)' : 'var(--color-surface)',
              border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
              textDecoration: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function InfoPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <SiteNav />
      <main className="container" style={{ paddingTop: '7rem', paddingBottom: '2rem', maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/" aria-label="Zaiq home" style={{ display: 'inline-flex' }}>
            <span className="brand-mark" style={{ width: 44, height: 44 }}><ZaiqIcon size={26} /></span>
          </Link>
        </div>
        <InfoPageTabs />
        {children}
      </main>
    </div>
  );
}

export function InfoPageCTA({ nextHref, nextLabel }: { nextHref: string; nextLabel: string }) {
  return (
    <div className="glass-card math-fade" style={{ marginTop: '3rem', padding: '2.5rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>Ready when you are.</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Free · 2-minute setup · No credit card
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href={nextHref} className="btn-secondary" style={{ fontSize: '0.95rem', padding: '0.85rem 1.8rem', textDecoration: 'none' }}>
          {nextLabel} <ArrowRightIcon size={16} />
        </Link>
        <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.85rem 1.8rem', textDecoration: 'none' }}>
          Log in to get started
        </Link>
      </div>
    </div>
  );
}
