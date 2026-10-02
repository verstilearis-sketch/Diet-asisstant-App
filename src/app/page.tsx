'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';
import {
  SaladIcon, CalculatorIcon, MapPinIcon, BotIcon, CartIcon,
  DropletsIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon,
  WheatIcon, UtensilsIcon,
} from '@/components/icons';

// ── What's inside the plan (maps 1:1 to what the engine generates) ──

const INSIDE = [
  {
    icon: CalculatorIcon,
    title: 'Your numbers, computed',
    desc: 'BMI, BMR, TDEE and a daily calorie target calculated with the Mifflin–St Jeor equation — adjusted for your goal. Not guessed, not generic.',
  },
  {
    icon: UtensilsIcon,
    title: 'A real 7-day meal plan',
    desc: 'Five meals a day — breakfast, two snacks, lunch, dinner — each with calories and macros, portioned to hit your daily target.',
  },
  {
    icon: MapPinIcon,
    title: 'Food you actually eat',
    desc: 'Tell us your city and meals are matched to your region’s cuisine and the markets near you — 40+ regional profiles, five continents.',
  },
  {
    icon: CartIcon,
    title: 'A weekly shopping list',
    desc: 'Every ingredient for the week in one list, so a single grocery trip covers the whole plan.',
  },
  {
    icon: DropletsIcon,
    title: 'Hydration & supplements',
    desc: 'A daily water target based on your body weight, plus evidence-based supplement notes matched to your goal.',
  },
  {
    icon: BotIcon,
    title: 'A coach that knows your plan',
    desc: 'The built-in AI health agent answers nutrition questions with your numbers and your plan in context — not canned advice.',
  },
];

// ── The math the app actually uses (src/lib/calculations.ts) ──

const FORMULAS = [
  { name: 'BMI', formula: 'weight(kg) ÷ height(m)²', note: 'Body-composition baseline' },
  { name: 'BMR', formula: '10·w + 6.25·h − 5·a + 5 (men) / −161 (women)', note: 'Mifflin–St Jeor · calories at rest' },
  { name: 'TDEE', formula: 'BMR × activity factor (1.2 – 1.9)', note: 'Calories burned per day' },
  { name: 'Target', formula: 'TDEE − 500 (lose) · +400 (gain) · TDEE (maintain)', note: 'Your daily calorie budget' },
];

const CUISINES = [
  'North Indian', 'South Indian', 'Japanese', 'Korean', 'Thai',
  'Mexican', 'Italian', 'Mediterranean', 'Middle Eastern', 'West African',
  'Brazilian', 'American',
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up and verify your email. About a minute.' },
  { n: '02', title: 'Answer the questions', desc: 'Four short steps: your body, your goal, your lifestyle, your food preferences.' },
  { n: '03', title: 'Get your numbers', desc: 'BMI, BMR, TDEE, calorie target and macro split — shown with the working.' },
  { n: '04', title: 'Follow your plan', desc: 'Seven days of meals, a shopping list, hydration — and the AI coach when you have questions.' },
];

const FAQS = [
  {
    q: 'Is this medical advice?',
    a: 'No. DietAI is an informational tool: it computes calorie and macro targets from standard nutrition equations and suggests meals around them. If you have a medical condition, are pregnant, or have a history of eating disorders, talk to a clinician or registered dietitian first.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'Yes. Click Get started, sign up with your email, and verify the code we send you. Your answers and your plan are saved to your account so you can come back to them — and so the AI coach remembers your numbers.',
  },
  {
    q: 'How do you handle allergies and dietary restrictions?',
    a: 'Step 4 of the questionnaire asks for dietary restrictions (vegetarian, vegan, keto, halal, kosher, gluten-free…) and allergies (nuts, dairy, shellfish…). Meals are built around your exclusions, not on top of them.',
  },
  {
    q: 'Will the food match what I actually eat?',
    a: 'That’s the point of the location question. Tell us your city or region and the plan draws on 40+ regional cuisine profiles — North Indian, Japanese, Mexican, Mediterranean and more — using foods from the markets near you.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your browser’s local storage — your profile, plan and chat history stay on your device. You can wipe everything at any time with the Reset data button on the dashboard.',
  },
];

// ── Sample day, consistent with the engine’s math ──
// Sample profile: male, 28, 178 cm, 82 kg, moderately active, lose weight
// BMR = 10·82 + 6.25·178 − 5·28 + 5 = 1,798 · TDEE = 1,798 × 1.55 = 2,786 · target = 2,286

const SAMPLE_MEALS = [
  { name: 'Vegetable poha with peanuts', kcal: 500, p: 16, c: 72, f: 14 },
  { name: 'Buttermilk + roasted makhana', kcal: 200, p: 8, c: 30, f: 5 },
  { name: 'Brown rice, sambar, poriyal, curd', kcal: 700, p: 32, c: 104, f: 14 },
  { name: 'Sprouted moong chaat', kcal: 240, p: 14, c: 34, f: 6 },
  { name: '2 besan cheelas, paneer stuffing', kcal: 620, p: 30, c: 52, f: 24 },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) router.replace('/dashboard');
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
            <a href="#what-you-get" className="nav-link">What’s inside</a>
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
              to your local cuisine, and builds a 7-day plan — macros, shopping list,
              hydration and all.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
              <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.1rem' }}>
                Get started <ArrowRightIcon size={17} />
              </Link>
              <a href="#what-you-get" className="btn-secondary">
                See what’s inside
              </a>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-faint)' }}>
              Free · 2-minute setup · No credit card
            </p>
          </div>

          {/* Sample output — the “show the working” card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                Example output
              </span>
              <span className="badge badge-green">South Indian · lose weight</span>
            </div>
            <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-faint)', marginBottom: '1.1rem' }}>
              male · 28 · 178 cm · 82 kg · moderately active
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.2rem' }}>
              {[
                { v: '1,798', l: 'BMR kcal' },
                { v: '2,786', l: 'TDEE kcal' },
                { v: '2,286', l: 'Daily target' },
              ].map((m) => (
                <div key={m.l} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '0.7rem 0.5rem', textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{m.v}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.15rem' }}>{m.l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.6rem' }}>Monday — ≈2,260 kcal · 100 g protein</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {SAMPLE_MEALS.map((m) => (
                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.8rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.6rem' }}>
                  <span style={{ fontSize: '0.83rem', fontWeight: 550 }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    {m.kcal} kcal · {m.p}p / {m.c}c / {m.f}f
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--color-faint)', marginTop: '0.9rem' }}>
              Your numbers replace these the moment you finish the questionnaire.
            </p>
          </div>
        </div>
      </section>

      {/* ── What's inside (the preface) ─────────────────── */}
      <section id="what-you-get" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="section-head">
          <div className="eyebrow">What you get</div>
          <h2>One questionnaire. A complete plan.</h2>
          <p>Not a PDF of generic tips — a structured, computable plan your dashboard and your coach both work from.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {INSIDE.map((f, i) => (
            <div key={f.title} className="glass-card" style={{ padding: '1.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.8rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={20} />
                </div>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-faint)' }}>0{i + 1}</span>
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
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
                    <div className="mono" style={{ fontSize: '0.9rem', marginBottom: '0.15rem' }}>{f.formula}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{f.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Cuisines ────────────────────────────────────── */}
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
              <h3 style={{ fontSize: '1.1rem' }}>40+ regional cuisines, not one generic menu</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                Tell us your city — meals are built from the cuisine and the markets around you.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CUISINES.map((c) => (
              <span key={c} className="cuisine-chip">{c}</span>
            ))}
            <span className="cuisine-chip" style={{ borderStyle: 'dashed', color: 'var(--color-muted)' }}>+ 30 more</span>
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
          <h2>Straight answers</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: 780 }}>
          {FAQS.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                {f.q}
                <ChevronDownIcon size={17} />
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
