import type { Metadata } from 'next';
import { InfoPageShell, InfoPageCTA } from '@/components/InfoPages';
import { FAQS } from '@/data/info-pages';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ — Zaiq',
  description: 'Frequently asked questions about Zaiq: medical advice, accounts, allergies, food matching and data storage.',
};

export default function FaqPage() {
  return (
    <InfoPageShell>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="eyebrow">FAQ</div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Questions, answered.
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
          The things people usually ask before starting their plan.
        </p>
      </div>

      <FaqAccordion faqs={FAQS} />

      <InfoPageCTA nextHref="/numbers" nextLabel="Continue to see the math" />
    </InfoPageShell>
  );
}
