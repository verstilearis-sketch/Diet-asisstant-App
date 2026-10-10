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
import { SiteNav } from '@/components/SiteNav';
import { FloatingFoodHero } from '@/components/ui/hero-section-7';
import { ContainerScroll } from '@/components/ui/container-scroll';
import { ZaiqAppPreview } from '@/components/ui/zaiq-app-preview';
import { TiltOnScroll } from '@/components/ui/tilt-on-scroll';
import { useIsMobile } from '@/hooks/use-is-mobile';

const HERO_IMAGES = [  {
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
    src: '/images/hero/basil-leaf.png',
    alt: 'A basil leaf',
    className: 'w-8 sm:w-12 top-1/4 left-1/3 animate-float',
  },
  {
    src: '/images/hero/tomato-slice.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-1/2 right-1/4 animate-float',
  },
  {
    src: '/images/hero/tomato-slice.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-3/4 left-1/4 animate-float',
  },
];

// ── Mobile hero: food images spread top-to-bottom like desktop ──
const HERO_IMAGES_MOBILE = [
  {
    src: '/images/hero/salad-bowl.png',
    alt: 'A fresh salad bowl',
    className: 'w-16 top-20 left-3 opacity-90',
  },
  {
    src: '/images/hero/avocado.png',
    alt: 'Half an avocado',
    className: 'w-14 top-[32%] right-3 opacity-90',
  },
  {
    src: '/images/hero/salmon.png',
    alt: 'A grilled salmon fillet',
    className: 'w-16 top-[48%] left-2 opacity-90',
  },
  {
    src: '/images/hero/avocado.png',
    alt: '',
    className: 'w-10 top-[64%] right-8 opacity-70',
  },
  {
    src: '/images/hero/salad-bowl.png',
    alt: '',
    className: 'w-12 top-[80%] left-6 opacity-70',
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

export default function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

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
      <SiteNav />

      <FloatingFoodHero
        title="Food that fits your body"
        description="Zaiq computes your daily calories with the Mifflin-St Jeor equation and builds a 7-day meal plan around the food you actually eat — macros, portions and all."
        badge="AI nutrition planner"
        images={isMobile ? HERO_IMAGES_MOBILE : HERO_IMAGES}
        className={isMobile ? "min-h-[68svh] pt-24" : undefined}
      >
        <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.1rem' }}>
          Get started <ArrowRightIcon size={17} />
        </Link>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-faint)', width: '100%' }}>
          Free · 2-minute setup · No credit card
        </p>
        {/* The math — horizontally scrollable strip (desktop) / stacked cards (mobile) */}
        <div style={{ width: '100%', marginTop: '1.75rem' }}>
          {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            {FORMULAS.map((f) => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'baseline', gap: '0.8rem',
                padding: '0.8rem 1rem',
                background: 'color-mix(in srgb, var(--color-surface) 72%, transparent)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.85rem',
              }}>
                <div className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.1em', flex: '0 0 52px' }}>{f.name}</div>
                <div className="mono" style={{ fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--color-text)', overflowWrap: 'anywhere' }}>{f.formula}</div>
              </div>
            ))}
          </div>
          ) : (
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
          )}
        </div>
      </FloatingFoodHero>

      {/* ── Container scroll: the app, in 3D (desktop) / static preview (mobile) ── */}
      {isMobile ? (
        <section className="container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '0.6rem' }}>
            Your body, <span style={{ color: 'var(--color-faint)' }}>computed.</span>
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem', textAlign: 'center', marginBottom: '1.5rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Every meal, macro and number — computed from your body&apos;s math.
          </p>
          <div className="glass-card" style={{ padding: '0.6rem', overflow: 'hidden' }}>
            <div style={{ height: 380, overflow: 'hidden', borderRadius: '0.9rem', border: '1px solid var(--color-border)' }}>
              <ZaiqAppPreview />
            </div>
          </div>
        </section>
      ) : (
      <ContainerScroll
        titleComponent={
          <>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Your body, <br />
              <span style={{ color: 'var(--color-faint)' }}>computed.</span>
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '1rem', marginTop: '1rem', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              Scroll to watch your plan take shape — every meal, macro and number,
              computed from your body&apos;s math.
            </p>
          </>
        }
      >
        <ZaiqAppPreview />
      </ContainerScroll>
      )}

      {/* ── The math ────────────────────────────────────── */}
      <section id="math" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <TiltOnScroll>
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
                  display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '64px 1fr', gap: isMobile ? '0.35rem' : '1rem', alignItems: 'baseline',
                  padding: '0.9rem 1.1rem', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: '0.75rem', minWidth: 0,
                }}>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)' }}>{f.name}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="mono formula-scroll" style={{ fontSize: '0.9rem', marginBottom: '0.15rem', overflowWrap: 'anywhere' }}>{f.formula}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{f.note}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed var(--color-border)', lineHeight: 1.6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>The science: </span>{f.science}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </TiltOnScroll>
        </div>
      </section>

      {/* ── Personalization (desktop only) ──────────────────────── */}
      {!isMobile && (
      <FloatingFoodHero
        title="Eat your food. Hit your numbers."
        description="Your plan isn’t adapted from some generic template — it’s generated from the dishes and ingredients of your food culture, with portions tuned to your calorie and macro targets."
        images={[
          {
            src: '/images/hero/salmon.png',
            alt: 'A grilled salmon fillet',
            className: 'w-28 sm:w-40 md:w-52 top-8 left-4 sm:left-10 md:top-16 md:left-16 animate-float',
          },
          {
            src: '/images/hero/salad-bowl.png',
            alt: 'A fresh salad bowl',
            className: 'w-32 sm:w-44 md:w-56 top-8 right-4 sm:right-10 md:top-16 md:right-16 animate-float',
          },
          {
            src: '/images/hero/avocado.png',
            alt: 'Half an avocado',
            className: 'w-24 sm:w-32 md:w-44 bottom-10 left-6 sm:left-12 md:bottom-20 md:left-24 animate-float',
          },
        ]}
        className="min-h-[82svh]"
      >
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '0.75rem' }}>
          {[
            { n: '01', title: 'Tell us your city', example: '\u201CHyderabad, India\u201D' },
            { n: '02', title: 'We match your food culture', example: 'Hyderabadi dishes & ingredients' },
            { n: '03', title: 'Portions tuned to your goals', example: 'Biryani \u00B7 520 kcal \u00B7 32g protein' },
          ].map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: '0.9rem 1.05rem', flex: '1 1 170px', maxWidth: 250, textAlign: 'left' }}>
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.25rem' }}>{s.n}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 650, marginBottom: '0.2rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)' }}>{s.example}</div>
            </div>
          ))}
        </div>
      </FloatingFoodHero>
      )}

      {/* ── How it works (floating-food hero style) ─────────────── */}
      {isMobile ? (
      <section className="container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="eyebrow" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>How it works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: '1rem 1.1rem' }}>
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '0.25rem' }}>{s.n}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 650, marginBottom: '0.15rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
      ) : (
      <FloatingFoodHero
        title="How it works"
        description="Four steps from sign-up to supper. No guesswork, no generic meal templates — just your body’s math turned into food you actually eat."
        images={[
          {
            src: '/images/hero/avocado.png',
            alt: 'Half an avocado',
            className: 'w-28 sm:w-40 md:w-52 top-8 right-4 sm:right-10 md:top-16 md:right-16 animate-float',
          },
          {
            src: '/images/hero/salmon.png',
            alt: 'A grilled salmon fillet',
            className: 'w-32 sm:w-44 md:w-56 top-8 left-4 sm:left-10 md:top-16 md:left-16 animate-float',
          },
          {
            src: '/images/hero/salad-bowl.png',
            alt: 'A fresh salad bowl',
            className: 'w-24 sm:w-32 md:w-44 bottom-10 right-6 sm:right-12 md:bottom-20 md:right-24 animate-float',
          },
        ]}
        className="min-h-[82svh]"
      >
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: '0.75rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card" style={{ padding: '0.9rem 1.05rem', flex: '1 1 160px', maxWidth: 240, textAlign: 'left' }}>
              <div className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '0.3rem' }}>{s.n}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 650, marginBottom: '0.2rem' }}>{s.title}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </FloatingFoodHero>
      )}

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="container scroll-mt" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="section-head">
          <div className="eyebrow">FAQ</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: 780 }}>
          {FAQS.map((f) => (
            <TiltOnScroll key={f.q}>
            <details className="faq-item">
              <summary>
                {f.q}
                <ChevronDownIcon size={17} className="faq-chevron" />
              </summary>
              <div className="faq-body">{f.a}</div>
            </details>
            </TiltOnScroll>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
        <div className="glass-card" style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>See your numbers.</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem', fontSize: '1rem' }}>
            Answer four short steps of questions and get a plan built on your body’s math.
          </p>
          <Link href="/auth?mode=signup" className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem' }}>
            Get started <ArrowRightIcon size={17} />
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['Free', '2-minute setup', 'No credit card'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
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
        <p style={{ color: 'var(--color-faint)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          For informational purposes only — not medical advice. © 2026 Zaiq.
        </p>
      </section>
    </div>
  );
}
