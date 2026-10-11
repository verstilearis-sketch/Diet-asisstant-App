'use client';

import { useEffect } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';
import {
  ZaiqIcon, ArrowRightIcon, CheckIcon,
  WheatIcon,
} from '@/components/icons';
import { SiteNav } from '@/components/SiteNav';
import { FloatingFoodHero } from '@/components/ui/hero-section-7';
import { ContainerScroll } from '@/components/ui/container-scroll';
import { ZaiqAppPreview } from '@/components/ui/zaiq-app-preview';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { FAQS, FORMULAS } from '@/data/info-pages';

const FADED: React.CSSProperties = { filter: 'saturate(0.1)' }; // 90% less saturation

const HERO_IMAGES = [  {
    src: '/images/hero/salad-bowl.png',
    alt: 'A fresh salad bowl',
    className: 'w-32 sm:w-44 md:w-52 lg:w-56 top-10 left-4 sm:left-10 md:top-20 md:left-20 animate-float',
    style: FADED,
  },
  {
    src: '/images/hero/avocado.png',
    alt: 'Half an avocado',
    className: 'w-[5.6rem] sm:w-28 md:w-36 top-10 right-4 sm:right-10 md:top-16 md:right-16 animate-float',
    style: FADED,
  },
  {
    src: '/images/hero/salmon.png',
    alt: 'A grilled salmon fillet',
    className: 'w-32 sm:w-40 md:w-56 bottom-8 right-5 sm:right-10 md:bottom-16 md:right-20 animate-float',
    style: FADED,
  },
  {
    src: '/images/hero/blueberries.png',
    alt: 'Fresh blueberries',
    className: 'w-24 sm:w-32 md:w-40 bottom-10 left-6 sm:left-12 md:bottom-24 md:left-28 animate-float',
    style: FADED,
  },
  {
    src: '/images/hero/basil-leaf.png',
    alt: 'A basil leaf',
    className: 'w-8 sm:w-12 top-1/4 left-1/3 animate-float',
    style: FADED,
  },
  {
    src: '/images/hero/tomato-slice.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-1/2 right-1/4 animate-float',
  },
  {
    src: '/images/hero/blueberries.png',
    alt: '',
    className: 'w-4 sm:w-5 top-[46%] right-[22%] animate-float',
  },
  {
    src: '/images/hero/tomato-slice.png',
    alt: 'A slice of tomato',
    className: 'w-8 sm:w-10 top-3/4 left-1/4 animate-float',
  },
  {
    src: '/images/hero/blueberries.png',
    alt: '',
    className: 'w-4 sm:w-5 top-[70%] left-[22%] animate-float',
  },
];

// ── Mobile hero: food images spread top-to-bottom like desktop ──
const HERO_IMAGES_MOBILE = [
  {
    src: '/images/hero/salad-bowl.png',
    alt: 'A fresh salad bowl',
    className: 'w-12 top-20 left-3 opacity-90',
    style: FADED,
  },
  {
    src: '/images/hero/avocado.png',
    alt: 'Half an avocado',
    className: 'w-11 top-[32%] right-3 opacity-90',
    style: FADED,
  },
  {
    src: '/images/hero/salmon.png',
    alt: 'A grilled salmon fillet',
    className: 'w-16 top-[48%] left-2 opacity-90',
    style: FADED,
  },
  {
    src: '/images/hero/blueberries.png',
    alt: 'Fresh blueberries',
    className: 'w-12 top-[60%] right-6 opacity-90',
    style: FADED,
  },
  {
    src: '/images/hero/tomato-slice.png',
    alt: 'A slice of tomato',
    className: 'w-8 top-[74%] left-8 opacity-90',
  },
  {
    src: '/images/hero/blueberries.png',
    alt: '',
    className: 'w-3 top-[71%] left-[22%] opacity-90',
  },
];

// Hero shows only the Target card — BMI/BMR/TDEE live in "How we hit your numbers".
const HERO_FORMULAS = FORMULAS.filter((f) => f.name === 'Target');

// ── The math the app actually uses (src/lib/calculations.ts) ──


export default function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (session && !cancelled) router.replace('/dashboard');
    });
    // Warm up the signup route early: its JS chunk is heavy (supabase),
    // and on phones the tap-to-navigation delay is otherwise seconds.
    const prefetchAuth = () => router.prefetch('/auth?mode=signup');
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAuth, { timeout: 3000 });
    } else {
      setTimeout(prefetchAuth, 1500);
    }
    return () => { cancelled = true; }
  }, [router]);

  // Extra head start: pointerdown fires ~100-300ms before the tap completes.
  const warmAuth = () => router.prefetch('/auth?mode=signup');

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
        <Link href="/auth?mode=signup" prefetch={true} onPointerDown={warmAuth} className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.1rem' }}>
          Get started <ArrowRightIcon size={17} />
        </Link>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-faint)', width: '100%' }}>
          Free · 2-minute setup · No credit card
        </p>
        {/* The math — horizontally scrollable strip (desktop) / stacked cards (mobile) */}
        <div style={{ width: '100%', marginTop: '1.75rem' }}>
          {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            {HERO_FORMULAS.map((f) => (
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
            {HERO_FORMULAS.map((f) => (
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
        <section className="container" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
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

      {/* ── Learn more ──────────────────────────────────── */}
      <section className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="eyebrow">Learn more</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Go deeper, on your terms.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', maxWidth: 900, margin: '0 auto' }}>
          {[
            { href: '/numbers', title: 'How we hit your numbers', desc: 'BMI, BMR, TDEE and your target — the four equations, with the science cited.' },
            { href: '/how-it-works', title: 'How it works', desc: 'Four steps from sign-up to supper. No guesswork, no generic templates.' },
            { href: '/faq', title: 'FAQ', desc: 'Medical advice, accounts, allergies, food matching, data storage.' },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="glass-card math-fade"
              style={{ padding: '1.4rem 1.3rem', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '0.7rem' }}>{c.desc}</div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                Continue <ArrowRightIcon size={15} />
              </span>
            </Link>
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
          <Link href="/auth?mode=signup" prefetch={true} onPointerDown={warmAuth} className="btn-primary" style={{ fontSize: '1rem', padding: '0.95rem 2.5rem' }}>
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
