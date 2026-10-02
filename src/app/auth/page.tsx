'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn, signUp } from '@/lib/storage';
import { SaladIcon, MailIcon, LockIcon, UserIcon, AlertIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    (searchParams.get('mode') as 'signin' | 'signup') || 'signin'
  );

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [verificationStep, setVerificationStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    const session = getSession();
    if (session) router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerificationCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, action: 'send' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }
      setVerificationStep('verify');
      setCountdown(60);
      if (data.devCode) setDevCode(data.devCode);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: verificationCode, action: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }
      const result = signUp(form.email, form.password, form.name);
      if (result.success) {
        router.push('/onboarding');
      } else {
        setError(result.error || 'Sign up failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!form.name.trim()) return setError('Please enter your name.');
      if (!form.email.toLowerCase().endsWith('@gmail.com')) {
        return setError('Please use a Gmail address (@gmail.com).');
      }
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
      await sendVerificationCode();
    } else {
      if (!form.email.includes('@')) return setError('Please enter a valid email.');
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      const result = signIn(form.email, form.password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Sign in failed.');
      }
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError('');
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setVerificationStep('form');
    setVerificationCode('');
    setCountdown(0);
  };

  /* ── Verification step ─────────────────────────────────── */
  if (mode === 'signup' && verificationStep === 'verify') {
    return (
      <div className="auth-wrap">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="glass-card auth-card fade-in-up">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="auth-logo"><MailIcon size={24} /></div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>Check your email</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--color-text)' }}>{form.email}</strong>
            </p>
          </div>

          {devCode && (
            <div className="info-box" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem', opacity: 0.75 }}>
                Development mode — your code
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.45rem', fontVariantNumeric: 'tabular-nums' }}>
                {devCode}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label" htmlFor="verify-code">Verification code</label>
              <input
                id="verify-code"
                className="input-field code-input"
                type="text"
                inputMode="numeric"
                placeholder="••••••"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {error && <div className="error-box"><AlertIcon size={16} /> {error}</div>}

            <button className="btn-primary" type="submit" disabled={loading || verificationCode.length !== 6} style={{ width: '100%' }}>
              {loading ? 'Verifying…' : 'Verify & create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.87rem', color: 'var(--color-muted)' }}>
            {countdown > 0 ? (
              <>Didn't get it? Resend in <strong style={{ color: 'var(--color-text)' }}>{countdown}s</strong></>
            ) : (
              <button className="link-btn" onClick={() => { setVerificationCode(''); sendVerificationCode(); }} disabled={loading}>
                Resend code
              </button>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <button
              className="link-btn"
              style={{ color: 'var(--color-muted)', fontWeight: 550, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => { setVerificationStep('form'); setVerificationCode(''); setError(''); }}
            >
              <ArrowLeftIcon size={14} /> Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Sign in / sign up form ──────────────────────────────── */
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
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            {mode === 'signin'
              ? 'Sign in to access your personalized plan.'
              : 'Start your nutrition journey — free.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label className="input-label" htmlFor="auth-name">Full name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-faint)', pointerEvents: 'none' }} />
                <input id="auth-name" className="input-field" style={{ paddingLeft: '2.7rem' }} type="text"
                  placeholder="Alex Johnson" value={form.name}
                  onChange={(e) => update('name', e.target.value)} required />
              </div>
            </div>
          )}

          <div>
            <label className="input-label" htmlFor="auth-email">
              {mode === 'signup' ? 'Gmail address' : 'Email address'}
            </label>
            <div style={{ position: 'relative' }}>
              <MailIcon size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-faint)', pointerEvents: 'none' }} />
              <input id="auth-email" className="input-field" style={{ paddingLeft: '2.7rem' }} type="email"
                placeholder={mode === 'signup' ? 'you@gmail.com' : 'you@example.com'}
                value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            {mode === 'signup' && (
              <p style={{ fontSize: '0.76rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
                Only Gmail addresses are accepted for verification.
              </p>
            )}
          </div>

          <div>
            <label className="input-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <LockIcon size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-faint)', pointerEvents: 'none' }} />
              <input id="auth-password" className="input-field" style={{ paddingLeft: '2.7rem' }} type="password"
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
                value={form.password} onChange={(e) => update('password', e.target.value)} required />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="input-label" htmlFor="auth-confirm-password">Confirm password</label>
              <div style={{ position: 'relative' }}>
                <LockIcon size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-faint)', pointerEvents: 'none' }} />
                <input id="auth-confirm-password" className="input-field" style={{ paddingLeft: '2.7rem' }} type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
              </div>
            </div>
          )}

          {error && <div className="error-box"><AlertIcon size={16} /> {error}</div>}

          <button className="btn-primary" type="submit" disabled={loading} id="auth-submit" style={{ width: '100%', marginTop: '0.25rem' }}>
            {loading ? (
              <><span className="spinner" style={{ width: 17, height: 17, borderWidth: 2 }} /> {mode === 'signin' ? 'Signing in…' : 'Sending code…'}</>
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              <>Continue <ArrowRightIcon size={16} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--color-muted)' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button className="link-btn" onClick={toggleMode} id="auth-toggle">
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
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
