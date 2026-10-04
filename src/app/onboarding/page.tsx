'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, savePlan } from '@/lib/storage';
import { computeAll, calculateBMI, getBMICategory } from '@/lib/calculations';
import { generateDietPlan } from '@/lib/ai-engine';
import type { UserProfile, Gender, ActivityLevel, Goal } from '@/lib/calculations';
import {
  UserIcon, TargetIcon, ActivityIcon, GlobeIcon, SparklesIcon,
  FlameIcon, DumbbellIcon, ScaleIcon, LeafIcon, TrophyIcon,
  CheckIcon, ArrowRightIcon, ArrowLeftIcon, BrainIcon, AlertIcon,
} from '@/components/icons';

// ── Step definitions ──────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Profile', icon: UserIcon },
  { id: 2, label: 'Goals', icon: TargetIcon },
  { id: 3, label: 'Lifestyle', icon: ActivityIcon },
  { id: 4, label: 'Preferences', icon: GlobeIcon },
  { id: 5, label: 'Your plan', icon: SparklesIcon },
];

const GOALS: { value: Goal; label: string; desc: string; icon: typeof FlameIcon }[] = [
  { value: 'lose_weight', label: 'Lose weight', desc: 'Burn fat with a sustainable calorie deficit', icon: FlameIcon },
  { value: 'gain_weight', label: 'Gain weight / muscle', desc: 'Build lean mass with a steady calorie surplus', icon: DumbbellIcon },
  { value: 'maintain', label: 'Maintain weight', desc: 'Stay where you are while eating well', icon: ScaleIcon },
  { value: 'improve_health', label: 'Improve overall health', desc: 'More energy, better immunity, longevity', icon: LeafIcon },
  { value: 'athletic', label: 'Athletic performance', desc: 'Fuel training, performance and recovery', icon: TrophyIcon },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, mostly desk work' },
  { value: 'light', label: 'Lightly active', desc: 'Light exercise 1–3 days per week' },
  { value: 'moderate', label: 'Moderately active', desc: 'Moderate exercise 3–5 days per week' },
  { value: 'active', label: 'Very active', desc: 'Hard exercise 6–7 days per week' },
  { value: 'very_active', label: 'Extremely active', desc: 'Physical job plus intense daily training' },
];

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Keto', 'Low-carb', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Paleo'];
const ALLERGY_OPTIONS = ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Fish', 'Peanuts'];

const GEN_MESSAGES = [
  'Analyzing your body metrics',
  'Calculating calorie targets',
  'Matching local cuisine preferences',
  'Building your 7-day meal plan',
  'Finalizing tips and shopping list',
];

// ── Initial state ─────────────────────────────────────────────

const initProfile: Partial<UserProfile> = {
  name: '', gender: 'male', age: 25, heightCm: 170, weightKg: 70,
  goal: 'lose_weight', activityLevel: 'moderate',
  dietaryRestrictions: [], allergies: [], location: '',
  sleepHours: 7, stressLevel: 3, workType: 'desk',
  exerciseFrequency: 3, exerciseDuration: 45,
};

// ── Main component ────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>(initProfile);
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const [userId, setUserId] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (cancelled) return;
      if (!session) { router.replace('/auth'); return; }
      setUserId(session.userId);
      setProfile((p) => ({ ...p, name: session.name }));
    });
    return () => { cancelled = true; };
  }, [router]);

  const update = (key: keyof UserProfile, value: unknown) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const toggleArray = (key: 'dietaryRestrictions' | 'allergies', value: string) => {
    setProfile((p) => {
      const arr = p[key] || [];
      const lower = value.toLowerCase();
      return {
        ...p,
        [key]: arr.map((v) => v.toLowerCase()).includes(lower)
          ? arr.filter((v) => v.toLowerCase() !== lower)
          : [...arr, value],
      };
    });
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setSaveError('');
    setGenPhase(0);
    for (let i = 0; i < GEN_MESSAGES.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setGenPhase(i + 1);
    }
    try {
      const fullProfile = profile as UserProfile;
      const calculations = computeAll(fullProfile);
      const plan = await generateDietPlan(fullProfile, calculations);
      await savePlan(userId, fullProfile, plan);
      router.push('/dashboard');
    } catch (err) {
      setGenerating(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save your plan. Please try again.');
    }
  }, [profile, userId, router]);

  useEffect(() => {
    if (step === 5) handleGenerate();
  }, [step, handleGenerate]);

  const bmi = profile.weightKg && profile.heightCm
    ? calculateBMI(profile.weightKg, profile.heightCm) : null;

  // ── Target-weight consultation ──
  // Warns (with explanation) when the target is outside a healthy range
  // or represents an extreme change. Advisory only — never blocks.
  const targetConsult = (() => {
    const { weightKg, targetWeightKg, heightCm } = profile;
    if (!weightKg || !targetWeightKg || !heightCm || targetWeightKg <= 0) return null;
    const targetBmi = calculateBMI(targetWeightKg, heightCm);
    const lowKg = Math.round(18.5 * (heightCm / 100) ** 2);
    const highKg = Math.round(24.9 * (heightCm / 100) ** 2);
    if (targetBmi < 18.5) {
      return {
        level: 'danger' as const,
        title: 'Let’s talk about this target',
        body: `At ${targetWeightKg} kg and ${heightCm} cm, your BMI would be ${targetBmi.toFixed(1)} — below the healthy range of 18.5–24.9. Under 18.5 is classed as underweight, which is linked to nutrient deficiencies, loss of muscle and bone density, weakened immunity and hormonal disruption — and chasing it with a steep deficit can do real harm.`,
        suggestion: `For your height, a healthy weight sits around ${lowKg}–${highKg} kg.`,
        foot: 'If you have a medical reason for this target, please work with a doctor or dietitian. Your plan will still be paced safely.',
      };
    }
    const changeKg = Math.abs(weightKg - targetWeightKg);
    if ((changeKg / weightKg) * 100 >= 25 && changeKg >= 15) {
      const weeks = Math.ceil(changeKg / 0.5);
      const losing = targetWeightKg < weightKg;
      return {
        level: 'caution' as const,
        title: 'A big journey — let’s pace it right',
        body: `${changeKg} kg is a major ${losing ? 'weight loss' : 'weight gain'}. At a safe rate of about 0.5 kg per week, that’s roughly a ${weeks}-week path.`,
        suggestion: `Your plan paces it so you ${losing ? 'lose fat, not muscle' : 'gain lean mass, not just weight'} — and keep the result.`,
        foot: null as string | null,
      };
    }
    return null;
  })();

  const canProceed = (): boolean => {
    if (step === 1) return !!(profile.name && profile.age && profile.heightCm && profile.weightKg);
    if (step === 2) return !!profile.goal;
    if (step === 3) return !!profile.activityLevel;
    return true;
  };

  const MOODS = ['Calm', 'Okay', 'Stressed', 'High', 'Burned out'];

  return (
    <div className="page-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* ── Stepper header ─────────────────────────────────── */}
      <header className="site-nav">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1rem 1.5rem 0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.8rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className={`step-dot ${step > s.id ? 'step-dot-done' : step === s.id ? 'step-dot-active' : 'step-dot-pending'}`}
                  title={s.label}
                >
                  {step > s.id ? <CheckIcon size={15} /> : <s.icon size={15} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    height: 2, width: 36, borderRadius: 1, margin: '0 0.2rem',
                    background: step > s.id ? 'var(--color-accent)' : 'var(--color-border)',
                    transition: 'background 300ms ease',
                  }} />
                )}
              </div>
            ))}
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>Step {step} of {STEPS.length}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 700 }}>{STEPS[step - 1]?.label}</span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem 4rem', position: 'relative', zIndex: 1 }}>

        {step === 1 && (
          <div className="fade-in-up" key="s1">
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.4rem' }}>Tell us about yourself</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
              Used to calculate your precise calorie and nutrition needs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="input-label" htmlFor="profile-name">Full name</label>
                <input id="profile-name" className="input-field" placeholder="Your name"
                  value={profile.name || ''} onChange={(e) => update('name', e.target.value)} />
              </div>

              <div>
                <span className="input-label">Gender</span>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button key={g} type="button"
                      className={`option-card ${profile.gender === g ? 'selected' : ''}`}
                      onClick={() => update('gender', g)}
                      style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize', padding: '0.7rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <div>
                  <label className="input-label" htmlFor="profile-age">Age <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(years)</span></label>
                  <input id="profile-age" className="input-field" type="number" min={10} max={100}
                    value={profile.age || ''} onChange={(e) => update('age', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label" htmlFor="profile-height">Height <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(cm)</span></label>
                  <input id="profile-height" className="input-field" type="number" min={100} max={250}
                    placeholder="170" value={profile.heightCm || ''} onChange={(e) => update('heightCm', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label" htmlFor="profile-weight">Weight <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(kg)</span></label>
                  <input id="profile-weight" className="input-field" type="number" min={20} max={300}
                    placeholder="72" value={profile.weightKg || ''} onChange={(e) => update('weightKg', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label" htmlFor="profile-target-weight">Target weight <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(optional)</span></label>
                  <input id="profile-target-weight" className="input-field" type="number" min={20} max={300}
                    placeholder="65" value={profile.targetWeightKg || ''} onChange={(e) => update('targetWeightKg', +e.target.value || undefined)} />
                </div>
              </div>

              {targetConsult && (
                <div className="glass-card" style={{
                  padding: '1.25rem 1.4rem',
                  borderLeft: `4px solid ${targetConsult.level === 'danger' ? '#dc2626' : '#d97706'}`,
                }}>
                  <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: targetConsult.level === 'danger' ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.14)',
                      color: targetConsult.level === 'danger' ? '#dc2626' : '#d97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AlertIcon size={18} />
                    </span>
                    <div style={{ fontWeight: 750, fontSize: '0.98rem' }}>{targetConsult.title}</div>
                  </div>
                  <p style={{ fontSize: '0.87rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '0.6rem' }}>
                    {targetConsult.body}
                  </p>
                  <p style={{ fontSize: '0.87rem', lineHeight: 1.7, marginBottom: targetConsult.foot ? '0.6rem' : 0 }}>
                    <strong style={{ color: 'var(--color-accent)' }}>{targetConsult.suggestion}</strong>
                  </p>
                  {targetConsult.foot && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.65, fontStyle: 'italic' }}>
                      {targetConsult.foot}
                    </p>
                  )}
                </div>
              )}

              {bmi && (
                <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div>
                      <div className="metric-label">Your BMI</div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-accent)' }}>{bmi}</div>
                    </div>
                    <span className={`badge ${bmi < 18.5 ? 'badge-indigo' : bmi < 25 ? 'badge-green' : 'badge-amber'}`}>
                      {getBMICategory(bmi)}
                    </span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 8 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${Math.min(100, (bmi / 40) * 100)}%`,
                      background: bmi < 18.5 ? '#4f46e5' : bmi < 25 ? 'var(--color-accent)' : bmi < 30 ? '#d97706' : '#dc2626',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--color-faint)' }}>
                    <span>Underweight</span><span>Healthy</span><span>Overweight</span><span>Obese</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in-up" key="s2">
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.4rem' }}>What's your main goal?</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
              Your entire plan is built around this objective.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.75rem' }}>
              {GOALS.map((g) => (
                <button key={g.value} type="button"
                  className={`option-card ${profile.goal === g.value ? 'selected' : ''}`}
                  onClick={() => update('goal', g.value)}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: profile.goal === g.value ? 'var(--color-accent)' : 'var(--color-surface2)',
                    color: profile.goal === g.value ? '#fff' : 'var(--color-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 140ms ease',
                  }}>
                    <g.icon size={19} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontWeight: 650, marginBottom: '0.15rem', fontSize: '0.95rem' }}>{g.label}</span>
                    <span style={{ display: 'block', fontSize: '0.84rem', color: 'var(--color-muted)' }}>{g.desc}</span>
                  </span>
                  {profile.goal === g.value && (
                    <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}><CheckIcon size={18} /></span>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="input-label" htmlFor="goal-timeline">Timeline <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(optional)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input id="goal-timeline" type="range" min={4} max={52} step={4}
                  value={profile.timeline || 12}
                  onChange={(e) => update('timeline', +e.target.value)} style={{ flex: 1 }} />
                <span style={{ minWidth: '4.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>
                  {profile.timeline || 12} wks
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in-up" key="s3">
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.4rem' }}>Your lifestyle</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
              The more accurate you are, the better your plan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              <div>
                <span className="input-label" style={{ marginBottom: '0.6rem', display: 'block' }}>Activity level</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {ACTIVITY_LEVELS.map((a) => (
                    <button key={a.value} type="button"
                      className={`option-card ${profile.activityLevel === a.value ? 'selected' : ''}`}
                      onClick={() => update('activityLevel', a.value)}>
                      <span>
                        <span style={{ display: 'block', fontWeight: 650, fontSize: '0.93rem', marginBottom: '0.1rem' }}>{a.label}</span>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{a.desc}</span>
                      </span>
                      {profile.activityLevel === a.value && (
                        <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}><CheckIcon size={18} /></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <div>
                  <label className="input-label" htmlFor="lifestyle-exercise-freq">Exercise days / week</label>
                  <input id="lifestyle-exercise-freq" className="input-field" type="number" min={0} max={7}
                    value={profile.exerciseFrequency ?? 3}
                    onChange={(e) => update('exerciseFrequency', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label" htmlFor="lifestyle-exercise-dur">Session length <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(min)</span></label>
                  <input id="lifestyle-exercise-dur" className="input-field" type="number" min={0} max={180}
                    value={profile.exerciseDuration ?? 45}
                    onChange={(e) => update('exerciseDuration', +e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <div>
                  <label className="input-label" htmlFor="lifestyle-sleep">Sleep <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(hrs/night)</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <input id="lifestyle-sleep" type="range" min={4} max={12} step={0.5}
                      value={profile.sleepHours ?? 7}
                      onChange={(e) => update('sleepHours', +e.target.value)} style={{ flex: 1 }} />
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700, minWidth: '2.2rem', fontVariantNumeric: 'tabular-nums' }}>{profile.sleepHours ?? 7}h</span>
                  </div>
                </div>
                <div>
                  <label className="input-label" htmlFor="lifestyle-stress">Stress level</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <input id="lifestyle-stress" type="range" min={1} max={5} step={1}
                      value={profile.stressLevel ?? 3}
                      onChange={(e) => update('stressLevel', +e.target.value)} style={{ flex: 1 }} />
                    <span style={{ color: 'var(--color-accent)', fontWeight: 650, minWidth: '4.5rem', fontSize: '0.82rem' }}>
                      {MOODS[(profile.stressLevel ?? 3) - 1]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="input-label">Work type</span>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {[
                    { v: 'desk', l: 'Desk job' },
                    { v: 'physical', l: 'Physical job' },
                    { v: 'mixed', l: 'Mixed' },
                  ].map((w) => (
                    <button key={w.v} type="button"
                      className={`option-card ${profile.workType === w.v ? 'selected' : ''}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '0.7rem 0.5rem', fontSize: '0.86rem', fontWeight: 600 }}
                      onClick={() => update('workType', w.v)}>
                      {w.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in-up" key="s4">
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.4rem' }}>Preferences & location</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
              We'll suggest culturally relevant, locally available meals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              <div>
                <label className="input-label" htmlFor="pref-location">Country / city / region</label>
                <input id="pref-location" className="input-field"
                  value={profile.location || ''} onChange={(e) => update('location', e.target.value)} />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.4rem' }}>
                  Used only to personalize meal suggestions — never shared.
                </p>
              </div>

              <div>
                <span className="input-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
                  Dietary restrictions <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>— select all that apply</span>
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DIETARY_OPTIONS.map((d) => {
                    const isChecked = (profile.dietaryRestrictions || []).map((v) => v.toLowerCase()).includes(d.toLowerCase());
                    return (
                      <button key={d} type="button" className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleArray('dietaryRestrictions', d)}>
                        {isChecked && <CheckIcon size={13} />} {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="input-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
                  Food allergies <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>— select all that apply</span>
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ALLERGY_OPTIONS.map((a) => {
                    const isChecked = (profile.allergies || []).map((v) => v.toLowerCase()).includes(a.toLowerCase());
                    return (
                      <button key={a} type="button" className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleArray('allergies', a)}>
                        {isChecked && <CheckIcon size={13} />} {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="pref-exercise-type">Exercise type <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>(optional)</span></label>
                <input id="pref-exercise-type" className="input-field" placeholder="e.g. Running, gym, yoga, swimming"
                  value={profile.exerciseType || ''} onChange={(e) => update('exerciseType', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in-up" key="s5" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem',
            }}>
              <BrainIcon size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>
              Building your personalized plan
            </h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '2.25rem', fontSize: '0.98rem' }}>
              Analyzing your profile and crafting your 7-day meal plan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 380, margin: '0 auto', textAlign: 'left' }}>
              {GEN_MESSAGES.map((msg, i) => (
                <div key={msg} style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.7rem 1rem', borderRadius: '0.75rem',
                  background: i <= genPhase ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  border: `1px solid ${i <= genPhase ? '#cfe7d6' : 'var(--color-border)'}`,
                  transition: 'all 300ms ease',
                  opacity: i <= genPhase ? 1 : 0.45,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < genPhase ? 'var(--color-accent)' : i === genPhase ? 'var(--color-surface)' : 'transparent',
                    border: i === genPhase ? '2px solid var(--color-border-strong)' : 'none',
                    borderTopColor: i === genPhase ? 'var(--color-accent)' : undefined,
                    color: '#fff',
                    animation: i === genPhase ? 'spin 0.9s linear infinite' : 'none',
                  }}>
                    {i < genPhase && <CheckIcon size={13} />}
                  </span>
                  <span style={{ fontSize: '0.87rem', fontWeight: i <= genPhase ? 600 : 500, color: i <= genPhase ? 'var(--color-text)' : 'var(--color-muted)' }}>
                    {msg}{i === genPhase ? '…' : ''}
                  </span>
                </div>
              ))}
            </div>
            {generating && <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-faint)' }}>This usually takes a few seconds</div>}
            {saveError && (
              <div className="error-box" style={{ maxWidth: 380, margin: '1.5rem auto 0', textAlign: 'left' }}>
                {saveError}
                <div style={{ marginTop: '0.75rem' }}>
                  <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '0.6rem 1.2rem' }}>
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Nav ──────────────────────────────────────────── */}
        {step < 5 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '2.25rem', paddingTop: '1.4rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            <button type="button" className="btn-secondary" id="onboarding-back"
              onClick={() => (step > 1 ? setStep((s) => s - 1) : router.push('/'))}
              style={{ padding: '0.7rem 1.4rem' }}>
              <ArrowLeftIcon size={16} /> {step === 1 ? 'Home' : 'Back'}
            </button>
            <button type="button" className="btn-primary" id="onboarding-next"
              onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
              style={{ padding: '0.7rem 1.6rem' }}>
              {step === 4 ? <><SparklesIcon size={16} /> Generate my plan</> : <>Continue <ArrowRightIcon size={16} /></>}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
