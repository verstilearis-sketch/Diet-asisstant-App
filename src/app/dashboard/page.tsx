'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getLatestPlan, signOut, getDailyLog, saveDailyLog, DailyLog } from '@/lib/storage';
import { computeAll } from '@/lib/calculations';
import type { SavedPlan } from '@/lib/storage';
import type { Meal } from '@/lib/ai-engine';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HealthAgentChat } from '@/components/HealthAgentChat';
import { ChatErrorBoundary } from '@/components/ChatErrorBoundary';

const GOAL_LABELS: Record<string, string> = { lose_weight: 'Weight Loss', gain_weight: 'Muscle Gain', maintain: 'Maintenance', improve_health: 'Health', athletic: 'Athletic Performance' };
const MACRO_COLORS = { protein: '#10b981', carbs: '#6366f1', fat: '#f59e0b' };

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [activeDay, setActiveDay] = useState((new Date().getDay() + 6) % 7); // Monday = 0
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'tracker' | 'shopping'>('overview');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [todayStr] = useState(getTodayString());

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/auth'); return; }
    setUserName(session.name);
    const plan = getLatestPlan(session.userId);
    if (!plan) { router.replace('/onboarding'); return; }
    setSavedPlan(plan);
    setDailyLog(getDailyLog(session.userId, todayStr));
    setLoading(false);
  }, [router, todayStr]);

  const updateLog = (updates: Partial<DailyLog>) => {
    if (!dailyLog || !savedPlan) return;
    const newLog = { ...dailyLog, ...updates };
    setDailyLog(newLog);
    saveDailyLog(savedPlan.userId, newLog);
  };

  const toggleMeal = (index: number) => {
    if (!dailyLog) return;
    const meals = [...dailyLog.mealsCompleted];
    meals[index] = !meals[index];
    updateLog({ mealsCompleted: meals });
  };

  const handleSignOut = () => { signOut(); router.replace('/'); };

  if (loading || !savedPlan || !dailyLog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-2" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-muted)' }}>Loading your plan…</p>
        </div>
      </div>
    );
  }

  const { profile, plan } = savedPlan;
  const calcs = computeAll(profile);
  const selectedDayPlan = plan.weeklyPlan[activeDay];
  
  // Track calories for today based on checkboxes
  const mealsList = [selectedDayPlan.breakfast, selectedDayPlan.morningSnack, selectedDayPlan.lunch, selectedDayPlan.afternoonSnack, selectedDayPlan.dinner];
  const calsConsumed = mealsList.reduce((acc, meal, i) => acc + (dailyLog.mealsCompleted[i] ? meal.calories : 0), 0);

  const macroData = [
    { name: 'Protein', value: calcs.proteinG, color: MACRO_COLORS.protein },
    { name: 'Carbs',   value: calcs.carbsG,   color: MACRO_COLORS.carbs },
    { name: 'Fat',     value: calcs.fatG,     color: MACRO_COLORS.fat },
  ];

  const bmiColor = calcs.bmi < 18.5 ? '#6366f1' : calcs.bmi < 25 ? '#10b981' : calcs.bmi < 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-2" />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '1rem 2rem',
        background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🥗</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Diet<span className="gradient-text">AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>👋 {userName.split(' ')[0]}</span>
          <button className="btn-ghost" onClick={() => router.push('/onboarding')} style={{ fontSize: '0.85rem' }}>🔄 New Plan</button>
          <button className="btn-ghost" onClick={handleSignOut} style={{ fontSize: '0.85rem', color: '#ef4444' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="fade-in-up" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>Your <span className="gradient-text">{GOAL_LABELS[profile.goal] || 'Nutrition'}</span> Plan</h1>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{plan.summary.split('\n')[0]}</p>
            </div>
            <span className="badge badge-indigo" style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>🌍 {plan.region ? plan.region.replace('-', ' ').toUpperCase() : 'GLOBAL'} CUISINE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="fade-in-up delay-100" style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: 'rgba(255,255,255,0.03)', padding: '0.375rem',
          borderRadius: '0.875rem', border: '1px solid var(--color-border)', overflowX: 'auto',
        }}>
          {(['overview', 'meals', 'tracker', 'shopping'] as const).map(t => (
            <button key={t} className={`tab-btn ${activeTab === t ? 'tab-btn-active' : 'tab-btn-inactive'}`} onClick={() => setActiveTab(t)}>
              {t === 'overview' ? '📊 Overview' : t === 'meals' ? '🍽️ Meal Plan' : t === 'tracker' ? '✅ Daily Tracker' : '🛒 Shopping'}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* Macros */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📊 Macro Breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart><Pie data={macroData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>{macroData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }} /></PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {macroData.map(m => (
                    <div key={m.name} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />{m.name}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: m.color }}>{m.value}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BMI & Stats */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>⚖️ Key Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: bmiColor, fontFamily: 'Outfit, sans-serif' }}>{calcs.bmi}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>BMI ({calcs.bmiCategory})</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Outfit, sans-serif' }}>{calcs.dailyCalorieGoal}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Daily kcal</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit, sans-serif' }}>{Math.abs(calcs.weeklyWeightChangeKg)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>kg / week {profile.goal === 'lose_weight' ? 'loss' : 'gain'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'Outfit, sans-serif' }}>{calcs.waterLiters}L</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Water</div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>💡 AI Recommendations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {plan.tips.slice(0, 4).map((tip, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span>{tip.split(' ')[0]}</span><span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>{tip.slice(tip.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEALS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'meals' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {plan.weeklyPlan.map((d, i) => (
                <button key={d.day} className={`tab-btn ${activeDay === i ? 'tab-btn-active' : 'tab-btn-inactive'}`} onClick={() => setActiveDay(i)} style={{ minWidth: 80 }}>{d.day.slice(0, 3)}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '🌅 Breakfast', meal: selectedDayPlan.breakfast, time: '7:00 – 9:00 AM' },
                { label: '🍏 Morning Snack', meal: selectedDayPlan.morningSnack, time: '10:30 – 11:00 AM' },
                { label: '☀️ Lunch', meal: selectedDayPlan.lunch, time: '12:30 – 2:00 PM' },
                { label: '🍌 Afternoon Snack', meal: selectedDayPlan.afternoonSnack, time: '4:00 – 5:00 PM' },
                { label: '🌙 Dinner', meal: selectedDayPlan.dinner, time: '7:00 – 8:30 PM' },
              ].map(({ label, meal, time }) => (
                <MealCard key={label} label={label} meal={meal} time={time} />
              ))}
            </div>
          </div>
        )}

        {/* ── TRACKER TAB ────────────────────────────────────────────────── */}
        {activeTab === 'tracker' && (
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Calorie Progress */}
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem' }}>Today's Progress</h3>
              <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--color-accent)' }}>
                {calsConsumed} <span style={{ fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 500 }}>/ {calcs.dailyCalorieGoal} kcal</span>
              </div>
              <div className="progress-bar-track" style={{ marginTop: '1rem', height: 12, borderRadius: 6 }}>
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, (calsConsumed / calcs.dailyCalorieGoal) * 100)}%` }} />
              </div>
            </div>

            {/* Meal Checklists */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Log Meals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Breakfast', cal: selectedDayPlan.breakfast.calories },
                  { label: 'Morning Snack', cal: selectedDayPlan.morningSnack.calories },
                  { label: 'Lunch', cal: selectedDayPlan.lunch.calories },
                  { label: 'Afternoon Snack', cal: selectedDayPlan.afternoonSnack.calories },
                  { label: 'Dinner', cal: selectedDayPlan.dinner.calories },
                ].map((m, i) => (
                  <button key={i} onClick={() => toggleMeal(i)} className={`option-card ${dailyLog.mealsCompleted[i] ? 'selected' : ''}`} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${dailyLog.mealsCompleted[i] ? 'var(--color-accent)' : 'var(--color-border)'}`, background: dailyLog.mealsCompleted[i] ? 'rgba(16,185,129,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {dailyLog.mealsCompleted[i] && <span style={{ color: 'var(--color-accent)' }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{m.cal} kcal</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Inputs (Water, Exercise, Mood, Weight) */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Daily Log</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Water Intake (Liters)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min={0} max={6} step={0.25} value={dailyLog.waterLiters} onChange={e => updateLog({ waterLiters: +e.target.value })} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', minWidth: 40 }}>{dailyLog.waterLiters}L</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem', textAlign: 'right' }}>Target: {calcs.waterLiters}L</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <button onClick={() => updateLog({ exerciseDone: !dailyLog.exerciseDone })} className={`option-card ${dailyLog.exerciseDone ? 'selected' : ''}`} style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>🏃 Exercise Completed?</span>
                  <span>{dailyLog.exerciseDone ? '✅ Yes' : '❌ No'}</span>
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Today's Weight (kg)</label>
                <input type="number" className="input-field" value={dailyLog.weight || ''} onChange={e => updateLog({ weight: +e.target.value })} placeholder={`e.g., ${profile.weightKg}`} />
              </div>

              <div>
                <label className="input-label">How do you feel today?</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[{v:'great',e:'🤩'},{v:'good',e:'😊'},{v:'okay',e:'😐'},{v:'bad',e:'😫'}].map(m => (
                    <button key={m.v} onClick={() => updateLog({ mood: m.v as any })} className={`option-card ${dailyLog.mood === m.v ? 'selected' : ''}`} style={{ flex: 1, padding: '0.75rem 0', justifyContent: 'center', fontSize: '1.5rem' }}>
                      {m.e}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── SHOPPING TAB ────────────────────────────────────────────────── */}
        {activeTab === 'shopping' && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Weekly Shopping List</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Based on your {plan.region.replace('-', ' ')} plan</p>
              </div>
              <span className="badge badge-green">{plan.shoppingList.length} items</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
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
    </div>
  );
}

function MealCard({ label, meal, time }: { label: string; meal: Meal; time: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="meal-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{ fontSize: '1.75rem', width: 48, height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{meal.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.15rem' }}>{label} · {time}</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{meal.name}</div>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#10b981' }}>{meal.calories} kcal</span>
            <span style={{ color: 'var(--color-muted)' }}>P: {meal.protein}g</span>
            <span style={{ color: 'var(--color-muted)' }}>C: {meal.carbs}g</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
          <span className="badge badge-indigo">{meal.prepTime}</span>
          <span style={{ color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
          📝 {meal.description}
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {meal.tags.map(t => <span key={t} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>{t}</span>)}
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
    <div className={`glass-card glass-card-hover`} style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', opacity: checked ? 0.5 : 1 }} onClick={() => setChecked(c => !c)}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`, background: checked ? 'rgba(16,185,129,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-accent)' }}>{checked && '✓'}</div>
      <span style={{ fontSize: '0.875rem', textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--color-muted)' : 'var(--color-text)' }}>{item}</span>
    </div>
  );
}
