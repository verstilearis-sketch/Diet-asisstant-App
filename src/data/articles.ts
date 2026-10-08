// ── Blog articles ───────────────────────────────────────────────

export interface ArticleBlock {
  type: 'p' | 'h2' | 'h3' | 'ul' | 'formula' | 'callout';
  text?: string;
  items?: string[];
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  keywords: string[];
  blocks: ArticleBlock[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'mifflin-st-jeor-equation-explained',
    title: 'The Mifflin-St Jeor Equation, Explained in Plain English',
    description:
      'What the Mifflin-St Jeor equation is, how to calculate your BMR with it, and why it beats every other formula for accuracy.',
    date: '2026-10-08',
    readMinutes: 6,
    keywords: ['mifflin-st jeor', 'BMR calculator', 'basal metabolic rate'],
    blocks: [
      { type: 'p', text: 'Every diet plan starts with one question: how many calories does your body burn just existing? The answer comes from your Basal Metabolic Rate (BMR) — and the most accurate way to estimate it is the Mifflin-St Jeor equation, published in 1990.' },
      { type: 'h2', text: 'The formula' },
      { type: 'formula', text: 'Men: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5\nWomen: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161' },
      { type: 'h2', text: 'A worked example' },
      { type: 'p', text: 'Take a 30-year-old woman, 165 cm, 65 kg: BMR = (10 × 65) + (6.25 × 165) − (5 × 30) − 161 = 650 + 1031.25 − 150 − 161 = 1,370 kcal/day. That is what her body burns at complete rest — before walking, working, or thinking.' },
      { type: 'h2', text: 'Why Mifflin-St Jeor and not Harris-Benedict?' },
      { type: 'p', text: 'The older Harris-Benedict equation (1919) was derived from a small, homogenous sample. Multiple validation studies since the 1990s have found Mifflin-St Jeor predicts measured resting metabolic rate within about 10% for most adults — closer than Harris-Benedict, Owen, or WHO equations. It is the equation the American Dietetic Association recommends.' },
      { type: 'h2', text: 'BMR is only the start' },
      { type: 'p', text: 'Your BMR is not your calorie target. Multiply it by an activity factor (1.2 for sedentary up to 1.9 for very active) to get your TDEE — total daily energy expenditure. Then adjust for your goal: roughly −500 kcal/day for steady fat loss, +300–400 for lean gain.' },
      { type: 'callout', text: 'Nutriq runs this exact calculation for you — plus TDEE, macros, and a full meal plan — in about two minutes. No spreadsheet required.' },
      { type: 'h2', text: 'Limitations to know' },
      {
        type: 'ul',
        items: [
          'It estimates, not measures. Lab calorimetry is the gold standard; equations get you within ~10%.',
          'Very muscular or very lean individuals may see larger errors — muscle burns more than the formula assumes.',
          'It does not account for medical conditions affecting metabolism (thyroid disorders, for example).',
        ],
      },
    ],
  },
  {
    slug: 'bmi-calculator-what-it-means',
    title: "BMI Calculator: What Your Number Actually Means (and Doesn't)",
    description:
      'How BMI is calculated, what the categories mean, and the important things BMI cannot tell you about your health.',
    date: '2026-10-08',
    readMinutes: 5,
    keywords: ['BMI calculator', 'body mass index', 'BMI categories'],
    blocks: [
      { type: 'p', text: 'Body Mass Index is the most quoted — and most misunderstood — number in nutrition. Here is what it is, how to compute it, and where its limits lie.' },
      { type: 'h2', text: 'The calculation' },
      { type: 'formula', text: 'BMI = weight (kg) ÷ height (m)²' },
      { type: 'p', text: 'Example: 70 kg at 1.70 m → 70 ÷ (1.70 × 1.70) = 70 ÷ 2.89 = 24.2.' },
      { type: 'h2', text: 'The categories (WHO)' },
      {
        type: 'ul',
        items: [
          'Below 18.5 — Underweight',
          '18.5–24.9 — Healthy range',
          '25–29.9 — Overweight',
          '30 and above — Obese',
        ],
      },
      { type: 'h2', text: 'What BMI gets right' },
      { type: 'p', text: 'At a population level, BMI correlates well with health risk. It is cheap, instant, and useful as a screening starting point — which is why clinicians still use it.' },
      { type: 'h2', text: 'What BMI gets wrong' },
      {
        type: 'ul',
        items: [
          'Muscle vs fat: a muscular athlete can score "overweight" while being very lean.',
          'Fat distribution: it says nothing about visceral vs subcutaneous fat, which matters more for risk.',
          'It is a screening tool, not a diagnosis. No single number defines your health.',
        ],
      },
      { type: 'callout', text: 'Nutriq shows your BMI alongside BMR, TDEE, and your calorie target — so one number never tells the whole story alone.' },
    ],
  },
  {
    slug: 'how-many-calories-should-i-eat',
    title: 'How Many Calories Should I Eat? A Practical Guide to TDEE',
    description:
      'Learn to calculate your TDEE, understand activity multipliers, and set a calorie target for weight loss, maintenance, or gain.',
    date: '2026-10-08',
    readMinutes: 7,
    keywords: ['how many calories should I eat', 'TDEE calculator', 'calorie deficit'],
    blocks: [
      { type: 'p', text: '"How many calories should I eat?" is the most important question in nutrition — and the answer is personal. It depends on your body, your activity, and your goal. Here is how to work it out properly.' },
      { type: 'h2', text: 'Step 1: Find your BMR' },
      { type: 'p', text: 'Start with the Mifflin-St Jeor equation (covered in detail in our companion article). This is your at-rest burn.' },
      { type: 'h2', text: 'Step 2: Multiply by your activity level' },
      {
        type: 'ul',
        items: [
          '1.2 — Sedentary (desk job, little exercise)',
          '1.375 — Lightly active (light exercise 1–3 days/week)',
          '1.55 — Moderately active (moderate exercise 3–5 days/week)',
          '1.725 — Very active (hard exercise 6–7 days/week)',
          '1.9 — Extremely active (physical job + hard training)',
        ],
      },
      { type: 'p', text: 'The result is your TDEE — total daily energy expenditure. Eat this much and your weight stays roughly stable.' },
      { type: 'h2', text: 'Step 3: Adjust for your goal' },
      {
        type: 'ul',
        items: [
          'Weight loss: TDEE − 500 kcal/day → about 0.5 kg per week, the rate clinical guidelines consider safe and sustainable.',
          'Maintenance: eat at TDEE.',
          'Weight gain: TDEE + 300–400 kcal/day, paired with resistance training so the gain is muscle, not just fat.',
        ],
      },
      { type: 'h2', text: 'Why aggressive deficits backfire' },
      { type: 'p', text: 'Cutting 1,000+ kcal below TDEE triggers disproportionate hunger, muscle loss, and metabolic adaptation. The research consistently favors moderate deficits you can sustain for months over extreme ones you abandon in two weeks.' },
      { type: 'callout', text: 'Nutriq computes your TDEE from your actual inputs and sets the deficit for you — then builds meals that hit the number.' },
    ],
  },
  {
    slug: '1800-calorie-north-indian-meal-plan',
    title: '1800-Calorie North Indian Meal Plan for Weight Loss (7-Day Sample)',
    description:
      'A full week of North Indian meals at ~1800 kcal/day — roti, dal, sabzi, and real food, with protein at every meal.',
    date: '2026-10-08',
    readMinutes: 8,
    keywords: ['1800 calorie Indian diet plan', 'North Indian meal plan weight loss', 'Indian diet chart'],
    blocks: [
      { type: 'p', text: 'Weight loss does not require giving up the food you grew up with. This 7-day sample keeps you near 1,800 kcal/day using standard North Indian home cooking — with protein anchored at every meal so you lose fat, not muscle.' },
      { type: 'callout', text: 'This is a sample template. Your ideal target depends on your body — Nutriq computes it from your weight, height, age, and activity.' },
      { type: 'h2', text: 'The daily framework (~1,800 kcal)' },
      {
        type: 'ul',
        items: [
          'Breakfast (~400 kcal): 2 besan cheela with paneer stuffing + 1 glass chaas',
          'Mid-morning (~150 kcal): 1 apple + 10 almonds',
          'Lunch (~550 kcal): 2 rotis + 1 katori dal + 1 katori mixed veg sabzi + salad + 1 katori curd',
          'Evening (~150 kcal): 1 cup masala chai (toned milk, less sugar) + roasted makhana',
          'Dinner (~550 kcal): 2 rotis + 150g paneer tikka or 1 katori rajma + salad',
        ],
      },
      { type: 'h2', text: 'Protein: the non-negotiable' },
      { type: 'p', text: 'Aim for roughly 1.6–2.0g of protein per kg of body weight when losing fat. For a 70 kg person, that is 110–140g/day. The framework above lands near 95–110g; add an extra paneer serving, soya chaap, or whey if you fall short.' },
      { type: 'h2', text: '7-day rotation' },
      {
        type: 'ul',
        items: [
          'Mon: Dal tadka + bhindi sabzi',
          'Tue: Rajma + jeera rice (measured 1 katori)',
          'Wed: Chole + 2 rotis',
          'Thu: Paneer bhurji + mixed veg',
          'Fri: Moong dal khichdi + curd',
          'Sat: Soya chaap curry + rotis',
          'Sun: Dal makhani (light — toned milk, less cream) + rotis',
        ],
      },
      { type: 'h2', text: 'Three rules that matter more than the menu' },
      {
        type: 'ul',
        items: [
          'Measure the rice and oil. A "katori" of rice is ~150g cooked (~195 kcal); free-pouring oil adds 120 kcal per tablespoon.',
          'Eat protein first at each meal — it blunts the glucose spike from the carbs that follow.',
          'Keep dinner 2–3 hours before sleep; front-load calories earlier in the day.',
        ],
      },
    ],
  },
  {
    slug: 'kashmiri-diet-weight-loss-guide',
    title: 'Eating Kashmiri Food While Losing Weight: A Practical Guide',
    description:
      'How to keep rogan josh, haakh, and nadru in your life while hitting a calorie deficit — portion strategies for Kashmiri cuisine.',
    date: '2026-10-08',
    readMinutes: 6,
    keywords: ['Kashmiri diet weight loss', 'Kashmiri food calories', 'wazwan healthy'],
    blocks: [
      { type: 'p', text: 'Kashmiri cuisine has an unfair reputation in diet circles — rich, meaty, "too heavy." The truth is more useful: the cuisine has excellent bones for weight loss if you handle portions and cooking methods deliberately.' },
      { type: 'h2', text: 'What works in your favor' },
      {
        type: 'ul',
        items: [
          'Haakh (collard greens): ~35 kcal per 100g cooked. Eat it freely — it is among the most nutrient-dense foods in the cuisine.',
          'Lean proteins: chicken and fish preparations are common; choose them over the fattiest mutton cuts on regular days.',
          'Nadru (lotus stem): high fiber, very filling, modest calories.',
          'Kahwa: effectively zero calories and a genuine appetite suppressant between meals.',
        ],
      },
      { type: 'h2', text: 'What to watch' },
      {
        type: 'ul',
        items: [
          'Rogan josh and wazwan preparations are delicious and calorie-dense — 400–600 kcal per serving is normal. Enjoy them; just count them honestly and balance the rest of the day.',
          'Mustard oil is traditional and fine, but measure it: 1 tablespoon = 120 kcal, and Kashmiri cooking can easily use 3–4 per dish.',
          'White rice portions creep up. A measured 1.5 katori (~225g cooked, ~290 kcal) is plenty alongside a protein-rich curry.',
        ],
      },
      { type: 'h2', text: 'A sample day (~1,900 kcal)' },
      {
        type: 'ul',
        items: [
          'Breakfast: 2 katlam (small) + noon chai (salt tea, modest) — ~350 kcal',
          'Lunch: 1.5 katori rice + haakh (large portion) + 150g chicken curry — ~650 kcal',
          'Snack: kahwa + a handful of walnuts (7–8 halves) — ~200 kcal',
          'Dinner: 2 rotis + nadru yakhni (yogurt-based, lighter) + salad — ~550 kcal',
          'Buffer: ~150 kcal for chai or a small extra',
        ],
      },
      { type: 'callout', text: 'Nutriq includes deep Kashmiri food coverage — wazwan dishes, everyday curries, and Srinagar/Jammu portion norms — so your plan speaks your food.' },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
