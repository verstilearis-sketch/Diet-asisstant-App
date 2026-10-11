import { LoaderRing } from '@/components/ZaiqLoader';

/* Instant skeleton shown the moment the user taps Get Started, while the
   auth chunk (supabase) finishes loading — so the tap never feels dead. */
export default function AuthLoading() {
  return (
    <div className="auth-wrap">
      <div className="signin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 2rem' }}>
        <LoaderRing size={40} />
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Getting things ready…</p>
      </div>
    </div>
  );
}
