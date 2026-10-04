import type { DailyLog } from './storage';
import type { DietPlan } from './ai-engine';
import type { UserProfile } from './calculations';
import { enrichIntake } from './adaptive';

// ── Weekly review ("Your week, decoded") ────────────────────────────
// Deterministic, rule-based analysis of the last 7 days of logs:
// adherence, intake vs target, protein, weight trend, water, exercise,
// best day, and exactly one suggested tweak for next week.

export interface DayScore {
  date: string;
  label: string;
  intakeKcal: number;
  proteinG: number;
  adherence: number; // 0..1 — share of planned meals completed
  waterOk: boolean;
  exercised: boolean;
}

export interface WeeklyReview {
  daysTracked: number;
  adherencePct: number;
  avgIntake: number;
  avgProteinG: number;
  proteinTargetG: number;
  weightChangeKg: number | null;
  waterDays: number;
  exerciseDays: number;
  bestDay: DayScore | null;
  headline: string;
  tweak: string;
  enoughData: boolean;
}

function weekdayIndex(date: string): number {
  return (new Date(date + 'T00:00:00').getDay() + 6) % 7;
}

function dayLabel(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function last7DayKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(fmtDate(d));
  }
  return keys;
}

export function buildWeeklyReview(opts: {
  logs: DailyLog[];
  plan: DietPlan;
  profile: UserProfile;
  dailyGoal: number;
  proteinTargetG: number;
  waterTargetL: number;
}): WeeklyReview {
  const { plan, profile, dailyGoal, proteinTargetG, waterTargetL } = opts;
  const enriched = enrichIntake(opts.logs, plan);
  const byDate = new Map(enriched.map((l) => [l.date, l]));
  const keys = last7DayKeys();

  const days: DayScore[] = [];
  for (const key of keys) {
    const log = byDate.get(key);
    if (!log) continue;
    const dayPlan = plan.weeklyPlan[weekdayIndex(key)];
    const meals = dayPlan
      ? [dayPlan.breakfast, dayPlan.morningSnack, dayPlan.lunch, dayPlan.afternoonSnack, dayPlan.dinner]
      : [];
    const completed = log.mealsCompleted.filter(Boolean).length;
    const proteinFromPlan = meals.reduce(
      (a, m, i) => a + (log.mealsCompleted[i] && m ? m.protein : 0),
      0,
    );
    const proteinFromExtras = (log.extraMeals || []).reduce((a, m) => a + (m.proteinG || 0), 0);
    days.push({
      date: key,
      label: dayLabel(key),
      intakeKcal: log.intakeKcal || 0,
      proteinG: Math.round((proteinFromPlan + proteinFromExtras) * 10) / 10,
      adherence: completed / 5,
      waterOk: log.waterLiters >= waterTargetL * 0.8,
      exercised: log.exerciseDone || (log.exercises || []).length > 0,
    });
  }

  const empty: WeeklyReview = {
    daysTracked: 0,
    adherencePct: 0,
    avgIntake: 0,
    avgProteinG: 0,
    proteinTargetG,
    weightChangeKg: null,
    waterDays: 0,
    exerciseDays: 0,
    bestDay: null,
    headline: 'Not enough data yet',
    tweak: 'Log your meals for a few more days and your first weekly review will appear here.',
    enoughData: false,
  };
  if (days.length < 3) return empty;

  const avg = (f: (d: DayScore) => number) => days.reduce((a, d) => a + f(d), 0) / days.length;
  const adherencePct = Math.round(avg((d) => d.adherence) * 100);
  const avgIntake = Math.round(avg((d) => d.intakeKcal));
  const avgProteinG = Math.round(avg((d) => d.proteinG) * 10) / 10;
  const waterDays = days.filter((d) => d.waterOk).length;
  const exerciseDays = days.filter((d) => d.exercised).length;

  // Weight trend across the week (needs 2+ weigh-ins).
  const weighIns = enriched
    .filter((l) => keys.includes(l.date) && typeof l.weight === 'number' && l.weight > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const weightChangeKg =
    weighIns.length >= 2
      ? Math.round((weighIns[weighIns.length - 1].weight! - weighIns[0].weight!) * 10) / 10
      : null;

  // Best day: closest intake to target, tie-broken by adherence.
  const bestDay = [...days].sort(
    (a, b) =>
      Math.abs(a.intakeKcal - dailyGoal) - Math.abs(b.intakeKcal - dailyGoal) ||
      b.adherence - a.adherence,
  )[0];

  // Headline.
  let headline: string;
  if (adherencePct >= 80) headline = 'Excellent week — you stayed on plan';
  else if (adherencePct >= 60) headline = 'Solid week — mostly on track';
  else if (adherencePct >= 40) headline = 'A mixed week — room to tighten up';
  else headline = 'A tough week — let\u2019s reset';

  // Exactly one tweak: highest-priority issue wins.
  const goal = profile.goal;
  let tweak: string;
  if (avgProteinG < proteinTargetG * 0.7) {
    tweak = `Protein averaged ${avgProteinG}g vs your ${proteinTargetG}g target. Add one palm-sized protein portion (eggs, paneer, chicken, dal) to lunch — it's the single biggest lever right now.`;
  } else if (adherencePct < 60) {
    tweak = `You completed ${adherencePct}% of planned meals. Try prepping tomorrow's breakfast tonight — mornings are where most plans slip.`;
  } else if (waterDays < 4) {
    tweak = `Water hit the mark only ${waterDays} of ${days.length} days. Keep a 1L bottle at your desk and finish it by lunch, then refill.`;
  } else if (exerciseDays < 3) {
    tweak = `Only ${exerciseDays} active ${exerciseDays === 1 ? 'day' : 'days'} this week. Two 30-minute walks would already change next week's numbers.`;
  } else if (
    weightChangeKg !== null &&
    ((goal === 'lose_weight' && weightChangeKg >= 0) ||
      (goal === 'gain_weight' && weightChangeKg <= 0))
  ) {
    tweak = `Weight ${weightChangeKg > 0 ? 'rose' : 'held steady'} despite ${adherencePct}% adherence — your target may need recalibrating. Give it one more consistent week, then check the adaptive target on Home.`;
  } else if (Math.abs(avgIntake - dailyGoal) > dailyGoal * 0.15) {
    const dir = avgIntake > dailyGoal ? 'over' : 'under';
    tweak = `You averaged ${avgIntake.toLocaleString('en-IN')} kcal — ${dir} your ${dailyGoal.toLocaleString('en-IN')} target by ${Math.abs(avgIntake - dailyGoal).toLocaleString('en-IN')}. Tighten portion sizes at dinner, where most of the drift happens.`;
  } else {
    tweak = `Everything is trending the right way — ${adherencePct}% adherence and intake near target. Protect the routine: same breakfast, same walk, same bedtime.`;
  }

  return {
    daysTracked: days.length,
    adherencePct,
    avgIntake,
    avgProteinG,
    proteinTargetG,
    weightChangeKg,
    waterDays,
    exerciseDays,
    bestDay,
    headline,
    tweak,
    enoughData: true,
  };
}
