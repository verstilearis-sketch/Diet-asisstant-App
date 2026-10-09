import type { Metadata } from 'next';
import Link from 'next/link';
import { ZaiqIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About — Zaiq',
  description:
    'Zaiq is a personalized nutrition planner built by Salik Lone. Real nutritional science, your local cuisine, no generic templates.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <ZaiqIcon size={29} />
            </span>
            Zaiq
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/blog" className="nav-link">
              Blog
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.55rem 1.2rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 720, paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="eyebrow" style={{ marginBottom: '1rem' }}>
          About
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', marginBottom: '1.5rem', lineHeight: 1.15 }}>
          Built by one person who was tired of generic diet plans.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--color-text)', lineHeight: 1.75, fontSize: '1.02rem' }}>
          <p>
            I&apos;m <strong>Salik Lone</strong>. I built Zaiq because every diet app I tried handed me the same
            copy-pasted meal plan — grilled chicken and broccoli, as if everyone on earth eats the same food.
          </p>
          <p>
            If you&apos;re in Srinagar, your diet shouldn&apos;t look like a meal plan written in California.
            It should know what rogan josh is, what a nadru tastes like, and that your grandmother&apos;s
            haakh is doing more for you than imported kale ever will.
          </p>
          <p>
            So Zaiq starts from your body — your weight, height, age, activity — runs it through validated
            nutritional science (the Mifflin-St&nbsp;Jeor equation for metabolic rate, standard TDEE activity
            multipliers), and then builds your meals from the food culture you actually live in. Over 50
            regional cuisine profiles, with deep coverage of Jammu &amp; Kashmir and India.
          </p>
          <p>
            Every number on your dashboard shows its working. No black box, no &ldquo;trust the
            algorithm.&rdquo; If a calorie target doesn&apos;t make sense, you can trace it back to the
            equation that produced it.
          </p>
        </div>

        <h2 style={{ fontSize: '1.5rem', marginTop: '3rem', marginBottom: '1.25rem' }}>What Zaiq is not</h2>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
          <li>— Not medical advice. It&apos;s an informational tool. If you have a health condition, talk to a clinician.</li>
          <li>— Not a template. Two people with the same goal get different plans if their bodies or cuisines differ.</li>
          <li>— Not a data harvest. Your plan lives in your account. Resetting your data actually deletes it.</li>
        </ul>

        <div
          style={{
            marginTop: '3rem',
            padding: '2rem',
            borderRadius: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--color-text)' }}>
            Want a plan built on your body&apos;s math?
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 2rem' }}>
            Get started — it&apos;s free
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div
          className="container"
          style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
        >
          <Link href="/" className="brand" style={{ fontSize: '1.1rem' }}>
            <span className="brand-mark" style={{ width: 36, height: 36 }}>
              <ZaiqIcon size={20} />
            </span>
            Zaiq
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }} aria-label="Footer">
            <Link href="/privacy" className="nav-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</Link>
          </nav>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', maxWidth: 480 }}>
            For informational purposes only — not medical advice. © 2026 Zaiq.
          </p>
        </div>
      </footer>
    </div>
  );
}
