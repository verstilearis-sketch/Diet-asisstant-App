// ── Festival mode ───────────────────────────────────────────────
// Occasions the plan should adapt to instead of pretending they aren't
// happening: feasts (enjoy, fitted into the day) and fasts (timing shifts).
// Dates are best-guess defaults — the user picks the actual date.

export interface FestivalFood {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  tip?: string;
}

export interface Festival {
  id: string;
  name: string;
  type: 'feast' | 'fast';
  defaultDate: string; // YYYY-MM-DD
  blurb: string;
  tips: string[];
  foods: FestivalFood[];
}

export const FESTIVALS: Festival[] = [
  {
    id: 'diwali',
    name: 'Diwali',
    type: 'feast',
    defaultDate: '2026-11-08',
    blurb: 'Festival of lights — mithai everywhere. Enjoy it, fitted into your day.',
    tips: [
      'Eat protein first at every festive meal — it blunts the sugar spike from mithai.',
      'Two-piece rule: pick your two favourite sweets and truly enjoy them, skip the rest.',
      'A 20-minute walk after the big dinner does more than skipping dessert entirely.',
    ],
    foods: [
      { name: 'Kaju katli', portion: '2 pieces', calories: 160, proteinG: 3, tip: 'Fits as your afternoon snack' },
      { name: 'Motichoor ladoo', portion: '1 piece', calories: 150, proteinG: 2 },
      { name: 'Jalebi', portion: '2 pieces', calories: 200, proteinG: 1, tip: 'Have it right after a protein-rich meal, not on an empty stomach' },
      { name: 'Roasted namkeen', portion: '1 handful', calories: 180, proteinG: 5 },
    ],
  },
  {
    id: 'eid-fitr',
    name: 'Eid al-Fitr',
    type: 'feast',
    defaultDate: '2026-03-20',
    blurb: 'Eid Mubarak — the feast after the fast. Celebrate without undoing a month of discipline.',
    tips: [
      'Break the day gently: dates and sheer khurma first, heavy biryani a couple of hours later.',
      'Load your plate with kebabs (protein) before reaching for the rice.',
      'One full festive meal, not three — keep the other two light and normal.',
    ],
    foods: [
      { name: 'Sheer khurma', portion: '1 katori', calories: 280, proteinG: 8 },
      { name: 'Mutton biryani', portion: '1 plate', calories: 550, proteinG: 28, tip: 'Make this your one big meal of the day' },
      { name: 'Seekh kebab', portion: '4 pieces', calories: 240, proteinG: 24 },
      { name: 'Dates', portion: '3 pieces', calories: 200, proteinG: 2 },
    ],
  },
  {
    id: 'eid-adha',
    name: 'Eid al-Adha',
    type: 'feast',
    defaultDate: '2026-05-27',
    blurb: 'The festival of sacrifice — qurbani meat at the center of the table.',
    tips: [
      'Lean cuts and kebabs over fried preparations — same celebration, half the calories.',
      'Balance the heavy lunches with light, soupy dinners.',
      'Share the portions; the barakah is in the sharing anyway.',
    ],
    foods: [
      { name: 'Mutton rogan josh', portion: '1 katori', calories: 380, proteinG: 30 },
      { name: 'Seekh kebab', portion: '4 pieces', calories: 240, proteinG: 24 },
      { name: 'Yakhni pulao', portion: '1 plate', calories: 480, proteinG: 26 },
      { name: 'Sheer khurma', portion: '1 katori', calories: 280, proteinG: 8 },
    ],
  },
  {
    id: 'navratri',
    name: 'Navratri',
    type: 'fast',
    defaultDate: '2026-10-10',
    blurb: 'Nine nights of fasting — vrat-friendly eating that still hits your targets.',
    tips: [
      'Fasting rules vary by family — follow yours first, this plan adapts around it.',
      'Vrat food runs carb-heavy (sabudana, potatoes): anchor each meal with paneer, peanuts, or makhana for protein.',
      'Hydrate aggressively between meals — most "fasting fatigue" is dehydration.',
    ],
    foods: [
      { name: 'Sabudana khichdi', portion: '1 katori', calories: 350, proteinG: 4, tip: 'Add peanuts for protein' },
      { name: 'Kuttu puri + aloo sabzi', portion: '2 puris + 1 katori', calories: 420, proteinG: 8 },
      { name: 'Roasted makhana', portion: '1 cup', calories: 180, proteinG: 5 },
      { name: 'Fruit chaat', portion: '1 katori', calories: 150, proteinG: 2 },
    ],
  },
  {
    id: 'ramadan',
    name: 'Ramadan',
    type: 'fast',
    defaultDate: '2026-02-18',
    blurb: 'Sehri to iftari — your plan reshapes around the fast, not against it.',
    tips: [
      'Sehri: slow carbs + protein (oats, eggs) and 2–3 glasses of water — it decides your whole day.',
      'Iftar: break with dates and water, pray, then eat — the pause prevents overeating.',
      'Keep one full meal at night; skip the second heavy dinner most days.',
    ],
    foods: [
      { name: 'Dates', portion: '3 pieces', calories: 200, proteinG: 2, tip: 'Traditional iftar opener' },
      { name: 'Haleem', portion: '1 katori', calories: 350, proteinG: 20 },
      { name: 'Fruit chaat', portion: '1 katori', calories: 150, proteinG: 2 },
      { name: 'Oats sehri bowl', portion: '1 bowl', calories: 300, proteinG: 12, tip: 'Slow-release energy for the fast' },
    ],
  },
  {
    id: 'baisakhi',
    name: 'Baisakhi',
    type: 'feast',
    defaultDate: '2026-04-14',
    blurb: 'Harvest festival — hearty Punjabi classics, fitted to your goals.',
    tips: [
      'Sarson da saag with makki roti is already a solid meal — just watch the white butter.',
      'One lassi, not three. It is basically dessert.',
      'Dance it off — bhangra burns a serious 400+ kcal an hour.',
    ],
    foods: [
      { name: 'Sarson da saag + makki roti', portion: '1 katori + 2 rotis', calories: 420, proteinG: 14 },
      { name: 'Sweet lassi', portion: '1 glass', calories: 220, proteinG: 8, tip: 'Counts as dessert, not a drink' },
      { name: 'Chole bhature (small)', portion: '1 plate', calories: 520, proteinG: 16 },
    ],
  },
  {
    id: 'christmas',
    name: 'Christmas',
    type: 'feast',
    defaultDate: '2026-12-25',
    blurb: 'Cake, roasts, and family tables — enjoy the day, protect the week.',
    tips: [
      'One indulgent day does not ruin a month — two indulgent weeks can. Keep it to the day.',
      'Protein first at the big lunch: roast meats before the cake.',
      'Box up leftovers for others; a fridge full of cake is a week-long temptation.',
    ],
    foods: [
      { name: 'Plum cake', portion: '1 slice', calories: 280, proteinG: 4 },
      { name: 'Roast chicken', portion: '2 pieces', calories: 350, proteinG: 35 },
      { name: 'Hot chocolate', portion: '1 cup', calories: 200, proteinG: 6 },
    ],
  },
  {
    id: 'new-year',
    name: 'New Year',
    type: 'feast',
    defaultDate: '2026-12-31',
    blurb: 'Party night — a plan for the evening that does not wreck January.',
    tips: [
      'Eat a proper protein-rich dinner before the party — arriving hungry is the real danger.',
      'Alternate every drink with water; most party calories are liquid.',
      'Start January 1st with your normal breakfast, not a "detox".',
    ],
    foods: [
      { name: 'Party snacks platter', portion: '1 small plate', calories: 400, proteinG: 15, tip: 'Pick the grilled options' },
      { name: 'Biryani (party serving)', portion: '1 plate', calories: 550, proteinG: 25 },
    ],
  },
];

export interface FestivalMode {
  festivalId: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'feast' | 'fast';
}

export function getFestival(id: string): Festival | undefined {
  return FESTIVALS.find((f) => f.id === id);
}
