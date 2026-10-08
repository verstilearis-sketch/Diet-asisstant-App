import type { Metadata } from 'next';
import Link from 'next/link';
import { NutriqIcon } from '@/components/icons';
import { ARTICLES } from '@/data/articles';

export const metadata: Metadata = {
  title: 'Blog — Nutriq',
  description:
    'Practical nutrition guides: BMR, TDEE, BMI, Indian meal plans, and Kashmiri diet strategies — all backed by real science.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndex() {
  return (
    <div className="page-shell">
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <NutriqIcon size={29} />
            </span>
            Nutriq
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 760, paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="eyebrow" style={{ marginBottom: '1rem' }}>Blog</div>
        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', marginBottom: '1rem', lineHeight: 1.15 }}>
          Nutrition, explained properly.
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 600 }}>
          No miracle foods, no detox teas. Just the science behind the numbers your plan is built on —
          and practical guides for eating well in India.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                borderRadius: '1rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text)', lineHeight: 1.35 }}>
                {a.title}
              </h2>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.93rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                {a.description}
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {a.readMinutes} min read
              </span>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" className="brand" style={{ fontSize: '1.1rem' }}>
            <span className="brand-mark" style={{ width: 36, height: 36 }}><NutriqIcon size={20} /></span>
            Nutriq
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }} aria-label="Footer">
            <Link href="/" className="nav-link" style={{ fontSize: '0.85rem' }}>Home</Link>
            <Link href="/about" className="nav-link" style={{ fontSize: '0.85rem' }}>About</Link>
            <Link href="/blog" className="nav-link" style={{ fontSize: '0.85rem' }}>Blog</Link>
            <Link href="/auth" className="nav-link" style={{ fontSize: '0.85rem' }}>Sign in</Link>
            <Link href="/privacy" className="nav-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</Link>
          </nav>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', maxWidth: 480 }}>
            For informational purposes only — not medical advice. © 2026 Nutriq.
          </p>
        </div>
      </footer>
    </div>
  );
}
