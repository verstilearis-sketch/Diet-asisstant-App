'use client';

import { useEffect, useState } from 'react';
import { getDailyLogsRange, type DailyLog } from '@/lib/storage';
import { BarChartIcon } from '@/components/icons';

interface WeekStats {
  daysTracked: number;
  avgIntake: number | null;
  adherencePct: number | null;
  workoutDays: number;
  avgWater: number | null;
  weightChange: number | null;
  moodTop: string | null;
  daily: { date: string; label: string; intake: number | null; tracked: boolean }[];
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStats(logs: DailyLog[], targetKcal: number): WeekStats {
  const tracked = logs.filter((l) =>
    l.intakeKcal != null || l.mealsCompleted.some(Boolean) || l.exerciseDone || l.weight != null,
  );
  const intakes = tracked.map((l) => l.intakeKcal).filter((v): v is number => v != null);
  const avgIntake = intakes.length ? Math.round(intakes.reduce((a, b) => a + b, 0) / intakes.length) : null;

  const mealSlots = tracked.flatMap((l) => l.mealsCompleted);
  const adherencePct = mealSlots.length
    ? Math.round((mealSlots.filter(Boolean).length / mealSlots.length) * 100)
    : null;

  const workoutDays = tracked.filter((l) => l.exerciseDone).length;

  const waters = tracked.map((l) => l.waterLiters).filter((v) => v > 0);
  const avgWater = waters.length ? Math.round((waters.reduce((a, b) => a + b, 0) / waters.length) * 10) / 10 : null;

  const weights = tracked.map((l) => l.weight).filter((v): v is number => v != null);
  const weightChange = weights.length >= 2
    ? Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10
    : null;

  const moods = tracked.map((l) => l.mood).filter(Boolean) as string[];
  const moodTop = moods.length
    ? (Object.entries(moods.reduce<Record<string, number>>((a, m) => ({ ...a, [m]: (a[m] ?? 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
    : null;

  const daily = logs.map((l) => {
    const d = new Date(l.date + 'T12:00:00');
    return {
      date: l.date,
      label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
      intake: l.intakeKcal ?? null,
      tracked: l.intakeKcal != null || l.mealsCompleted.some(Boolean) || l.exerciseDone,
    };
  });

  return { daysTracked: tracked.length, avgIntake, adherencePct, workoutDays, avgWater, weightChange, moodTop, daily };
}

function verdict(s: WeekStats, targetKcal: number, goal: string): string {
  if (s.daysTracked === 0) return 'No data yet — log a few days and your first report will appear here.';
  const parts: string[] = [];
  if (s.avgIntake != null) {
    const diff = s.avgIntake - targetKcal;
    const dir = goal === 'lose_weight' ? diff <= 0 : goal === 'gain_weight' ? diff >= 0 : Math.abs(diff) < 150;
    parts.push(dir
      ? `averaging ${s.avgIntake.toLocaleString('en-IN')} kcal/day — right on your ${targetKcal.toLocaleString('en-IN')} target`
      : `averaging ${s.avgIntake.toLocaleString('en-IN')} kcal/day vs your ${targetKcal.toLocaleString('en-IN')} target`);
  }
  if (s.adherencePct != null) parts.push(`${s.adherencePct}% of planned meals completed`);
  if (s.workoutDays > 0) parts.push(`${s.workoutDays} workout${s.workoutDays > 1 ? 's' : ''} logged`);
  if (s.weightChange != null && s.weightChange !== 0) {
    parts.push(`${s.weightChange > 0 ? '+' : ''}${s.weightChange} kg this week`);
  }
  return parts.length ? `This week: ${parts.join(' · ')}.` : 'Keep logging — a few more days will fill in your report.';
}

export function WeeklyReport({
  userId,
  targetKcal,
  waterGoal,
  goal,
}: {
  userId: string;
  targetKcal: number;
  waterGoal: number;
  goal: string;
}) {
  const [stats, setStats] = useState<WeekStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      try {
        const logs = await getDailyLogsRange(userId, fmtDate(start), fmtDate(end));
        if (!cancelled) setStats(computeStats(logs, targetKcal));
      } catch {
        /* report stays hidden on failure */
      }
    })();
    return () => { cancelled = true; };
  }, [userId, targetKcal]);

  if (!stats || stats.daysTracked === 0) return null;

  const s = stats;
  const maxBar = Math.max(targetKcal, ...s.daily.map((d) => d.intake ?? 0));
  const rangeLabel = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const f = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${f(start)} – ${f(end)}`;
  })();

  const tiles = [
    { label: 'Avg intake', value: s.avgIntake != null ? s.avgIntake.toLocaleString('en-IN') : '—', sub: `target ${targetKcal.toLocaleString('en-IN')} kcal` },
    { label: 'Meal adherence', value: s.adherencePct != null ? `${s.adherencePct}%` : '—', sub: `${s.daysTracked}/7 days tracked` },
    { label: 'Workouts', value: String(s.workoutDays), sub: s.workoutDays === 1 ? 'day this week' : 'days this week' },
    { label: 'Avg water', value: s.avgWater != null ? `${s.avgWater}L` : '—', sub: `goal ${waterGoal}L/day` },
  ];

  return (
    <div className="glass-card" style={{ padding: '1.4rem', gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
        <h3 style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <BarChartIcon size={17} style={{ color: 'var(--color-accent)' }} /> Your week
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-faint)' }}>{rangeLabel}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.7rem', marginBottom: '1.2rem' }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '0.8rem 0.9rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{t.value}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '0.15rem' }}>{t.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{t.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>
          Daily intake vs target
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem', height: 96 }}>
          {s.daily.map((d) => {
            const h = d.intake != null ? Math.max(6, Math.round((d.intake / maxBar) * 88)) : 6;
            const over = d.intake != null && d.intake > targetKcal * 1.1;
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <div
                  title={d.intake != null ? `${d.intake.toLocaleString('en-IN')} kcal` : 'No data'}
                  style={{
                    width: '100%', maxWidth: 34, height: h, borderRadius: '0.35rem',
                    background: !d.tracked
                      ? 'var(--color-border)'
                      : over
                        ? 'linear-gradient(180deg, #e07856, #b34a2e)'
                        : 'linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 55%, transparent))',
                    opacity: d.tracked ? 1 : 0.45,
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: 600 }}>{d.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-faint)' }}>
            Target {targetKcal.toLocaleString('en-IN')} kcal/day
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: 0, paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)' }}>
        {verdict(s, targetKcal, goal)}
        {s.weightChange != null && s.weightChange !== 0 && (
          <> Your scale moved <strong style={{ color: 'var(--color-text)' }}>{s.weightChange > 0 ? '+' : ''}{s.weightChange} kg</strong> across the week.</>
        )}
      </p>
    </div>
  );
}
