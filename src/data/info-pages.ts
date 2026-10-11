/* Shared content for the info pages: /how-it-works, /numbers, /faq */

export interface Formula {
  name: string;
  formula: string;
  note: string;
  science: string;
}

export const FORMULAS: Formula[] = [
  {
    name: 'BMI',
    formula: 'weight(kg) / height(m)²',
    note: 'Body-composition baseline — where you start from',
    science: 'The WHO’s standard screening measure (Quetelet, 1832). A screening tool, not a diagnosis — it doesn’t distinguish muscle from fat.',
  },
  {
    name: 'BMR',
    formula: '10·w + 6.25·h − 5·a + 5 (men) / −161 (women)',
    note: 'Calories your body burns at complete rest',
    science: 'Mifflin–St Jeor equation (Mifflin et al., 1990, Am. J. Clin. Nutr.) — validated as the most accurate BMR predictor, usually within 10% of lab-measured values.',
  },
  {
    name: 'TDEE',
    formula: 'BMR × activity factor (1.2 – 1.9)',
    note: 'Your real daily burn, activity included',
    science: 'Harris–Benedict activity framework (1919, rev. 1984): 1.2 = sedentary … 1.9 = very active. The clinical standard for scaling resting calories to real life.',
  },
  {
    name: 'Target',
    formula: 'TDEE − 500 (lose) · +400 (gain) · TDEE (maintain)',
    note: 'Your daily calorie budget for the goal',
    science: '≈7,700 kcal per kg of body fat (Wishnofsky, 1958) → a 500 kcal daily deficit ≈ 0.5 kg/week — the rate clinical guidelines call safe and sustainable.',
  },
];

export interface Step {
  n: string;
  title: string;
  desc: string;
}

export const STEPS: Step[] = [
  { n: '01', title: 'Create your account', desc: 'Continue with Google to sign in. About a minute.' },
  { n: '02', title: 'Answer the questions', desc: 'Four short steps: your body, your goal, your lifestyle, your food preferences.' },
  { n: '03', title: 'Get your numbers', desc: 'BMI, BMR, TDEE, calorie target and macro split — shown with the working.' },
  { n: '04', title: 'Follow your plan', desc: 'Seven days of meals, hydration and milestones — plus the AI coach when you have questions.' },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'Is this medical advice?',
    a: 'No. Zaiq is an informational tool: it computes calorie and macro targets from standard nutrition equations and suggests meals around them. If you have a medical condition, are pregnant, or have a history of eating disorders, talk to a clinician or registered dietitian first.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'Yes. Click Get started and continue with Google — no passwords, no waiting. Your answers and your plan are saved to your account so you can come back to them — and so the AI coach remembers your numbers.',
  },
  {
    q: 'How do you handle allergies and dietary restrictions?',
    a: 'Step 4 of the questionnaire asks for dietary restrictions (vegetarian, vegan, keto, halal, kosher, gluten-free…) and allergies (nuts, dairy, shellfish…). Meals are built around your exclusions, not on top of them.',
  },
  {
    q: 'Will the food match what I actually eat?',
    a: 'That’s the point of the location question. Tell us your city or region and the plan draws on 50+ regional cuisine profiles — North Indian, Japanese, Mexican, Mediterranean and more — using foods from the markets near you.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your Zaiq cloud account — your profile, plans, logs and chat history are saved to your secure database, so they follow you across devices. The Reset data button on the dashboard deletes your cloud data as well and signs you out.',
  },
];
