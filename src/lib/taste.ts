import type { DailyLog } from './storage';
import type { DietPlan, Meal } from './ai-engine';
import type { UserProfile } from './calculations';
import { buildWeeklyReview } from './weekly-review';

// ── Taste learning ("the plan learns you") ────────────────────────
// Signals: meal swaps (strong), consistently skipped meals (medium),
// and the weekly review's directive (e.g. "lunch needs more protein").
// buildTasteConstraints() turns them into generation constraints plus
// human-readable explanations ("here's what changed and why").

export interface SwapRecord {
  from: string;
  to: string;
  slot: string;
  at: string; // ISO timestamp
}

export interface TasteProfile {
  /** Meal names the user keeps removing → exclude from generation. */
  dislikes: string[];
  /** Meal names the user keeps choosing → prefer in generation. */
  likes: string[];
  /** Slots that need a protein boost, e.g. ['lunch']. */
  proteinBoostSlots: string[];
  /** What the user was told changed and why. */
  learnings: string[];
  updatedAt: string;
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Fuzzy: does a food name match a remembered like/dislike? */
export function nameMatches(foodName: string, remembered: string): boolean {
  const f = normalizeName(foodName);
  const r = normalizeName(remembered);
  if (!f || !r) return false;
  if (f === r) return true;
  // Match when one contains the other and the overlap is substantial
  // (avoids "dal" matching "dalia"... actually those SHOULD match loosely;
  // the length guard below keeps it sane).
  const shorter = f.length < r.length ? f : r;
  const longer = f.length < r.length ? r : f;
  return longer.includes(shorter) && shorter.length >= 4;
}

export function matchesAny(foodName: string, list: string[]): boolean {
  return list.some((r) => nameMatches(foodName, r));
}

const MAX_SWAPS = 60;

export function recordSwap(
  history: SwapRecord[] | undefined,
  from: Meal,
  to: Meal,
  slot: string,
): SwapRecord[] {
  const next = [...(history || []), { from: from.name, to: to.name, slot, at: new Date().toISOString() }];
  return next.slice(-MAX_SWAPS);
}

function weekdayIndex(date: string): number {
  return (new Date(date + 'T00:00:00').getDay() + 6) % 7;
}

const SLOT_KEYS = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'] as const;

export function buildTasteConstraints(opts: {
  plan: DietPlan;
  profile: UserProfile;
  logs: DailyLog[];
  dailyGoal: number;
  proteinTargetG: number;
  waterTargetL: number;
}): TasteProfile {
  const { plan, profile, logs, dailyGoal, proteinTargetG, waterTargetL } = opts;
  const dislikes: string[] = [];
  const likes: string[] = [];
  const learnings: string[] = [];
  const pushUnique = (arr: string[], v: string) => {
    if (!arr.some((x) => nameMatches(v, x))) arr.push(v);
  };

  // 1. Swaps — the strongest signal.
  const swaps = plan.swapHistory || [];
  const fromCounts = new Map<string, number>();
  const toCounts = new Map<string, number>();
  for (const s of swaps) {
    fromCounts.set(s.from, (fromCounts.get(s.from) || 0) + 1);
    toCounts.set(s.to, (toCounts.get(s.to) || 0) + 1);
  }
  for (const [name, n] of fromCounts) {
    if (n >= 2) {
      pushUnique(dislikes, name);
      learnings.push(
        `You swapped out “${name}” ${n} times — it's off next week's menu.`,
      );
    }
  }
  for (const [name, n] of toCounts) {
    if (n >= 2 && !matchesAny(name, dislikes)) {
      pushUnique(likes, name);
      learnings.push(`You keep choosing “${name}” — you'll see more meals like it.`);
    }
  }

  // 2. Consistently skipped meals (served 4+ times, skipped 3+).
  const served = new Map<string, number>();
  const skipped = new Map<string, number>();
  for (const log of logs) {
    const dayPlan = plan.weeklyPlan[weekdayIndex(log.date)];
    if (!dayPlan) continue;
    SLOT_KEYS.forEach((key, i) => {
      const meal = dayPlan[key];
      if (!meal) return;
      served.set(meal.name, (served.get(meal.name) || 0) + 1);
      if (!log.mealsCompleted[i]) skipped.set(meal.name, (skipped.get(meal.name) || 0) + 1);
    });
  }
  for (const [name, n] of skipped) {
    if (n >= 3 && (served.get(name) || 0) >= 4 && !matchesAny(name, dislikes)) {
      pushUnique(dislikes, name);
      learnings.push(`You skipped “${name}” ${n} times — replaced with something you'll actually eat.`);
    }
  }

  // 3. Weekly review directive.
  const proteinBoostSlots: string[] = [];
  const review = buildWeeklyReview({ logs, plan, profile, dailyGoal, proteinTargetG, waterTargetL });
  if (review.enoughData && review.directive?.kind === 'protein' && review.directive.slot !== 'any') {
    proteinBoostSlots.push(review.directive.slot);
    const slotLabel =
      review.directive.slot === 'morningSnack' || review.directive.slot === 'afternoonSnack'
        ? 'snacks'
        : review.directive.slot;
    learnings.push(`Your review flagged low protein — ${slotLabel} get a protein boost next week.`);
  } else if (review.enoughData && review.directive?.kind === 'protein') {
    proteinBoostSlots.push('lunch', 'dinner');
    learnings.push('Your review flagged low protein — lunches and dinners get a protein boost next week.');
  }

  return {
    dislikes,
    likes,
    proteinBoostSlots,
    learnings,
    updatedAt: new Date().toISOString(),
  };
}

/** Is there enough signal to make learning worthwhile? */
export function hasTasteSignal(plan: DietPlan, logs: DailyLog[]): boolean {
  return (plan.swapHistory || []).length >= 2 || logs.length >= 5;
}
