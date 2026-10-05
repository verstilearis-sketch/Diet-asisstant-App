// ── Offline estimation fallbacks ────────────────────────────────
// When Groq AND Gemini are both unreachable (or rate-limited past the
// retry budget), these deterministic estimators keep meal and exercise
// logging working. They are approximate by design — the UI labels them
// as offline estimates.

export interface OfflineMeal {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface OfflineExercise {
  name: string;
  caloriesBurned: number;
  durationMin?: number;
}

interface UnitFood {
  keys: string[];
  label: string;
  /** per 100g when true — otherwise per natural unit (piece/katori/glass…) */
  per100g?: boolean;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Realistic home-portion values for common (mostly Indian) foods.
const UNIT_FOODS: UnitFood[] = [
  { keys: ['aloo paratha', 'aloo parantha'], label: 'Aloo paratha', cal: 280, protein: 7, carbs: 40, fat: 10 },
  { keys: ['paratha', 'parathas', 'parantha'], label: 'Paratha', cal: 210, protein: 5, carbs: 30, fat: 8 },
  { keys: ['roti', 'rotis', 'phulka', 'chapati', 'chappati'], label: 'Roti', cal: 110, protein: 4, carbs: 22, fat: 1.5 },
  { keys: ['puri', 'puris', 'poori', 'pooris'], label: 'Puri', cal: 85, protein: 1.5, carbs: 10, fat: 4.5 },
  { keys: ['bhatura', 'bhature'], label: 'Bhatura', cal: 190, protein: 5, carbs: 32, fat: 5 },
  { keys: ['naan'], label: 'Naan', cal: 260, protein: 7, carbs: 45, fat: 5 },
  { keys: ['bread', 'toast'], label: 'Bread slice', cal: 80, protein: 3, carbs: 15, fat: 1 },
  { keys: ['pav'], label: 'Pav', cal: 150, protein: 4, carbs: 28, fat: 2 },
  { keys: ['biryani', 'biriyani'], label: 'Biryani', cal: 550, protein: 20, carbs: 62, fat: 20 },
  { keys: ['pulao', 'pulav'], label: 'Pulao', cal: 400, protein: 10, carbs: 60, fat: 10 },
  { keys: ['rice', 'chawal'], label: 'Cooked rice (1 cup)', cal: 205, protein: 4, carbs: 45, fat: 0.5 },
  { keys: ['fried rice', 'schezwan rice', 'veg fried rice', 'egg fried rice', 'chicken fried rice'], label: 'Fried rice (1 cup)', cal: 350, protein: 8, carbs: 55, fat: 12 },
  { keys: ['khichdi'], label: 'Khichdi', cal: 220, protein: 9, carbs: 36, fat: 5 },
  { keys: ['poha'], label: 'Poha', cal: 180, protein: 4, carbs: 32, fat: 4 },
  { keys: ['upma'], label: 'Upma', cal: 200, protein: 5, carbs: 34, fat: 5 },
  { keys: ['oats', 'oatmeal', 'dalia'], label: 'Oats bowl', cal: 170, protein: 6, carbs: 28, fat: 3 },
  { keys: ['dal makhani'], label: 'Dal makhani', cal: 280, protein: 12, carbs: 24, fat: 14 },
  { keys: ['dal', 'daal'], label: 'Dal (1 katori)', cal: 160, protein: 10, carbs: 24, fat: 3 },
  { keys: ['rajma'], label: 'Rajma', cal: 210, protein: 11, carbs: 32, fat: 4 },
  { keys: ['chole', 'chana', 'chickpea'], label: 'Chole', cal: 220, protein: 11, carbs: 32, fat: 5 },
  { keys: ['paneer butter masala'], label: 'Paneer butter masala', cal: 320, protein: 14, carbs: 14, fat: 24 },
  { keys: ['palak paneer', 'saag paneer'], label: 'Palak paneer', cal: 260, protein: 14, carbs: 12, fat: 18 },
  { keys: ['paneer'], label: 'Paneer (100g)', per100g: true, cal: 265, protein: 18, carbs: 4, fat: 21 },
  { keys: ['chicken curry'], label: 'Chicken curry', cal: 280, protein: 28, carbs: 8, fat: 14 },
  { keys: ['butter chicken'], label: 'Butter chicken', cal: 380, protein: 30, carbs: 12, fat: 22 },
  { keys: ['chicken', 'murgh'], label: 'Chicken (100g)', per100g: true, cal: 180, protein: 26, carbs: 0, fat: 8 },
  { keys: ['fish curry', 'fish'], label: 'Fish (100g)', per100g: true, cal: 150, protein: 24, carbs: 0, fat: 5 },
  { keys: ['mutton', 'lamb', 'rogan josh', 'rista'], label: 'Mutton (100g)', per100g: true, cal: 220, protein: 24, carbs: 0, fat: 13 },
  { keys: ['egg curry'], label: 'Egg curry', cal: 240, protein: 14, carbs: 8, fat: 16 },
  { keys: ['omelette', 'omelet'], label: 'Omelette', cal: 150, protein: 10, carbs: 2, fat: 11 },
  { keys: ['egg', 'eggs', 'anda'], label: 'Boiled egg', cal: 78, protein: 6, carbs: 0.6, fat: 5 },
  { keys: ['mixed veg', 'sabzi', 'subzi', 'sabji'], label: 'Mixed veg sabzi', cal: 180, protein: 5, carbs: 20, fat: 9 },
  { keys: ['aloo sabzi', 'aloo ki sabzi', 'dum aloo'], label: 'Aloo sabzi', cal: 200, protein: 4, carbs: 30, fat: 8 },
  { keys: ['haak', 'saag'], label: 'Haak / saag', cal: 120, protein: 5, carbs: 12, fat: 7 },
  { keys: ['milk', 'doodh'], label: 'Milk (1 glass)', cal: 150, protein: 8, carbs: 12, fat: 8 },
  { keys: ['dahi', 'curd', 'yogurt', 'yoghurt'], label: 'Curd (1 katori)', cal: 100, protein: 5, carbs: 7, fat: 4 },
  { keys: ['lassi'], label: 'Lassi (1 glass)', cal: 180, protein: 7, carbs: 24, fat: 4 },
  { keys: ['chaas', 'buttermilk'], label: 'Chaas (1 glass)', cal: 60, protein: 3, carbs: 6, fat: 1.5 },
  { keys: ['kahwa', 'kehwa', 'qahwa'], label: 'Kahwa', cal: 15, protein: 0, carbs: 4, fat: 0 },
  { keys: ['noon chai', 'sheer chai'], label: 'Noon chai', cal: 60, protein: 2, carbs: 8, fat: 3 },
  { keys: ['chai', 'tea'], label: 'Chai (1 cup)', cal: 40, protein: 1, carbs: 8, fat: 1 },
  { keys: ['coffee'], label: 'Coffee (1 cup)', cal: 50, protein: 2, carbs: 8, fat: 2 },
  { keys: ['banana'], label: 'Banana', cal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { keys: ['apple'], label: 'Apple', cal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { keys: ['samosa'], label: 'Samosa', cal: 260, protein: 5, carbs: 30, fat: 14 },
  { keys: ['pakora', 'pakoda', 'bhaji'], label: 'Pakoras (4 pc)', cal: 220, protein: 6, carbs: 20, fat: 14 },
  { keys: ['papad', 'papadum'], label: 'Papad', cal: 40, protein: 2, carbs: 7, fat: 0.5 },
  { keys: ['pickle', 'achaar'], label: 'Pickle (1 tbsp)', cal: 30, protein: 0, carbs: 4, fat: 2 },
  { keys: ['ghee'], label: 'Ghee (1 tbsp)', cal: 120, protein: 0, carbs: 0, fat: 14 },
  { keys: ['salad'], label: 'Salad bowl', cal: 60, protein: 2, carbs: 10, fat: 1 },
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const trimNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Estimate a described meal from the local unit-food table. Returns null if nothing matched. */
export function estimateMealOffline(text: string): OfflineMeal | null {
  const lower = text.toLowerCase();
  const used: [number, number][] = [];
  const parts: {
    label: string; qty: number; cal: number; protein: number; carbs: number; fat: number;
    per100g: boolean; explicitGrams: boolean;
  }[] = [];

  const sorted = [...UNIT_FOODS].sort(
    (a, b) => Math.max(...b.keys.map((k) => k.length)) - Math.max(...a.keys.map((k) => k.length)),
  );

  for (const food of sorted) {
    const keyPattern = food.keys.map(escapeRegExp).join('|');
    // Optional grams for per-100g foods ("150g chicken")
    if (food.per100g) {
      const gre = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*g(?:rams?)?\\s*(${keyPattern})\\b`, 'gi');
      let gm: RegExpExecArray | null;
      while ((gm = gre.exec(lower)) !== null) {
        const start = gm.index;
        const end = start + gm[0].length;
        if (used.some(([s, e]) => start < e && end > s)) continue;
        used.push([start, end]);
        const qty = parseFloat(gm[1]) / 100;
        parts.push({
          label: food.label, qty,
          cal: food.cal * qty, protein: food.protein * qty, carbs: food.carbs * qty, fat: food.fat * qty,
          per100g: true, explicitGrams: true,
        });
      }
    }
    const re = new RegExp(
      `(\\d+(?:\\.\\d+)?)?\\s*(?:glass(?:es)?|cups?|katoris?|bowls?|plates?|pieces?|pcs?|slices?|tbsp|tablespoons?)?\\s*(${keyPattern})s?\\b`,
      'gi',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (used.some(([s, e]) => start < e && end > s)) continue;
      // Skip the bare-keyword hit when a grams hit already claimed nearby text is handled above;
      // also skip matches that are part of a longer food name already claimed.
      used.push([start, end]);
      const qty = m[1] ? parseFloat(m[1]) : 1;
      parts.push({
        label: food.label, qty,
        cal: food.cal * qty, protein: food.protein * qty, carbs: food.carbs * qty, fat: food.fat * qty,
        per100g: !!food.per100g, explicitGrams: false,
      });
    }
  }

  // A bare ingredient ("chicken") is part of the dish when a dish already
  // matched ("chicken biryani") — keep it only with an explicit gram amount.
  const hasDish = parts.some((p) => !p.per100g);
  const kept = hasDish ? parts.filter((p) => !p.per100g || p.explicitGrams) : parts;
  if (!kept.length) return null;

  const name = kept.map((p) => (p.qty !== 1 ? `${trimNum(p.qty)}× ${p.label}` : p.label)).join(', ');
  const sum = (f: (p: (typeof kept)[number]) => number) => kept.reduce((a, p) => a + f(p), 0);
  return {
    name: name.slice(0, 80),
    calories: Math.round(sum((p) => p.cal)),
    proteinG: Math.round(sum((p) => p.protein) * 10) / 10,
    carbsG: Math.round(sum((p) => p.carbs) * 10) / 10,
    fatG: Math.round(sum((p) => p.fat) * 10) / 10,
  };
}

// ── Exercise: MET-based burn ──────────────────────────────────────

interface Activity {
  keys: string[];
  name: string;
  met: number;
}

const ACTIVITIES: Activity[] = [
  { keys: ['brisk walk', 'power walk', 'fast walk'], name: 'Brisk walking', met: 4.3 },
  { keys: ['walk'], name: 'Walking', met: 3.5 },
  { keys: ['run', 'running', 'jog', 'jogging'], name: 'Running', met: 9 },
  { keys: ['cricket'], name: 'Cricket', met: 5 },
  { keys: ['football', 'soccer'], name: 'Football', met: 8 },
  { keys: ['cycling', 'cycle', 'cycled', 'bike', 'biking'], name: 'Cycling', met: 7 },
  { keys: ['swim', 'swimming'], name: 'Swimming', met: 7 },
  { keys: ['yoga'], name: 'Yoga', met: 3 },
  { keys: ['skipping', 'skip', 'jump rope', 'skipped'], name: 'Skipping', met: 11 },
  { keys: ['badminton'], name: 'Badminton', met: 5.5 },
  { keys: ['tennis'], name: 'Tennis', met: 7 },
  { keys: ['stairs', 'stair', 'climbing'], name: 'Stair climbing', met: 8 },
  { keys: ['dance', 'dancing'], name: 'Dancing', met: 5 },
  { keys: ['gym', 'weights', 'weightlifting', 'lifting', 'workout'], name: 'Gym workout', met: 5 },
  { keys: ['pushup', 'push-up', 'pullup', 'pull-up', 'squat', 'squats'], name: 'Bodyweight training', met: 6 },
  { keys: ['plank', 'core'], name: 'Core training', met: 4 },
  { keys: ['housework', 'cleaning', 'mopping', 'chores', 'sweeping'], name: 'Household chores', met: 3.3 },
  { keys: ['gardening'], name: 'Gardening', met: 4 },
];

/** Estimate workout burn from MET values. Returns null if no known activity matched. */
export function estimateExerciseOffline(text: string, weightKg: number): OfflineExercise | null {
  const lower = text.toLowerCase();

  let minutes = 30;
  let hasDuration = false;
  const dm = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|minutes?|mins?|m\b)/);
  if (dm) {
    const v = parseFloat(dm[1]);
    minutes = dm[2].startsWith('h') ? v * 60 : v;
    hasDuration = true;
  }
  minutes = Math.min(300, Math.max(1, minutes));

  const sorted = [...ACTIVITIES].sort(
    (a, b) => Math.max(...b.keys.map((k) => k.length)) - Math.max(...a.keys.map((k) => k.length)),
  );
  const found = sorted.find((a) =>
    a.keys.some((k) => new RegExp(`\\b${escapeRegExp(k)}s?\\b`).test(lower)),
  );
  if (!found) return null;

  const kg = weightKg > 0 ? weightKg : 70;
  const caloriesBurned = Math.round(found.met * kg * (minutes / 60));
  return {
    name: found.name,
    caloriesBurned: Math.min(2000, caloriesBurned),
    ...(hasDuration ? { durationMin: Math.round(minutes) } : {}),
  };
}
