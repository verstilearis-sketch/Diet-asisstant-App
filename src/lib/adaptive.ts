import type { DailyLog } from './storage';
import type { DietPlan } from './ai-engine';
import type { UserProfile } from './calculations';

// ── Adaptive calorie targets ──────────────────────────────────────
// Compares what the user actually ate (logged intake) against how their
// weight actually moved, estimates their real TDEE, and nudges the daily
// calorie target toward it. Conservative by design: at most ±200 kcal per
// adjustment, at most one adjustment per 7 days, never below BMR/1200.

const KCAL_PER_KG = 7700;
const WINDOW_DAYS = 21;
const MIN_INTAKE_DAYS = 7;
const MIN_WEIGHT_SPAN_DAYS = 7;
const MIN_ADJUST_GAP_DAYS = 7;
const MAX_SHIFT = 200;
const MIN_CHANGE = 100;

export interface AdaptationCheck {
  status: 'adapted' | 'up-to-date' | 'recently-adjusted' | 'not-enough-data';
  newTarget?: number;
  reason?: string;
  daysLogged?: number;
  weighIns?: number;
  avgIntake?: number;
  weightChangeKg?: number;
  estimatedTdee?: number;
}

/** Weekday index (Mon=0..Sun=6) for a YYYY-MM-DD date. */
function weekdayIndex(date: string): number {
  return (new Date(date + 'T00:00:00').getDay() + 6) % 7;
}

/**
 * Fill in intakeKcal for older logs saved before snapshots existed,
 * using the current plan's weekday meals + logged extras.
 */
export function enrichIntake(logs: DailyLog[], plan: DietPlan): DailyLog[] {
  return logs.map((log) => {
    if (typeof log.intakeKcal === 'number' && log.intakeKcal > 0) return log;
    const dayPlan = plan.weeklyPlan[weekdayIndex(log.date)];
    const meals = dayPlan
      ? [dayPlan.breakfast, dayPlan.morningSnack, dayPlan.lunch, dayPlan.afternoonSnack, dayPlan.dinner]
      : [];
    const planKcal = meals.reduce((a, m, i) => a + (log.mealsCompleted[i] && m ? m.calories : 0), 0);
    const extraKcal = (log.extraMeals || []).reduce((a, m) => a + m.calories, 0);
    return { ...log, intakeKcal: planKcal + extraKcal };
  });
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000,
  );
}

export function checkAdaptation(opts: {
  logs: DailyLog[];
  plan: DietPlan;
  profile: UserProfile;
  currentTarget: number;
  bmr: number;
}): AdaptationCheck {
  const { plan, profile, currentTarget, bmr } = opts;
  const logs = enrichIntake(opts.logs, plan);

  // Don't re-adjust too often.
  if (plan.adaptiveTarget?.adjustedAt) {
    const daysSince = (Date.now() - new Date(plan.adaptiveTarget.adjustedAt).getTime()) / 86400000;
    if (daysSince < MIN_ADJUST_GAP_DAYS) return { status: 'recently-adjusted' };
  }

  const intakeDays = logs.filter((l) => (l.intakeKcal || 0) > 0);
  const weighIns = logs
    .filter((l) => typeof l.weight === 'number' && l.weight > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (intakeDays.length < MIN_INTAKE_DAYS || weighIns.length < 2) {
    return {
      status: 'not-enough-data',
      daysLogged: intakeDays.length,
      weighIns: weighIns.length,
    };
  }

  const first = weighIns[0];
  const last = weighIns[weighIns.length - 1];
  const spanDays = daysBetween(first.date, last.date);
  if (spanDays < MIN_WEIGHT_SPAN_DAYS || spanDays > WINDOW_DAYS + 7) {
    return { status: 'not-enough-data', daysLogged: intakeDays.length, weighIns: weighIns.length };
  }

  const avgIntake = Math.round(
    intakeDays.reduce((a, l) => a + (l.intakeKcal || 0), 0) / intakeDays.length,
  );
  const weightChangeKg = Math.round((last.weight! - first.weight!) * 100) / 100;

  // Real TDEE implied by intake vs. actual weight movement.
  const estimatedTdee = Math.round(avgIntake - (weightChangeKg * KCAL_PER_KG) / spanDays);

  // Desired daily energy delta for the goal.
  const goal = profile.goal;
  const desiredDelta = goal === 'lose_weight' ? -550 : goal === 'gain_weight' ? 300 : 0;

  const rawTarget = estimatedTdee + desiredDelta;
  const floor = Math.max(1200, Math.round(bmr));
  let newTarget = Math.round(rawTarget / 10) * 10;
  newTarget = Math.min(Math.max(newTarget, floor), currentTarget + MAX_SHIFT);
  newTarget = Math.max(newTarget, currentTarget - MAX_SHIFT);
  newTarget = Math.min(newTarget, 4500);

  if (Math.abs(newTarget - currentTarget) < MIN_CHANGE) {
    return { status: 'up-to-date', estimatedTdee, avgIntake, weightChangeKg };
  }

  const dir = newTarget < currentTarget ? 'lowered' : 'raised';
  const moved = Math.abs(weightChangeKg);
  const movedWord =
    goal === 'lose_weight'
      ? `lost ${moved} kg`
      : goal === 'gain_weight'
        ? `gained ${moved} kg`
        : weightChangeKg === 0
          ? 'held steady'
          : `${weightChangeKg > 0 ? 'gained' : 'lost'} ${moved} kg`;
  const reason =
    `Over the last ${spanDays} days you averaged ${avgIntake.toLocaleString('en-IN')} kcal/day and ${movedWord}. ` +
    `That puts your real daily burn around ${estimatedTdee.toLocaleString('en-IN')} kcal, so your target was ${dir} ` +
    `from ${currentTarget.toLocaleString('en-IN')} to ${newTarget.toLocaleString('en-IN')} kcal to keep you on track.`;

  return {
    status: 'adapted',
    newTarget,
    reason,
    daysLogged: intakeDays.length,
    weighIns: weighIns.length,
    avgIntake,
    weightChangeKg,
    estimatedTdee,
  };
}
