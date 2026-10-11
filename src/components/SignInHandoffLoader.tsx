'use client';

import { ZaiqIcon } from '@/components/icons';
import { LoadingScreen } from '@/components/ZaiqLoader';

/**
 * The one and only loading screen for the Google sign-in handoff.
 * Rendered by /auth/callback AND by the dashboard while it finishes
 * loading after a fresh sign-in — so the user sees a single continuous
 * loading page from tap to dashboard, never two different spinners.
 */
export function SignInHandoffLoader() {
  return (
    <div className="auth-wrap">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card auth-card fade-in-up" style={{ textAlign: 'center' }}>
        <span className="auth-logo" style={{ marginBottom: '1.25rem' }}><ZaiqIcon size={33} /></span>
        <LoadingScreen title="Finishing Google sign-in…" subtitle="You're almost in — setting things up." />
      </div>
    </div>
  );
}

/** Mark that a fresh sign-in just handed off to the dashboard. */
export function markSignInHandoff() {
  try { sessionStorage.setItem('zaiq_signin_handoff', '1'); } catch { /* private mode */ }
}

/** True if the dashboard is loading right after a fresh sign-in. */
export function isSignInHandoff(): boolean {
  try { return sessionStorage.getItem('zaiq_signin_handoff') === '1'; } catch { return false; }
}

/** Clear the handoff flag once the dashboard has rendered. */
export function clearSignInHandoff() {
  try { sessionStorage.removeItem('zaiq_signin_handoff'); } catch { /* private mode */ }
}
