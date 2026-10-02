// ── Nutrition & Fitness Calculation Engine ──────────────────────────────────
// Uses Mifflin-St Jeor formula (most accurate for general population)

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_weight' | 'gain_weight' | 'maintain' | 'improve_health' | 'athletic';

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
  dietaryRestrictions?: string[];
  allergies?: string[];
  location?: string;
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
  if (gender === 'male') return Math.round(base + 5);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base - 78); // average for 'other'
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
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

export function calculateMacros(calories: number, goal: Goal): { proteinG: number; carbsG: number; fatG: number } {
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

  return {
    proteinG: Math.round((calories * proteinPct) / 4),
    carbsG:   Math.round((calories * carbsPct)  / 4),
    fatG:     Math.round((calories * fatPct)    / 9),
  };
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
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const dailyCalorieGoal = calculateDailyCalorieGoal(tdee, profile.goal);
  const macros = calculateMacros(dailyCalorieGoal, profile.goal);
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
