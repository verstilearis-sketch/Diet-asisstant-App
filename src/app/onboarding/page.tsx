'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, savePlan } from '@/lib/storage';
import { computeAll, calculateBMI, getBMICategory } from '@/lib/calculations';
import { generateDietPlan } from '@/lib/ai-engine';
import type { UserProfile, Gender, ActivityLevel, Goal } from '@/lib/calculations';

// ── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Profile',     icon: '👤' },
  { id: 2, label: 'Goals',       icon: '🎯' },
  { id: 3, label: 'Lifestyle',   icon: '🏃' },
  { id: 4, label: 'Preferences', icon: '🌍' },
  { id: 5, label: 'Your Plan',   icon: '✨' },
];

const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: 'lose_weight',    label: 'Lose Weight',            desc: 'Burn fat with a sustainable calorie deficit', emoji: '🔥' },
  { value: 'gain_weight',    label: 'Gain Weight / Muscle',   desc: 'Build lean mass with a calorie surplus', emoji: '💪' },
  { value: 'maintain',       label: 'Maintain Weight',        desc: 'Keep your current weight while eating healthy', emoji: '⚖️' },
  { value: 'improve_health', label: 'Improve Overall Health', desc: 'Better energy, immunity, and longevity', emoji: '🌿' },
  { value: 'athletic',       label: 'Athletic Performance',   desc: 'Fuel peak performance and recovery', emoji: '🏅' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary',   label: 'Sedentary',          desc: 'Little to no exercise, desk job' },
  { value: 'light',       label: 'Lightly Active',     desc: '1–3 days of light exercise/week' },
  { value: 'moderate',    label: 'Moderately Active',  desc: '3–5 days of moderate exercise/week' },
  { value: 'active',      label: 'Very Active',        desc: '6–7 days of hard exercise/week' },
  { value: 'very_active', label: 'Extremely Active',   desc: 'Physical job + intense daily training' },
];

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Keto', 'Low-carb', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Paleo'];
const ALLERGY_OPTIONS  = ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish', 'Peanuts'];

// ── Initial state ────────────────────────────────────────────────────────────

const initProfile: Partial<UserProfile> = {
  name: '', gender: 'male', age: 25, heightCm: 170, weightKg: 70,
  goal: 'lose_weight', activityLevel: 'moderate',
  dietaryRestrictions: [], allergies: [], location: '',
  sleepHours: 7, stressLevel: 3, workType: 'desk',
  exerciseFrequency: 3, exerciseDuration: 45,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>(initProfile);
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase]     = useState(0);
  const [userId, setUserId]         = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/auth'); return; }
    setUserId(session.userId);
    setProfile(p => ({ ...p, name: session.name }));
  }, [router]);

  const update = (key: keyof UserProfile, value: unknown) =>
    setProfile(p => ({ ...p, [key]: value }));

  const toggleArray = (key: 'dietaryRestrictions' | 'allergies', value: string) => {
    setProfile(p => {
      const arr = p[key] || [];
      const lower = value.toLowerCase();
      return {
        ...p,
        [key]: arr.map(v => v.toLowerCase()).includes(lower)
          ? arr.filter(v => v.toLowerCase() !== lower)
          : [...arr, value],
      };
    });
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenPhase(0);
    const phases = [
      'Analyzing your body metrics…',
      'Calculating calorie targets…',
      'Matching local cuisine preferences…',
      'Building your 7-day meal plan…',
      'Finalizing tips and shopping list…',
    ];
    // Cycle through phases
    for (let i = 0; i < phases.length - 1; i++) {
      await new Promise(r => setTimeout(r, 700));
      setGenPhase(i + 1);
    }

    const fullProfile = profile as UserProfile;
    const calculations = computeAll(fullProfile);
    const plan = await generateDietPlan(fullProfile, calculations);
    savePlan(userId, fullProfile, plan);
    router.push('/dashboard');
  }, [profile, userId, router]);

  useEffect(() => {
    if (step === 5) handleGenerate();
  }, [step, handleGenerate]);

  const bmi = profile.weightKg && profile.heightCm
    ? calculateBMI(profile.weightKg, profile.heightCm) : null;

  const canProceed = (): boolean => {
    if (step === 1) return !!(profile.name && profile.age && profile.heightCm && profile.weightKg);
    if (step === 2) return !!profile.goal;
    if (step === 3) return !!profile.activityLevel;
    return true;
  };

  const GEN_MESSAGES = [
    'Analyzing your body metrics…',
    'Calculating calorie targets…',
    'Matching local cuisine preferences…',
    'Building your 7-day meal plan…',
    'Finalizing tips and shopping list…',
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 2rem',
        background: 'rgba(10,15,30,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`step-dot ${step > s.id ? 'step-dot-done' : step === s.id ? 'step-dot-active' : 'step-dot-pending'}`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    height: 2, width: 40,
                    background: step > s.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)',
                    margin: '0 0.25rem',
                    borderRadius: 1,
                    transition: 'background 0.4s ease',
                  }} />
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Step {step} of {STEPS.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
              {STEPS[step - 1]?.label}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: 700, margin: '0 auto',
        padding: '8rem 1.5rem 4rem',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── STEP 1: Profile ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tell us about yourself 👤</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              This helps us calculate your precise calorie and nutrition needs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Your name" id="profile-name"
                  value={profile.name || ''}
                  onChange={e => update('name', e.target.value)} />
              </div>

              <div>
                <label className="input-label">Gender</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {(['male', 'female', 'other'] as Gender[]).map(g => (
                    <button
                      key={g}
                      className={`option-card ${profile.gender === g ? 'selected' : ''}`}
                      onClick={() => update('gender', g)}
                      style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize', padding: '0.75rem' }}
                    >
                      {g === 'male' ? '♂️' : g === 'female' ? '♀️' : '⚧️'} {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Age (years)</label>
                  <input className="input-field" type="number" min={10} max={100} id="profile-age"
                    value={profile.age || ''}
                    onChange={e => update('age', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Height (cm)</label>
                  <input className="input-field" type="number" min={100} max={250} id="profile-height"
                    placeholder="e.g. 170"
                    value={profile.heightCm || ''}
                    onChange={e => update('heightCm', +e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Current Weight (kg)</label>
                  <input className="input-field" type="number" min={20} max={300} id="profile-weight"
                    placeholder="e.g. 72"
                    value={profile.weightKg || ''}
                    onChange={e => update('weightKg', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Target Weight (kg) <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>— optional</span></label>
                  <input className="input-field" type="number" min={20} max={300} id="profile-target-weight"
                    placeholder="e.g. 65"
                    value={profile.targetWeightKg || ''}
                    onChange={e => update('targetWeightKg', +e.target.value || undefined)} />
                </div>
              </div>

              {/* Live BMI preview */}
              {bmi && (
                <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>YOUR BMI</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="gradient-text">
                        {bmi}
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${
                        bmi < 18.5 ? 'badge-indigo' : bmi < 25 ? 'badge-green' : bmi < 30 ? 'badge-amber' : 'badge-amber'
                      }`} style={{ fontSize: '0.9rem', padding: '0.375rem 0.875rem' }}>
                        {getBMICategory(bmi)}
                      </span>
                    </div>
                  </div>
                  {/* BMI scale */}
                  <div style={{ marginTop: '0.875rem' }}>
                    <div className="progress-bar-track" style={{ height: 8, borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.min(100, (bmi / 40) * 100)}%`,
                        background: bmi < 18.5 ? '#6366f1' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444',
                        transition: 'all 0.4s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                      <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Goals ─────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What's your main goal? 🎯</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              Your plan will be fully tailored around this objective.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
              {GOALS.map(g => (
                <button
                  key={g.value}
                  className={`option-card ${profile.goal === g.value ? 'selected' : ''}`}
                  onClick={() => update('goal', g.value)}
                >
                  <span style={{ fontSize: '1.5rem', minWidth: 36 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{g.label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{g.desc}</div>
                  </div>
                  {profile.goal === g.value && (
                    <span style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontSize: '1.1rem' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="input-label">Timeline (weeks) — optional</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="range" min={4} max={52} step={4}
                  value={profile.timeline || 12}
                  onChange={e => update('timeline', +e.target.value)}
                  style={{ flex: 1 }}
                  id="goal-timeline"
                />
                <span style={{ minWidth: '4rem', textAlign: 'right', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-accent)' }}>
                  {profile.timeline || 12} weeks
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Lifestyle ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your lifestyle 🏃</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              The more accurate you are, the better your plan will be.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              <div>
                <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Activity Level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {ACTIVITY_LEVELS.map(a => (
                    <button key={a.value} className={`option-card ${profile.activityLevel === a.value ? 'selected' : ''}`}
                      onClick={() => update('activityLevel', a.value)}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '0.15rem', fontSize: '0.95rem' }}>{a.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{a.desc}</div>
                      </div>
                      {profile.activityLevel === a.value && (
                        <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Exercise days/week</label>
                  <input className="input-field" type="number" min={0} max={7} id="lifestyle-exercise-freq"
                    value={profile.exerciseFrequency ?? 3}
                    onChange={e => update('exerciseFrequency', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Session duration (min)</label>
                  <input className="input-field" type="number" min={0} max={180} id="lifestyle-exercise-dur"
                    value={profile.exerciseDuration ?? 45}
                    onChange={e => update('exerciseDuration', +e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Sleep (hours/night)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="range" min={4} max={12} step={0.5}
                      value={profile.sleepHours ?? 7}
                      onChange={e => update('sleepHours', +e.target.value)}
                      style={{ flex: 1 }} id="lifestyle-sleep" />
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700, minWidth: '2rem' }}>{profile.sleepHours ?? 7}h</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Stress level (1–5)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="range" min={1} max={5} step={1}
                      value={profile.stressLevel ?? 3}
                      onChange={e => update('stressLevel', +e.target.value)}
                      style={{ flex: 1 }} id="lifestyle-stress" />
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700, minWidth: '1.5rem' }}>
                      {['😌','😐','😟','😰','🤯'][( profile.stressLevel ?? 3) - 1]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Work type</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    { v: 'desk', l: '💻 Desk job' },
                    { v: 'physical', l: '🔨 Physical job' },
                    { v: 'mixed', l: '🔄 Mixed' },
                  ].map(w => (
                    <button key={w.v}
                      className={`option-card ${profile.workType === w.v ? 'selected' : ''}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                      onClick={() => update('workType', w.v)}>
                      {w.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Preferences ───────────────────────────────────────── */}
        {step === 4 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Preferences & Location 🌍</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
              We'll suggest culturally relevant, locally available meals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="input-label">Country / City / Region</label>
                <input className="input-field" placeholder="e.g. Mumbai, India" id="pref-location"
                  value={profile.location || ''}
                  onChange={e => update('location', e.target.value)} />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
                  Used only to personalize meal suggestions — never shared.
                </p>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                  Dietary Restrictions <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>— select all that apply</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DIETARY_OPTIONS.map(d => {
                    const isChecked = (profile.dietaryRestrictions || []).map(v => v.toLowerCase()).includes(d.toLowerCase());
                    return (
                      <button key={d} className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleArray('dietaryRestrictions', d)}>
                        {isChecked ? '✓' : '○'} {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                  Food Allergies <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>— select all that apply</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ALLERGY_OPTIONS.map(a => {
                    const isChecked = (profile.allergies || []).map(v => v.toLowerCase()).includes(a.toLowerCase());
                    return (
                      <button key={a} className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleArray('allergies', a)}>
                        {isChecked ? '✓' : '○'} {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label">Exercise type (optional)</label>
                <input className="input-field" placeholder="e.g. Running, Gym, Yoga, Swimming" id="pref-exercise-type"
                  value={profile.exerciseType || ''}
                  onChange={e => update('exerciseType', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: Generating ─────────────────────────────────────────── */}
        {step === 5 && (
          <div className="fade-in-up" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(99,102,241,0.2))',
              border: '2px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 2rem',
              animation: 'spin 3s linear infinite',
            }}>
              🧠
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
              Building your <span className="gradient-text">personalized plan</span>…
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
              Our AI is analyzing your profile and crafting the perfect diet plan for you.
            </p>

            {/* Phases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 360, margin: '0 auto' }}>
              {GEN_MESSAGES.map((msg, i) => (
                <div key={msg} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: i <= genPhase ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i <= genPhase ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.4s ease',
                  opacity: i <= genPhase ? 1 : 0.4,
                  textAlign: 'left',
                }}>
                  <span style={{ fontSize: '1rem' }}>
                    {i < genPhase ? '✅' : i === genPhase ? '⏳' : '○'}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: i <= genPhase ? 'var(--color-text)' : 'var(--color-muted)' }}>
                    {msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '2.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <button
              className="btn-secondary"
              onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/')}
              id="onboarding-back"
            >
              ← {step === 1 ? 'Home' : 'Back'}
            </button>
            <button
              className="btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              id="onboarding-next"
            >
              {step === 4 ? '✨ Generate My Plan' : 'Continue →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
