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
      { name: 'Rasgulla', portion: '2 pieces', calories: 180, proteinG: 6, tip: 'Lighter than most mithai — good pick' },
      { name: 'Gulab jamun', portion: '2 pieces', calories: 220, proteinG: 4 },
      { name: 'Soan papdi', portion: '2 pieces', calories: 180, proteinG: 2 },
      { name: 'Mysore pak', portion: '2 pieces', calories: 240, proteinG: 3 },
      { name: 'Roasted namkeen', portion: '1 handful', calories: 180, proteinG: 5 },
      { name: 'Baked mathri', portion: '4 pieces', calories: 160, proteinG: 4, tip: 'Baked, not fried — smarter crunch' },
      { name: 'Dry fruit mix', portion: '1 small handful', calories: 200, proteinG: 6 },
    ],
  },
  {
    id: 'holi',
    name: 'Holi',
    type: 'feast',
    defaultDate: '2026-03-04',
    blurb: 'Festival of colours — gujiya, thandai, and a whole day of grazing.',
    tips: [
      'Thandai is basically dessert in a glass — count it as your sweet, not a drink.',
      'Gujiya: one is a treat, three is a meal. Decide before the plate arrives.',
      'The day is long and grazey — keep breakfast and dinner light to make room.',
    ],
    foods: [
      { name: 'Gujiya', portion: '1 piece', calories: 250, proteinG: 4, tip: 'The Holi classic — enjoy one properly' },
      { name: 'Thandai', portion: '1 glass', calories: 230, proteinG: 8, tip: 'Counts as dessert, not hydration' },
      { name: 'Dahi bhalla', portion: '1 plate', calories: 280, proteinG: 10, tip: 'Protein from dahi — decent pick' },
      { name: 'Pani puri', portion: '6 pieces', calories: 200, proteinG: 4 },
      { name: 'Malpua', portion: '1 piece', calories: 220, proteinG: 3 },
      { name: 'Namak pare', portion: '1 handful', calories: 190, proteinG: 4 },
      { name: 'Chole tikki', portion: '1 plate', calories: 320, proteinG: 12 },
      { name: 'Kesar phirni', portion: '1 katori', calories: 240, proteinG: 7 },
    ],
  },
  {
    id: 'dussehra',
    name: 'Dussehra / Vijayadashami',
    type: 'feast',
    defaultDate: '2026-10-20',
    blurb: 'Victory of good over evil — festive thalis and Ram-leela night snacks.',
    tips: [
      'Festive thalis are built for sharing — take a little of everything, not full servings.',
      'Jalebi-fafda mornings are a tradition in the west — pair with buttermilk for protein.',
      'If you fasted through Navratri, ease back in — don’t go from vrat to feast in one meal.',
    ],
    foods: [
      { name: 'Jalebi-fafda', portion: '2 jalebi + 4 fafda', calories: 420, proteinG: 6, tip: 'Classic combo — split it with someone' },
      { name: 'Puri-sabzi thali', portion: '1 thali', calories: 550, proteinG: 14 },
      { name: 'Mysore pak', portion: '2 pieces', calories: 240, proteinG: 3 },
      { name: 'Shrikhand', portion: '1 katori', calories: 250, proteinG: 8, tip: 'Protein from hung curd' },
      { name: 'Dal-bafla', portion: '2 bafla + dal', calories: 480, proteinG: 16 },
      { name: 'Mohanthal', portion: '2 pieces', calories: 230, proteinG: 5 },
    ],
  },
  {
    id: 'durga-puja',
    name: 'Durga Puja',
    type: 'feast',
    defaultDate: '2026-10-20',
    blurb: 'Pandal-hopping days — khichuri bhog, rolls, and mishti at every corner.',
    tips: [
      'Bhog khichuri is soul food — one proper serving, then walk to the next pandal.',
      'Kathi rolls are the pandal-hopper’s fuel: pick chicken or paneer for protein.',
      'Mishti doi over rasgulla when you want sweet — the curd adds protein.',
    ],
    foods: [
      { name: 'Khichuri bhog', portion: '1 plate', calories: 450, proteinG: 14, tip: 'Complete meal — no need for extras' },
      { name: 'Chicken kathi roll', portion: '1 roll', calories: 380, proteinG: 24 },
      { name: 'Paneer kathi roll', portion: '1 roll', calories: 360, proteinG: 16 },
      { name: 'Mishti doi', portion: '1 cup', calories: 200, proteinG: 7 },
      { name: 'Rasgulla', portion: '2 pieces', calories: 180, proteinG: 6 },
      { name: 'Fish fry (Bengali)', portion: '2 pieces', calories: 280, proteinG: 22, tip: 'High protein — great pick' },
      { name: 'Luchi-alur dom', portion: '4 luchi + sabzi', calories: 480, proteinG: 10 },
      { name: 'Sandesh', portion: '2 pieces', calories: 160, proteinG: 8, tip: 'Lighter mishti option' },
    ],
  },
  {
    id: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    type: 'feast',
    defaultDate: '2026-09-14',
    blurb: 'Ganpati Bappa Morya — modaks first, everything else after.',
    tips: [
      'Ukadiche modak (steamed) over fried — same joy, far less oil.',
      'Prasad is meant to be shared — take your piece, pass the plate on.',
      'The 10 days graze constantly — anchor each day with one solid protein meal.',
    ],
    foods: [
      { name: 'Ukadiche modak', portion: '2 pieces', calories: 200, proteinG: 3, tip: 'Steamed — the smarter modak' },
      { name: 'Fried modak', portion: '2 pieces', calories: 320, proteinG: 4 },
      { name: 'Puran poli', portion: '1 poli + ghee', calories: 350, proteinG: 8 },
      { name: 'Karanji', portion: '1 piece', calories: 220, proteinG: 4 },
      { name: 'Coconut ladoo', portion: '2 pieces', calories: 210, proteinG: 3 },
      { name: 'Sabudana vada', portion: '2 pieces', calories: 260, proteinG: 3 },
    ],
  },
  {
    id: 'janmashtami',
    name: 'Janmashtami',
    type: 'fast',
    defaultDate: '2026-09-04',
    blurb: 'Krishna’s birthday — many fast till midnight, then feast.',
    tips: [
      'Fasting till midnight is long — milk, fruits, and makhana through the day.',
      'Break the fast gently: start with milk or fruit, not the fried snacks.',
      'Dhaniya panjiri is prasad — a small katori, not a bowl.',
    ],
    foods: [
      { name: 'Dhaniya panjiri', portion: '1 small katori', calories: 250, proteinG: 5, tip: 'Prasad portion, not a meal' },
      { name: 'Makhana kheer', portion: '1 katori', calories: 220, proteinG: 8 },
      { name: 'Singhare ke pakode', portion: '4 pieces', calories: 240, proteinG: 4 },
      { name: 'Fruit chaat', portion: '1 katori', calories: 150, proteinG: 2 },
      { name: 'Milk + almonds', portion: '1 glass + 8 almonds', calories: 250, proteinG: 12, tip: 'Fasting-day protein anchor' },
      { name: 'Kuttu cheela', portion: '2 cheela', calories: 280, proteinG: 10 },
    ],
  },
  {
    id: 'karva-chauth',
    name: 'Karva Chauth',
    type: 'fast',
    defaultDate: '2026-10-28',
    blurb: 'A day-long fast — sargi before sunrise decides how the day feels.',
    tips: [
      'Sargi is everything: protein + slow carbs + lots of water before sunrise.',
      'Most Karva Chauth misery is dehydration — 3-4 glasses of water at sargi.',
      'Break the fast with something light first; the feast can wait 30 minutes.',
    ],
    foods: [
      { name: 'Sargi thali', portion: '1 thali', calories: 550, proteinG: 20, tip: 'Eat this well — it fuels the whole fast' },
      { name: 'Coconut water', portion: '1 glass', calories: 60, proteinG: 1, tip: 'After moonrise, rehydrate first' },
      { name: 'Paneer curry + roti', portion: '1 katori + 2 roti', calories: 450, proteinG: 22 },
      { name: 'Dry fruits', portion: '1 handful', calories: 200, proteinG: 6 },
      { name: 'Milk with kesar', portion: '1 glass', calories: 180, proteinG: 8 },
    ],
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    type: 'feast',
    defaultDate: '2026-08-28',
    blurb: 'Siblings, sweets, and a big family lunch.',
    tips: [
      'The mithai box will sit there all week — take your share today, gift the rest away.',
      'Big family lunch? Protein first, then the festive carbs.',
      'Homemade beats halwai for once — you control the ghee and sugar.',
    ],
    foods: [
      { name: 'Kaju katli', portion: '2 pieces', calories: 160, proteinG: 3 },
      { name: 'Rasmalai', portion: '2 pieces', calories: 260, proteinG: 10, tip: 'Protein from chenna — decent pick' },
      { name: 'Chole-bhature (home)', portion: '1 plate', calories: 520, proteinG: 16 },
      { name: 'Ghevar', portion: '1 piece', calories: 280, proteinG: 3 },
      { name: 'Dry fruit ladoo', portion: '2 pieces', calories: 220, proteinG: 7, tip: 'No refined sugar version' },
    ],
  },
  {
    id: 'onam',
    name: 'Onam',
    type: 'feast',
    defaultDate: '2026-08-26',
    blurb: 'Onam Sadhya — the legendary banana-leaf feast with 20+ dishes.',
    tips: [
      'Sadhya is a marathon, not a sprint — tiny servings of everything, seconds only of favourites.',
      'The meal is already balanced (veggies, dal, rice, curd) — trust the tradition.',
      'Skip the second rice serving; the payasams are coming.',
    ],
    foods: [
      { name: 'Onam sadhya (full)', portion: '1 leaf', calories: 900, proteinG: 24, tip: 'The whole experience — one leaf is the meal' },
      { name: 'Avial', portion: '1 katori', calories: 180, proteinG: 5 },
      { name: 'Sambar + rice', portion: '1 katori + 1 cup rice', calories: 380, proteinG: 12 },
      { name: 'Palada payasam', portion: '1 katori', calories: 280, proteinG: 8 },
      { name: 'Ada pradhaman', portion: '1 katori', calories: 320, proteinG: 5 },
      { name: 'Banana chips', portion: '1 handful', calories: 200, proteinG: 2 },
      { name: 'Inji curry', portion: '2 tbsp', calories: 60, proteinG: 1, tip: 'Tiny portion, big flavour' },
    ],
  },
  {
    id: 'pongal',
    name: 'Pongal / Makar Sankranti',
    type: 'feast',
    defaultDate: '2026-01-14',
    blurb: 'Harvest thanksgiving — pongal pots, til-gud, and winter sweets.',
    tips: [
      'Ven pongal with extra dal is already high-protein — ask for it that way.',
      'Til-gud ladoos are small but dense — two is plenty.',
      'Winter harvest food is hearty — keep the other meals light that day.',
    ],
    foods: [
      { name: 'Ven pongal', portion: '1 katori', calories: 350, proteinG: 12, tip: 'Extra dal = extra protein' },
      { name: 'Sakkarai pongal', portion: '1 katori', calories: 380, proteinG: 8 },
      { name: 'Til-gud ladoo', portion: '2 pieces', calories: 180, proteinG: 4 },
      { name: 'Gajak', portion: '2 pieces', calories: 200, proteinG: 5 },
      { name: 'Undhiyu', portion: '1 katori', calories: 300, proteinG: 9 },
      { name: 'Jaggery peanuts', portion: '1 handful', calories: 220, proteinG: 8 },
    ],
  },
  {
    id: 'lohri',
    name: 'Lohri',
    type: 'feast',
    defaultDate: '2026-01-13',
    blurb: 'Bonfire night — rewari, peanuts, and popcorn around the flames.',
    tips: [
      'Bonfire snacks are endless grazing — portion a plate instead of eating from the pile.',
      'Peanuts and rewari are calorie-dense — a handful each, then step back.',
      'Sarson da saag season is peak — make it your main meal.',
    ],
    foods: [
      { name: 'Rewari', portion: '4 pieces', calories: 220, proteinG: 5 },
      { name: 'Roasted peanuts', portion: '1 handful', calories: 200, proteinG: 8 },
      { name: 'Popcorn', portion: '2 cups', calories: 120, proteinG: 4, tip: 'Lightest bonfire snack' },
      { name: 'Sarson da saag + makki roti', portion: '1 katori + 2 rotis', calories: 420, proteinG: 14 },
      { name: 'Gajak', portion: '2 pieces', calories: 200, proteinG: 5 },
      { name: 'Til ladoo', portion: '2 pieces', calories: 190, proteinG: 5 },
    ],
  },
  {
    id: 'maha-shivratri',
    name: 'Maha Shivratri',
    type: 'fast',
    defaultDate: '2026-02-15',
    blurb: 'A night of fasting and vigil — light vrat food through the day.',
    tips: [
      'Many fast without grains all day — fruits, milk, and makhana carry you.',
      'If you stay up all night, keep sipping water — the vigil dehydrates.',
      'Next morning: normal breakfast, not a feast — your stomach shrank.',
    ],
    foods: [
      { name: 'Sabudana khichdi', portion: '1 katori', calories: 350, proteinG: 4, tip: 'Add peanuts for protein' },
      { name: 'Roasted makhana', portion: '1 cup', calories: 180, proteinG: 5 },
      { name: 'Fruit chaat', portion: '1 katori', calories: 150, proteinG: 2 },
      { name: 'Milk + banana', portion: '1 glass + 1 banana', calories: 280, proteinG: 10 },
      { name: 'Kuttu puri + aloo', portion: '2 puris + sabzi', calories: 420, proteinG: 8 },
    ],
  },
  {
    id: 'chhath',
    name: 'Chhath Puja',
    type: 'fast',
    defaultDate: '2026-10-27',
    blurb: 'Four days of devotion to the Sun — strict fasting, then prasad.',
    tips: [
      'The nirjala fast is strict — follow your family’s rules first, always.',
      'Kharna night: the kheer-roti prasad is the meal — eat it mindfully.',
      'Thekua is prasad — one or two pieces, shared with family.',
    ],
    foods: [
      { name: 'Kharna kheer-roti', portion: '1 katori + 2 roti', calories: 450, proteinG: 10 },
      { name: 'Thekua', portion: '2 pieces', calories: 240, proteinG: 4, tip: 'Prasad — share the rest' },
      { name: 'Coconut water', portion: '1 glass', calories: 60, proteinG: 1, tip: 'Rehydrate after the fast' },
      { name: 'Fruits (prasad)', portion: '1 plate', calories: 180, proteinG: 2 },
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
      { name: 'Chicken biryani', portion: '1 plate', calories: 520, proteinG: 30 },
      { name: 'Seekh kebab', portion: '4 pieces', calories: 240, proteinG: 24 },
      { name: 'Shami kebab', portion: '4 pieces', calories: 200, proteinG: 18 },
      { name: 'Dates', portion: '3 pieces', calories: 200, proteinG: 2 },
      { name: 'Kimami sewaiyan', portion: '1 katori', calories: 300, proteinG: 7 },
      { name: 'Mutton korma', portion: '1 katori', calories: 400, proteinG: 26 },
      { name: 'Bakarkhani roti', portion: '2 pieces', calories: 260, proteinG: 6 },
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
      { name: 'Kaleji fry', portion: '1 katori', calories: 280, proteinG: 28, tip: 'Liver — iron-rich, very high protein' },
      { name: 'Mutton yakhni soup', portion: '1 bowl', calories: 200, proteinG: 22, tip: 'Light but protein-packed' },
      { name: 'Chapli kebab', portion: '2 pieces', calories: 300, proteinG: 20 },
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
      { name: 'Paneer tikka (vrat)', portion: '6 pieces', calories: 280, proteinG: 20, tip: 'Best vrat protein source' },
      { name: 'Samak rice khichdi', portion: '1 katori', calories: 320, proteinG: 6 },
      { name: 'Singhare halwa', portion: '1 katori', calories: 300, proteinG: 4 },
      { name: 'Dahi + roasted peanuts', portion: '1 katori + handful', calories: 300, proteinG: 14 },
      { name: 'Aloo jeera (vrat)', portion: '1 katori', calories: 250, proteinG: 4 },
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
      { name: 'Dahi vada', portion: '2 pieces', calories: 220, proteinG: 8 },
      { name: 'Chicken shorba', portion: '1 bowl', calories: 180, proteinG: 20, tip: 'Light, hydrating, high protein' },
      { name: 'Egg curry + roti (sehri)', portion: '2 eggs + 2 roti', calories: 420, proteinG: 22 },
      { name: 'Rooh afza milk', portion: '1 glass', calories: 200, proteinG: 8, tip: 'Iftar classic — count the sugar' },
      { name: 'Samosa (iftar)', portion: '1 piece', calories: 180, proteinG: 4 },
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
      { name: 'Rajma chawal', portion: '1 plate', calories: 480, proteinG: 18, tip: 'Comfort food with solid protein' },
      { name: 'Amritsari kulcha', portion: '2 kulcha + chole', calories: 550, proteinG: 16 },
      { name: 'Pinni', portion: '2 pieces', calories: 260, proteinG: 6 },
      { name: 'Salted lassi / chaas', portion: '1 glass', calories: 120, proteinG: 8, tip: 'Protein without the sugar' },
    ],
  },
  {
    id: 'gurpurab',
    name: 'Gurpurab',
    type: 'feast',
    defaultDate: '2026-11-24',
    blurb: 'Guru Nanak Jayanti — langar, kadha prasad, and community kitchens.',
    tips: [
      'Langar is simple, wholesome food — dal, roti, sabzi is already a balanced plate.',
      'Kadha prasad is pure ghee and sugar — a small portion is the blessing.',
      'Eat with the sangat, at langar pace — slow communal eating prevents overeating.',
    ],
    foods: [
      { name: 'Langar dal-roti-sabzi', portion: '1 thali', calories: 500, proteinG: 18, tip: 'Wholesome and balanced' },
      { name: 'Kadha prasad', portion: '1 small katori', calories: 300, proteinG: 3, tip: 'Blessing portion, not a bowl' },
      { name: 'Kheer (langar)', portion: '1 katori', calories: 260, proteinG: 8 },
      { name: 'Aloo-puri (langar)', portion: '2 puri + sabzi', calories: 420, proteinG: 8 },
    ],
  },
  {
    id: 'bihu',
    name: 'Bihu',
    type: 'feast',
    defaultDate: '2026-04-15',
    blurb: 'Assamese new year — pitha, laru, and harvest joy.',
    tips: [
      'Pitha come in many forms — steamed (tekeli) over fried (ghila) when you can choose.',
      'Laru are small energy bombs — two or three, not ten.',
      'Bihu feasts are rice-heavy — balance with the fish and meat preparations.',
    ],
    foods: [
      { name: 'Til pitha', portion: '2 pieces', calories: 220, proteinG: 5 },
      { name: 'Narikol laru', portion: '3 pieces', calories: 200, proteinG: 3 },
      { name: 'Ghila pitha', portion: '2 pieces', calories: 280, proteinG: 4 },
      { name: 'Fish tenga', portion: '1 katori', calories: 240, proteinG: 26, tip: 'Light, tangy, high protein' },
      { name: 'Duck curry (hanh)', portion: '1 katori', calories: 380, proteinG: 28 },
    ],
  },
  {
    id: 'gudi-padwa',
    name: 'Gudi Padwa / Ugadi',
    type: 'feast',
    defaultDate: '2026-03-19',
    blurb: 'New year in Maharashtra, Karnataka, Andhra — shrikhand-puri and pachadi.',
    tips: [
      'Shrikhand-puri is the soul of the day — enjoy it as your main festive meal.',
      'Ugadi pachadi tastes all six flavours — a spoonful is symbolic, not a serving.',
      'Mango season begins — fresh mango over mango shrikhand when both are on offer.',
    ],
    foods: [
      { name: 'Shrikhand + puri', portion: '1 katori + 2 puri', calories: 480, proteinG: 12 },
      { name: 'Puran poli', portion: '1 poli', calories: 300, proteinG: 7 },
      { name: 'Ugadi pachadi', portion: '1 small katori', calories: 120, proteinG: 1, tip: 'Taste, don’t fill up' },
      { name: 'Mango shrikhand', portion: '1 katori', calories: 280, proteinG: 8 },
      { name: 'Obbattu', portion: '1 piece', calories: 320, proteinG: 7 },
    ],
  },
  {
    id: 'teej',
    name: 'Teej',
    type: 'fast',
    defaultDate: '2026-08-16',
    blurb: 'Monsoon festival — many fast, then ghevar and swings.',
    tips: [
      'Many observe nirjala fast — if you do, rehydrate slowly after sunset.',
      'Ghevar is the Teej icon — one piece, savoured, beats three rushed.',
      'Sargi-style pre-dawn meal if your family does it — protein and water.',
    ],
    foods: [
      { name: 'Ghevar', portion: '1 piece', calories: 280, proteinG: 3, tip: 'The Teej sweet — one is enough' },
      { name: 'Malpua-rabri', portion: '1 malpua + rabri', calories: 350, proteinG: 8 },
      { name: 'Coconut water', portion: '1 glass', calories: 60, proteinG: 1, tip: 'First thing after the fast' },
      { name: 'Dal-baati', portion: '2 baati + dal', calories: 520, proteinG: 16 },
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
      { name: 'Mince pie', portion: '1 piece', calories: 250, proteinG: 3 },
      { name: 'Christmas pudding', portion: '1 slice', calories: 320, proteinG: 4, tip: 'Small slice — it’s dense' },
      { name: 'Gingerbread cookies', portion: '3 pieces', calories: 210, proteinG: 3 },
      { name: 'Roast potatoes', portion: '1 katori', calories: 280, proteinG: 4 },
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
      { name: 'Paneer tikka', portion: '6 pieces', calories: 280, proteinG: 20 },
      { name: 'Chicken tikka', portion: '6 pieces', calories: 260, proteinG: 28, tip: 'Best party protein' },
      { name: 'Hara bhara kebab', portion: '4 pieces', calories: 200, proteinG: 8 },
      { name: 'Mocktail', portion: '1 glass', calories: 150, proteinG: 0, tip: 'Watch the sugar — soda + lime is lighter' },
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
