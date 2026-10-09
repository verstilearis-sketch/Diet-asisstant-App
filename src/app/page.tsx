'use client';

import { useEffect } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';
import {
  ZaiqIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon,
  WheatIcon,
} from '@/components/icons';
import { FloatingFoodHero } from '@/components/ui/hero-section-7';
import { CircularCarousel } from '@/components/ui/circular-carousel';

const HERO_IMAGES = [
  {
    src: '/images/hero/salad-bowl.png',
    alt: 'A fresh salad bowl',
    className: 'w-40 sm:w-56 md:w-64 lg:w-72 top-10 left-4 sm:left-10 md:top-20 md:left-20 animate-float',
  },
  {
    src: '/images/hero/avocado.png',
    alt: 'Half an avocado',
    className: 'w-28 sm:w-36 md:w-48 top-10 right-4 sm:right-10 md:top-16 md:right-16 animate-float',
  },
  {
    src: '/images/hero/salmon.png',
    alt: 'A grilled salmon fillet',
    className: 'w-32 sm:w-40 md:w-56 bottom-8 right-5 sm:right-10 md:bottom-16 md:right-20 animate-float',
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/8e/8ec4fbab8445c1769d3200d674cd3731a0550b21c87bb8bc6938cb3a05932e5b.png',
    alt: 'A basil leaf',
    className: 'w-8 sm:w-12 top-1/4 left-1/3 animate-float',
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/e7/e758e9c35a8360f201c40d0bf3e3433c2b6ff3f759763eb697cbc3803af80e18.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-1/2 right-1/4 animate-float',
  },
  {
    src: 'https://cdn.21st.dev/assets/mirror/e7/e758e9c35a8360f201c40d0bf3e3433c2b6ff3f759763eb697cbc3803af80e18.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-3/4 left-1/4 animate-float',
  },
];

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
  { n: '01', title: 'Create your account', desc: 'Continue with Google to sign in. About a minute.' },
  { n: '02', title: 'Answer the questions', desc: 'Four short steps: your body, your goal, your lifestyle, your food preferences.' },
  { n: '03', title: 'Get your numbers', desc: 'BMI, BMR, TDEE, calorie target and macro split — shown with the working.' },
  { n: '04', title: 'Follow your plan', desc: 'Seven days of meals, hydration and milestones — plus the AI coach when you have questions.' },
];

const FAQS = [
  {
    q: 'Is this medical advice?',
    a: 'No. Zaiq is an informational tool: it computes calorie and macro targets from standard nutrition equations and suggests meals around them. If you have a medical condition, are pregnant, or have a history of eating disorders, talk to a clinician or registered dietitian first.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'Yes. Click Get started and continue with Google — no passwords, no waiting. Your answers and your plan are saved to your account so you can come back to them — and so the AI coach remembers your numbers.',
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
    a: 'In your Zaiq cloud account — your profile, plans, logs and chat history are saved to your secure database, so they follow you across devices. The Reset data button on the dashboard deletes your cloud data as well and signs you out.',
  },
];

// ── Wheel card shells ─────────────────────────────────────────
// Compact content cards for the WorksWheel. Kept tight so they read
// on phone-sized cards as well as desktop.
const wheelCard: React.CSSProperties = {
  padding: '1rem 1.1rem',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};
const wheelEyebrow: React.CSSProperties = {
  marginBottom: '0.2rem',
  fontSize: '0.66rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-faint)',
  fontWeight: 700,
};
const wheelTitle: React.CSSProperties = {
  fontSize: '0.98rem',
  fontWeight: 700,
  marginBottom: '0.65rem',
  lineHeight: 1.25,
};
const wheelRow: React.CSSProperties = {
  padding: '0.42rem 0.6rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.55rem',
};

function FaqWheelCard() {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <div style={wheelCard}>
      <div style={wheelEyebrow}>FAQ</div>
      <div style={wheelTitle}>Questions, answered.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
        {FAQS.map((f, i) => (
          <div key={f.q} style={{ ...wheelRow, padding: 0 }}>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '0.42rem 0.6rem',
                fontSize: '0.72rem', fontWeight: 600, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
                background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer',
              }}
            >
              <span>{f.q}</span>
              <span style={{ color: 'var(--color-accent)', flexShrink: 0, fontSize: '0.85rem' }}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 0.6rem 0.5rem', fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.55 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const PERSONALIZATION = [
  { n: '01', title: 'Tell us your city', example: '“Hyderabad, India”' },
  { n: '02', title: 'We match your food culture', example: 'Hyderabadi dishes & ingredients' },
  { n: '03', title: 'Portions tuned to your goals', example: 'Biryani · 520 kcal · 32g protein' },
];

function buildCarouselItems(): import('@/components/ui/circular-carousel').CarouselItem[] {
  return [
    {
      id: 'taste',
      title: 'A taste of the plan',
      description: 'Every meal placed for a reason.',
      content: (
        <div style={wheelCard}>
          <div style={wheelEyebrow}>A taste of the plan</div>
          <div style={wheelTitle}>Every meal placed for a reason.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
            {ANNOTATED_DAY.map((m) => (
              <div key={m.meal} style={{ ...wheelRow, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.meal}</span>
                  {' · '}{m.name}
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{m.kcal} kcal</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.55rem', textAlign: 'right', fontSize: '0.76rem', fontWeight: 700 }}>
            <span className="mono" style={{ color: 'var(--color-accent)' }}>2,050 / 2,100 kcal</span>
          </div>
        </div>
      ),
    },
    {
      id: 'math',
      title: 'The math, shown',
      description: 'No black box.',
      content: (
        <div style={wheelCard}>
          <div style={wheelEyebrow}>The math, shown</div>
          <div style={wheelTitle}>No black box.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
            {FORMULAS.map((f) => (
              <div key={f.name} style={wheelRow}>
                <div className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.06em' }}>{f.name}</div>
                <div className="mono" style={{ fontSize: '0.72rem', marginTop: '0.1rem' }}>{f.formula}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'food',
      title: 'Eat your food',
      description: 'Hit your numbers.',
      content: (
        <div style={wheelCard}>
          <div style={wheelEyebrow}>Personalization</div>
          <div style={wheelTitle}>Eat your food. Hit your numbers.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
            {PERSONALIZATION.map((s) => (
              <div key={s.n} style={wheelRow}>
                <div className="mono" style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--color-accent)' }}>{s.n}</div>
                <div style={{ fontSize: '0.76rem', fontWeight: 650, marginTop: '0.1rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{s.example}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'how',
      title: 'How it works',
      description: 'From sign-up to supper.',
      content: (
        <div style={wheelCard}>
          <div style={wheelEyebrow}>How it works</div>
          <div style={wheelTitle}>From sign-up to supper.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={wheelRow}>
                <div className="mono" style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--color-accent)' }}>{s.n}</div>
                <div style={{ fontSize: '0.76rem', fontWeight: 650, marginTop: '0.1rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.45 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Questions, answered.',
      content: <FaqWheelCard />,
    },
  ];
}

// ── Annotated day ──
// A Tuesday from a sample plan, with the reasoning shown. The "why" lines are
// the point: the plan shows its work instead of handing you a menu.
const ANNOTATED_DAY = [
  {
    meal: 'Breakfast', name: '3-egg bhurji, 2 toast, glass of milk', kcal: 480, protein: 28,
    why: 'Big day ahead — front-loading protein keeps you full till lunch.',
  },
  {
    meal: 'Lunch', name: 'Grilled chicken, brown rice, dal', kcal: 680, protein: 52,
    why: 'Leg day. Carbs timed before your workout, protein after.',
  },
  {
    meal: 'Snack', name: 'Greek yogurt, roasted makhana', kcal: 240, protein: 18,
    why: 'You’ll be at 98g of your 128g protein — this closes the gap without spoiling dinner.',
  },
  {
    meal: 'Dinner', name: 'Paneer tikka, 2 rotis, salad', kcal: 650, protein: 30,
    why: 'Light enough to land you at 2,050 of your 2,100 kcal.',
  },
];

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: 'Zaiq',
                applicationCategory: 'HealthApplication',
                operatingSystem: 'Web',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                description:
                  'AI-powered personalized nutrition planner. Computes calorie targets with the Mifflin-St Jeor equation and builds 7-day meal plans matched to your local cuisine.',
              },
              {
                '@type': 'FAQPage',
                mainEntity: FAQS.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              },
            ],
          }),
        }}
      />

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"><ZaiqIcon size={29} /></span>
            Zaiq
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/blog" className="nav-link">Blog</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/auth?mode=signin" className="btn-ghost nav-signin">Sign in</Link>
            <Link href="/auth?mode=signup" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <FloatingFoodHero
        title="Food that fits your body"
        description="Zaiq computes your daily calories with the Mifflin-St Jeor equation and builds a 7-day meal plan around the food you actually eat — macros, portions and all."
        images={HERO_IMAGES}
      >
        <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.1rem' }}>
          Get started <ArrowRightIcon size={17} />
        </Link>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-faint)', width: '100%' }}>
          Free · 2-minute setup · No credit card
        </p>
        {/* The math — horizontally scrollable strip */}
        <div style={{ width: '100%', marginTop: '1.75rem' }}>
          <div className="math-strip" style={{
            display: 'flex', gap: '0.7rem',
            overflowX: 'auto', paddingBottom: '0.4rem',
            scrollSnapType: 'x mandatory',
          }}>
            {FORMULAS.map((f) => (
              <div key={f.name} style={{
                flex: '0 0 auto', scrollSnapAlign: 'start',
                width: 230,
                padding: '0.95rem 1.05rem',
                background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                textAlign: 'left',
              }}>
                <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem', letterSpacing: '0.1em' }}>{f.name}</div>
                <div className="mono" style={{ fontSize: '0.83rem', lineHeight: 1.55, color: 'var(--color-text)' }}>{f.formula}</div>
              </div>
            ))}
          </div>
        </div>
      </FloatingFoodHero>

      {/* ── Explore carousel: the sections, orbiting ────────────── */}
      <section style={{ paddingTop: '3rem', paddingBottom: '3rem' }} aria-label="Explore Zaiq">
        <CircularCarousel items={buildCarouselItems()} />
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
        <div className="glass-card" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem', color: '#131311' }}>See your numbers.</h2>
          <p style={{ color: 'rgba(19,19,17,0.72)', marginBottom: '1.75rem', fontSize: '1rem' }}>
            Answer four short steps of questions and get a plan built on your body’s math.
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem', background: '#131311', color: '#fff', boxShadow: 'none' }}>
            Get started <ArrowRightIcon size={17} />
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['Free', '2-minute setup', 'No credit card'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'rgba(19,19,17,0.7)' }}>
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
          <span className="brand-mark" style={{ width: 38, height: 38 }}><ZaiqIcon size={22} /></span>
          <span style={{ width: 44, height: 1, background: 'var(--color-border-strong)' }} />
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Designed &amp; Engineered by <strong style={{ color: 'var(--color-text)' }}>Salik Lone</strong>
          <br />Real math, Real food, and an unreasonable attention to detail.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/" className="brand" style={{ fontSize: '1.1rem' }}>
            <span className="brand-mark" style={{ width: 36, height: 36 }}><ZaiqIcon size={20} /></span>
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
