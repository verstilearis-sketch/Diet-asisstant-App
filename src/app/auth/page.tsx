'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signInWithGoogle } from '@/lib/storage';
import { SaladIcon, AlertIcon, GoogleIcon } from '@/components/icons';

function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (session && !cancelled) router.replace('/dashboard');
    });
    return () => { cancelled = true; };
  }, [router]);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    const result = await signInWithGoogle();
    // Success means the browser is leaving for Google — keep the spinner
    // until navigation happens. Failure stays on this page with an error.
    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card auth-card fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link href="/" style={{ display: 'inline-block' }} aria-label="DietAI home">
            <span className="auth-logo" style={{ marginBottom: 0 }}><SaladIcon size={24} /></span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', margin: '1rem 0 0.4rem' }}>
            Welcome to DietAI
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Sign in to get your personalized nutrition plan.
          </p>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '1rem' }}><AlertIcon size={16} /> {error}</div>}

        <button
          type="button" className="btn-secondary" onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.8rem' }}
        >
          {loading ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            <GoogleIcon size={19} />
          )}
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--color-faint)', lineHeight: 1.6 }}>
          By continuing, you agree to our{' '}
          <Link href="/privacy" style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          .
        </p>
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
