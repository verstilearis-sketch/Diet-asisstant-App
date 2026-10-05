'use client';

import { useEffect } from 'react';

/**
 * Dashboard error boundary. If the dashboard crashes during render (e.g. on
 * unexpected saved-plan data), show the actual error message instead of
 * Next.js's generic "This page couldn't load" page, so the problem can be
 * diagnosed from a screenshot.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard crashed:', error);
  }, [error]);

  return (
    <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="glass-card" style={{ padding: '2rem', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Something went wrong loading your dashboard
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Please take a screenshot of this page and share it — it tells us exactly what broke.
        </p>
        <pre style={{
          fontSize: '0.72rem', textAlign: 'left', background: 'var(--color-bg)',
          border: '1px solid var(--color-border)', borderRadius: '0.5rem',
          padding: '0.75rem', overflow: 'auto', maxHeight: 160, marginBottom: '1.25rem',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {error.message}
          {error.digest ? `\n(digest: ${error.digest})` : ''}
        </pre>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={reset} style={{ padding: '0.7rem 1.5rem' }}>
            Try again
          </button>
          <button type="button" className="btn-secondary" onClick={() => (window.location.href = '/')} style={{ padding: '0.7rem 1.5rem' }}>
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
