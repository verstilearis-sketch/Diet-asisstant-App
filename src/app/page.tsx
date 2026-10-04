'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';
import {
  SaladIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon,
  WheatIcon,
} from '@/components/icons';

// ── The math the app actually uses (src/lib/calculations.ts) ──

const FORMULAS = [
  {
    name: 'BMI',
    formula: 'weight(kg) / height(m)²',
    note: 'Body-composition baseline — where you start from',
    science: 'The WHO’s standard screening measure (Quetelet, 1832). A screening tool, not a diagnosis — it doesn’t distinguish muscle from fat.',
  },
  {
    name: 'BMR',
    formula: '10·w + 6.25·h − 5·a + 5 (men) / −161 (women)',
    note: 'Calories your body burns at complete rest',
    science: 'Mifflin–St Jeor equation (Mifflin et al., 1990, Am. J. Clin. Nutr.) — validated as the most accurate BMR predictor, usually within 10% of lab-measured values.',
  },
  {
    name: 'TDEE',
    formula: 'BMR × activity factor (1.2 – 1.9)',
    note: 'Your real daily burn, activity included',
    science: 'Harris–Benedict activity framework (1919, rev. 1984): 1.2 = sedentary … 1.9 = very active. The clinical standard for scaling resting calories to real life.',
  },
  {
    name: 'Target',
    formula: 'TDEE − 500 (lose) · +400 (gain) · TDEE (maintain)',
    note: 'Your daily calorie budget for the goal',
    science: '≈7,700 kcal per kg of body fat (Wishnofsky, 1958) → a 500 kcal daily deficit ≈ 0.5 kg/week — the rate clinical guidelines call safe and sustainable.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up with your name and email. About a minute.' },
  { n: '02', title: 'Answer the questions', desc: 'Four short steps: your body, your goal, your lifestyle, your food preferences.' },
  { n: '03', title: 'Get your numbers', desc: 'BMI, BMR, TDEE, calorie target and macro split — shown with the working.' },
  { n: '04', title: 'Follow your plan', desc: 'Seven days of meals, hydration and milestones — plus the AI coach when you have questions.' },
];

const FAQS = [
  {
    q: 'Is this medical advice?',
    a: 'No. DietAI is an informational tool: it computes calorie and macro targets from standard nutrition equations and suggests meals around them. If you have a medical condition, are pregnant, or have a history of eating disorders, talk to a clinician or registered dietitian first.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'Yes. Click Get started and sign up with your name and email — no verification codes, no waiting. Your answers and your plan are saved to your account so you can come back to them — and so the AI coach remembers your numbers.',
  },
  {
    q: 'How do you handle allergies and dietary restrictions?',
    a: 'Step 4 of the questionnaire asks for dietary restrictions (vegetarian, vegan, keto, halal, kosher, gluten-free…) and allergies (nuts, dairy, shellfish…). Meals are built around your exclusions, not on top of them.',
  },
  {
    q: 'Will the food match what I actually eat?',
    a: 'That’s the point of the location question. Tell us your city or region and the plan draws on 50+ regional cuisine profiles — North Indian, Japanese, Mexican, Mediterranean and more — using foods from the markets near you.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your browser’s local storage — your profile, plan and chat history stay on your device. You can wipe everything at any time with the Reset data button on the dashboard.',
  },
];

// ── Sample plan numbers ──
// Sample day at 2,100 kcal target (480 + 680 + 240 + 650)

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (session && !cancelled) router.replace('/dashboard');
    });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="page-shell">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"><SaladIcon size={19} /></span>
            DietAI
          </Link>
          <div className="nav-links">
            <a href="#math" className="nav-link">The math</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/auth?mode=signin" className="btn-ghost">Sign in</Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '4.5rem', paddingBottom: '4.5rem' }}>
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Personal nutrition software</div>
            <h1 style={{ fontSize: 'clamp(2.3rem, 4.6vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.12, marginBottom: '1.25rem' }}>
              A diet plan computed from your body, not copied from a template.
            </h1>
            <p style={{ fontSize: '1.06rem', color: 'var(--color-muted)', lineHeight: 1.75, maxWidth: 520, marginBottom: '2rem' }}>
              Answer a short set of questions about your body, goals and lifestyle. DietAI
              computes your calorie target with the Mifflin–St Jeor equation, matches meals
              to your local cuisine, and builds a 7-day plan — macros, milestones,
              hydration and all.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
              <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.1rem' }}>
                Get started <ArrowRightIcon size={17} />
              </Link>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-faint)' }}>
              Free · 2-minute setup · No credit card
            </p>
          </div>

          {/* Sample plan — the actual output of the questionnaire */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Your 7-day plan
              </span>
              <span className="badge badge-green">Sample</span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.1rem' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <span key={d} style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '0.32rem 0', flex: 1, textAlign: 'center',
                  borderRadius: '0.5rem',
                  background: i === 0 ? 'var(--color-accent-soft)' : 'transparent',
                  color: i === 0 ? 'var(--color-accent)' : 'var(--color-faint)',
                  border: i === 0 ? '1px solid var(--color-accent)' : '1px solid transparent',
                }}>{d}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
              {[
                { meal: 'Breakfast', name: '3-egg bhurji, 2 toast, glass of milk', kcal: 480, protein: 28 },
                { meal: 'Lunch', name: 'Grilled chicken, brown rice, dal', kcal: 680, protein: 52 },
                { meal: 'Snack', name: 'Greek yogurt, roasted makhana', kcal: 240, protein: 18 },
                { meal: 'Dinner', name: 'Paneer tikka, 2 rotis, salad', kcal: 650, protein: 30 },
              ].map((m) => (
                <div key={m.meal} style={{ padding: '0.6rem 0.8rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)' }}>{m.meal}</span>
                    <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>{m.kcal} kcal · {m.protein}g protein</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 550 }}>{m.name}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', background: 'var(--color-accent-soft)', borderRadius: '0.6rem', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Day total</span>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent)' }}>2,050 / 2,100 kcal</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--color-muted)' }}>
              Matched to your cuisine, allergies and goal — swaps in one tap.
            </p>
          </div>
        </div>
      </section>

      {/* ── The math ────────────────────────────────────── */}
      <section id="math" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="eyebrow">The math, shown</div>
            <h2 style={{ marginBottom: '0.6rem' }}>No black box.</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', maxWidth: 640 }}>
              Every number on your dashboard traces back to these four equations. We show the
              working because a plan you can’t audit is a plan you can’t trust.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {FORMULAS.map((f) => (
                <div key={f.name} style={{
                  display: 'grid', gridTemplateColumns: '64px 1fr', gap: '1rem', alignItems: 'baseline',
                  padding: '0.9rem 1.1rem', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: '0.75rem',
                }}>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)' }}>{f.name}</span>
                  <div>
                    <div className="mono formula-scroll" style={{ fontSize: '0.9rem', marginBottom: '0.15rem' }}>{f.formula}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{f.note}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed var(--color-border)', lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>The science: </span>{f.science}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Personalization ─────────────────────────────── */}
      <section className="container" style={{ paddingTop: '1rem', paddingBottom: '3.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WheatIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Eat your food. Hit your numbers.</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                Your plan isn’t adapted from some generic template — it’s generated from the
                dishes and ingredients of your food culture, with portions tuned to your calorie
                and macro targets. Progress that tastes like dinner, not discipline.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { n: '01', title: 'Tell us your city', example: '“Hyderabad, India”' },
              { n: '02', title: 'We match your food culture', example: 'Hyderabadi dishes & ingredients' },
              { n: '03', title: 'Portions tuned to your goals', example: 'Biryani · 520 kcal · 32g protein' },
            ].map((s) => (
              <div key={s.n} style={{ padding: '1rem 1.1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}>
                <div className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>{s.n}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 650, marginBottom: '0.25rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{s.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="section-head">
          <div className="eyebrow">How it works</div>
          <h2>Four steps, about two minutes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: '1.5rem' }}>
              <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '0.7rem' }}>{s.n}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.87rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="section-head">
          <div className="eyebrow">FAQ</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: 780 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                {f.q}
                <ChevronDownIcon size={17} className="faq-chevron" />
              </summary>
              <div className="faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
        <div className="glass-card" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-text)', borderColor: 'var(--color-text)' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem', color: '#fff' }}>See your numbers.</h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: '1.75rem', fontSize: '1rem' }}>
            Answer four short steps of questions and get a plan built on your body’s math.
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem', background: '#fff', color: 'var(--color-text)', boxShadow: 'none' }}>
            Get started <ArrowRightIcon size={17} />
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['Free', '2-minute setup', 'No credit card'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                <CheckIcon size={14} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Builder credit ──────────────────────────────── */}
      <section className="container" style={{ paddingBottom: '4rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ width: 44, height: 1, background: 'var(--color-border-strong)' }} />
          <span className="brand-mark" style={{ width: 30, height: 30 }}><SaladIcon size={16} /></span>
          <span style={{ width: 44, height: 1, background: 'var(--color-border-strong)' }} />
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Designed &amp; engineered by <strong style={{ color: 'var(--color-text)' }}>Salik Lone</strong>
          <br />real math, real food, and an unreasonable attention to detail.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" className="brand" style={{ fontSize: '0.95rem' }}>
            <span className="brand-mark" style={{ width: 28, height: 28 }}><SaladIcon size={16} /></span>
            DietAI
          </Link>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', maxWidth: 480 }}>
            For informational purposes only — not medical advice. © 2026 DietAI.
          </p>
        </div>
      </footer>
    </div>
  );
}
