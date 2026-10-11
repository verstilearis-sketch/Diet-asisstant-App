// ── Nutrition & Fitness Calculation Engine ──────────────────────────────────
// Uses Mifflin-St Jeor formula (most accurate for general population)

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_weight' | 'gain_weight' | 'maintain' | 'improve_health' | 'athletic';
export type BudgetTier = 'budget' | 'moderate' | 'premium';
export type CuisineMix = 'local' | 'mixed' | 'international';

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  goal: Goal;
  timeline?: number; // weeks
  activityLevel: ActivityLevel;
  exerciseType?: string;
  exerciseFrequency?: number; // days/week
  exerciseDuration?: number; // minutes/session
  sleepHours?: number;
  stressLevel?: number; // 1-5
  workType?: 'desk' | 'physical' | 'mixed';
  /** When workType is 'mixed': how the week splits between desk and physical work. */
  workMix?: 'mostly_desk' | 'balanced' | 'mostly_physical';
  /** What the user usually eats — free text, used to personalize the plan. */
  usualBreakfast?: string;
  usualLunch?: string;
  usualDinner?: string;
  /** Favorite foods (comma-separated) and cuisine — the plan leans into these. */
  favoriteFoods?: string;
  favoriteCuisine?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  /** Foods the user avoids (comma-separated) — the plan steers clear of these. */
  foodsToAvoid?: string;
  /** Closest body-type figure the user picked (5 options per gender). */
  bodyType?: 'lean' | 'athletic' | 'average' | 'soft' | 'plus';
  /** Self-reported metabolism speed — nudges TDEE. */
  metabolism?: 'very-slow' | 'slow' | 'average' | 'fast' | 'very-fast';
  /** Compressed profile photo (data URL), stored with the plan. */
  photoUrl?: string;
  location?: string;
  budget?: BudgetTier;       // cost preference for meal planning
  cuisineMix?: CuisineMix;   // how much regional vs international food
}

export interface Calculations {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalorieGoal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterLiters: number;
  weeklyWeightChangeKg: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateBMR(profile: UserProfile): number {
  const { weightKg, heightCm, age, gender } = profile;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  let mifflin: number;
  if (gender === 'male') mifflin = base + 5;
  else if (gender === 'female') mifflin = base - 161;
  else mifflin = base - 78; // average for 'other'
  // Body-type refinement: the picked figure maps to an estimated body-fat %,
  // giving lean mass for the Katch-McArdle equation — blended 50/50 with
  // Mifflin-St Jeor so neither formula dominates.
  const bf = estimatedBodyFat(profile.bodyType, gender);
  if (bf == null) return Math.round(mifflin);
  const leanMassKg = weightKg * (1 - bf / 100);
  const katch = 370 + 21.6 * leanMassKg;
  return Math.round((mifflin + katch) / 2);
}

/** Estimated body-fat % for each body-type figure, by gender. */
export function estimatedBodyFat(
  bodyType?: UserProfile['bodyType'],
  gender?: UserProfile['gender'],
): number | null {
  if (!bodyType) return null;
  const female = gender === 'female';
  const table: Record<NonNullable<UserProfile['bodyType']>, number> = female
    ? { lean: 20, athletic: 24, average: 29, soft: 35, plus: 40 }
    : { lean: 12, athletic: 16, average: 21, soft: 27, plus: 33 };
  return table[bodyType];
}

/** Self-reported metabolism speed → small TDEE nudge. */
export function metabolismFactor(metabolism?: UserProfile['metabolism']): number {
  switch (metabolism) {
    case 'very-slow': return 0.93;
    case 'slow': return 0.96;
    case 'fast': return 1.04;
    case 'very-fast': return 1.07;
    default: return 1.0; // average or unset
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/** Small TDEE nudge from the kind of work someone does — the activity-level
 *  multiplier alone doesn't capture an 8-hour physical shift vs a desk day. */
export function workTypeFactor(workType?: UserProfile['workType'], workMix?: UserProfile['workMix']): number {
  if (workType === 'physical') return 1.06;
  if (workType === 'mixed') {
    if (workMix === 'mostly_desk') return 1.02;
    if (workMix === 'mostly_physical') return 1.05;
    return 1.035; // balanced, or older profiles without a mix set
  }
  return 1.0; // desk (or unset): activity level already covers it
}

export function calculateDailyCalorieGoal(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose_weight': return tdee - 500;   // ~0.5 kg/week loss
    case 'gain_weight': return tdee + 400;   // ~0.4 kg/week gain
    case 'maintain':    return tdee;
    case 'improve_health': return tdee - 100;
    case 'athletic':    return tdee + 200;
    default: return tdee;
  }
}

export function calculateMacros(calories: number, goal: Goal, weightKg: number): { proteinG: number; carbsG: number; fatG: number } {
  let proteinPct: number, carbsPct: number, fatPct: number;

  switch (goal) {
    case 'lose_weight':
      proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30; break;
    case 'gain_weight':
    case 'athletic':
      proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25; break;
    case 'maintain':
    case 'improve_health':
    default:
      proteinPct = 0.25; carbsPct = 0.45; fatPct = 0.30; break;
  }

  // ISSN-aligned ceiling: meta-analyses (Morton et al. 2018) show no added benefit
  // beyond ~2.2 g/kg/day even in a deficit; excess protein just displaces carbs/fat.
  const proteinG = Math.min(Math.round((calories * proteinPct) / 4), Math.round(2.2 * weightKg));
  const remainingCal = Math.max(0, calories - proteinG * 4);
  const carbShare = carbsPct / (carbsPct + fatPct);
  const carbsG = Math.round((remainingCal * carbShare) / 4);
  const fatG = Math.round((remainingCal * (1 - carbShare)) / 9);

  return { proteinG, carbsG, fatG };
}

export function calculateWater(weightKg: number, activityLevel: ActivityLevel): number {
  const base = weightKg * 0.033;
  const activityBonus = activityLevel === 'very_active' ? 0.7
    : activityLevel === 'active' ? 0.5
    : activityLevel === 'moderate' ? 0.3 : 0;
  return Math.round((base + activityBonus) * 10) / 10;
}

export function computeAll(profile: UserProfile): Calculations {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(profile);
  const tdee = Math.round(
    calculateTDEE(bmr, profile.activityLevel)
    * workTypeFactor(profile.workType, profile.workMix)
    * metabolismFactor(profile.metabolism),
  );
  const dailyCalorieGoal = calculateDailyCalorieGoal(tdee, profile.goal);
  const macros = calculateMacros(dailyCalorieGoal, profile.goal, profile.weightKg);
  const waterLiters = calculateWater(profile.weightKg, profile.activityLevel);
  const weeklyWeightChangeKg = Math.round(((dailyCalorieGoal - tdee) * 7) / 7700 * 100) / 100;

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    dailyCalorieGoal,
    ...macros,
    waterLiters,
    weeklyWeightChangeKg,
  };
}

// Calorie equivalence examples
export function getCalorieEquivalences(calories: number): string[] {
  const examples: { cal: number; text: string }[] = [
    { cal: 78,  text: '1 large egg' },
    { cal: 234, text: '3 large eggs' },
    { cal: 160, text: '1 medium avocado' },
    { cal: 105, text: '1 medium banana' },
    { cal: 85,  text: '1 cup cooked oats' },
    { cal: 206, text: '1 cup cooked brown rice' },
    { cal: 120, text: '100g grilled chicken breast' },
    { cal: 240, text: '200g Greek yogurt' },
    { cal: 350, text: '1 slice whole wheat pizza' },
    { cal: 500, text: '1 standard cheeseburger' },
    { cal: 670, text: '1 large chicken shawarma wrap' },
    { cal: 400, text: '2 medium chapati with dal' },
    { cal: 280, text: '1 bowl biryani (small)' },
  ];

  return examples
    .filter(e => Math.abs(e.cal - calories) < calories * 0.5)
    .sort((a, b) => Math.abs(a.cal - calories) - Math.abs(b.cal - calories))
    .slice(0, 4)
    .map(e => `≈ ${e.cal} kcal = ${e.text}`);
}

// Exercise calorie burn context
export function getExerciseEquivalences(deficit: number): string[] {
  if (Math.abs(deficit) < 50) return ['≈ 10 min brisk walk'];
  const abs = Math.abs(deficit);
  const results: string[] = [];
  if (abs > 0) results.push(`≈ ${Math.round(abs / 6)} min of brisk walking`);
  if (abs > 0) results.push(`≈ ${Math.round(abs / 9)} min of running`);
  if (abs > 200) results.push(`≈ ${Math.round(abs / 8)} min of cycling`);
  return results.slice(0, 2);
}
