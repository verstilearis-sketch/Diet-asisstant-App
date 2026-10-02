'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage';
import Link from 'next/link';

const FEATURES = [
  { emoji: '🧮', title: 'Smart Calculations', desc: 'BMI, BMR, TDEE computed using Mifflin-St Jeor formula' },
  { emoji: '🌍', title: 'Location-Aware', desc: 'Meals curated from your local cuisine and available foods' },
  { emoji: '🤖', title: 'AI-Powered Plans', desc: 'Personalized 7-day meal plans with snacks and recipes' },
  { emoji: '📊', title: 'Visual Dashboard', desc: 'Track macros, calories, hydration with beautiful charts' },
  { emoji: '🎯', title: 'Goal-Focused', desc: 'Whether losing, gaining, or maintaining — we adapt' },
  { emoji: '💊', title: 'Supplement Guide', desc: 'Evidence-based supplement suggestions for your goals' },
];

const STATS = [
  { value: '50,000+', label: 'Plans Generated' },
  { value: '4.9★', label: 'User Rating' },
  { value: '98%', label: 'Goal Achievement' },
  { value: '195+', label: 'Countries Supported' },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10, 15, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>🥗</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
            Diet<span className="gradient-text">AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/auth?mode=signin">
            <button className="btn-ghost">Sign in</button>
          </Link>
          <Link href="/auth?mode=signup">
            <button className="btn-primary" style={{ padding: '0.625rem 1.5rem', fontSize: '0.9rem' }}>
              Get Started Free
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '8rem 1.5rem 4rem',
        position: 'relative', zIndex: 1,
      }}>
        <div className="fade-in-up" style={{ marginBottom: '1.5rem' }}>
          <span className="badge badge-green" style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>
            🎉 AI-Powered Nutrition Science
          </span>
        </div>

        <h1 className="fade-in-up delay-100" style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 900,
          marginBottom: '1.5rem',
          maxWidth: '900px',
          lineHeight: 1.1,
        }}>
          Your Personal <span className="gradient-text">AI Diet Coach</span>{' '}
          <br />That Actually Works
        </h1>

        <p className="fade-in-up delay-200" style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--color-muted)',
          maxWidth: '620px',
          marginBottom: '3rem',
          lineHeight: 1.8,
        }}>
          Answer a few questions about your body, goals, and lifestyle. We generate a{' '}
          <strong style={{ color: 'var(--color-text)' }}>fully personalized, science-backed diet plan</strong>{' '}
          with locally relevant meals — all in under 2 minutes.
        </p>

        <div className="fade-in-up delay-300" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/auth?mode=signup">
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
              ✨ Start Your Free Plan
            </button>
          </Link>
          <Link href="/auth?mode=signin">
            <button className="btn-secondary">
              Sign In →
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="fade-in-up delay-400" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
          marginTop: '5rem',
          maxWidth: '700px',
          width: '100%',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '5rem 1.5rem',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>
            Everything you need to{' '}
            <span className="gradient-text">transform your health</span>
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto' }}>
            No guesswork, no generic advice. Personalized to your body, goals, and culture.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card glass-card-hover fade-in-up"
              style={{
                padding: '1.75rem',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div style={{
                fontSize: '2rem', marginBottom: '1rem',
                width: 52, height: 52,
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.emoji}
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '5rem 1.5rem',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>
            Ready in <span className="gradient-text">4 simple steps</span>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { n: '01', title: 'Tell us about you', desc: 'Age, height, weight, and gender for precise calculations' },
            { n: '02', title: 'Set your goal', desc: 'Lose weight, build muscle, or simply feel your best' },
            { n: '03', title: 'Share your lifestyle', desc: 'Activity level, food preferences, and your location' },
            { n: '04', title: 'Get your plan', desc: 'A personalized 7-day meal plan with shopping list, tips, and more' },
          ].map((s, i) => (
            <div key={s.n} className="glass-card fade-in-up" style={{
              padding: '1.5rem 2rem',
              display: 'flex', alignItems: 'center', gap: '1.5rem',
              animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 900,
                color: 'rgba(16, 185, 129, 0.25)',
                minWidth: '3rem',
              }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '5rem 1.5rem 8rem',
        textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div className="glass-card" style={{
          maxWidth: '700px', margin: '0 auto',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,102,241,0.06) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Ready to transform your health?
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
            Join thousands who have already unlocked their best self with DietAI.
          </p>
          <Link href="/auth?mode=signup">
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}>
              Get My Free Plan Now 🚀
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '2rem',
        color: 'var(--color-muted)', fontSize: '0.85rem',
        borderTop: '1px solid var(--color-border)',
        position: 'relative', zIndex: 1,
      }}>
        © 2026 DietAI — For informational purposes. Consult a healthcare professional for medical advice.
      </footer>
    </div>
  );
}
