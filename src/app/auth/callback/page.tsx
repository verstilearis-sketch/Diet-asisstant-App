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
  const [debug, setDebug] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const code = searchParams.get('code');
      const errDesc = searchParams.get('error_description') || searchParams.get('error');
      if (errDesc) {
        if (!cancelled) {
          setError(decodeURIComponent(errDesc).replace(/\+/g, ' '));
          setDebug(typeof window !== 'undefined' ? window.location.search.slice(0, 200) : '');
        }
        return;
      }
      if (!code) {
        // No code: the user may already have a session (e.g. the browser
        // auto-detected tokens from the URL, or they are already signed in).
        try {
          const { data } = await getSupabase().auth.getSession();
          if (data.session) {
            if (!cancelled) router.replace('/dashboard');
            return;
          }
        } catch {
          /* fall through to the error below */
        }
        if (!cancelled) {
          setError('Sign-in was interrupted. Please try again.');
          // Diagnostic: shows what the callback actually received.
          const q = typeof window !== 'undefined' ? window.location.search : '';
          const h = typeof window !== 'undefined' ? window.location.hash : '';
          setDebug(`query: ${q.slice(0, 160) || '(empty)'} | hash: ${h.slice(0, 80) || '(empty)'}`);
        }
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
        <span className="auth-logo" style={{ marginBottom: '1.25rem' }}><NutriqIcon size={33} /></span>
        {error ? (
          <>
            <div className="error-box" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <AlertIcon size={16} /> {error}
            </div>
            {debug && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-faint)', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '1.25rem', textAlign: 'left' }}>
                Detail: {debug}
              </p>
            )}
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
