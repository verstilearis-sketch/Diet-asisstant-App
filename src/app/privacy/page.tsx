import Link from 'next/link';
import { NutriqIcon } from '@/components/icons';

export const metadata = {
  title: 'Privacy Policy — Nutriq',
  description: 'How Nutriq collects, uses, and protects your data.',
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What we collect',
    body: [
      'Account information: your name and email address, provided when you sign up directly or via Google sign-in.',
      'Health profile: the details you enter in the questionnaire — such as age, height, weight, health goals, activity level, and dietary preferences — used to build your personalized plan.',
      'App activity: your meal plans, daily logs (meals, water, exercise, weight, mood), and messages you send to the in-app health coach.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'Your data is used only to operate Nutriq for you: generating your meal plans, tracking your progress, and powering the health coach.',
      'We never sell your personal information and never share it with advertisers.',
    ],
  },
  {
    title: 'Where it is stored',
    body: [
      'Your account and app data are stored securely with our database provider (Supabase), protected by industry-standard encryption in transit and at rest.',
      'When you use AI features (meal analysis, the health coach, photo estimates), the text or image you submit is processed by our AI providers solely to generate your result. We do not use your inputs to train models.',
    ],
  },
  {
    title: 'Your control',
    body: [
      'You can delete your account and all associated data at any time from the dashboard (Reset data), or by contacting us at the email below.',
      'Google sign-in users can also revoke Nutriq\'s access at any time from their Google Account security settings.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'For privacy questions or data requests, contact us at the support email listed on our Google OAuth consent screen.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="auth-wrap" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="glass-card fade-in-up" style={{ maxWidth: 720, width: '100%', padding: '2.5rem' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }} aria-label="Nutriq home">
          <span className="auth-logo" style={{ marginBottom: 0 }}><NutriqIcon size={33} /></span>
        </Link>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          Last updated: October 4, 2026
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
      </div>
    </div>
  );
}
