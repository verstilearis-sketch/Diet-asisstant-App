import type { Metadata } from 'next';
import { InfoPageShell, InfoPageCTA } from '@/components/InfoPages';
import { FORMULAS } from '@/data/info-pages';

export const metadata: Metadata = {
  title: 'How we hit your numbers — Zaiq',
  description: 'The four equations behind every Zaiq plan: BMI, BMR, TDEE and your calorie target — with the science cited.',
};

export default function NumbersPage() {
  return (
    <InfoPageShell>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="eyebrow">The math, shown</div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          How we hit your numbers.
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          Every number on your dashboard traces back to these four equations. We show the
          working because a plan you can’t audit is a plan you can’t trust.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {FORMULAS.map((f, i) => (
          <div key={f.name} className="glass-card math-fade" style={{ padding: '1.5rem 1.6rem', animationDelay: `${i * 80}ms` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.08em' }}>{f.name}</span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 600 }}>{f.formula}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '0.6rem' }}>{f.note}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', paddingTop: '0.6rem', borderTop: '1px dashed var(--color-border)', lineHeight: 1.65 }}>
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>The science: </span>{f.science}
            </p>
          </div>
        ))}
      </div>

      <InfoPageCTA nextHref="/how-it-works" nextLabel="Continue to see how it works" />
    </InfoPageShell>
  );
}
