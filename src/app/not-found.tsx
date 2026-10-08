import Link from 'next/link';
import { NutriqIcon } from '@/components/icons';

// ── Custom 404 ────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '26rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <NutriqIcon size={56} />
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          This page wandered off the meal plan. Let&apos;s get you back on track.
        </p>
        <Link
          href="/"
          className="btn-primary"
          style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 1.75rem' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
