'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signInWithGoogle } from '@/lib/storage';
import { NutriqIcon, AlertIcon, GoogleIcon } from '@/components/icons';

function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [needAgree, setNeedAgree] = useState(false);
  // Ref guard: React state hasn't re-rendered yet during a rapid double-tap,
  // so `loading` alone can't stop two OAuth flows from starting.
  const redirecting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (session && !cancelled) router.replace('/dashboard');
    });
    return () => { cancelled = true; };
  }, [router]);

  const handleGoogle = async () => {
    // Every tap does something visible — never a dead button.
    if (!agreed) {
      setNeedAgree(true);
      return;
    }
    if (redirecting.current) return;
    redirecting.current = true;
    setError('');
    setLoading(true);
    const result = await signInWithGoogle();
    // Success means the browser is leaving for Google — keep the spinner
    // until navigation happens. Failure stays on this page with an error.
    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Please try again.');
      setLoading(false);
      redirecting.current = false;
    }
  };

  return (
    <div className="auth-wrap">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card auth-card fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link href="/" style={{ display: 'inline-block' }} aria-label="Nutriq home">
            <span className="auth-logo" style={{ marginBottom: 0 }}><NutriqIcon size={33} /></span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', margin: '1rem 0 0.4rem' }}>
            Welcome to Nutriq
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Sign in to get your personalized nutrition plan.
          </p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '1rem' }}><AlertIcon size={16} /> {error}</div>}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1.25rem', cursor: 'pointer', fontSize: '0.84rem', color: needAgree && !agreed ? 'var(--color-text)' : 'var(--color-muted)', lineHeight: 1.55 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setNeedAgree(false); }}
            style={{ marginTop: '0.2rem', width: 18, height: 18, accentColor: 'var(--color-accent)', flexShrink: 0, cursor: 'pointer', outline: needAgree && !agreed ? '2px solid var(--color-accent)' : 'none', outlineOffset: 2, borderRadius: 4 }}
          />
          <span>
            I&apos;ve read and agree to the{' '}
            <Link href="/privacy" style={{ color: 'var(--color-text)', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {needAgree && !agreed && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '0.5rem', fontWeight: 600 }}>
            Please tick the box above first — one tap, then continue.
          </p>
        )}

        <button
          type="button" className="btn-secondary" onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.8rem', marginTop: '1rem', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            <GoogleIcon size={19} />
          )}
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
