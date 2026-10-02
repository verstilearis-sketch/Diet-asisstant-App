'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';
import {
  SaladIcon, CalculatorIcon, MapPinIcon, BotIcon, BarChartIcon,
  TargetIcon, PillIcon, ArrowRightIcon, CheckIcon,
} from '@/components/icons';

const FEATURES = [
  { icon: CalculatorIcon, title: 'Smart calculations', desc: 'BMI, BMR and TDEE computed with the Mifflin-St Jeor formula, tuned to your body.' },
  { icon: MapPinIcon, title: 'Location-aware meals', desc: 'Dishes built from your local cuisine and the foods you can actually buy.' },
  { icon: BotIcon, title: 'AI health coach', desc: 'A personal coach that knows your plan and answers nutrition questions anytime.' },
  { icon: BarChartIcon, title: 'Visual dashboard', desc: 'Track macros, calories and hydration with clear charts and daily logs.' },
  { icon: TargetIcon, title: 'Goal-focused plans', desc: 'Losing, gaining or maintaining — every plan adapts to your objective.' },
  { icon: PillIcon, title: 'Supplement guidance', desc: 'Evidence-based supplement suggestions matched to your goals.' },
];

const STATS = [
  { value: '50,000+', label: 'Plans generated' },
  { value: '4.9 / 5', label: 'Average rating' },
  { value: '98%', label: 'Report hitting goals' },
  { value: '195+', label: 'Countries supported' },
];

const STEPS = [
  { n: '01', title: 'Tell us about you', desc: 'Age, height, weight and gender for precise calculations.' },
  { n: '02', title: 'Set your goal', desc: 'Lose weight, build muscle, or simply feel your best.' },
  { n: '03', title: 'Share your lifestyle', desc: 'Activity level, food preferences and your location.' },
  { n: '04', title: 'Get your plan', desc: 'A 7-day meal plan with a shopping list, tips and more.' },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="page-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"><SaladIcon size={19} /></span>
            DietAI
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/auth?mode=signin" className="btn-ghost">Sign in</Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '5.5rem', paddingBottom: '4rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="fade-in-up" style={{ marginBottom: '1.4rem' }}>
          <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
            <SparklesDot /> AI-powered nutrition science
          </span>
        </div>

        <h1 className="fade-in-up delay-100" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', fontWeight: 800, maxWidth: 820, margin: '0 auto 1.25rem' }}>
          A personal diet coach that actually fits your life
        </h1>

        <p className="fade-in-up delay-200" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.18rem)', color: 'var(--color-muted)', maxWidth: 620, margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
          Answer a few questions about your body, goals and lifestyle. Get a{' '}
          <strong style={{ color: 'var(--color-text)' }}>fully personalized, science-backed diet plan</strong>{' '}
          with locally relevant meals — in under two minutes.
        </p>

        <div className="fade-in-up delay-300" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.25rem' }}>
            Start your free plan <ArrowRightIcon size={17} />
          </Link>
          <Link href="/auth?mode=signin" className="btn-secondary">
            Sign in
          </Link>
        </div>

        <div className="fade-in-up delay-400" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem',
          marginTop: '4.5rem', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto',
        }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>{s.value}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', position: 'relative', zIndex: 1 }}>
        <div className="section-head" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Why DietAI</div>
          <h2>Everything you need to eat better</h2>
          <p style={{ margin: '0 auto' }}>No guesswork, no generic advice. Personalized to your body, goals and culture.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card glass-card-hover fade-in-up" style={{ padding: '1.6rem', animationDelay: `${i * 0.05}s` }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
              }}>
                <f.icon size={21} />
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem', position: 'relative', zIndex: 1 }}>
        <div className="section-head" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>How it works</div>
          <h2>Ready in four simple steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: 980, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="glass-card fade-in-up" style={{ padding: '1.5rem', animationDelay: `${i * 0.06}s` }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '0.7rem' }}>{s.n}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.87rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-text)', borderColor: 'var(--color-text)' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem', color: '#fff' }}>Ready to change how you eat?</h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: '1.75rem', fontSize: '1rem' }}>
            Join thousands who have already built a healthier routine with DietAI.
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem', background: '#fff', color: 'var(--color-text)', boxShadow: 'none' }}>
            Get my free plan <ArrowRightIcon size={17} />
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['Free forever plan', 'No credit card', '2-minute setup'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                <CheckIcon size={14} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', position: 'relative', zIndex: 1, background: 'var(--color-surface)' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" className="brand" style={{ fontSize: '0.95rem' }}>
            <span className="brand-mark" style={{ width: 28, height: 28 }}><SaladIcon size={16} /></span>
            DietAI
          </Link>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', maxWidth: 480 }}>
            For informational purposes only. Consult a healthcare professional for medical advice. © 2026 DietAI.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SparklesDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4Z" />
    </svg>
  );
}
