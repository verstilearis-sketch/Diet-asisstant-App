'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn, signUp } from '@/lib/storage';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    (searchParams.get('mode') as 'signin' | 'signup') || 'signin'
  );

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification states
  const [verificationStep, setVerificationStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState(''); // For development testing

  useEffect(() => {
    const session = getSession();
    if (session) router.replace('/dashboard');
  }, [router]);

  // Countdown timer for resend
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
        body: JSON.stringify({ email: form.email, action: 'send' })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      setCodeSent(true);
      setVerificationStep('verify');
      setCountdown(60); // 60 seconds before can resend

      // In development, show the code
      if (data.devCode) {
        setDevCode(data.devCode);
        console.log('🔐 DEV CODE:', data.devCode);
      }

    } catch (err) {
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
        body: JSON.stringify({ email: form.email, code: verificationCode, action: 'verify' })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Email verified! Now create account
      const result = signUp(form.email, form.password, form.name);
      if (result.success) {
        router.push('/onboarding');
      } else {
        setError(result.error || 'Sign up failed');
      }

    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      // Validation
      if (!form.name.trim()) return setError('Please enter your name');
      if (!form.email.toLowerCase().endsWith('@gmail.com')) {
        return setError('Please use a Gmail address (@gmail.com)');
      }
      if (form.password.length < 6) return setError('Password must be at least 6 characters');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match');

      // Send verification code
      await sendVerificationCode();
    } else {
      // Sign in flow (no verification needed)
      if (!form.email.includes('@')) return setError('Please enter a valid email');

      setLoading(true);
      await new Promise(r => setTimeout(r, 600));

      const result = signIn(form.email, form.password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Sign in failed');
      }
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    setError('');
  };

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError('');
    setVerificationStep('form');
    setCodeSent(false);
    setVerificationCode('');
  };

  // Verification code screen
  if (mode === 'signup' && verificationStep === 'verify') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />

        <div className="glass-card fade-in-up" style={{
          width: '100%', maxWidth: '440px',
          padding: '2.5rem 2rem',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', margin: '0 auto 1rem',
            }}>📧</div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
              Check your email
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--color-text)' }}>{form.email}</strong>
            </p>
          </div>

          {/* Development code display */}
          {devCode && (
            <div style={{
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
                🔧 DEV MODE - Your code:
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5rem', color: '#6366f1' }}>
                {devCode}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="input-label">Verification Code</label>
              <input
                className="input-field"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
                style={{
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                Enter the 6-digit code
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '0.75rem',
                color: '#fca5a5',
                fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            {countdown > 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                Resend code in {countdown}s
              </p>
            ) : (
              <button
                onClick={() => {
                  setVerificationCode('');
                  sendVerificationCode();
                }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Resend code
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => {
                setVerificationStep('form');
                setVerificationCode('');
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ← Change email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original form screen
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="glass-card fade-in-up" style={{
        width: '100%', maxWidth: '440px',
        padding: '2.5rem 2rem',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', margin: '0 auto 1rem',
          }}>🥗</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            {mode === 'signin'
              ? 'Sign in to access your personalized plan'
              : 'Start your nutrition journey today — free forever'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label className="input-label">Full Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="Alex Johnson"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
                id="auth-name"
              />
            </div>
          )}

          <div>
            <label className="input-label">
              {mode === 'signup' ? 'Gmail Address' : 'Email Address'}
            </label>
            <input
              className="input-field"
              type="email"
              placeholder={mode === 'signup' ? 'you@gmail.com' : 'you@example.com'}
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              id="auth-email"
            />
            {mode === 'signup' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ✓ Only Gmail addresses accepted
              </div>
            )}
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              id="auth-password"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="input-label">Confirm Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                required
                id="auth-confirm-password"
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '0.75rem',
              color: '#fca5a5',
              fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            id="auth-submit"
            style={{ marginTop: '0.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {mode === 'signin' ? 'Signing in…' : 'Sending code…'}</>
            ) : mode === 'signin' ? 'Sign In' : 'Continue with Email Verification →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={toggleMode}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-accent)',
              fontWeight: 600, cursor: 'pointer',
              fontSize: '0.9rem',
            }}
            id="auth-toggle"
          >
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
        </div>

        {/* Demo hint */}
        {mode === 'signin' && (
          <div style={{
            marginTop: '1.5rem',
            padding: '0.875rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '0.75rem',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              💡 <strong style={{ color: 'var(--color-text)' }}>New here?</strong> Create a free account to get your personalized plan.
            </p>
          </div>
        )}
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
