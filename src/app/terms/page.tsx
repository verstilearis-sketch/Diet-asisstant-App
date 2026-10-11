import Link from 'next/link';
import { ZaiqIcon } from '@/components/icons';

export const metadata = {
  title: 'Terms of Service — Zaiq',
  description: 'The terms governing your use of Zaiq.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What Zaiq is',
    body: [
      'Zaiq is a personal nutrition planning tool. It generates meal plans, tracks your progress, and offers general health and nutrition guidance through its built-in health coach.',
      'Zaiq is for informational purposes only. It is not medical advice, diagnosis, or treatment. Always consult a qualified doctor or dietitian before making significant changes to your diet, especially if you are pregnant, nursing, managing a medical condition, or taking medication.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'You sign in with your Google account. You are responsible for keeping that account secure.',
      'You must provide accurate information in your health profile — your plan is only as good as the details you give it.',
      'One account per person. You may not share your account or use Zaiq on behalf of someone else without their knowledge.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'Use Zaiq for your own personal nutrition planning. Do not scrape, copy, or resell its content, meal plans, or underlying data.',
      'Do not attempt to disrupt the service, bypass its limits, or misuse the health coach (for example, to generate harmful, deceptive, or unlawful content).',
      'We may suspend accounts that abuse the service or violate these terms.',
    ],
  },
  {
    title: 'AI-generated content',
    body: [
      'Meal plans, nutrition estimates, and health coach replies are generated with the help of AI and published food databases. They are estimates, not guarantees — verify anything critical with a professional.',
      'The body-type estimate from your photo is a rough visual guess used only to pre-select a figure in the questionnaire. It is not a body-composition measurement.',
    ],
  },
  {
    title: 'Availability',
    body: [
      'Zaiq is provided "as is". We work hard to keep it fast and reliable, but we do not guarantee uninterrupted or error-free service.',
      'We may update, pause, or discontinue features at any time. Where reasonably possible, we will give notice of significant changes.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'To the fullest extent permitted by law, Zaiq and its creator are not liable for any direct or indirect harm arising from your use of the app, including health decisions you make based on its content.',
      'Your use of Zaiq means you accept responsibility for how you apply its guidance.',
    ],
  },
  {
    title: 'Changes to these terms',
    body: [
      'We may update these terms from time to time. Continued use of Zaiq after changes take effect means you accept the updated terms.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For questions about these terms, contact us at the support email listed on our Google OAuth consent screen.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card fade-in-up" style={{ maxWidth: 720, width: '100%', padding: '2.5rem' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }} aria-label="Zaiq home">
          <span className="auth-logo" style={{ marginBottom: 0 }}><ZaiqIcon size={33} /></span>
        </Link>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          Last updated: October 11, 2026
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', marginBottom: '0.6rem' }}>{s.title}</h2>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {s.body.map((p, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
        <Link href="/" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '0.5rem' }}>
          Back to home
        </Link>
        <p style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
          Also see our <Link href="/privacy" style={{ color: 'var(--color-text)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
