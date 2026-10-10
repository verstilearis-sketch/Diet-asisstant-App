'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession, signInWithGoogle } from '@/lib/storage';
import { ZaiqIcon, AlertIcon, GoogleIcon } from '@/components/icons';
import { LoadingScreen } from '@/components/ZaiqLoader';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';
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
      <div className="signin-card fade-in-up">
        <Link href="/" aria-label="Zaiq home" style={{ display: 'inline-block' }}>
          <span className="signin-logo"><ZaiqIcon size={30} /></span>
        </Link>
        <h1 className="signin-title">Zaiq</h1>
        <p className="signin-sub">
          {isSignup
            ? 'Create your account — your personalized nutrition plan is 2 minutes away.'
            : 'Welcome back — sign in to continue to your nutrition plan.'}
        </p>

        {error && <div className="error-box" style={{ marginBottom: '1rem', textAlign: 'left' }}><AlertIcon size={16} /> {error}</div>}

        <button
          type="button" className="btn-primary signin-google" onClick={handleGoogle} disabled={loading}
          style={{ opacity: loading ? 0.65 : 1 }}
        >
          {loading ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            <GoogleIcon size={19} />
          )}
          {loading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        <label className={'signin-agree' + (needAgree && !agreed ? ' signin-agree-needed' : '')}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setNeedAgree(false); }}
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
          <p className="signin-agree-hint">
            Please tick the box above first — one tap, then continue.
          </p>
        )}

        <p className="signin-toggle">
          {isSignup ? (
            <>Already have an account? <Link href="/auth?mode=signin">Sign in</Link></>
          ) : (
            <>New to Zaiq? <Link href="/auth?mode=signup">Create an account, it&apos;s free</Link></>
          )}
        </p>
      </div>
      <p className="signin-proof">Free · 2-minute setup · No credit card</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthForm />
    </Suspense>
  );
}
