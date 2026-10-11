'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// NOTE: '@/lib/storage' (supabase-js, ~800KB) is NEVER statically imported
// here — it loads lazily on tap so this page paints instantly on phones.
import { ZaiqIcon, AlertIcon, GoogleIcon } from '@/components/icons';

/** Bump this whenever the privacy policy changes — users will be asked to accept again. */
const PRIVACY_VERSION = '2026-10-11';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Privacy acceptance is versioned: once accepted, the checkbox never shows
  // again — unless the policy itself is updated (bump PRIVACY_VERSION).
  const [agreed, setAgreed] = useState(false);
  const [needAgree, setNeedAgree] = useState(false);
  const [showCheckbox, setShowCheckbox] = useState(true);
  // Ref guard: React state hasn't re-rendered yet during a rapid double-tap,
  // so `loading` alone can't stop two OAuth flows from starting.
  const redirecting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Lazy session check — never blocks first paint.
    import('@/lib/storage').then(({ getSession }) => {
      getSession().then((session) => {
        if (session && !cancelled) router.replace('/dashboard');
      }).catch(() => {});
    }).catch(() => {});
    // Returning users who already accepted the current privacy policy
    // go straight through — no checkbox again.
    try {
      if (localStorage.getItem('zaiq_privacy_accepted') === PRIVACY_VERSION) {
        setAgreed(true);
        setShowCheckbox(false);
      }
    } catch { /* private mode */ }
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
    setLoading(true); // instant feedback
    try { localStorage.setItem('zaiq_privacy_accepted', PRIVACY_VERSION); } catch { /* private mode */ }
    // Direct Google OAuth: just build the URL and go — no heavy libraries,
    // no waiting. The tap redirects instantly.
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const state = [...crypto.getRandomValues(new Uint8Array(16))]
        .map((b) => b.toString(16).padStart(2, '0')).join('');
      document.cookie = `zaiq_oauth_state=${encodeURIComponent(state)}; path=/; max-age=600; SameSite=Lax`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      return; // the browser is leaving for Google — nothing more to do
    }
    // Fallback (no client ID configured): needs supabase — lazy-load only here.
    try {
      const { signInWithGoogle } = await import('@/lib/storage');
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Google sign-in failed. Please try again.');
        setLoading(false);
        redirecting.current = false;
      }
    } catch {
      setError('Could not start Google sign-in. Please check your connection and try again.');
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

        {showCheckbox && (
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
        )}
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
    <Suspense fallback={
      <div className="auth-wrap">
        <div className="signin-card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
