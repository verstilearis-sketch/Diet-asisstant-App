'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getLatestPlan, signOut, getDailyLog, saveDailyLog, DailyLog, resetAllData } from '@/lib/storage';
import { computeAll } from '@/lib/calculations';
import type { SavedPlan } from '@/lib/storage';
import type { Meal } from '@/lib/ai-engine';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthAgentChat } from '@/components/HealthAgentChat';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';
import {
  SaladIcon, DashboardIcon, UtensilsIcon, ClipboardIcon, CartIcon,
  BulbIcon, DumbbellIcon, CoffeeIcon, AppleIcon,
  SunIcon, MoonIcon, CookieIcon, ChevronDownIcon, CheckIcon,
  LogoutIcon, RefreshIcon, LaughIcon, SmileIcon, MehIcon, FrownIcon,
  MapPinIcon, FlameIcon, TrashIcon,
} from '@/components/icons';

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Weight Loss', gain_weight: 'Muscle Gain', maintain: 'Maintenance',
  improve_health: 'Health', athletic: 'Athletic Performance',
};
const MACRO_COLORS = { protein: '#177245', carbs: '#d97706', fat: '#2563eb' };

const MEAL_META = [
  { key: 'breakfast', label: 'Breakfast', time: '7:00 – 9:00 AM', icon: CoffeeIcon },
  { key: 'morningSnack', label: 'Morning snack', time: '10:30 – 11:00 AM', icon: AppleIcon },
  { key: 'lunch', label: 'Lunch', time: '12:30 – 2:00 PM', icon: SunIcon },
  { key: 'afternoonSnack', label: 'Afternoon snack', time: '4:00 – 5:00 PM', icon: CookieIcon },
  { key: 'dinner', label: 'Dinner', time: '7:00 – 8:30 PM', icon: MoonIcon },
] as const;

const TABS = [
  { id: 'overview', label: 'Overview', icon: DashboardIcon },
  { id: 'meals', label: 'Meal plan', icon: UtensilsIcon },
  { id: 'tracker', label: 'Daily tracker', icon: ClipboardIcon },
  { id: 'shopping', label: 'Shopping', icon: CartIcon },
] as const;

const MOODS = [
  { v: 'great', label: 'Great', icon: LaughIcon },
  { v: 'good', label: 'Good', icon: SmileIcon },
  { v: 'okay', label: 'Okay', icon: MehIcon },
  { v: 'bad', label: 'Rough', icon: FrownIcon },
] as const;

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [activeDay, setActiveDay] = useState((new Date().getDay() + 6) % 7);
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'tracker' | 'shopping'>('overview');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [todayStr] = useState(getTodayString());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getSession();
      if (!session) { router.replace('/auth'); return; }
      if (cancelled) return;
      setUserName(session.name);
      const plan = await getLatestPlan(session.userId);
      if (!plan) { router.replace('/onboarding'); return; }
      if (cancelled) return;
      setSavedPlan(plan);
      setDailyLog(await getDailyLog(session.userId, todayStr));
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, todayStr]);

  const updateLog = (updates: Partial<DailyLog>) => {
    if (!dailyLog || !savedPlan) return;
    const newLog = { ...dailyLog, ...updates };
    setDailyLog(newLog);
    saveDailyLog(savedPlan.userId, newLog).catch((e) =>
      console.error('Failed to save daily log:', e)
    );
  };

  const toggleMeal = (index: number) => {
    if (!dailyLog) return;
    const meals = [...dailyLog.mealsCompleted];
    meals[index] = !meals[index];
    updateLog({ mealsCompleted: meals });
  };

  const handleSignOut = async () => { await signOut(); router.replace('/'); };

  const handleResetAll = async () => {
    await resetAllData();
    router.replace('/');
  };

  useEffect(() => {
    if (!showResetConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResetConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showResetConfirm]);

  if (loading || !savedPlan || !dailyLog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Loading your plan…</p>
        </div>
      </div>
    );
  }

  const { profile, plan } = savedPlan;
  const firstName = (userName || profile.name || '').split(' ')[0];
  const calcs = computeAll(profile);
  const selectedDayPlan = plan.weeklyPlan[activeDay];

  const mealsList = MEAL_META.map((m) => selectedDayPlan[m.key]);
  const calsConsumed = mealsList.reduce((acc, meal, i) => acc + (dailyLog.mealsCompleted[i] ? meal.calories : 0), 0);

  const macroData = [
    { name: 'Protein', value: calcs.proteinG, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: calcs.carbsG, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: calcs.fatG, color: MACRO_COLORS.fat },
  ];

  const bmiColor = calcs.bmi < 18.5 ? '#4f46e5' : calcs.bmi < 25 ? '#177245' : calcs.bmi < 30 ? '#d97706' : '#dc2626';
  const caloriePct = Math.min(100, Math.round((calsConsumed / calcs.dailyCalorieGoal) * 100));

  return (
    <div className="page-shell">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="site-nav">
        <div className="site-nav-inner">
          <span className="brand">
            <span className="brand-mark"><SaladIcon size={18} /></span>
            DietAI
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-muted)', marginRight: '0.5rem' }}>
              Hi, <strong style={{ color: 'var(--color-text)' }}>{userName.split(' ')[0]}</strong>
            </span>
            <button className="btn-ghost" onClick={() => router.push('/onboarding')} style={{ fontSize: '0.85rem' }}>
              <RefreshIcon size={15} /> New plan
            </button>
            <button className="btn-ghost" onClick={() => setShowResetConfirm(true)} style={{ fontSize: '0.85rem' }} title="Delete your profile, plans and logs from the cloud">
              <TrashIcon size={15} /> Reset data
            </button>
            <button className="btn-ghost" onClick={handleSignOut} style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>
              <LogoutIcon size={15} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
        {/* ── Header ────────────────────────────────────── */}
        <div className="fade-in-up" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.9rem' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', marginBottom: '0.3rem' }}>
                {firstName ? `${firstName}'s ${GOAL_LABELS[profile.goal] || 'nutrition'} plan` : `Your ${GOAL_LABELS[profile.goal] || 'nutrition'} plan`}
              </h1>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: 640 }}>{plan.summary.split('\n')[0]}</p>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.76rem', padding: '0.4rem 0.85rem' }}>
              <MapPinIcon size={13} /> {(plan.region || 'global').replace(/-/g, ' ')} cuisine
            </span>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="fade-in-up delay-100" style={{
          display: 'inline-flex', gap: '0.25rem', marginBottom: '1.5rem',
          background: 'var(--color-surface)', padding: '0.3rem',
          borderRadius: '0.875rem', border: '1px solid var(--color-border)',
          maxWidth: '100%', overflowX: 'auto',
        }}>
          {TABS.map((t) => (
            <button key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem' }}>Macro breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={macroData} cx={65} cy={65} innerRadius={42} outerRadius={64} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e6e5e0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {macroData.map((m) => (
                    <div key={m.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-muted)' }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                          {m.name}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.value}g</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 5 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.round((m.value / (calcs.proteinG + calcs.carbsG + calcs.fatG)) * 100)}%`, background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Key stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
                {[
                  { v: calcs.bmi, l: `BMI · ${calcs.bmiCategory}`, c: bmiColor },
                  { v: calcs.dailyCalorieGoal, l: 'Daily calories', c: 'var(--color-text)' },
                  { v: Math.abs(calcs.weeklyWeightChangeKg), l: `kg / week ${profile.goal === 'lose_weight' ? 'loss' : 'gain'}`, c: 'var(--color-text)' },
                  { v: `${calcs.waterLiters}L`, l: 'Water target', c: 'var(--color-text)' },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: s.c, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                    <div className="metric-label" style={{ marginTop: '0.15rem' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem', gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BulbIcon size={17} style={{ color: 'var(--color-accent)' }} /> Recommendations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {plan.tips.slice(0, 4).map((tip, i) => (
                  <div key={i} style={{ padding: '0.9rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    {tip.replace(/^[^\s]+\s/, '')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEALS ─────────────────────────────────────── */}
        {activeTab === 'meals' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {plan.weeklyPlan.map((d, i) => (
                <button key={d.day}
                  className={`tab-btn ${activeDay === i ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                  onClick={() => setActiveDay(i)}
                  style={{ minWidth: 64, border: activeDay === i ? 'none' : '1px solid var(--color-border)', background: activeDay === i ? undefined : 'var(--color-surface)' }}>
                  {d.day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem' }}>{selectedDayPlan.day}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{selectedDayPlan.totalCalories}</strong> kcal total
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {MEAL_META.map((meta) => (
                <MealCard key={meta.key} meta={meta} meal={selectedDayPlan[meta.key]} />
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKER ───────────────────────────────────── */}
        {activeTab === 'tracker' && (
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '0.98rem' }}>Today's calories</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>Based on meals you've logged</p>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {calsConsumed}
                <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)', fontWeight: 500 }}> / {calcs.dailyCalorieGoal} kcal</span>
              </div>
              <div className="progress-bar-track" style={{ marginTop: '1rem', height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${caloriePct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                <span>{caloriePct}% of target</span>
                <span>{calcs.dailyCalorieGoal - calsConsumed} kcal remaining</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.98rem' }}>Log meals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {MEAL_META.map((meta, i) => {
                  const done = dailyLog.mealsCompleted[i];
                  return (
                    <button key={meta.key} onClick={() => toggleMeal(i)}
                      className={`option-card ${done ? 'selected' : ''}`}
                      style={{ padding: '0.7rem 0.9rem', alignItems: 'center' }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                        border: `1.5px solid ${done ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                        background: done ? 'var(--color-accent)' : 'transparent',
                        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done && <CheckIcon size={13} />}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{meta.label}</span>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {selectedDayPlan[meta.key].calories} kcal
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <h3 style={{ marginBottom: '1.1rem', fontSize: '0.98rem' }}>Daily log</h3>

              <div style={{ marginBottom: '1.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Water intake</label>
                  <span style={{ fontWeight: 750, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{dailyLog.waterLiters}L</span>
                </div>
                <input type="range" min={0} max={6} step={0.25} value={dailyLog.waterLiters}
                  onChange={(e) => updateLog({ waterLiters: +e.target.value })} />
                <div style={{ fontSize: '0.74rem', color: 'var(--color-faint)', marginTop: '0.3rem', textAlign: 'right' }}>Target: {calcs.waterLiters}L</div>
              </div>

              <button onClick={() => updateLog({ exerciseDone: !dailyLog.exerciseDone })}
                className={`option-card ${dailyLog.exerciseDone ? 'selected' : ''}`}
                style={{ padding: '0.85rem 1rem', alignItems: 'center', marginBottom: '1.3rem' }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: dailyLog.exerciseDone ? 'var(--color-accent)' : 'var(--color-surface2)',
                  color: dailyLog.exerciseDone ? '#fff' : 'var(--color-muted)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <DumbbellIcon size={18} />
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>Exercise completed</span>
                <span className={`badge ${dailyLog.exerciseDone ? 'badge-green' : 'badge-grey'}`}>
                  {dailyLog.exerciseDone ? 'Done' : 'Not yet'}
                </span>
              </button>

              <div style={{ marginBottom: '1.3rem' }}>
                <label className="input-label" htmlFor="log-weight">Today's weight (kg)</label>
                <input id="log-weight" type="number" className="input-field"
                  value={dailyLog.weight || ''} onChange={(e) => updateLog({ weight: +e.target.value })}
                  placeholder={`${profile.weightKg}`} />
              </div>

              <div>
                <span className="input-label">How do you feel today?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {MOODS.map((m) => (
                    <button key={m.v} type="button" onClick={() => updateLog({ mood: m.v as DailyLog['mood'] })}
                      className={`option-card ${dailyLog.mood === m.v ? 'selected' : ''}`}
                      style={{ flex: 1, padding: '0.65rem 0', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '0.25rem' }}
                      title={m.label}>
                      <m.icon size={20} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SHOPPING ──────────────────────────────────── */}
        {activeTab === 'shopping' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>Weekly shopping list</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem' }}>
                  Everything you need for your {(plan.region || 'global').replace(/-/g, ' ')} plan
                </p>
              </div>
              <span className="badge badge-green">{plan.shoppingList.length} items</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.6rem' }}>
              {plan.shoppingList.map((item, i) => (
                <ShoppingItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatErrorBoundary>
        <HealthAgentChat plan={savedPlan} />
      </ChatErrorBoundary>

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)} role="dialog" aria-modal="true" aria-label="Confirm data reset">
          <div className="glass-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <span style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: '#fdecea', color: 'var(--color-danger)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrashIcon size={18} />
              </span>
              <div>
                <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Reset all data?</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  This permanently deletes your profile, diet plans, and daily logs from the cloud. This cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)} style={{ padding: '0.65rem 1.3rem' }}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleResetAll} style={{ padding: '0.65rem 1.3rem' }}>
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({ meta, meal }: { meta: (typeof MEAL_META)[number]; meal: Meal }) {
  const [open, setOpen] = useState(false);
  const Icon = meta.icon;
  return (
    <div className="meal-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          all: 'unset', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.9rem', boxSizing: 'border-box',
        }}>
        <span style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={21} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-faint)', fontWeight: 650, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
            {meta.label} · {meta.time}
          </span>
          <span style={{ display: 'block', fontWeight: 650, fontSize: '0.98rem', marginBottom: '0.2rem' }}>{meal.name}</span>
          <span style={{ display: 'flex', gap: '0.8rem', fontSize: '0.79rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{meal.calories} kcal</span>
            <span>P {meal.protein}g</span>
            <span>C {meal.carbs}g</span>
            <span>F {meal.fat}g</span>
          </span>
        </span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flexShrink: 0 }}>
          <span className="badge badge-grey"><FlameIcon size={12} /> {meal.prepTime}</span>
          <ChevronDownIcon size={16} style={{ color: 'var(--color-faint)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }} />
        </span>
      </button>
      {open && (
        <div className="fade-in-up" style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)', fontSize: '0.87rem', color: 'var(--color-muted)', lineHeight: 1.65 }}>
          {meal.description}
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              {meal.tags.map((t) => <span key={t} className="badge badge-grey">{t}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShoppingItem({ item }: { item: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked((c) => !c)}
      className="glass-card"
      style={{
        all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%',
        padding: '0.8rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
        opacity: checked ? 0.55 : 1, transition: 'opacity 140ms ease',
      }}>
      <span style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
        background: checked ? 'var(--color-accent)' : 'transparent',
        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <CheckIcon size={12} />}
      </span>
      <span style={{
        fontSize: '0.87rem',
        textDecoration: checked ? 'line-through' : 'none',
        color: checked ? 'var(--color-faint)' : 'var(--color-text)',
      }}>
        {item}
      </span>
    </button>
  );
}
