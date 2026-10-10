'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { ZaiqIcon, AlertIcon } from '@/components/icons';
import { LoadingScreen } from '@/components/ZaiqLoader';

// ── OAuth callback ──────────────────────────────────────────────
// Direct Google OAuth (not via Supabase Auth) lands here with the ID token
// in a short-lived cookie (set by /api/auth/google/callback). We sign into
// Supabase with it, then send the user to the dashboard — which bounces to
// /onboarding when they have no plan yet.
// (The old Supabase-hosted ?code=… flow is kept as a fallback.)

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      const errDesc = searchParams.get('error_description') || searchParams.get('error');
      const debugUrl = () => {
        const q = typeof window !== 'undefined' ? window.location.search : '';
        return `query: ${q.slice(0, 160) || '(empty)'}`;
      };
      if (errDesc) {
        if (!cancelled) {
          setError(decodeURIComponent(errDesc).replace(/\+/g, ' '));
          setDebug(debugUrl());
        }
        return;
      }
      // New flow: ID token from our own Google OAuth, passed via cookie.
      const idToken = document.cookie.match(/(?:^|;\s*)zaiq_id_token=([^;]+)/)?.[1];
      if (idToken) {
        // Clear it immediately — it must not linger.
        document.cookie = 'zaiq_id_token=; path=/; max-age=0';
        try {
          const { error } = await sb.auth.signInWithIdToken({
            provider: 'google',
            token: decodeURIComponent(idToken),
          });
          if (error) throw error;
        } catch (e) {
          if (!cancelled) {
            setError('Could not complete Google sign-in. Please try again.');
            const msg = e instanceof Error ? e.message : String(e);
            setDebug(`id_token sign-in failed: ${msg.slice(0, 160)}`);
          }
          return;
        }
        if (!cancelled) router.replace('/dashboard');
        return;
      }
      const code = searchParams.get('code');
      if (code) {
        try {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } catch (e) {
          // The code may already have been redeemed (e.g. a retried page
          // load) — a session may still have been established. Check first.
          try {
            const { data } = await sb.auth.getSession();
            if (data.session) {
              if (!cancelled) router.replace('/dashboard');
              return;
            }
          } catch {
            /* fall through to the error below */
          }
          if (!cancelled) {
            setError('Could not complete Google sign-in. Please try again.');
            const msg = e instanceof Error ? e.message : String(e);
            setDebug(`exchange failed: ${msg.slice(0, 160)} | ${debugUrl()}`);
          }
          return;
        }
        if (!cancelled) router.replace('/dashboard');
        return;
      }
      // No code: the user may already have a session (already signed in).
      try {
        const { data } = await sb.auth.getSession();
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
        setDebug(debugUrl());
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
        <span className="auth-logo" style={{ marginBottom: '1.25rem' }}><ZaiqIcon size={33} /></span>
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
          <LoadingScreen title="Finishing Google sign-in…" subtitle="You're almost in — setting things up." />
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CallbackHandler />
    </Suspense>
  );
}
