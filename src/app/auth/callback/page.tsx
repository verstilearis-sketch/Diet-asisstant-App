'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { NutriqIcon, AlertIcon } from '@/components/icons';

// ── OAuth callback ──────────────────────────────────────────────
// Google (and any future OAuth provider) redirects here with ?code=….
// We exchange it for a session, then send the user to the dashboard —
// which bounces to /onboarding when they have no plan yet.

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = searchParams.get('code');
      const errDesc = searchParams.get('error_description') || searchParams.get('error');
      if (errDesc) {
        if (!cancelled) setError(errDesc);
        return;
      }
      if (!code) {
        if (!cancelled) setError('Sign-in was interrupted. Please try again.');
        return;
      }
      try {
        const { error } = await getSupabase().auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setError('Could not complete Google sign-in. Please try again.');
          return;
        }
        if (!cancelled) router.replace('/dashboard');
      } catch {
        if (!cancelled) setError('Could not complete Google sign-in. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="auth-wrap">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card auth-card fade-in-up" style={{ textAlign: 'center' }}>
        <span className="auth-logo" style={{ marginBottom: '1.25rem' }}><NutriqIcon size={26} /></span>
        {error ? (
          <>
            <div className="error-box" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <AlertIcon size={16} /> {error}
            </div>
            <Link href="/auth" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Finishing Google sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
