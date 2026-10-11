import type { Metadata } from 'next';
import { InfoPageShell, InfoPageCTA } from '@/components/InfoPages';
import { STEPS } from '@/data/info-pages';

export const metadata: Metadata = {
  title: 'How it works — Zaiq',
  description: 'Four steps from sign-up to supper: how Zaiq turns your body’s math into food you actually eat.',
};

export default function HowItWorksPage() {
  return (
    <InfoPageShell>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="eyebrow">How it works</div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Four steps from sign-up to supper.
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          No guesswork, no generic meal templates — just your body’s math turned into food you actually eat.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
        {STEPS.map((s, i) => (
          <div key={s.n} className="glass-card math-fade" style={{ padding: '1.5rem 1.4rem', animationDelay: `${i * 80}ms` }}>
            <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-accent)', marginBottom: '0.6rem' }}>{s.n}</div>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '0.4rem' }}>{s.title}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <InfoPageCTA nextHref="/faq" nextLabel="Continue to the FAQ" />
    </InfoPageShell>
  );
}
