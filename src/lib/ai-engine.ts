// ── Smart AI Diet Plan Engine — Enhanced Regional Food Database ──────────────
import type { UserProfile, Calculations, BudgetTier, CuisineMix, Goal } from './calculations';
import type { TasteProfile } from './taste';

export interface Meal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  emoji: string;
  tags: string[];
  /** One-line reason this meal is in the plan — the plan showing its work. */
  why?: string;
}

export interface DayPlan {
  day: string;
  breakfast: Meal;
  morningSnack: Meal;
  lunch: Meal;
  afternoonSnack: Meal;
  dinner: Meal;
  totalCalories: number;
}

export interface DietPlan {
  summary: string;
  weeklyPlan: DayPlan[];
  tips: string[];
  hydrationPlan: string;
  supplementSuggestions: string[];
  shoppingList: string[];
  calorieEquivalences: { amount: number; examples: string[] }[];
  progressMilestones: { week: number; milestone: string }[];
  region: string;
  /** Adaptive calorie target learned from logged intake + weight trend. */
  adaptiveTarget?: {
    calories: number;
    adjustedAt: string; // ISO timestamp
    reason: string; // human-readable explanation shown on Home
  };
  /** Festival/occasion mode: the plan adapts to feasts and fasts. */
  festivalMode?: {
    festivalId: string;
    name: string;
    date: string; // YYYY-MM-DD
    type: 'feast' | 'fast';
  };
  /** Meal swap history — the raw signal for taste learning. Capped at 60. */
  swapHistory?: { from: string; to: string; slot: string; at: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectRegion(location?: string): string {
  const loc = (location || '').toLowerCase();

  // ── Jammu & Kashmir (Wazwan cuisine — distinct from North Indian) ──
  if (/kashmir|srinagar|jammu|ladakh|leh|anantnag|baramulla|kathua|udhampur|rajouri|poonch|doda|kishtwar|kupwara|pulwama|ganderbal/.test(loc)) return 'kashmir';

  // ── South Asia ──
  if (/delhi|punjab|haryana|uttar pradesh|rajasthan|himachal|chandigarh|\bup\b|lucknow|jaipur|amritsar|agra|varanasi|madhya pradesh|chhattisgarh|bhopal|indore/.test(loc)) return 'north-india';
  if (/mumbai|maharashtra|goa|gujarat|pune|nagpur|surat|ahmedabad|nashik/.test(loc)) return 'west-india';
  if (/chennai|tamil|kerala|bangalore|bengaluru|karnataka|andhra|telangana|hyderabad|kochi|coimbatore|mysore|mysuru|pondicherry|puducherry/.test(loc)) return 'south-india';
  if (/kolkata|bengal|odisha|bihar|jharkhand|assam|northeast|guwahati|bhubaneswar|meghalaya|manipur|mizoram|nagaland|tripura|sikkim|patna|ranchi/.test(loc)) return 'east-india';
  if (/india|indian/.test(loc)) return 'north-india'; // default Indian
  if (/pakistan|karachi|lahore|islamabad|rawalpindi|faisalabad|peshawar|quetta|multan/.test(loc)) return 'pakistan';
  if (/bangladesh|dhaka|chittagong|chattogram|khulna|sylhet/.test(loc)) return 'bangladesh';
  if (/nepal|kathmandu|pokhara|bhutan|thimphu|tibet|lhasa/.test(loc)) return 'nepal';
  if (/sri lanka|colombo|kandy|galle|maldives/.test(loc)) return 'sri-lanka';
  if (/afghanistan|kabul|kandahar|herat/.test(loc)) return 'afghanistan';

  // ── Central Asia ──
  if (/kazakhstan|astana|almaty|uzbekistan|tashkent|samarkand|kyrgyzstan|bishkek|tajikistan|dushanbe|turkmenistan|ashgabat|mongolia|ulaanbaatar/.test(loc)) return 'central-asia';

  // ── Middle East ──
  if (/saudi|riyadh|jeddah|mecca|medina|dammam|yemen|sanaa|aden/.test(loc)) return 'gulf';
  if (/uae|emirates|dubai|abu dhabi|sharjah|qatar|doha|kuwait|kuwait city|oman|muscat|bahrain|manama/.test(loc)) return 'gulf';
  if (/\bgulf\b|middle east/.test(loc)) return 'gulf';
  if (/iran|tehran|isfahan|shiraz|persia/.test(loc)) return 'iran';
  if (/turkey|turkiye|istanbul|ankara|izmir|antalya/.test(loc)) return 'turkey';
  if (/egypt|cairo|alexandria|giza|luxor/.test(loc)) return 'egypt';
  if (/lebanon|beirut|jordan|amman|syria|damascus|palestine|gaza|iraq|baghdad|basra|mosul|israel|tel aviv|jerusalem|haifa|levant/.test(loc)) return 'levant';
  if (/morocco|marrakech|casablanca|rabat|fes|algeria|algiers|oran|tunisia|tunis|libya|tripoli|benghazi|mauritania|nouakchott/.test(loc)) return 'maghreb';

  // ── East Asia ──
  if (/japan|tokyo|osaka|kyoto|yokohama|nagoya|sapporo|kobe/.test(loc)) return 'japan';
  if (/korea|seoul|busan|incheon|pyongyang/.test(loc)) return 'korea';
  if (/china|beijing|shanghai|guangzhou|shenzhen|chengdu|hangzhou|hong kong|macau|wuhan|nanjing/.test(loc)) return 'china';
  if (/taiwan|taipei|kaohsiung/.test(loc)) return 'taiwan';

  // ── Southeast Asia ──
  if (/thailand|bangkok|chiang mai|phuket|pattaya/.test(loc)) return 'thailand';
  if (/vietnam|hanoi|ho chi minh|saigon|da nang|hue/.test(loc)) return 'vietnam';
  if (/myanmar|burma|yangon|laos|vientiane|cambodia|phnom penh|siem reap/.test(loc)) return 'mekong';
  if (/indonesia|jakarta|bali|surabaya|timor/.test(loc)) return 'indonesia';
  if (/malaysia|kuala lumpur|penang|singapore|brunei/.test(loc)) return 'malaysia-singapore';
  if (/philippines|manila|cebu|davao/.test(loc)) return 'philippines';

  // ── Europe ──
  if (/italy|italian|rome|milan|naples|florence|venice|turin|vatican|san marino/.test(loc)) return 'italy';
  if (/spain|madrid|barcelona|seville|valencia|andorra/.test(loc)) return 'spain';
  if (/portugal|lisbon|porto/.test(loc)) return 'portugal';
  if (/greece|athens|thessaloniki|cyprus|nicosia|malta|crete/.test(loc)) return 'greece';
  if (/france|paris|lyon|marseille|nice|monaco/.test(loc)) return 'france';
  if (/germany|berlin|munich|hamburg|cologne|liechtenstein/.test(loc)) return 'germany';
  if (/switzerland|zurich|geneva|austria|vienna|salzburg|innsbruck/.test(loc)) return 'alpine';
  if (/netherlands|amsterdam|rotterdam|belgium|brussels|antwerp|luxembourg|dutch/.test(loc)) return 'benelux';
  if (/\buk\b|england|london|britain|scotland|wales|ireland|dublin|manchester|birmingham|edinburgh/.test(loc)) return 'uk-ireland';
  if (/sweden|norway|denmark|finland|iceland|stockholm|oslo|copenhagen|helsinki|reykjavik|scandinavia|nordic/.test(loc)) return 'nordics';
  if (/poland|warsaw|krakow|hungary|budapest|czech|prague|slovakia|romania|bucharest|bulgaria|sofia|ukraine|kyiv|kyiv|estonia|tallinn|latvia|riga|lithuania|vilnius|moldova/.test(loc)) return 'poland-eastern-europe';
  if (/russia|moscow|saint petersburg|belarus|minsk/.test(loc)) return 'russia';
  if (/serbia|belgrade|croatia|zagreb|bosnia|sarajevo|albania|tirana|macedonia|skopje|montenegro|slovenia|kosovo/.test(loc)) return 'balkans';
  // Georgia the country vs Georgia the US state
  if (/georgia/.test(loc)) return /usa|united states|atlanta/.test(loc) ? 'usa' : 'caucasus';
  if (/armenia|yerevan|azerbaijan|baku|caucasus/.test(loc)) return 'caucasus';

  // ── Africa ──
  if (/nigeria|lagos|abuja|\bniger\b|ghana|accra|senegal|dakar|ivory coast|abidjan|mali|bamako|cameroon|togo|benin|burkina|guinea|sierra leone/.test(loc)) return 'nigeria-west-africa';
  if (/\bcongo\b|kinshasa|gabon|libreville|chad|central african/.test(loc)) return 'central-africa';
  if (/kenya|nairobi|tanzania|dar es salaam|uganda|kampala|rwanda|kigali|madagascar|mauritius|seychelles/.test(loc)) return 'swahili-coast';
  if (/ethiopia|addis ababa|somalia|mogadishu|eritrea|sudan|khartoum|djibouti/.test(loc)) return 'ethiopia-east-africa';
  if (/south africa|cape town|johannesburg|durban|zimbabwe|harare|zambia|lusaka|botswana|namibia|mozambique|angola|malawi/.test(loc)) return 'south-africa';

  // ── Americas ──
  if (/mexico|mexico city|guadalajara|monterrey|oaxaca|cancun/.test(loc)) return 'mexico';
  if (/guatemala|honduras|el salvador|nicaragua|costa rica|panama|belize/.test(loc)) return 'central-america';
  if (/cuba|havana|jamaica|kingston|haiti|dominican|santo domingo|puerto rico|trinidad|barbados|bahamas|caribbean/.test(loc)) return 'caribbean';
  if (/peru|lima|cusco|colombia|bogota|medellin|ecuador|quito|bolivia|la paz|venezuela|caracas/.test(loc)) return 'andean';
  if (/brazil|sao paulo|rio|brasilia|salvador|fortaleza/.test(loc)) return 'brazil';
  if (/argentina|buenos aires|chile|santiago|uruguay|montevideo|paraguay|asuncion/.test(loc)) return 'argentina';
  if (/usa|united states|america|new york|los angeles|chicago|texas|california|florida|canada|toronto|vancouver|montreal/.test(loc)) return 'usa';

  // ── Oceania ──
  if (/australia|sydney|melbourne|brisbane|perth|new zealand|auckland|wellington/.test(loc)) return 'australia-nz';
  if (/fiji|suva|papua new guinea|samoa|tonga|vanuatu|solomon|tahiti|guam|pacific/.test(loc)) return 'pacific-islands';

  return 'global';
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOD DATABASE — Organized by region and meal type
// ─────────────────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  name: string;
  emoji: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  description: string;
  tags: string[];
}

type RegionalFoodDB = Record<string, Record<MealType, FoodItem[]>>;

const REGIONAL_DB: RegionalFoodDB = {

  // ── NORTH INDIA ─────────────────────────────────────────────────────────────
  'north-india': {
    breakfast: [
      { name: 'Aloo Paratha & Dahi', emoji: '🫓', cal: 380, protein: 10, carbs: 55, fat: 14, prepTime: '20 min', description: 'Whole wheat flatbread stuffed with spiced potato, served with low-fat curd', tags: ['vegetarian'] },
      { name: 'Moong Dal Chilla', emoji: '🥞', cal: 280, protein: 16, carbs: 35, fat: 6, prepTime: '20 min', description: 'Savory green lentil pancakes with green chutney and onion', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Poha (Flattened Rice)', emoji: '🍚', cal: 310, protein: 8, carbs: 52, fat: 7, prepTime: '15 min', description: 'Light beaten rice with mustard seeds, peanuts, turmeric, and coriander', tags: ['vegetarian', 'vegan'] },
      { name: 'Methi Paratha & Achaar', emoji: '🫓', cal: 340, protein: 9, carbs: 50, fat: 12, prepTime: '20 min', description: 'Fenugreek-loaded whole wheat flatbread with mixed pickle', tags: ['vegetarian'] },
      { name: 'Besan Chilla & Chutney', emoji: '🥞', cal: 260, protein: 14, carbs: 32, fat: 8, prepTime: '15 min', description: 'Chickpea flour pancakes with ginger, green chili, and coriander chutney', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Upma', emoji: '🫙', cal: 290, protein: 7, carbs: 48, fat: 8, prepTime: '15 min', description: 'Savory semolina cooked with vegetables, curry leaves, and mustard seeds', tags: ['vegetarian'] },
      { name: 'Bread Omelette (Brown Bread)', emoji: '🍳', cal: 320, protein: 18, carbs: 28, fat: 14, prepTime: '10 min', description: 'Fluffy egg omelette with onion, tomato, and green chili on whole grain bread', tags: ['high-protein'] },
    ],
    lunch: [
      { name: 'Dal Makhani & Roti', emoji: '🫘', cal: 450, protein: 18, carbs: 62, fat: 14, prepTime: '40 min', description: 'Slow-cooked black lentils with butter and cream, served with whole wheat roti', tags: ['vegetarian'] },
      { name: 'Rajma Chawal', emoji: '🍛', cal: 460, protein: 20, carbs: 72, fat: 8, prepTime: '35 min', description: 'Kidney bean curry in tomato-onion gravy with basmati rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chole Bhature (Small)', emoji: '🍢', cal: 520, protein: 16, carbs: 74, fat: 18, prepTime: '40 min', description: 'Spiced chickpea curry with one puffed fried bread — a Punjab classic', tags: ['vegetarian'] },
      { name: 'Paneer Butter Masala & Roti', emoji: '🧀', cal: 480, protein: 22, carbs: 42, fat: 24, prepTime: '30 min', description: 'Cottage cheese cubes in rich tomato-cashew gravy with whole wheat roti', tags: ['vegetarian', 'high-protein'] },
      { name: 'Sarson Ka Saag & Makki Roti', emoji: '🌿', cal: 420, protein: 14, carbs: 52, fat: 16, prepTime: '45 min', description: 'Punjabi mustard greens with corn flatbread and dollop of white butter', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Butter Chicken & Rice', emoji: '🍗', cal: 510, protein: 36, carbs: 48, fat: 18, prepTime: '40 min', description: 'Tender chicken in velvety tomato-cream sauce with basmati rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Kadhi Pakora & Rice', emoji: '🍲', cal: 440, protein: 12, carbs: 65, fat: 14, prepTime: '35 min', description: 'Yogurt-based tangy curry with crispy besan dumplings and rice', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Dal Tadka & Jeera Rice', emoji: '🍛', cal: 420, protein: 16, carbs: 65, fat: 10, prepTime: '30 min', description: 'Yellow lentils tempered with cumin, mustard, and garlic with aromatic cumin rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Palak Paneer & Roti', emoji: '🥬', cal: 440, protein: 22, carbs: 38, fat: 22, prepTime: '30 min', description: 'Cottage cheese in creamy spinach and spice gravy with whole wheat roti', tags: ['vegetarian', 'high-protein'] },
      { name: 'Chicken Curry & Roti', emoji: '🍗', cal: 460, protein: 38, carbs: 36, fat: 18, prepTime: '35 min', description: 'Home-style North Indian chicken curry with aromatic spices and roti', tags: ['high-protein'] },
      { name: 'Mixed Veg Subzi & Phulka', emoji: '🥕', cal: 360, protein: 10, carbs: 54, fat: 12, prepTime: '25 min', description: 'Seasonal vegetables stir-fried with cumin, coriander and served with thin roti', tags: ['vegetarian', 'vegan'] },
      { name: 'Keema Matar & Paratha', emoji: '🥩', cal: 490, protein: 34, carbs: 44, fat: 20, prepTime: '35 min', description: 'Spiced minced lamb with green peas served with whole wheat paratha', tags: ['high-protein'] },
      { name: 'Khichdi & Papad', emoji: '🍲', cal: 360, protein: 14, carbs: 58, fat: 8, prepTime: '25 min', description: 'Comforting rice-lentil porridge with ghee, cumin, and papad on the side', tags: ['vegetarian', 'gluten-free'] },
    ],
    snack: [
      { name: 'Sprouts Chaat', emoji: '🌱', cal: 140, protein: 8, carbs: 22, fat: 2, prepTime: '5 min', description: 'Mixed sprouted moong & chana with lemon, chaat masala, onion, tomato', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Roasted Chana', emoji: '🫘', cal: 160, protein: 10, carbs: 24, fat: 3, prepTime: '0 min', description: 'Crunchy roasted chickpeas with black salt and chili — high protein', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Makhana (Fox Nuts) Bowl', emoji: '⚪', cal: 120, protein: 4, carbs: 20, fat: 2, prepTime: '5 min', description: 'Roasted fox nuts with ghee, black pepper, and rock salt', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Dahi with Gud (Jaggery)', emoji: '🍮', cal: 150, protein: 8, carbs: 22, fat: 3, prepTime: '2 min', description: 'Fresh curd topped with a small piece of jaggery — probiotic-rich', tags: ['vegetarian'] },
    ],
  },

  // ── SOUTH INDIA ─────────────────────────────────────────────────────────────
  'south-india': {
    breakfast: [
      { name: 'Idli Sambar & Chutney', emoji: '🫙', cal: 300, protein: 10, carbs: 55, fat: 4, prepTime: '20 min', description: 'Steamed rice cakes with lentil vegetable soup and coconut chutney', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Masala Dosa', emoji: '🫓', cal: 350, protein: 8, carbs: 58, fat: 10, prepTime: '20 min', description: 'Crispy rice-lentil crepe filled with spiced potato, served with sambar', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Rava Upma with Vegetables', emoji: '🥣', cal: 290, protein: 7, carbs: 46, fat: 9, prepTime: '15 min', description: 'Semolina cooked with cashews, curry leaves, carrots, and beans', tags: ['vegetarian'] },
      { name: 'Uttapam with Coconut Chutney', emoji: '🥞', cal: 320, protein: 9, carbs: 52, fat: 8, prepTime: '15 min', description: 'Thick rice pancake topped with onion, tomato, and green chili', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Puttu & Kadala Curry', emoji: '🫛', cal: 360, protein: 14, carbs: 58, fat: 8, prepTime: '25 min', description: 'Steamed rice cylinders with black chickpea curry — Kerala breakfast', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Egg Dosa & Sambar', emoji: '🍳', cal: 340, protein: 16, carbs: 48, fat: 10, prepTime: '15 min', description: 'Crispy dosa with egg cooked on top, served with hot sambar', tags: ['gluten-free'] },
    ],
    lunch: [
      { name: 'Sambar Rice & Papad', emoji: '🍛', cal: 420, protein: 14, carbs: 68, fat: 8, prepTime: '30 min', description: 'Flavorful lentil-vegetable sambar mixed into hot rice with crispy papad', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Curd Rice & Pickle', emoji: '🍚', cal: 360, protein: 10, carbs: 58, fat: 8, prepTime: '15 min', description: 'Cooling yogurt rice tempered with mustard, curry leaves, and ginger', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Kerala Fish Curry & Rice', emoji: '🐟', cal: 490, protein: 36, carbs: 50, fat: 16, prepTime: '35 min', description: 'Tangy coconut-based fish curry with Kerala spices and steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Bisi Bele Bath', emoji: '🍲', cal: 450, protein: 14, carbs: 68, fat: 12, prepTime: '40 min', description: 'Karnataka\'s hot rice-lentil-vegetable stew with ghee and boondi', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Chicken Chettinad & Parotta', emoji: '🍗', cal: 520, protein: 38, carbs: 52, fat: 18, prepTime: '45 min', description: 'Bold, aromatic Chettinad pepper chicken with layered Kerala parotta', tags: ['high-protein'] },
      { name: 'Rasam Rice & Fry', emoji: '🍜', cal: 380, protein: 10, carbs: 62, fat: 8, prepTime: '25 min', description: 'Peppery tamarind rasam with steamed rice and stir-fried vegetables', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Kootu & Chapati', emoji: '🥬', cal: 380, protein: 14, carbs: 54, fat: 12, prepTime: '30 min', description: 'Lentil and vegetable stew in coconut base with whole wheat chapati', tags: ['vegetarian', 'vegan'] },
      { name: 'Appam & Egg Curry', emoji: '🥞', cal: 420, protein: 20, carbs: 52, fat: 14, prepTime: '30 min', description: 'Lacy fermented rice pancakes with spiced egg curry in coconut milk', tags: ['gluten-free'] },
      { name: 'Prawn Masala & Rice', emoji: '🦐', cal: 460, protein: 38, carbs: 46, fat: 14, prepTime: '30 min', description: 'Coastal prawn curry in onion-tomato base with basmati rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Vegetable Biryani (Hyderbadi)', emoji: '🍚', cal: 440, protein: 12, carbs: 68, fat: 14, prepTime: '45 min', description: 'Fragrant Hyderabadi-style vegetable dum biryani with raita', tags: ['vegetarian'] },
      { name: 'Pesarattu & Upma', emoji: '🥞', cal: 360, protein: 14, carbs: 54, fat: 8, prepTime: '25 min', description: 'Andhra green moong crepes with upma filling — high protein', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Sundal (Chickpea)', emoji: '🫘', cal: 150, protein: 8, carbs: 22, fat: 3, prepTime: '10 min', description: 'Boiled chickpeas tempered with coconut, curry leaves, and mustard', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Banana Chips (Nendran)', emoji: '🍌', cal: 160, protein: 1, carbs: 24, fat: 7, prepTime: '0 min', description: 'Thin-sliced raw Kerala banana chips fried in coconut oil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Murukku (1 serving)', emoji: '🌀', cal: 130, protein: 3, carbs: 18, fat: 6, prepTime: '0 min', description: 'Crispy spiral rice-lentil snack — a South Indian staple', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Tamarind Rice (small)', emoji: '🍚', cal: 180, protein: 3, carbs: 32, fat: 5, prepTime: '10 min', description: 'Tangy temple-style tamarind rice with groundnuts and curry leaves', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  // ── WEST INDIA ──────────────────────────────────────────────────────────────
  'west-india': {
    breakfast: [
      { name: 'Dhokla & Green Chutney', emoji: '🟡', cal: 250, protein: 10, carbs: 38, fat: 6, prepTime: '30 min', description: 'Steamed fermented chickpea-semolina snack with sweet-sour chutney', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Thepla with Dahi', emoji: '🫓', cal: 340, protein: 10, carbs: 50, fat: 12, prepTime: '20 min', description: 'Gujarati fenugreek flatbread with spiced curd — travel-friendly', tags: ['vegetarian'] },
      { name: 'Pav Bhaji (Healthy)', emoji: '🥖', cal: 420, protein: 12, carbs: 65, fat: 14, prepTime: '30 min', description: 'Mashed vegetable bhaji with whole wheat pav and a squeeze of lemon', tags: ['vegetarian'] },
      { name: 'Batata Vada & Chutney', emoji: '🟠', cal: 300, protein: 6, carbs: 46, fat: 10, prepTime: '20 min', description: 'Spiced potato ball in chickpea batter with green chutney', tags: ['vegetarian', 'vegan'] },
      { name: 'Khaman & Chutney', emoji: '🟡', cal: 240, protein: 9, carbs: 35, fat: 5, prepTime: '25 min', description: 'Soft steamed chickpea flour cake with mustard seeds and coconut', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Gujarati Thali', emoji: '🍽️', cal: 480, protein: 16, carbs: 72, fat: 14, prepTime: '40 min', description: 'Dal, sabzi, roti, rice, chaas, farsan — balanced Gujarati meal', tags: ['vegetarian'] },
      { name: 'Vada Pav & Chaas', emoji: '🥖', cal: 380, protein: 8, carbs: 58, fat: 12, prepTime: '20 min', description: 'Mumbai street food: potato fritter in bread with chutneys and buttermilk', tags: ['vegetarian'] },
      { name: 'Kolhapuri Chicken Rassa', emoji: '🍗', cal: 480, protein: 36, carbs: 38, fat: 20, prepTime: '45 min', description: 'Fiery Kolhapuri-style chicken curry with bhakri — spice lover\'s pick', tags: ['high-protein'] },
      { name: 'Undhiyu & Puri', emoji: '🥘', cal: 460, protein: 12, carbs: 66, fat: 16, prepTime: '50 min', description: 'Winter Gujarati mixed vegetable dish with puri — festive meal', tags: ['vegetarian'] },
      { name: 'Pitla Bhakri', emoji: '🫓', cal: 400, protein: 14, carbs: 58, fat: 12, prepTime: '25 min', description: 'Chickpea flour curry with sorghum flatbread — Maharashtrian staple', tags: ['vegetarian', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Masoor Dal & Bhakri', emoji: '🫘', cal: 380, protein: 16, carbs: 54, fat: 8, prepTime: '25 min', description: 'Red lentil soup with sorghum flatbread and raw onion', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Bombay Fish Curry & Rice', emoji: '🐟', cal: 460, protein: 36, carbs: 48, fat: 14, prepTime: '30 min', description: 'Coastal Maharashtra-style fish curry with steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Misal Pav', emoji: '🫛', cal: 420, protein: 16, carbs: 62, fat: 12, prepTime: '30 min', description: 'Spicy sprouted moth bean curry with pav and toppings', tags: ['vegetarian'] },
    ],
    snack: [
      { name: 'Chivda (Light)', emoji: '🥣', cal: 150, protein: 4, carbs: 22, fat: 5, prepTime: '0 min', description: 'Dry roasted flattened rice mix with nuts and spices', tags: ['vegetarian', 'vegan'] },
      { name: 'Fafda & Chutney', emoji: '🟡', cal: 160, protein: 5, carbs: 20, fat: 7, prepTime: '0 min', description: 'Crispy chickpea flour strips with sweet papaya chutney', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Kanda Poha', emoji: '🍚', cal: 180, protein: 4, carbs: 32, fat: 4, prepTime: '10 min', description: 'Quick flattened rice snack with onion, peanuts, and lemon', tags: ['vegetarian', 'vegan'] },
    ],
  },

  // ── EAST INDIA ──────────────────────────────────────────────────────────────
  'east-india': {
    breakfast: [
      { name: 'Luchi & Alur Torkari', emoji: '🫓', cal: 400, protein: 9, carbs: 60, fat: 16, prepTime: '25 min', description: 'Fluffy Bengal-style fried bread with light potato curry', tags: ['vegetarian'] },
      { name: 'Sattu Paratha', emoji: '🫓', cal: 350, protein: 14, carbs: 52, fat: 10, prepTime: '20 min', description: 'Roasted chickpea flour stuffed paratha — Bihar protein staple', tags: ['vegetarian', 'high-protein'] },
      { name: 'Panta Bhat & Vegetables', emoji: '🍚', cal: 260, protein: 6, carbs: 48, fat: 4, prepTime: '5 min (soaked overnight)', description: 'Fermented rice water with small potato and mustard oil — probiotic', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chira Dahi (Flattened Rice + Curd)', emoji: '🥣', cal: 290, protein: 9, carbs: 50, fat: 5, prepTime: '5 min', description: 'Beaten rice soaked in curd with banana and jaggery — Bengal classic', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Macher Jhol & Rice', emoji: '🐟', cal: 460, protein: 34, carbs: 52, fat: 14, prepTime: '35 min', description: 'Light Bengali fish curry with potatoes in mustard-turmeric gravy and rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Dal Bhat with Fried Veg', emoji: '🍛', cal: 420, protein: 14, carbs: 66, fat: 10, prepTime: '30 min', description: 'Classic Bihar/Orissa dal with steamed rice, fried brinjal, and papad', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Litti Chokha', emoji: '🫙', cal: 440, protein: 14, carbs: 64, fat: 14, prepTime: '45 min', description: 'Baked wheat balls stuffed with sattu, served with roasted vegetable mash', tags: ['vegetarian'] },
      { name: 'Hilsa Fish Bhapa', emoji: '🐟', cal: 480, protein: 36, carbs: 38, fat: 22, prepTime: '30 min', description: 'Steamed hilsa fish in mustard-coconut marinade — Bengali delicacy', tags: ['high-protein', 'gluten-free'] },
      { name: 'Dalma & Rice', emoji: '🫘', cal: 400, protein: 16, carbs: 60, fat: 8, prepTime: '35 min', description: 'Odisha-style lentils with raw banana, papaya, and spices', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Shorshe Ilish & Rice', emoji: '🐟', cal: 500, protein: 38, carbs: 48, fat: 18, prepTime: '30 min', description: 'Hilsa fish in mustard sauce — Puja special from Bengal', tags: ['high-protein', 'gluten-free'] },
      { name: 'Aloo Posto & Rice', emoji: '🥔', cal: 380, protein: 8, carbs: 58, fat: 14, prepTime: '20 min', description: 'Potatoes cooked in poppy seed paste — Bengali comfort food', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Kosha & Rice', emoji: '🍗', cal: 480, protein: 36, carbs: 42, fat: 20, prepTime: '50 min', description: 'Dark, rich slow-cooked Bengali chicken with caramelized onions', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Ghugni Chaat', emoji: '🫛', cal: 170, protein: 9, carbs: 25, fat: 4, prepTime: '10 min', description: 'Spiced white pea chaat with tamarind, onion, and green chili', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Jhalmuri', emoji: '🥣', cal: 130, protein: 3, carbs: 22, fat: 4, prepTime: '5 min', description: 'Kolkata street puffed rice with vegetables, mustard oil, and spices', tags: ['vegetarian', 'vegan'] },
    ],
  },

  // ── PAKISTAN ─────────────────────────────────────────────────────────────────
  pakistan: {
    breakfast: [
      { name: 'Halwa Puri Nashta', emoji: '🍮', cal: 450, protein: 8, carbs: 68, fat: 18, prepTime: '30 min', description: 'Weekend classic: semolina halwa with puffed bread and chana', tags: ['vegetarian'] },
      { name: 'Anda Paratha', emoji: '🫓', cal: 380, protein: 14, carbs: 48, fat: 16, prepTime: '15 min', description: 'Egg-filled whole wheat flatbread with chai — Lahori breakfast', tags: [] },
      { name: 'Doodh Patti Chai & Rusk', emoji: '☕', cal: 220, protein: 6, carbs: 32, fat: 7, prepTime: '10 min', description: 'Thick milk tea with cardamom served with twice-baked rusk', tags: ['vegetarian'] },
      { name: 'Aloo ka Paratha & Lassi', emoji: '🫓', cal: 420, protein: 11, carbs: 58, fat: 15, prepTime: '20 min', description: 'Potato-stuffed paratha with sweet lassi — classic Pakistani morning', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Nihari & Naan', emoji: '🍖', cal: 540, protein: 40, carbs: 46, fat: 24, prepTime: '60+ min', description: 'Slow-cooked beef or mutton stew with wheat-thickened gravy and naan', tags: ['high-protein'] },
      { name: 'Haleem & Roti', emoji: '🥣', cal: 490, protein: 32, carbs: 48, fat: 18, prepTime: '120 min (slow cook)', description: 'Slow-cooked wheat-lentil-meat stew — protein powerhouse', tags: ['high-protein'] },
      { name: 'Chicken Karahi', emoji: '🍗', cal: 500, protein: 40, carbs: 18, fat: 28, prepTime: '35 min', description: 'Wok-fried chicken in tomato-ginger-green chili gravy', tags: ['high-protein', 'gluten-free'] },
      { name: 'Daal Gosht & Rice', emoji: '🍛', cal: 480, protein: 34, carbs: 46, fat: 18, prepTime: '45 min', description: 'Slow-cooked mutton and lentils with steamed basmati', tags: ['high-protein', 'gluten-free'] },
      { name: 'Biryani (Chicken/Mutton)', emoji: '🍚', cal: 520, protein: 32, carbs: 58, fat: 18, prepTime: '60 min', description: 'Aromatic Sindhi or Karachi-style dum biryani with raita', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Bun Kebab', emoji: '🫓', cal: 380, protein: 22, carbs: 38, fat: 16, prepTime: '20 min', description: 'Karachi-style spiced beef patty in bun with chutneys', tags: ['high-protein'] },
      { name: 'Qeema Palak', emoji: '🥬', cal: 440, protein: 30, carbs: 22, fat: 24, prepTime: '30 min', description: 'Minced meat cooked with spinach and spices — high iron', tags: ['high-protein', 'gluten-free'] },
      { name: 'Aloo Gosht', emoji: '🥔', cal: 460, protein: 28, carbs: 36, fat: 22, prepTime: '50 min', description: 'Potato and mutton curry — everyday Pakistani dinner staple', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Samosa (1 pc) & Chutney', emoji: '🔺', cal: 170, protein: 4, carbs: 22, fat: 8, prepTime: '0 min', description: 'Crispy fried pastry filled with spiced potato and peas', tags: ['vegetarian'] },
      { name: 'Dahi Bhalle', emoji: '🫙', cal: 200, protein: 8, carbs: 28, fat: 6, prepTime: '10 min', description: 'Lentil dumplings in cold spiced yogurt with tamarind chutney', tags: ['vegetarian'] },
    ],
  },

  // ── MIDDLE EAST / GULF ────────────────────────────────────────────────────
  gulf: {
    breakfast: [
      { name: 'Ful Medames & Pita', emoji: '🫘', cal: 360, protein: 16, carbs: 52, fat: 9, prepTime: '20 min', description: 'Slow-cooked fava beans with olive oil, lemon, garlic, and pita bread', tags: ['vegetarian', 'vegan'] },
      { name: 'Labneh & Za\'atar Bread', emoji: '🫙', cal: 320, protein: 12, carbs: 38, fat: 14, prepTime: '5 min', description: 'Strained yogurt cheese with olive oil, thyme blend, and flatbread', tags: ['vegetarian'] },
      { name: 'Shakshuka', emoji: '🍳', cal: 350, protein: 20, carbs: 24, fat: 18, prepTime: '20 min', description: 'Eggs poached in spiced tomato-pepper sauce with cumin and paprika', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Balaleet (Sweet Vermicelli)', emoji: '🍜', cal: 380, protein: 9, carbs: 62, fat: 12, prepTime: '25 min', description: 'Sweet spiced vermicelli with omelette on top — UAE breakfast classic', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Kabsa (Chicken)', emoji: '🍗', cal: 540, protein: 38, carbs: 58, fat: 16, prepTime: '50 min', description: 'Saudi national dish: fragrant basmati rice with chicken, spices, nuts', tags: ['high-protein', 'gluten-free'] },
      { name: 'Shawarma Wrap', emoji: '🌯', cal: 480, protein: 28, carbs: 48, fat: 20, prepTime: '15 min', description: 'Grilled chicken or meat in lavash with garlic sauce, pickles, fries', tags: ['high-protein'] },
      { name: 'Machboos (Fish)', emoji: '🐟', cal: 500, protein: 36, carbs: 55, fat: 14, prepTime: '50 min', description: 'Gulf-style fish over saffron rice with dried lemon and baharat', tags: ['high-protein', 'gluten-free'] },
      { name: 'Mandi (Lamb)', emoji: '🍖', cal: 560, protein: 44, carbs: 52, fat: 22, prepTime: '90 min', description: 'Slow-cooked pit-smoked lamb over fragrant rice — Yemeni origin', tags: ['high-protein', 'gluten-free'] },
      { name: 'Falafel Plate', emoji: '🫘', cal: 420, protein: 16, carbs: 52, fat: 18, prepTime: '25 min', description: 'Fried chickpea patties with hummus, salad, and pita', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Harees (Meat Porridge)', emoji: '🥣', cal: 460, protein: 32, carbs: 44, fat: 16, prepTime: '90 min', description: 'Slow-cooked wheat and lamb porridge — a Ramadan staple', tags: ['high-protein'] },
      { name: 'Grilled Hammour & Rice', emoji: '🐟', cal: 480, protein: 40, carbs: 44, fat: 14, prepTime: '30 min', description: 'Gulf grouper fish grilled with lemon-herb marinade and rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Chicken Margoog', emoji: '🍲', cal: 500, protein: 34, carbs: 54, fat: 16, prepTime: '50 min', description: 'Hearty Saudi stew with chicken, vegetables, and thin bread pieces', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Dates & Almonds', emoji: '🌴', cal: 180, protein: 3, carbs: 30, fat: 8, prepTime: '0 min', description: '4–5 medjool dates with a handful of almonds — natural energy', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Hummus & Veggies', emoji: '🫙', cal: 160, protein: 6, carbs: 18, fat: 7, prepTime: '5 min', description: 'Creamy chickpea dip with carrot, cucumber, celery sticks', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Luqaimat', emoji: '🍡', cal: 200, protein: 3, carbs: 32, fat: 7, prepTime: '0 min', description: 'Crispy fried dough balls drizzled with date syrup — Gulf sweet', tags: ['vegetarian'] },
    ],
  },

  // ── JAPAN ────────────────────────────────────────────────────────────────────
  japan: {
    breakfast: [
      { name: 'Tamago Gohan (TKG)', emoji: '🥚', cal: 280, protein: 12, carbs: 44, fat: 7, prepTime: '5 min', description: 'Raw egg stirred into hot steamed rice with soy sauce and furikake', tags: [] },
      { name: 'Miso Soup & Onigiri', emoji: '🍱', cal: 320, protein: 10, carbs: 56, fat: 4, prepTime: '10 min', description: 'Clear tofu miso soup with triangle rice ball filled with salmon or umeboshi', tags: [] },
      { name: 'Natto & Rice', emoji: '🫘', cal: 300, protein: 16, carbs: 48, fat: 8, prepTime: '5 min', description: 'Fermented soybean over rice with mustard and soy sauce — probiotic superfood', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Japanese Oatmeal Porridge', emoji: '🥣', cal: 310, protein: 9, carbs: 52, fat: 6, prepTime: '10 min', description: 'Oat porridge topped with sesame seeds, seaweed flakes, and soft-boiled egg', tags: [] },
    ],
    lunch: [
      { name: 'Chicken Teriyaki Bento', emoji: '🍱', cal: 480, protein: 36, carbs: 52, fat: 14, prepTime: '25 min', description: 'Grilled teriyaki chicken with steamed rice, pickles, and salad', tags: ['high-protein'] },
      { name: 'Salmon Sushi Set', emoji: '🍣', cal: 440, protein: 28, carbs: 58, fat: 10, prepTime: '20 min', description: '8 pc nigiri sushi with salmon, tuna, and shrimp with miso soup', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ramen (Light Shoyu)', emoji: '🍜', cal: 460, protein: 24, carbs: 58, fat: 12, prepTime: '15 min (instant/restaurant)', description: 'Soy broth ramen with chashu pork, egg, nori, and bamboo shoots', tags: [] },
      { name: 'Udon with Vegetables', emoji: '🍜', cal: 400, protein: 14, carbs: 68, fat: 6, prepTime: '15 min', description: 'Thick udon noodles in dashi broth with mushrooms and tofu', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Salmon Misoyaki & Rice', emoji: '🐟', cal: 480, protein: 40, carbs: 42, fat: 16, prepTime: '25 min', description: 'Miso-glazed baked salmon with steamed rice and miso soup', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tofu Miso Hot Pot', emoji: '🫕', cal: 360, protein: 20, carbs: 32, fat: 14, prepTime: '25 min', description: 'Simmered tofu, mushrooms, and greens in kombu-miso broth', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Gyoza & Rice', emoji: '🥟', cal: 440, protein: 18, carbs: 56, fat: 14, prepTime: '25 min', description: 'Pan-fried pork and cabbage dumplings with ponzu sauce and rice', tags: [] },
    ],
    snack: [
      { name: 'Edamame', emoji: '🫛', cal: 120, protein: 10, carbs: 10, fat: 5, prepTime: '5 min', description: 'Steamed salted young soybeans — protein-packed Japanese snack', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Onigiri (1 pc)', emoji: '🍙', cal: 180, protein: 4, carbs: 38, fat: 1, prepTime: '0 min', description: 'Convenience rice ball with nori and filling', tags: [] },
    ],
  },

  // ── KOREA ───────────────────────────────────────────────────────────────────
  korea: {
    breakfast: [
      { name: 'Juk (Rice Porridge)', emoji: '🥣', cal: 260, protein: 8, carbs: 48, fat: 3, prepTime: '20 min', description: 'Silky rice porridge with sesame oil, green onion, and side banchan', tags: ['gluten-free'] },
      { name: 'Gyeran-bap (Egg Rice)', emoji: '🍳', cal: 320, protein: 14, carbs: 46, fat: 10, prepTime: '8 min', description: 'Hot rice topped with fried egg and soy sauce — simple and satisfying', tags: ['gluten-free'] },
    ],
    lunch: [
      { name: 'Bibimbap', emoji: '🍲', cal: 520, protein: 22, carbs: 72, fat: 14, prepTime: '25 min', description: 'Rice bowl with seasoned vegetables, gochujang, sesame oil, and egg', tags: ['gluten-free'] },
      { name: 'Kimchi Jjigae & Rice', emoji: '🍲', cal: 460, protein: 24, carbs: 52, fat: 16, prepTime: '25 min', description: 'Fermented kimchi stew with pork or tofu — deeply flavorful', tags: [] },
      { name: 'Doenjang Jjigae & Rice', emoji: '🫙', cal: 420, protein: 20, carbs: 54, fat: 12, prepTime: '20 min', description: 'Korean fermented soybean paste stew with tofu and vegetables', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Japchae (Glass Noodles)', emoji: '🍜', cal: 440, protein: 16, carbs: 62, fat: 12, prepTime: '25 min', description: 'Stir-fried sweet potato noodles with vegetables and sesame', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Korean BBQ Samgyeopsal', emoji: '🥩', cal: 540, protein: 36, carbs: 20, fat: 34, prepTime: '20 min', description: 'Grilled pork belly wrapped in lettuce with garlic and doenjang', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Tteok (Rice Cake, 2pc)', emoji: '🍡', cal: 130, protein: 2, carbs: 28, fat: 1, prepTime: '0 min', description: 'Chewy rice cakes — light and filling Korean snack', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Hoddeok (1 pc)', emoji: '🥞', cal: 180, protein: 3, carbs: 30, fat: 6, prepTime: '0 min', description: 'Sweet cinnamon-filled Korean pancake — street food classic', tags: ['vegetarian'] },
    ],
  },

  // ── MEDITERRANEAN / GREECE ───────────────────────────────────────────────────
  greece: {
    breakfast: [
      { name: 'Greek Yogurt & Honey', emoji: '🍯', cal: 280, protein: 18, carbs: 32, fat: 8, prepTime: '2 min', description: 'Thick strained yogurt with local honey, walnuts, and fresh figs', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Spanakopita (1 slice)', emoji: '🥬', cal: 320, protein: 10, carbs: 32, fat: 16, prepTime: '0 min', description: 'Flaky phyllo pastry with spinach and feta cheese', tags: ['vegetarian'] },
      { name: 'Dakos (Rusk Salad)', emoji: '🍅', cal: 300, protein: 9, carbs: 40, fat: 12, prepTime: '5 min', description: 'Barley rusk topped with grated tomato, feta, olives, and oregano', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Greek Salad & Grilled Fish', emoji: '🐟', cal: 460, protein: 36, carbs: 22, fat: 22, prepTime: '20 min', description: 'Tomato, olive, feta salad with grilled sea bream and lemon', tags: ['high-protein', 'gluten-free'] },
      { name: 'Moussaka', emoji: '🧆', cal: 520, protein: 24, carbs: 38, fat: 28, prepTime: '60 min', description: 'Layered eggplant, spiced ground beef, and béchamel sauce', tags: [] },
      { name: 'Souvlaki Pita', emoji: '🌯', cal: 480, protein: 30, carbs: 48, fat: 18, prepTime: '15 min', description: 'Grilled meat skewer in pita with tzatziki, tomato, and onion', tags: [] },
    ],
    dinner: [
      { name: 'Fasolada (Bean Soup)', emoji: '🫘', cal: 380, protein: 16, carbs: 54, fat: 10, prepTime: '30 min', description: 'Traditional white bean soup with olive oil, celery, and carrot', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Pastitsio', emoji: '🍝', cal: 510, protein: 26, carbs: 52, fat: 22, prepTime: '60 min', description: 'Greek baked pasta with spiced meat sauce and béchamel', tags: [] },
    ],
    snack: [
      { name: 'Tzatziki & Pita', emoji: '🫙', cal: 180, protein: 6, carbs: 22, fat: 7, prepTime: '0 min', description: 'Yogurt-cucumber-garlic dip with warm pita — light and refreshing', tags: ['vegetarian'] },
      { name: 'Loukoumades (3 pc)', emoji: '🍯', cal: 190, protein: 3, carbs: 28, fat: 8, prepTime: '0 min', description: 'Mini honey-drenched doughnuts with cinnamon — Greek street sweet', tags: ['vegetarian'] },
    ],
  },

  // ── ITALY ────────────────────────────────────────────────────────────────────
  italy: {
    breakfast: [
      { name: 'Cornetto & Cappuccino', emoji: '🥐', cal: 320, protein: 8, carbs: 46, fat: 12, prepTime: '0 min', description: 'Light Italian pastry with a frothy milk espresso — classic bar breakfast', tags: ['vegetarian'] },
      { name: 'Bircher Muesli', emoji: '🥣', cal: 340, protein: 10, carbs: 54, fat: 8, prepTime: '5 min (overnight)', description: 'Oats soaked in apple juice with yogurt, nuts, and seasonal fruit', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Pasta Pomodoro', emoji: '🍝', cal: 460, protein: 14, carbs: 72, fat: 12, prepTime: '20 min', description: 'Al dente spaghetti with San Marzano tomato, basil, and Parmesan', tags: ['vegetarian'] },
      { name: 'Pizza Margherita (2 slices)', emoji: '🍕', cal: 500, protein: 18, carbs: 66, fat: 16, prepTime: '25 min', description: 'Thin-crust Neapolitan pizza with tomato, mozzarella, and fresh basil', tags: ['vegetarian'] },
      { name: 'Risotto ai Funghi', emoji: '🍄', cal: 480, protein: 14, carbs: 68, fat: 14, prepTime: '30 min', description: 'Creamy Arborio rice with porcini mushrooms and Parmesan', tags: ['vegetarian', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Branzino al Forno', emoji: '🐟', cal: 440, protein: 38, carbs: 12, fat: 24, prepTime: '30 min', description: 'Herb-baked Mediterranean sea bass with lemon, capers, and olives', tags: ['high-protein', 'gluten-free'] },
      { name: 'Osso Buco & Gremolata', emoji: '🍖', cal: 520, protein: 40, carbs: 18, fat: 28, prepTime: '90 min', description: 'Braised veal shank with saffron risotto and citrus gremolata', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Bruschetta (2 slices)', emoji: '🍞', cal: 180, protein: 5, carbs: 28, fat: 6, prepTime: '5 min', description: 'Grilled bread rubbed with garlic and topped with tomato and basil', tags: ['vegetarian', 'vegan'] },
      { name: 'Panna Cotta', emoji: '🍮', cal: 200, protein: 4, carbs: 24, fat: 10, prepTime: '0 min', description: 'Silky vanilla cream with berry coulis — light Italian dessert', tags: ['vegetarian'] },
    ],
  },

  // ── MEXICO ────────────────────────────────────────────────────────────────────
  mexico: {
    breakfast: [
      { name: 'Chilaquiles Verdes', emoji: '🫔', cal: 420, protein: 18, carbs: 52, fat: 16, prepTime: '20 min', description: 'Crispy tortilla chips in green salsa with scrambled eggs, crema, and cheese', tags: [] },
      { name: 'Huevos Rancheros', emoji: '🍳', cal: 380, protein: 20, carbs: 38, fat: 18, prepTime: '15 min', description: 'Fried eggs on corn tortillas with roasted tomato salsa and beans', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Atole & Pan Dulce', emoji: '🥐', cal: 350, protein: 6, carbs: 62, fat: 8, prepTime: '10 min', description: 'Warm corn-based drink with sweet rolls — traditional Mexican morning', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Tacos de Pollo (3 pc)', emoji: '🌮', cal: 480, protein: 32, carbs: 46, fat: 16, prepTime: '20 min', description: 'Grilled chicken tacos in corn tortillas with salsa verde, onion, cilantro', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pozole Rojo', emoji: '🍲', cal: 440, protein: 28, carbs: 48, fat: 14, prepTime: '60 min', description: 'Hominy corn stew with pork, chili, and garnished with cabbage', tags: ['high-protein', 'gluten-free'] },
      { name: 'Enchiladas Verdes', emoji: '🫔', cal: 500, protein: 26, carbs: 54, fat: 20, prepTime: '30 min', description: 'Rolled tortillas filled with chicken, topped with tomatillo sauce and cheese', tags: [] },
      { name: 'Sopa de Lentejas', emoji: '🫘', cal: 380, protein: 18, carbs: 52, fat: 8, prepTime: '30 min', description: 'Mexican lentil soup with plantain, chorizo, and fresh herbs', tags: [] },
    ],
    dinner: [
      { name: 'Caldo de Pollo', emoji: '🍜', cal: 380, protein: 32, carbs: 30, fat: 12, prepTime: '40 min', description: 'Light chicken soup with vegetables, rice, and lime', tags: ['high-protein', 'gluten-free'] },
      { name: 'Frijoles & Tortillas', emoji: '🫘', cal: 400, protein: 16, carbs: 62, fat: 10, prepTime: '15 min', description: 'Refried black beans with corn tortillas and fresh salsa', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Guacamole & Chips', emoji: '🥑', cal: 220, protein: 3, carbs: 20, fat: 15, prepTime: '5 min', description: 'Fresh avocado dip with lime, jalapeño, and baked tortilla chips', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Elote (Corn on Cob)', emoji: '🌽', cal: 170, protein: 4, carbs: 28, fat: 6, prepTime: '10 min', description: 'Grilled corn with chili powder, lime, cotija cheese, and mayo', tags: ['vegetarian'] },
    ],
  },

  // ── USA ───────────────────────────────────────────────────────────────────────
  usa: {
    breakfast: [
      { name: 'Avocado Toast & Eggs', emoji: '🥑', cal: 390, protein: 18, carbs: 32, fat: 22, prepTime: '12 min', description: 'Sourdough toast with smashed avocado, poached egg, and chili flakes', tags: ['vegetarian'] },
      { name: 'Greek Yogurt Parfait', emoji: '🍨', cal: 310, protein: 20, carbs: 38, fat: 8, prepTime: '5 min', description: 'Thick yogurt layered with granola, fresh berries, and honey', tags: ['vegetarian', 'high-protein'] },
      { name: 'Overnight Oats', emoji: '🥣', cal: 340, protein: 12, carbs: 52, fat: 9, prepTime: '5 min (overnight)', description: 'Oats with chia, almond milk, banana, and peanut butter', tags: ['vegetarian', 'vegan'] },
      { name: 'Smoothie Bowl', emoji: '🍓', cal: 360, protein: 10, carbs: 58, fat: 8, prepTime: '8 min', description: 'Blended açaí or berry with granola, banana slices, coconut, chia', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Grilled Chicken Salad', emoji: '🥗', cal: 420, protein: 38, carbs: 22, fat: 18, prepTime: '20 min', description: 'Grilled chicken over mixed greens with avocado and balsamic dressing', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Turkey Club Sandwich', emoji: '🥪', cal: 460, protein: 32, carbs: 44, fat: 18, prepTime: '10 min', description: 'Triple-decker with turkey, bacon, lettuce, tomato on wheat bread', tags: ['high-protein'] },
      { name: 'Burrito Bowl', emoji: '🌮', cal: 510, protein: 28, carbs: 58, fat: 16, prepTime: '20 min', description: 'Rice, black beans, grilled chicken, salsa, guac, and sour cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tuna Poke Bowl', emoji: '🐟', cal: 480, protein: 36, carbs: 50, fat: 12, prepTime: '15 min', description: 'Fresh tuna, sushi rice, edamame, cucumber, and spicy mayo', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Baked Salmon & Asparagus', emoji: '🐟', cal: 460, protein: 42, carbs: 16, fat: 24, prepTime: '25 min', description: 'Herb-crusted salmon with roasted asparagus and lemon-butter sauce', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Turkey Meatballs & Zoodles', emoji: '🍝', cal: 400, protein: 36, carbs: 22, fat: 18, prepTime: '30 min', description: 'Lean turkey meatballs with zucchini noodles in marinara — low carb', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Grilled Steak & Sweet Potato', emoji: '🥩', cal: 540, protein: 44, carbs: 34, fat: 24, prepTime: '25 min', description: 'Lean flank steak with roasted sweet potato and green beans', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Apple & Almond Butter', emoji: '🍎', cal: 200, protein: 5, carbs: 28, fat: 10, prepTime: '2 min', description: 'Apple slices with 2 tbsp natural almond butter', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Protein Bar', emoji: '🍫', cal: 200, protein: 20, carbs: 20, fat: 7, prepTime: '0 min', description: 'Low-sugar protein bar for on-the-go energy', tags: ['high-protein'] },
      { name: 'Trail Mix', emoji: '🥜', cal: 190, protein: 6, carbs: 20, fat: 12, prepTime: '0 min', description: 'Mixed nuts, seeds, dark chocolate chips, and dried cranberries', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  // ── GLOBAL FALLBACK ──────────────────────────────────────────────────────────
  'bangladesh': {
    breakfast: [
      { name: 'Chotpoti', emoji: '🥣', cal: 350, protein: 14, carbs: 55, fat: 9, prepTime: '20 min', description: 'Yellow peas tossed with potato, tamarind, onion and boiled egg bits', tags: ['vegetarian'] },
      { name: 'Patishapta Pitha (light)', emoji: '🥞', cal: 300, protein: 8, carbs: 52, fat: 8, prepTime: '25 min', description: 'Rice-flour crepe filled with lightly sweetened coconut and jaggery', tags: ['vegetarian'] },
      { name: 'Ruti + Alu Bhorta', emoji: '🥔', cal: 380, protein: 12, carbs: 62, fat: 10, prepTime: '20 min', description: 'Two whole wheat flatbreads with mustard-oil mashed potato and green chili', tags: ['vegetarian', 'vegan'] },
      { name: 'Dal + Paratha (light)', emoji: '🫓', cal: 420, protein: 16, carbs: 58, fat: 14, prepTime: '25 min', description: 'Masoor dal with one lightly-oiled paratha and cucumber slices', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Ilish Bhapa', emoji: '🐟', cal: 550, protein: 34, carbs: 40, fat: 28, prepTime: '30 min', description: 'Steamed hilsa fish in mustard paste, served with steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Bhorta Platter + Rice', emoji: '🥗', cal: 480, protein: 14, carbs: 78, fat: 14, prepTime: '25 min', description: 'Assorted mashed vegetables with mustard oil and steamed rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Roast (Bengali)', emoji: '🍗', cal: 620, protein: 42, carbs: 45, fat: 30, prepTime: '30 min', description: 'Chicken leg marinated in yogurt and spices, roasted, with pulao rice', tags: ['high-protein'] },
      { name: 'Rui Fish Curry + Rice', emoji: '🐠', cal: 520, protein: 36, carbs: 52, fat: 18, prepTime: '30 min', description: 'Rohu fish in a light turmeric-tomato curry with steamed rice', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Shorshe Ilish (light)', emoji: '🐟', cal: 500, protein: 32, carbs: 45, fat: 22, prepTime: '25 min', description: 'Hilsa in mustard gravy, restrained oil, with brown rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Lau Chingri', emoji: '🍤', cal: 470, protein: 28, carbs: 50, fat: 18, prepTime: '25 min', description: 'Prawns simmered with bottle gourd in light spices, served with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Vegetable Khichuri', emoji: '🍲', cal: 520, protein: 18, carbs: 82, fat: 14, prepTime: '30 min', description: 'One-pot rice and moong dal with seasonal vegetables, light ghee tempering', tags: ['vegetarian'] },
      { name: 'Beef Bhuna (light)', emoji: '🥩', cal: 580, protein: 40, carbs: 30, fat: 32, prepTime: '30 min', description: 'Slow-braised beef in caramelized onion gravy, easy on oil, with two ruti', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Fuchka (6 pc, light)', emoji: '🫓', cal: 220, protein: 6, carbs: 42, fat: 4, prepTime: '15 min', description: 'Crisp semolina shells filled with spiced potato-chickpea mix and tamarind water', tags: ['vegetarian', 'vegan'] },
      { name: 'Jhal Muri', emoji: '🍿', cal: 160, protein: 5, carbs: 30, fat: 4, prepTime: '10 min', description: 'Puffed rice tossed with mustard oil, peanuts, onion and green chili', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Egg + Chana Chaat', emoji: '🥚', cal: 200, protein: 12, carbs: 20, fat: 8, prepTime: '15 min', description: 'Two boiled eggs with spiced chickpea chaat and lemon', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
    ],
  },

  'nepal': {
    breakfast: [
      { name: 'Sel Roti + Aloo (2 pc)', emoji: '🍩', cal: 380, protein: 8, carbs: 66, fat: 10, prepTime: '25 min', description: 'Two ring-shaped rice-flour doughnuts with spiced potato curry', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Dhindo + Gundruk Soup', emoji: '🍲', cal: 320, protein: 10, carbs: 58, fat: 6, prepTime: '20 min', description: 'Buckwheat porridge with fermented leafy-green soup, a mountain staple', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Momo (6 pc)', emoji: '🥟', cal: 400, protein: 26, carbs: 42, fat: 15, prepTime: '30 min', description: 'Six steamed dumplings stuffed with minced chicken and cabbage, sesame chutney', tags: ['high-protein'] },
      { name: 'Masala Oats Jhol', emoji: '🥣', cal: 300, protein: 12, carbs: 45, fat: 9, prepTime: '15 min', description: 'Savory oats porridge with turmeric, cumin and mixed vegetables', tags: ['vegetarian', 'vegan'] },
    ],
    lunch: [
      { name: 'Dal Bhat Tarkari', emoji: '🍛', cal: 650, protein: 24, carbs: 98, fat: 18, prepTime: '30 min', description: 'The national plate: lentil soup, rice, seasonal vegetable curry and achar', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Thukpa', emoji: '🍜', cal: 580, protein: 34, carbs: 62, fat: 22, prepTime: '30 min', description: 'Hand-pulled noodle soup with chicken, bok choy and Himalayan spices', tags: ['high-protein'] },
      { name: 'Veg Momo + Soup (8 pc)', emoji: '🥟', cal: 450, protein: 16, carbs: 68, fat: 14, prepTime: '30 min', description: 'Eight steamed cabbage-carrot dumplings with clear vegetable broth', tags: ['vegetarian', 'vegan'] },
      { name: 'Sukuti Sadheko (light)', emoji: '🥩', cal: 560, protein: 38, carbs: 35, fat: 28, prepTime: '20 min', description: 'Air-dried buffalo meat tossed with onion, tomato and mustard oil, with beaten rice', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Dal Bhat (chicken)', emoji: '🍗', cal: 620, protein: 38, carbs: 80, fat: 16, prepTime: '30 min', description: 'Lentils, rice and chicken curry with saag and tomato achar', tags: ['high-protein', 'gluten-free'] },
      { name: 'Gundruk Dhindo Set', emoji: '🥬', cal: 450, protein: 14, carbs: 78, fat: 10, prepTime: '25 min', description: 'Buckwheat dhindo with fermented greens and bean soup', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Choila + Bhuja', emoji: '🍖', cal: 540, protein: 36, carbs: 42, fat: 24, prepTime: '25 min', description: 'Flame-grilled spiced chicken with beaten rice and soybeans', tags: ['high-protein', 'gluten-free'] },
      { name: 'Aloo Tama Bodi', emoji: '🥔', cal: 480, protein: 16, carbs: 72, fat: 14, prepTime: '25 min', description: 'Bamboo shoot, potato and black-eyed pea curry with steamed rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Wai Wai Sadheko (dry)', emoji: '🍜', cal: 250, protein: 7, carbs: 40, fat: 8, prepTime: '10 min', description: 'Crushed dry noodles tossed with onion, tomato, peas and masala', tags: ['vegetarian', 'vegan'] },
      { name: 'Roasted Soybean (Bhatmas)', emoji: '🫘', cal: 180, protein: 12, carbs: 12, fat: 10, prepTime: '10 min', description: 'Crunchy roasted soybeans with chili salt and lemon', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Buff Momo (4 pc)', emoji: '🥟', cal: 280, protein: 18, carbs: 28, fat: 11, prepTime: '20 min', description: 'Four steamed buffalo-meat dumplings with tomato-sesame chutney', tags: ['high-protein'] },
    ],
  },

  'sri-lanka': {
    breakfast: [
      { name: 'Hoppers + Lunu Miris (2 pc)', emoji: '🥞', cal: 350, protein: 8, carbs: 60, fat: 9, prepTime: '25 min', description: 'Two bowl-shaped fermented rice pancakes with spicy onion-chili sambol', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'String Hoppers + Dhal (6 pc)', emoji: '🍝', cal: 380, protein: 14, carbs: 68, fat: 7, prepTime: '25 min', description: 'Six steamed rice-flour noodle nests with red lentil curry', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Egg Hopper (2 pc)', emoji: '🍳', cal: 400, protein: 16, carbs: 52, fat: 14, prepTime: '20 min', description: 'Two crisp appa each with a soft egg center, coconut sambol on the side', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Kiribath (light)', emoji: '🍚', cal: 420, protein: 10, carbs: 72, fat: 11, prepTime: '25 min', description: 'Milk rice cooked light on coconut milk, served with lunu miris', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Fish Curry + Red Rice', emoji: '🐟', cal: 580, protein: 36, carbs: 70, fat: 18, prepTime: '30 min', description: 'Tuna simmered in roasted curry-powder gravy with red rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Kottu Roti (chicken, light)', emoji: '🫓', cal: 640, protein: 36, carbs: 60, fat: 28, prepTime: '25 min', description: 'Chopped godhamba roti stir-fried with chicken, egg and vegetables', tags: ['high-protein'] },
      { name: 'Dhal + Pol Sambol + Rice', emoji: '🥥', cal: 520, protein: 18, carbs: 84, fat: 14, prepTime: '25 min', description: 'Red lentil curry, coconut sambol and steamed rice, the island trinity', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Curry (Jaffna)', emoji: '🍗', cal: 600, protein: 40, carbs: 55, fat: 24, prepTime: '30 min', description: 'Fiery roasted-spice chicken curry with string hoppers', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Hopper Dinner Set', emoji: '🥞', cal: 480, protein: 20, carbs: 70, fat: 14, prepTime: '25 min', description: 'Three plain hoppers with seeni sambol and a boiled egg', tags: ['vegetarian'] },
      { name: 'Crab Curry (light)', emoji: '🦀', cal: 520, protein: 38, carbs: 45, fat: 20, prepTime: '30 min', description: 'Mud crab in a thin lagoon-spice broth with red rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Vegetable Kottu', emoji: '🥕', cal: 500, protein: 16, carbs: 72, fat: 16, prepTime: '20 min', description: 'Chopped roti tossed with mixed vegetables and egg ribbons', tags: ['vegetarian'] },
      { name: 'Ambulthiyal', emoji: '🐠', cal: 540, protein: 38, carbs: 50, fat: 20, prepTime: '30 min', description: 'Tuna in a tangy tamarind-black pepper curry with steamed rice', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Pol Roti + Seeni Sambol', emoji: '🫓', cal: 280, protein: 7, carbs: 48, fat: 8, prepTime: '15 min', description: 'Coconut flatbread with sweet caramelized onion relish', tags: ['vegetarian', 'vegan'] },
      { name: 'Isso Wade (2 pc)', emoji: '🍤', cal: 220, protein: 12, carbs: 26, fat: 8, prepTime: '20 min', description: 'Two crispy lentil fritters topped with tiny shrimp and onion', tags: ['high-protein'] },
      { name: 'Kurakkan Roti + Katta Sambol', emoji: '🌾', cal: 200, protein: 6, carbs: 36, fat: 5, prepTime: '15 min', description: 'Finger-millet flatbread with fiery chili-onion sambol', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'afghanistan': {
    breakfast: [
      { name: 'Bolani Aloo (2 pc)', emoji: '🫓', cal: 380, protein: 10, carbs: 62, fat: 11, prepTime: '25 min', description: 'Two griddled flatbreads stuffed with spiced potato and scallion', tags: ['vegetarian', 'vegan'] },
      { name: 'Shir Berenj (light)', emoji: '🍚', cal: 320, protein: 9, carbs: 55, fat: 8, prepTime: '25 min', description: 'Rice pudding made with low-fat milk, cardamom and a few pistachios', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Qaymaq + Naan (light)', emoji: '🫓', cal: 420, protein: 12, carbs: 58, fat: 16, prepTime: '10 min', description: 'Clotted cream with honey on warm tandoor naan', tags: ['vegetarian'] },
      { name: 'Tukhum Banjan', emoji: '🍳', cal: 350, protein: 14, carbs: 28, fat: 20, prepTime: '20 min', description: 'Eggplant and egg skillet with tomato and turmeric', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Kabuli Pulao (chicken, light)', emoji: '🍚', cal: 640, protein: 34, carbs: 78, fat: 22, prepTime: '30 min', description: 'The national dish: saffron rice with chicken, julienned carrot and raisins', tags: ['high-protein', 'gluten-free'] },
      { name: 'Mantu (8 pc)', emoji: '🥟', cal: 520, protein: 28, carbs: 62, fat: 18, prepTime: '30 min', description: 'Eight beef-and-onion dumplings with yogurt and split-pea topping', tags: ['high-protein'] },
      { name: 'Borani Banjan', emoji: '🍆', cal: 480, protein: 14, carbs: 60, fat: 20, prepTime: '25 min', description: 'Eggplant layered with garlic yogurt and tomato sauce, served with naan', tags: ['vegetarian'] },
      { name: 'Aush (Noodle Soup)', emoji: '🍜', cal: 540, protein: 22, carbs: 72, fat: 18, prepTime: '30 min', description: 'Hearty noodle soup with chickpeas, kidney beans and herbed yogurt', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Chicken Kebab + Naan', emoji: '🍢', cal: 580, protein: 42, carbs: 52, fat: 22, prepTime: '30 min', description: 'Char-grilled marinated chicken skewers with naan and grilled tomato', tags: ['high-protein'] },
      { name: 'Qorma-e-Sabzi (light)', emoji: '🥬', cal: 500, protein: 24, carbs: 55, fat: 20, prepTime: '30 min', description: 'Beef and spinach stew, restrained oil, with brown rice', tags: ['high-protein'] },
      { name: 'Ashak (veg)', emoji: '🥟', cal: 460, protein: 16, carbs: 70, fat: 14, prepTime: '30 min', description: 'Scallion dumplings with garlic yogurt and meatless lentil sauce', tags: ['vegetarian'] },
      { name: 'Maash Pulao', emoji: '🍚', cal: 520, protein: 20, carbs: 80, fat: 14, prepTime: '30 min', description: 'Mung bean and rice pilaf with caramelized onion', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Gosh Feel (1 pc, light)', emoji: '🥐', cal: 220, protein: 5, carbs: 36, fat: 7, prepTime: '15 min', description: 'One flaky elephant-ear pastry, lightly sugared', tags: ['vegetarian'] },
      { name: 'Roasted Chickpeas (Nakhod)', emoji: '🫘', cal: 170, protein: 9, carbs: 26, fat: 4, prepTime: '10 min', description: 'Crunchy salted chickpeas roasted with cumin', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Shor Nakhod', emoji: '🥣', cal: 240, protein: 11, carbs: 38, fat: 6, prepTime: '15 min', description: 'Warm chickpeas with potato, tamarind and green chili', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
    ],
  },

  'central-asia': {
    breakfast: [
      { name: 'Kattama (light)', emoji: '🫓', cal: 380, protein: 10, carbs: 58, fat: 12, prepTime: '20 min', description: 'Flaky layered flatbread, griddled with minimal oil', tags: ['vegetarian'] },
      { name: 'Syrniki (3 pc, light)', emoji: '🥞', cal: 320, protein: 18, carbs: 36, fat: 12, prepTime: '20 min', description: 'Three pan-fried cottage-cheese cakes with a spoon of sour cream', tags: ['vegetarian'] },
      { name: 'Shurpa Breakfast Bowl', emoji: '🍲', cal: 420, protein: 28, carbs: 38, fat: 18, prepTime: '30 min', description: 'Light lamb-and-vegetable broth soup with a chunk of bread', tags: ['high-protein'] },
      { name: 'Talkan Porridge', emoji: '🥣', cal: 300, protein: 10, carbs: 52, fat: 7, prepTime: '15 min', description: 'Roasted barley porridge with milk and honey', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Plov (chicken, light)', emoji: '🍚', cal: 620, protein: 34, carbs: 75, fat: 20, prepTime: '30 min', description: 'The Silk Road classic: rice pilaf with chicken, carrot and cumin, easy on oil', tags: ['high-protein', 'gluten-free'] },
      { name: 'Lagman (beef)', emoji: '🍜', cal: 640, protein: 32, carbs: 70, fat: 26, prepTime: '30 min', description: 'Hand-pulled noodles in a rich beef-pepper broth with stir-fried vegetables', tags: ['high-protein'] },
      { name: 'Manti (6 pc)', emoji: '🥟', cal: 560, protein: 28, carbs: 60, fat: 22, prepTime: '30 min', description: 'Six steamed dumplings filled with spiced lamb and onion', tags: ['high-protein'] },
      { name: 'Dimlama (veg)', emoji: '🥘', cal: 480, protein: 14, carbs: 72, fat: 16, prepTime: '30 min', description: 'Slow-steamed medley of potato, cabbage, carrot and tomato', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Shashlik (chicken, 3 skewers)', emoji: '🍢', cal: 540, protein: 44, carbs: 30, fat: 26, prepTime: '25 min', description: 'Three flame-grilled chicken skewers with onion and flatbread', tags: ['high-protein'] },
      { name: 'Beshbarmak (light)', emoji: '🍖', cal: 600, protein: 40, carbs: 55, fat: 24, prepTime: '30 min', description: 'Boiled lamb over wide noodles with onion broth, trimmed of excess fat', tags: ['high-protein'] },
      { name: 'Samsa (2 pc, baked)', emoji: '🥐', cal: 520, protein: 22, carbs: 58, fat: 22, prepTime: '30 min', description: 'Two baked pastries stuffed with lamb, onion and pumpkin', tags: ['high-protein'] },
      { name: 'Kuurdak (veg)', emoji: '🥔', cal: 460, protein: 12, carbs: 68, fat: 16, prepTime: '25 min', description: 'Pan-fried potato, pepper and onion hash with herbs', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Kaimak + Baursak (2 pc)', emoji: '🍩', cal: 260, protein: 7, carbs: 38, fat: 10, prepTime: '15 min', description: 'Two puffy fried dough bites with clotted cream and honey', tags: ['vegetarian'] },
      { name: 'Kurt (4 pc)', emoji: '🧀', cal: 160, protein: 12, carbs: 8, fat: 9, prepTime: '10 min', description: 'Four tangy dried yogurt-cheese balls, a nomad staple', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Samsa Veg (1 pc)', emoji: '🥐', cal: 240, protein: 8, carbs: 34, fat: 9, prepTime: '20 min', description: 'One baked pumpkin-and-onion pastry', tags: ['vegetarian'] },
    ],
  },

  'iran': {
    breakfast: [
      { name: 'Adasi', emoji: '🍲', cal: 320, protein: 16, carbs: 48, fat: 8, prepTime: '20 min', description: 'Warming red lentil soup with turmeric and a squeeze of lime', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Nan + Paneer + Sabzi', emoji: '🫓', cal: 380, protein: 16, carbs: 52, fat: 13, prepTime: '10 min', description: 'Flatbread with fresh cheese, walnuts and a bundle of herbs', tags: ['vegetarian'] },
      { name: 'Halim (light)', emoji: '🥣', cal: 420, protein: 24, carbs: 52, fat: 13, prepTime: '30 min', description: 'Slow-cooked wheat and shredded chicken porridge with cinnamon', tags: ['high-protein'] },
      { name: 'Kuku Sabzi (2 slices)', emoji: '🥬', cal: 300, protein: 12, carbs: 22, fat: 18, prepTime: '20 min', description: 'Herb frittata packed with parsley, cilantro and walnuts', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Chelo Kebab (chicken, light)', emoji: '🍢', cal: 640, protein: 42, carbs: 62, fat: 24, prepTime: '30 min', description: 'Char-grilled chicken koobideh with saffron basmati rice and tomato', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ghormeh Sabzi (light)', emoji: '🥬', cal: 560, protein: 30, carbs: 55, fat: 24, prepTime: '30 min', description: 'The beloved herb stew with kidney beans and beef, restrained oil, over rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Zereshk Polo (chicken)', emoji: '🍚', cal: 600, protein: 34, carbs: 75, fat: 18, prepTime: '30 min', description: 'Barberry jeweled rice with saffron chicken', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ash Reshteh', emoji: '🍜', cal: 520, protein: 20, carbs: 78, fat: 14, prepTime: '30 min', description: 'Thick noodle soup with herbs, beans and lentils, crowned with kashk', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Fesenjan (chicken, light)', emoji: '🍗', cal: 580, protein: 34, carbs: 40, fat: 32, prepTime: '30 min', description: 'Pomegranate-walnut stew with chicken, served with a modest scoop of rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tahdig + Khoresh Bademjan', emoji: '🍆', cal: 540, protein: 22, carbs: 70, fat: 20, prepTime: '30 min', description: 'Crisp saffron rice crust with eggplant-tomato beef stew', tags: ['high-protein'] },
      { name: 'Baghali Polo (veg)', emoji: '🍚', cal: 500, protein: 16, carbs: 80, fat: 14, prepTime: '30 min', description: 'Dill and fava-bean rice with a fried egg on top', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Joojeh Kebab + Salad', emoji: '🥗', cal: 560, protein: 40, carbs: 35, fat: 28, prepTime: '25 min', description: 'Saffron-lemon grilled chicken pieces with Shirazi salad', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Kashk Bademjan + Bread', emoji: '🫓', cal: 240, protein: 10, carbs: 30, fat: 10, prepTime: '15 min', description: 'Smoky eggplant and whey dip with toasted sangak', tags: ['vegetarian'] },
      { name: 'Roasted Pistachios (30g)', emoji: '🫘', cal: 170, protein: 6, carbs: 8, fat: 14, prepTime: '10 min', description: 'A handful of lightly salted Persian pistachios', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Kotlet (2 pc, baked)', emoji: '🥩', cal: 260, protein: 18, carbs: 20, fat: 12, prepTime: '20 min', description: 'Two baked potato-beef patties with herbs', tags: ['high-protein', 'gluten-free'] },
    ],
  },

  'turkey': {
    breakfast: [
      { name: 'Menemen (light)', emoji: '🍳', cal: 340, protein: 16, carbs: 26, fat: 20, prepTime: '15 min', description: 'Two eggs scrambled with tomato, green pepper and a little olive oil', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Mercimek Corbasi', emoji: '🍲', cal: 300, protein: 14, carbs: 44, fat: 8, prepTime: '20 min', description: 'Silky red lentil soup with cumin and lemon', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Simit + Peynir (light)', emoji: '🥯', cal: 400, protein: 14, carbs: 58, fat: 13, prepTime: '10 min', description: 'One sesame bagel with white cheese, tomato and cucumber', tags: ['vegetarian'] },
      { name: 'Yumurtali Ispanak', emoji: '🥬', cal: 320, protein: 18, carbs: 18, fat: 20, prepTime: '15 min', description: 'Spinach wilted with onion, topped with two poached eggs', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Adana Kebab (light)', emoji: '🍢', cal: 600, protein: 38, carbs: 45, fat: 28, prepTime: '30 min', description: 'Hand-minced spicy lamb skewer with bulgur pilaf and grilled tomato', tags: ['high-protein'] },
      { name: 'Pide Kasarli (light)', emoji: '🫓', cal: 640, protein: 28, carbs: 72, fat: 26, prepTime: '30 min', description: 'Boat-shaped flatbread with melted cheese and a side salad', tags: ['vegetarian'] },
      { name: 'Grilled Sea Bass + Salad', emoji: '🐟', cal: 520, protein: 40, carbs: 30, fat: 26, prepTime: '25 min', description: 'Whole grilled levrek with olive oil, lemon and shepherd salad', tags: ['high-protein', 'gluten-free'] },
      { name: 'Kuru Fasulye + Pilav', emoji: '🫘', cal: 560, protein: 22, carbs: 88, fat: 14, prepTime: '30 min', description: 'White bean stew in tomato sauce over buttered rice with pickles', tags: ['vegetarian', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Tavuk Sis + Bulgur', emoji: '🍗', cal: 580, protein: 42, carbs: 52, fat: 22, prepTime: '30 min', description: 'Marinated chicken skewers with bulgur pilaf and ezme', tags: ['high-protein'] },
      { name: 'Borek Ispanakli (2 pc, baked)', emoji: '🥐', cal: 500, protein: 18, carbs: 58, fat: 22, prepTime: '25 min', description: 'Two baked spinach-feta pastries with yogurt', tags: ['vegetarian'] },
      { name: 'Hamsi Tava (light)', emoji: '🐟', cal: 540, protein: 36, carbs: 48, fat: 22, prepTime: '20 min', description: 'Lightly fried Black Sea anchovies with cornmeal crust and salad', tags: ['high-protein'] },
      { name: 'Imam Bayildi', emoji: '🍆', cal: 470, protein: 12, carbs: 52, fat: 24, prepTime: '30 min', description: 'Eggplant braised in olive oil with tomato and onion, served at room temperature', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Midye Dolma (4 pc)', emoji: '🦪', cal: 220, protein: 12, carbs: 32, fat: 5, prepTime: '15 min', description: 'Four mussels stuffed with spiced rice, served with lemon', tags: ['high-protein'] },
      { name: 'Kisir', emoji: '🥗', cal: 200, protein: 6, carbs: 34, fat: 6, prepTime: '15 min', description: 'Fine bulgur salad with pomegranate molasses, mint and tomato', tags: ['vegetarian', 'vegan'] },
      { name: 'Ayran + Galeta', emoji: '🥛', cal: 150, protein: 8, carbs: 22, fat: 4, prepTime: '10 min', description: 'Salted yogurt drink with two sesame breadsticks', tags: ['vegetarian'] },
    ],
  },

  'levant': {
    breakfast: [
      { name: 'Labneh + Zaatar + Pita', emoji: '🫓', cal: 350, protein: 14, carbs: 42, fat: 15, prepTime: '10 min', description: 'Creamy strained yogurt with zaatar and olive oil, warm pita', tags: ['vegetarian'] },
      { name: 'Falafel Wrap (3 pc, baked)', emoji: '🥙', cal: 420, protein: 16, carbs: 58, fat: 14, prepTime: '20 min', description: 'Three baked chickpea patties in pita with tahini and pickles', tags: ['vegetarian', 'vegan'] },
      { name: 'Shakshuka (light)', emoji: '🍳', cal: 320, protein: 16, carbs: 28, fat: 16, prepTime: '20 min', description: 'Two eggs poached in cumin-spiced tomato sauce with pita', tags: ['vegetarian'] },
      { name: 'Foul + Hummus Bowl', emoji: '🫘', cal: 380, protein: 16, carbs: 50, fat: 14, prepTime: '15 min', description: 'Fava beans and hummus swirled with olive oil, lemon and parsley', tags: ['vegetarian', 'vegan'] },
    ],
    lunch: [
      { name: 'Kafta Grill + Tabbouleh', emoji: '🍢', cal: 580, protein: 36, carbs: 42, fat: 28, prepTime: '25 min', description: 'Grilled spiced beef skewers with parsley-bulgur tabbouleh', tags: ['high-protein'] },
      { name: 'Mujadara', emoji: '🍚', cal: 520, protein: 18, carbs: 82, fat: 14, prepTime: '30 min', description: 'Lentils and rice crowned with caramelized onions and yogurt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Shawarma Plate (light)', emoji: '🍗', cal: 600, protein: 40, carbs: 48, fat: 26, prepTime: '25 min', description: 'Shaved marinated chicken with garlic sauce, pickles and half pita', tags: ['high-protein'] },
      { name: 'Falafel Plate (6 pc, baked)', emoji: '🧆', cal: 540, protein: 20, carbs: 72, fat: 20, prepTime: '25 min', description: 'Six baked falafel with hummus, fattoush and tahini', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
    dinner: [
      { name: 'Grilled Kafta + Fattoush', emoji: '🥗', cal: 560, protein: 34, carbs: 45, fat: 26, prepTime: '25 min', description: 'Two beef kafta skewers over sumac-dressed bread salad', tags: ['high-protein'] },
      { name: 'Sayadieh', emoji: '🐟', cal: 580, protein: 38, carbs: 62, fat: 20, prepTime: '30 min', description: 'Spiced rice with fried fish and onion-tahini sauce', tags: ['high-protein'] },
      { name: 'Musakhan (light)', emoji: '🍗', cal: 600, protein: 36, carbs: 60, fat: 24, prepTime: '30 min', description: 'Sumac chicken over taboon bread with caramelized onions and pine nuts', tags: ['high-protein'] },
      { name: 'Loubieh bi Zeit', emoji: '🫛', cal: 450, protein: 14, carbs: 60, fat: 18, prepTime: '25 min', description: 'Green beans braised in olive oil and tomato, served with rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Hummus + Pita Chips (baked)', emoji: '🫓', cal: 220, protein: 8, carbs: 32, fat: 8, prepTime: '10 min', description: 'Classic chickpea-tahini dip with baked pita triangles', tags: ['vegetarian', 'vegan'] },
      { name: 'Manoushe Zaatar (small)', emoji: '🍕', cal: 260, protein: 8, carbs: 40, fat: 9, prepTime: '15 min', description: 'Small thyme-and-sesame flatbread with olive oil', tags: ['vegetarian', 'vegan'] },
      { name: 'Kibbeh (2 pc, baked)', emoji: '🥩', cal: 280, protein: 20, carbs: 22, fat: 13, prepTime: '25 min', description: 'Two baked bulgur shells stuffed with spiced minced beef', tags: ['high-protein'] },
    ],
  },

  'egypt': {
    breakfast: [
      { name: 'Ful Medames', emoji: '🫘', cal: 380, protein: 16, carbs: 50, fat: 14, prepTime: '20 min', description: 'The national breakfast of Egypt: slow-cooked fava beans with olive oil, lemon and cumin', tags: ['vegetarian', 'vegan'] },
      { name: 'Taameya (3 pc, baked)', emoji: '🧆', cal: 360, protein: 14, carbs: 48, fat: 13, prepTime: '20 min', description: 'Three baked fava-bean falafel with tahini and baladi bread', tags: ['vegetarian', 'vegan'] },
      { name: 'Shakshuka (Egyptian)', emoji: '🍳', cal: 340, protein: 17, carbs: 28, fat: 18, prepTime: '20 min', description: 'Two eggs in a smoky tomato-pepper sauce with whole wheat baladi', tags: ['vegetarian'] },
      { name: 'Fateer Cheese (light)', emoji: '🥞', cal: 420, protein: 14, carbs: 60, fat: 14, prepTime: '25 min', description: 'Layered flaky pastry with light white cheese and honey drizzle', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Koshari', emoji: '🍚', cal: 620, protein: 22, carbs: 102, fat: 14, prepTime: '30 min', description: 'The iconic mix: rice, lentils, macaroni and chickpeas with spicy tomato sauce', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Kofta + Rice', emoji: '🍢', cal: 600, protein: 36, carbs: 62, fat: 22, prepTime: '25 min', description: 'Char-grilled spiced beef fingers with vermicelli rice and salad', tags: ['high-protein'] },
      { name: 'Molokhia + Chicken', emoji: '🥬', cal: 560, protein: 38, carbs: 55, fat: 20, prepTime: '30 min', description: 'Jute-leaf stew with garlic over rice and poached chicken', tags: ['high-protein', 'gluten-free'] },
      { name: 'Hawawshi (light, baked)', emoji: '🫓', cal: 640, protein: 32, carbs: 58, fat: 30, prepTime: '25 min', description: 'Baladi bread stuffed with spiced minced beef, baked not fried', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Fateh (chicken, light)', emoji: '🍗', cal: 580, protein: 36, carbs: 62, fat: 20, prepTime: '30 min', description: 'Layered rice, crisp bread and chicken with garlic-vinegar yogurt', tags: ['high-protein'] },
      { name: 'Samak Mashwi', emoji: '🐟', cal: 540, protein: 40, carbs: 45, fat: 22, prepTime: '25 min', description: 'Whole grilled sea bass with cumin, lemon and tahini salad', tags: ['high-protein', 'gluten-free'] },
      { name: 'Mahshi (veg)', emoji: '🫑', cal: 500, protein: 14, carbs: 82, fat: 14, prepTime: '30 min', description: 'Zucchini and peppers stuffed with herbed rice in tomato broth', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Torly', emoji: '🥘', cal: 560, protein: 30, carbs: 60, fat: 22, prepTime: '30 min', description: 'Slow-baked beef with potato, carrot and peas in tomato sauce', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Tirmis', emoji: '🫘', cal: 150, protein: 12, carbs: 16, fat: 5, prepTime: '10 min', description: 'Brined lupini beans with cumin and lemon, Alexandria street style', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Dukkah + Bread + Olive Oil', emoji: '🫓', cal: 240, protein: 7, carbs: 30, fat: 12, prepTime: '10 min', description: 'Nut-seed-spice dip with baladi bread and olive oil', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Halloumi (60g)', emoji: '🧀', cal: 200, protein: 12, carbs: 4, fat: 16, prepTime: '10 min', description: 'Seared salty cheese with mint and tomato', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
    ],
  },

  'maghreb': {
    breakfast: [
      { name: 'Msemen (1 pc, light)', emoji: '🫓', cal: 350, protein: 8, carbs: 58, fat: 11, prepTime: '20 min', description: 'Square griddled flatbread with honey and a smear of butter', tags: ['vegetarian'] },
      { name: 'Harira (small bowl)', emoji: '🍲', cal: 300, protein: 14, carbs: 46, fat: 8, prepTime: '25 min', description: 'Tomato-lentil-chickpea soup with cilantro, a Ramadan favorite', tags: ['vegetarian', 'vegan'] },
      { name: 'Shakshuka Maghrebi', emoji: '🍳', cal: 340, protein: 16, carbs: 28, fat: 18, prepTime: '20 min', description: 'Two eggs in harissa-spiced tomato sauce with khobz bread', tags: ['vegetarian'] },
      { name: 'Bissara', emoji: '🫘', cal: 320, protein: 14, carbs: 44, fat: 10, prepTime: '20 min', description: 'Silky split-pea and fava dip with olive oil, cumin and paprika', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Couscous Tfaya (chicken)', emoji: '🍗', cal: 620, protein: 36, carbs: 80, fat: 18, prepTime: '30 min', description: 'Steamed semolina with chicken, caramelized onion and raisins', tags: ['high-protein'] },
      { name: 'Chicken Tagine (lemon & olive)', emoji: '🫒', cal: 580, protein: 38, carbs: 48, fat: 26, prepTime: '30 min', description: 'Preserved-lemon chicken slow-cooked with olives, served with bread', tags: ['high-protein'] },
      { name: 'Loubia', emoji: '🫘', cal: 520, protein: 20, carbs: 76, fat: 14, prepTime: '30 min', description: 'White bean stew in tomato-cumin sauce with khobz', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Fish (Chermoula)', emoji: '🐟', cal: 560, protein: 40, carbs: 42, fat: 24, prepTime: '25 min', description: 'Chermoula-marinated sea bream, grilled, with couscous', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Tagine Kefta', emoji: '🥗', cal: 560, protein: 34, carbs: 45, fat: 26, prepTime: '30 min', description: 'Spiced beef meatballs poached in tomato sauce with a baked egg', tags: ['high-protein'] },
      { name: 'Couscous Seven Vegetables', emoji: '🥕', cal: 540, protein: 16, carbs: 88, fat: 14, prepTime: '30 min', description: 'Friday couscous piled with carrot, zucchini, pumpkin and chickpeas', tags: ['vegetarian', 'vegan'] },
      { name: 'Rfissa (chicken, light)', emoji: '🍗', cal: 600, protein: 34, carbs: 68, fat: 22, prepTime: '30 min', description: 'Shredded msemen with chicken, lentils and fenugreek broth', tags: ['high-protein'] },
      { name: 'Tanjia (light)', emoji: '🥩', cal: 580, protein: 38, carbs: 40, fat: 28, prepTime: '30 min', description: 'Slow-cooked beef with preserved lemon and garlic, easy on the fat', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Chebakia (2 pc, light)', emoji: '🍯', cal: 220, protein: 5, carbs: 36, fat: 7, prepTime: '15 min', description: 'Two sesame-honey cookies, lightly soaked', tags: ['vegetarian'] },
      { name: 'Roasted Almonds (25g)', emoji: '🌰', cal: 150, protein: 6, carbs: 6, fat: 13, prepTime: '10 min', description: 'A small handful of dry-roasted almonds', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Sardine Kefta (3 pc)', emoji: '🐟', cal: 240, protein: 22, carbs: 14, fat: 11, prepTime: '20 min', description: 'Three pan-fried sardine patties with chermoula', tags: ['high-protein'] },
    ],
  },

  'china': {
    breakfast: [
      { name: 'Century Egg & Pork Congee', emoji: '🥣', cal: 320, protein: 18, carbs: 45, fat: 6, prepTime: '25 min', description: 'Silky rice porridge with century egg, shredded pork and ginger', tags: ['gluten-free'] },
      { name: 'Vegetable Steamed Dumplings', emoji: '🥟', cal: 300, protein: 10, carbs: 52, fat: 6, prepTime: '20 min', description: 'Delicate wheat wrappers filled with bok choy, mushroom and bamboo shoot', tags: ['vegetarian'] },
      { name: 'Fresh Soy Milk & Youtiao (Light)', emoji: '🥛', cal: 350, protein: 12, carbs: 48, fat: 12, prepTime: '10 min', description: 'Warm fresh soy milk with a small crisp fried dough stick for dipping', tags: ['vegetarian'] },
      { name: 'Scallion Pancake & Fried Egg', emoji: '🫓', cal: 380, protein: 12, carbs: 50, fat: 14, prepTime: '15 min', description: 'Flaky scallion pancake with a fried egg and black vinegar dip', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Mapo Tofu (Light, Veggie)', emoji: '🌶️', cal: 480, protein: 24, carbs: 40, fat: 22, prepTime: '20 min', description: 'Silken tofu in numbing-spicy bean sauce with mushrooms instead of pork, over rice', tags: ['vegetarian', 'high-protein'] },
      { name: 'Kung Pao Chicken (Light)', emoji: '🍗', cal: 520, protein: 36, carbs: 40, fat: 18, prepTime: '25 min', description: 'Diced chicken wok-tossed with peanuts, dried chilies and scallions over rice', tags: ['high-protein'] },
      { name: 'Pork & Shrimp Wonton Soup', emoji: '🍲', cal: 450, protein: 26, carbs: 48, fat: 14, prepTime: '25 min', description: 'Hand-wrapped pork and shrimp wontons in clear ginger-scallion broth', tags: ['high-protein'] },
      { name: 'Buddha’s Delight with Rice', emoji: '🥗', cal: 460, protein: 18, carbs: 62, fat: 14, prepTime: '20 min', description: 'Braised mixed vegetables, tofu and black mushrooms in light mushroom sauce, with rice', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Steamed Sea Bass, Ginger & Scallion', emoji: '🐟', cal: 480, protein: 38, carbs: 35, fat: 18, prepTime: '25 min', description: 'Whole sea bass steamed with ginger, scallions and light soy, with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Twice-Cooked Pork (Light)', emoji: '🥩', cal: 580, protein: 32, carbs: 42, fat: 26, prepTime: '30 min', description: 'Lean pork belly twice-cooked with leeks, peppers and black bean sauce, with rice', tags: ['high-protein'] },
      { name: 'Tomato Egg Stir-Fry', emoji: '🍅', cal: 460, protein: 18, carbs: 62, fat: 12, prepTime: '15 min', description: 'Classic sweet-tart tomato and fluffy egg stir-fry over steamed rice', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Lion’s Head Meatballs (Light)', emoji: '🍖', cal: 520, protein: 30, carbs: 45, fat: 22, prepTime: '30 min', description: 'Giant braised pork meatballs with napa cabbage in savory broth, with rice', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Tea Egg', emoji: '🥚', cal: 120, protein: 10, carbs: 4, fat: 7, prepTime: '10 min', description: 'Marbled egg simmered in spiced black tea and star anise', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Red Bean Steamed Bun', emoji: '🍡', cal: 200, protein: 5, carbs: 42, fat: 2, prepTime: '15 min', description: 'Fluffy steamed bun with sweet red bean paste', tags: ['vegetarian', 'vegan'] },
      { name: 'Smashed Cucumber Salad', emoji: '🥒', cal: 130, protein: 4, carbs: 14, fat: 7, prepTime: '10 min', description: 'Smashed cucumbers in garlic black-vinegar dressing with sesame', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'taiwan': {
    breakfast: [
      { name: 'Dan Bing', emoji: '🫓', cal: 300, protein: 12, carbs: 40, fat: 10, prepTime: '15 min', description: 'Soft wheat-egg crepe with scallions, rolled with sweet soy paste', tags: ['vegetarian'] },
      { name: 'Vegetarian Fan Tuan', emoji: '🍙', cal: 340, protein: 12, carbs: 58, fat: 6, prepTime: '15 min', description: 'Sticky rice roll with pickled mustard greens, egg and crispy dough bits', tags: ['vegetarian'] },
      { name: 'Oyster Omelette (Mini, Light)', emoji: '🦪', cal: 350, protein: 20, carbs: 30, fat: 16, prepTime: '15 min', description: 'Crispy-edged egg omelette with plump oysters and sweet chili sauce', tags: ['high-protein'] },
      { name: 'Sweet Potato Congee', emoji: '🍠', cal: 280, protein: 8, carbs: 55, fat: 4, prepTime: '25 min', description: 'Gentle rice porridge with chunks of golden sweet potato', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Beef Noodle Soup (Light)', emoji: '🍜', cal: 580, protein: 38, carbs: 60, fat: 18, prepTime: '30 min', description: 'Slow-braised beef shank in aromatic broth with wheat noodles and bok choy', tags: ['high-protein'] },
      { name: 'Braised Pork Rice (Small)', emoji: '🍚', cal: 520, protein: 22, carbs: 62, fat: 18, prepTime: '25 min', description: 'Small bowl of rice topped with melt-in-mouth braised minced pork', tags: ['high-protein'] },
      { name: 'Three-Cup Chicken (Light)', emoji: '🍗', cal: 540, protein: 36, carbs: 30, fat: 28, prepTime: '25 min', description: 'Basil, ginger and garlic chicken in sesame oil with rice', tags: ['high-protein'] },
      { name: 'Braised Bamboo & Mushroom Rice', emoji: '🍄', cal: 460, protein: 14, carbs: 72, fat: 12, prepTime: '20 min', description: 'Braised bamboo shoots and shiitake over rice in savory vegetarian sauce', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Danzai Noodles (Light)', emoji: '🍜', cal: 480, protein: 22, carbs: 60, fat: 16, prepTime: '20 min', description: 'Tainan-style noodles with minced pork, shrimp and bean sprouts in rich shrimp broth', tags: ['high-protein'] },
      { name: 'Steamed Fish with Black Beans', emoji: '🐟', cal: 500, protein: 36, carbs: 30, fat: 22, prepTime: '25 min', description: 'Delicate white fish steamed with fermented black beans, ginger and scallion, with rice', tags: ['high-protein'] },
      { name: 'Hakka Stir-Fry (Light)', emoji: '🥬', cal: 520, protein: 28, carbs: 40, fat: 26, prepTime: '25 min', description: 'Pork, squid and tofu stir-fried with celery in savory sauce, with rice', tags: ['high-protein'] },
      { name: 'Taiwanese Buddha’s Delight', emoji: '🥗', cal: 450, protein: 16, carbs: 65, fat: 12, prepTime: '25 min', description: 'Braised gluten, tofu and seasonal greens in light soy broth with rice', tags: ['vegetarian', 'vegan'] },
    ],
    snack: [
      { name: 'Douhua (Light)', emoji: '🍮', cal: 150, protein: 8, carbs: 24, fat: 2, prepTime: '10 min', description: 'Silky tofu pudding with ginger syrup and soft peanuts', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Mini Pineapple Cake', emoji: '🍍', cal: 220, protein: 3, carbs: 40, fat: 6, prepTime: '10 min', description: 'Buttery shortcrust with tangy pineapple jam filling', tags: ['vegetarian'] },
      { name: 'Scallion Pancake Bites', emoji: '🥞', cal: 200, protein: 5, carbs: 30, fat: 7, prepTime: '10 min', description: 'Crispy pan-fried scallion pancake cut into shareable bites', tags: ['vegetarian'] },
    ],
  },

  'thailand': {
    breakfast: [
      { name: 'Jok Moo (Pork Porridge)', emoji: '🥣', cal: 320, protein: 20, carbs: 42, fat: 6, prepTime: '25 min', description: 'Thick Thai rice porridge with minced pork, ginger and soft egg', tags: ['high-protein', 'gluten-free'] },
      { name: 'Khao Tom (Veggie)', emoji: '🍚', cal: 280, protein: 10, carbs: 52, fat: 4, prepTime: '20 min', description: 'Light boiled-rice soup with mushrooms, greens and fried garlic', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Khai Jiao with Rice', emoji: '🍳', cal: 380, protein: 16, carbs: 45, fat: 14, prepTime: '15 min', description: 'Puffy crisp-edged Thai omelette over jasmine rice with lime-chili on the side', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Nam Tao Hu & Pa Thong Ko', emoji: '🥛', cal: 330, protein: 12, carbs: 52, fat: 8, prepTime: '10 min', description: 'Warm sweetened soy milk with two crisp Thai-Chinese crullers', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Pad Thai Goong (Light)', emoji: '🍜', cal: 560, protein: 28, carbs: 68, fat: 16, prepTime: '25 min', description: 'Tamarind rice noodles with shrimp, egg, bean sprouts and crushed peanut', tags: ['high-protein'] },
      { name: 'Green Curry Gai (Light Coconut)', emoji: '🍛', cal: 520, protein: 34, carbs: 42, fat: 22, prepTime: '25 min', description: 'Fragrant green curry with chicken, Thai eggplant and basil over jasmine rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Som Tum Jay with Tofu & Sticky Rice', emoji: '🥗', cal: 460, protein: 14, carbs: 72, fat: 12, prepTime: '20 min', description: 'Fiery meat-free green papaya salad with lime and peanut, grilled tofu and sticky rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Khao Man Gai (Light)', emoji: '🍗', cal: 540, protein: 36, carbs: 55, fat: 16, prepTime: '30 min', description: 'Poached chicken with fragrant oily rice (light), cucumber and ginger-chili sauce', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Tom Yum Goong with Rice', emoji: '🍤', cal: 480, protein: 32, carbs: 48, fat: 14, prepTime: '25 min', description: 'Hot-sour lemongrass broth loaded with prawns and mushrooms, with jasmine rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Massaman Nuea (Light)', emoji: '🥘', cal: 600, protein: 32, carbs: 48, fat: 28, prepTime: '30 min', description: 'Mild aromatic curry with tender beef, potatoes and roasted peanuts, with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pad Kra Pao Gai (Light)', emoji: '🌶️', cal: 520, protein: 36, carbs: 50, fat: 16, prepTime: '20 min', description: 'Wok-fired minced chicken with holy basil, chilies and fried egg over rice', tags: ['high-protein'] },
      { name: 'Pad Pak Ruam with Tofu', emoji: '🥬', cal: 450, protein: 16, carbs: 62, fat: 14, prepTime: '20 min', description: 'Crisp garden vegetables and tofu wok-tossed in light garlic-soy with jasmine rice', tags: ['vegetarian', 'vegan'] },
    ],
    snack: [
      { name: 'Chicken Satay (3 sticks)', emoji: '🍢', cal: 220, protein: 20, carbs: 8, fat: 12, prepTime: '15 min', description: 'Char-grilled turmeric chicken skewers with light peanut sauce', tags: ['high-protein', 'gluten-free'] },
      { name: 'Mango Sticky Rice (Small)', emoji: '🥭', cal: 260, protein: 4, carbs: 55, fat: 5, prepTime: '10 min', description: 'Sweet mango with a small scoop of coconut sticky rice', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Tod Mun Pla (2 pc, Light)', emoji: '🐠', cal: 180, protein: 14, carbs: 12, fat: 8, prepTime: '15 min', description: 'Bouncy Thai fish cakes with red curry paste and cucumber relish', tags: ['high-protein'] },
    ],
  },

  'vietnam': {
    breakfast: [
      { name: 'Pho Bo (Light)', emoji: '🍜', cal: 420, protein: 30, carbs: 48, fat: 10, prepTime: '30 min', description: 'Aromatic beef broth with flat rice noodles, rare beef and fresh herbs', tags: ['high-protein', 'gluten-free'] },
      { name: 'Banh Mi Op La', emoji: '🥖', cal: 360, protein: 14, carbs: 50, fat: 10, prepTime: '15 min', description: 'Crispy baguette with fried eggs, pickled daikon-carrot and cilantro', tags: ['vegetarian'] },
      { name: 'Xoi (Veggie)', emoji: '🍚', cal: 320, protein: 8, carbs: 62, fat: 5, prepTime: '20 min', description: 'Coconut sticky rice with mung bean, sesame salt and scallion oil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chao Ga', emoji: '🥣', cal: 300, protein: 18, carbs: 44, fat: 5, prepTime: '25 min', description: 'Silky chicken rice porridge with ginger, scallion and fried shallot', tags: ['gluten-free'] },
    ],
    lunch: [
      { name: 'Bun Cha', emoji: '🥩', cal: 560, protein: 30, carbs: 62, fat: 18, prepTime: '30 min', description: 'Char-grilled pork patties with rice vermicelli, herbs and tangy dipping broth', tags: ['high-protein'] },
      { name: 'Banh Mi Ga (Whole Grain)', emoji: '🥪', cal: 480, protein: 28, carbs: 55, fat: 14, prepTime: '15 min', description: 'Whole-grain baguette with lemongrass chicken, pickles and light chili mayo', tags: ['high-protein'] },
      { name: 'Goi Cuon Tom Thit (4 pc)', emoji: '🦐', cal: 450, protein: 22, carbs: 55, fat: 12, prepTime: '20 min', description: 'Four translucent rolls of shrimp, pork, vermicelli and herbs with hoisin-peanut dip', tags: ['high-protein'] },
      { name: 'Pho Chay', emoji: '🍲', cal: 450, protein: 16, carbs: 70, fat: 10, prepTime: '25 min', description: 'Fragrant mushroom-star anise broth with rice noodles, tofu and Thai basil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Com Tam Suon', emoji: '🍖', cal: 620, protein: 34, carbs: 70, fat: 20, prepTime: '30 min', description: 'Broken rice with lemongrass pork chop, shredded pork skin and steamed egg', tags: ['high-protein'] },
      { name: 'Ca Kho To (Light)', emoji: '🐟', cal: 520, protein: 34, carbs: 45, fat: 20, prepTime: '30 min', description: 'Caramel-braised catfish in clay pot with steamed rice and greens', tags: ['high-protein'] },
      { name: 'Bo Luc Lac (Light)', emoji: '🥘', cal: 560, protein: 36, carbs: 35, fat: 28, prepTime: '25 min', description: 'Wok-seared cubed beef with watercress, tomato and lime-pepper dip, with rice', tags: ['high-protein'] },
      { name: 'Dau Hu Sot Ca Chua', emoji: '🍅', cal: 460, protein: 20, carbs: 58, fat: 14, prepTime: '20 min', description: 'Golden fried tofu braised in tangy tomato sauce with steamed rice', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
    ],
    snack: [
      { name: 'Banh Flan (Light)', emoji: '🍮', cal: 180, protein: 6, carbs: 30, fat: 4, prepTime: '10 min', description: 'Silky Vietnamese caramel custard, lightly sweetened', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Che Bap (Light)', emoji: '🌽', cal: 200, protein: 4, carbs: 44, fat: 3, prepTime: '15 min', description: 'Warm sweet-corn pudding with coconut cream drizzle', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Banh Trang Nuong (Veggie)', emoji: '🫓', cal: 220, protein: 8, carbs: 38, fat: 4, prepTime: '10 min', description: 'Crispy grilled rice paper with egg, scallion and chili sauce', tags: ['vegetarian'] },
    ],
  },

  'mekong': {
    breakfast: [
      { name: 'Mohinga (Light)', emoji: '🍜', cal: 380, protein: 22, carbs: 55, fat: 8, prepTime: '30 min', description: 'Myanmar’s beloved lemongrass fish chowder with rice noodles, egg and light crispy fritters', tags: ['high-protein'] },
      { name: 'Laphet Thoke (Small)', emoji: '🥗', cal: 300, protein: 8, carbs: 28, fat: 18, prepTime: '15 min', description: 'Fermented tea leaves tossed with peanuts, sesame, tomato and lime (no dried shrimp)', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Khao Piak Sen Gai', emoji: '🍲', cal: 360, protein: 24, carbs: 48, fat: 8, prepTime: '25 min', description: 'Lao-style chewy rice noodles in clear chicken broth with herbs', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tofu Nway', emoji: '🥣', cal: 280, protein: 14, carbs: 40, fat: 6, prepTime: '20 min', description: 'Creamy chickpea-tofu porridge with crispy shallots and chili oil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Larb Gai (Light)', emoji: '🌶️', cal: 460, protein: 36, carbs: 25, fat: 22, prepTime: '20 min', description: 'Zesty Lao minced-chicken salad with toasted rice powder, mint and lime, with sticky rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Fish Amok', emoji: '🐟', cal: 480, protein: 32, carbs: 30, fat: 24, prepTime: '30 min', description: 'Cambodian steamed fish custard in banana leaf with kroeung curry and coconut, with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tofu Hin with Rice', emoji: '🍛', cal: 470, protein: 18, carbs: 60, fat: 16, prepTime: '25 min', description: 'Silky chickpea-tofu simmered in turmeric-onion curry with steamed rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Bai Sach Chrouk', emoji: '🍖', cal: 520, protein: 28, carbs: 62, fat: 16, prepTime: '25 min', description: 'Cambodian coconut-grilled pork over broken rice with pickled vegetables', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Burmese Chicken Curry (Light)', emoji: '🥘', cal: 560, protein: 36, carbs: 50, fat: 20, prepTime: '30 min', description: 'Home-style Burmese chicken curry with potatoes and turmeric rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ping Pa', emoji: '🐠', cal: 500, protein: 38, carbs: 30, fat: 24, prepTime: '25 min', description: 'Whole river fish grilled in banana leaf with dill and lime, with sticky rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Samlor Korko with Rice', emoji: '🥬', cal: 450, protein: 14, carbs: 68, fat: 12, prepTime: '25 min', description: 'Cambodian kroeung-spiced vegetable soup with pumpkin and morning glory, with rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Ohn No Khao Swe (Light)', emoji: '🍜', cal: 540, protein: 30, carbs: 58, fat: 20, prepTime: '30 min', description: 'Burmese coconut chicken noodle soup with crispy noodle topping and lime', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Baked Burmese Samosa (2 pc)', emoji: '🥟', cal: 220, protein: 6, carbs: 36, fat: 6, prepTime: '15 min', description: 'Crisp baked samosas with spiced potato-pea filling and tamarind dip', tags: ['vegetarian', 'vegan'] },
      { name: 'Num Kom', emoji: '🥥', cal: 200, protein: 4, carbs: 38, fat: 4, prepTime: '15 min', description: 'Steamed palm-sugar coconut rice cake wrapped in banana leaf', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Crispy Tofu with Tamarind', emoji: '🍘', cal: 180, protein: 10, carbs: 14, fat: 10, prepTime: '15 min', description: 'Golden chickpea-tofu cubes with sweet-tart tamarind dip', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
  },

  'indonesia': {
    breakfast: [
      { name: 'Bubur Ayam', emoji: '🥣', cal: 340, protein: 22, carbs: 45, fat: 6, prepTime: '25 min', description: 'Savory chicken rice porridge with shredded chicken, cakwe bits and scallion', tags: ['high-protein', 'gluten-free'] },
      { name: 'Nasi Uduk (Small, Veggie)', emoji: '🍚', cal: 360, protein: 10, carbs: 58, fat: 10, prepTime: '20 min', description: 'Fragrant coconut rice with tempeh orek, cucumber and light sambal', tags: ['vegetarian'] },
      { name: 'Pisang Goreng Panggang (2 pc)', emoji: '🍌', cal: 250, protein: 4, carbs: 52, fat: 4, prepTime: '15 min', description: 'Caramelized baked banana fritters with a whisper of palm sugar', tags: ['vegetarian', 'vegan'] },
      { name: 'Gado-Gado Bowl (Small)', emoji: '🥗', cal: 380, protein: 14, carbs: 48, fat: 14, prepTime: '20 min', description: 'Blanched greens, tofu and lontong with light peanut dressing and small krupuk', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Nasi Goreng Ayam (Light)', emoji: '🥘', cal: 560, protein: 30, carbs: 65, fat: 18, prepTime: '25 min', description: 'Smoky wok-fried rice with chicken, egg ribbons and krupuk (light oil)', tags: ['high-protein'] },
      { name: 'Soto Ayam (Light)', emoji: '🍲', cal: 450, protein: 32, carbs: 42, fat: 14, prepTime: '30 min', description: 'Golden turmeric chicken soup with rice cakes, egg and bean sprouts', tags: ['high-protein', 'gluten-free'] },
      { name: 'Gado-Gado', emoji: '🥬', cal: 520, protein: 20, carbs: 55, fat: 22, prepTime: '25 min', description: 'Rainbow blanched vegetables, tempeh and egg under creamy peanut sauce with rice', tags: ['vegetarian', 'high-protein'] },
      { name: 'Ikan Bakar', emoji: '🐟', cal: 500, protein: 38, carbs: 35, fat: 18, prepTime: '30 min', description: 'Char-grilled fish in banana leaf with sambal dabu-dabu and steamed rice', tags: ['high-protein'] },
    ],
    dinner: [
      { name: 'Ayam Rendang (Light)', emoji: '🍛', cal: 580, protein: 38, carbs: 40, fat: 28, prepTime: '30 min', description: 'Slow-braised chicken in lightened coconut rendang spices with steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Sayur Lodeh with Tempeh', emoji: '🥥', cal: 460, protein: 16, carbs: 58, fat: 16, prepTime: '25 min', description: 'Mixed vegetables simmered in light coconut-turmeric broth with rice and fried tempeh', tags: ['vegetarian', 'vegan'] },
      { name: 'Ayam Bakar', emoji: '🍗', cal: 540, protein: 40, carbs: 38, fat: 20, prepTime: '30 min', description: 'Sweet-soy marinated grilled chicken with lalapan greens, rice and sambal', tags: ['high-protein'] },
      { name: 'Pepes Tahu', emoji: '🌿', cal: 450, protein: 20, carbs: 45, fat: 20, prepTime: '25 min', description: 'Spiced tofu steamed in banana leaf with basil and lemongrass, with rice', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Baked Tempeh Chips', emoji: '🫓', cal: 180, protein: 12, carbs: 12, fat: 10, prepTime: '15 min', description: 'Crisp baked tempeh chips dusted with garlic salt', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Dadar Gulung (Light)', emoji: '🥞', cal: 200, protein: 4, carbs: 42, fat: 4, prepTime: '15 min', description: 'Green pandan crepe rolled around palm-sugar coconut', tags: ['vegetarian'] },
      { name: 'Rujak Buah', emoji: '🍍', cal: 150, protein: 2, carbs: 36, fat: 1, prepTime: '10 min', description: 'Crisp tropical fruits tossed in sweet-spicy palm-sugar dressing', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'malaysia-singapore': {
    breakfast: [
      { name: 'Nasi Lemak (Small, No Anchovy)', emoji: '🍚', cal: 420, protein: 14, carbs: 62, fat: 12, prepTime: '20 min', description: 'Coconut rice with veggie sambal, cucumber, peanuts and half a boiled egg', tags: ['vegetarian'] },
      { name: 'Roti Canai with Dhal (Light)', emoji: '🫓', cal: 380, protein: 10, carbs: 58, fat: 12, prepTime: '15 min', description: 'Flaky whole-wheat flatbread with light lentil dhal for dipping', tags: ['vegetarian'] },
      { name: 'Kaya Toast (Whole Grain, Light)', emoji: '🍞', cal: 300, protein: 8, carbs: 52, fat: 6, prepTime: '10 min', description: 'Toasted whole-grain bread with light kaya and soft-boiled eggs', tags: ['vegetarian'] },
      { name: 'Chee Cheong Fun (Veggie)', emoji: '🍥', cal: 280, protein: 8, carbs: 55, fat: 4, prepTime: '15 min', description: 'Silky steamed rice-noodle rolls with sweet soy and sesame', tags: ['vegetarian', 'vegan'] },
    ],
    lunch: [
      { name: 'Hainanese Chicken Rice (Light)', emoji: '🍗', cal: 560, protein: 38, carbs: 60, fat: 16, prepTime: '30 min', description: 'Silky poached chicken with fragrant oily rice (light), cucumber and chili-ginger', tags: ['high-protein'] },
      { name: 'Laksa (Light)', emoji: '🍜', cal: 520, protein: 28, carbs: 55, fat: 20, prepTime: '25 min', description: 'Lightened coconut-lemongrass broth with prawns, tofu puffs and rice noodles', tags: ['high-protein'] },
      { name: 'Yong Tau Foo Soup', emoji: '🍲', cal: 450, protein: 26, carbs: 48, fat: 14, prepTime: '25 min', description: 'Tofu and vegetables stuffed with seasoned fish paste in clear broth with noodles', tags: ['high-protein'] },
      { name: 'Nasi Kerabu (Veggie)', emoji: '🌿', cal: 460, protein: 14, carbs: 70, fat: 12, prepTime: '25 min', description: 'Butterfly-pea blue rice with fresh ulam herbs, coconut and light sambal', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Char Kway Teow (Light)', emoji: '🥘', cal: 580, protein: 26, carbs: 70, fat: 20, prepTime: '25 min', description: 'Wok-breath flat rice noodles with prawns, egg and chives, light on oil', tags: ['high-protein'] },
      { name: 'Assam Pedas Ikan (Light)', emoji: '🐟', cal: 500, protein: 36, carbs: 40, fat: 20, prepTime: '30 min', description: 'Tamarind-spicy fish stew with okra and eggplant, with steamed rice', tags: ['high-protein'] },
      { name: 'Bak Kut Teh (Light)', emoji: '🍖', cal: 540, protein: 34, carbs: 42, fat: 24, prepTime: '30 min', description: 'Peppery pork-rib herbal soup with mushrooms and rice, small youtiao on the side', tags: ['high-protein'] },
      { name: 'Sayur Lemak', emoji: '🥥', cal: 450, protein: 14, carbs: 55, fat: 18, prepTime: '25 min', description: 'Cabbage and long beans simmered in light coconut-turmeric gravy with rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Baked Veggie Curry Puff', emoji: '🥟', cal: 200, protein: 5, carbs: 32, fat: 6, prepTime: '15 min', description: 'Flaky baked puff with curried potato-pea filling', tags: ['vegetarian'] },
      { name: 'Kuih Lapis (2 pc, Light)', emoji: '🍰', cal: 180, protein: 3, carbs: 40, fat: 2, prepTime: '10 min', description: 'Two slices of rainbow steamed layer cake, gently sweet', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Baked Cucur Udang (2 pc)', emoji: '🍤', cal: 220, protein: 12, carbs: 28, fat: 7, prepTime: '15 min', description: 'Crisp baked prawn fritters with chili-vinegar dip', tags: ['high-protein'] },
    ],
  },

  'philippines': {
    breakfast: [
      { name: 'Tapsilog (Light)', emoji: '🥩', cal: 420, protein: 30, carbs: 48, fat: 10, prepTime: '20 min', description: 'Lean beef tapa, garlic rice and fried egg with vinegar dip', tags: ['high-protein'] },
      { name: 'Champorado (Light)', emoji: '🍫', cal: 320, protein: 8, carbs: 62, fat: 5, prepTime: '20 min', description: 'Chocolate rice porridge, lightly sweetened, with a swirl of milk', tags: ['vegetarian'] },
      { name: 'Tortang Talong', emoji: '🍆', cal: 280, protein: 12, carbs: 28, fat: 14, prepTime: '20 min', description: 'Grilled eggplant omelette with tomato-onion relish', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Arroz Caldo (Light)', emoji: '🥣', cal: 320, protein: 22, carbs: 42, fat: 6, prepTime: '25 min', description: 'Gingery chicken rice porridge with toasted garlic and scallion', tags: ['high-protein', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Chicken Adobo (Light)', emoji: '🍗', cal: 520, protein: 38, carbs: 45, fat: 18, prepTime: '30 min', description: 'Vinegar-soy braised skinless chicken with garlic rice', tags: ['high-protein'] },
      { name: 'Sinigang na Bangus', emoji: '🐟', cal: 480, protein: 34, carbs: 42, fat: 16, prepTime: '30 min', description: 'Tamarind-sour milkfish soup with kangkong, radish and eggplant, with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pinakbet (Veggie)', emoji: '🥬', cal: 460, protein: 14, carbs: 68, fat: 12, prepTime: '25 min', description: 'Bitter gourd, squash and okra stewed with tomato (no bagoong), with brown rice', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Bangus', emoji: '🐠', cal: 500, protein: 36, carbs: 40, fat: 18, prepTime: '25 min', description: 'Char-grilled boneless milkfish stuffed with tomato-onion, with garlic rice', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Chicken Inasal (Light)', emoji: '🐔', cal: 540, protein: 40, carbs: 42, fat: 20, prepTime: '30 min', description: 'Annatto-grilled chicken with calamansi dip, garlic rice and atchara', tags: ['high-protein'] },
      { name: 'Kare-Kare Gulay (Light)', emoji: '🥘', cal: 520, protein: 24, carbs: 55, fat: 22, prepTime: '30 min', description: 'Peanut stew with tofu, banana heart and sitaw in lightened sauce, with rice', tags: ['vegetarian', 'high-protein'] },
      { name: 'Laing (Light)', emoji: '🌿', cal: 450, protein: 12, carbs: 50, fat: 22, prepTime: '25 min', description: 'Taro leaves simmered in light coconut milk with ginger and chili, with rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Adobong Kangkong with Tofu', emoji: '🥗', cal: 460, protein: 18, carbs: 60, fat: 14, prepTime: '20 min', description: 'Water spinach and crisp tofu in adobo-style vinegar glaze with rice', tags: ['vegetarian', 'vegan'] },
    ],
    snack: [
      { name: 'Baked Turon', emoji: '🍌', cal: 200, protein: 3, carbs: 44, fat: 3, prepTime: '15 min', description: 'Baked banana-jackfruit roll in crisp lumpia wrapper with palm sugar', tags: ['vegetarian', 'vegan'] },
      { name: 'Puto (2 pc)', emoji: '🧁', cal: 180, protein: 4, carbs: 38, fat: 2, prepTime: '10 min', description: 'Two fluffy steamed rice cakes with a hint of cheese', tags: ['vegetarian'] },
      { name: 'Kamote Cue (Baked)', emoji: '🍠', cal: 160, protein: 3, carbs: 38, fat: 1, prepTime: '15 min', description: 'Caramelized baked sweet potato skewers with palm sugar glaze', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'nigeria-west-africa': {
    breakfast: [
      { name: 'Moi Moi (Steamed Bean Pudding)', emoji: '🫘', cal: 300, protein: 18, carbs: 35, fat: 10, prepTime: '30 min', description: 'Silky steamed black-eyed pea pudding with peppers, onions and a touch of palm oil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Akara & Pap', emoji: '🧆', cal: 340, protein: 12, carbs: 55, fat: 8, prepTime: '25 min', description: 'Crispy black-eyed pea fritters served with warm fermented corn pap', tags: ['vegetarian', 'vegan'] },
      { name: 'Boiled Yam & Egg Sauce', emoji: '🍠', cal: 380, protein: 16, carbs: 52, fat: 12, prepTime: '20 min', description: 'Soft chunks of white yam with a rich tomato-pepper egg sauce', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Dodo & Ewa Riro', emoji: '🍌', cal: 420, protein: 14, carbs: 68, fat: 10, prepTime: '20 min', description: 'Caramelised fried plantain with stewed honey beans in palm oil', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Jollof Rice + Grilled Chicken', emoji: '🍗', cal: 640, protein: 44, carbs: 70, fat: 18, prepTime: '30 min', description: 'Smoky party-style tomato jollof rice with char-grilled chicken thigh', tags: ['high-protein', 'gluten-free'] },
      { name: 'Egusi Soup + Pounded Yam', emoji: '🍲', cal: 620, protein: 28, carbs: 58, fat: 30, prepTime: '30 min', description: 'Melon-seed soup with spinach and mushrooms, scooped with smooth pounded yam', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Ofada Rice + Ayamase', emoji: '🍚', cal: 580, protein: 22, carbs: 78, fat: 16, prepTime: '25 min', description: 'Nutty local ofada rice with fiery green bell-pepper ayamase sauce', tags: ['vegetarian', 'vegan'] },
      { name: 'Ewa Oloyin (Honey Beans Porridge)', emoji: '🥘', cal: 520, protein: 24, carbs: 72, fat: 10, prepTime: '30 min', description: 'Slow-cooked brown honey beans in palm oil with sweet peppers and onions', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
    ],
    dinner: [
      { name: 'Suya + Cabbage Salad', emoji: '🥩', cal: 550, protein: 42, carbs: 12, fat: 36, prepTime: '25 min', description: 'Fire-grilled spiced beef suya with extra yaji and crunchy cabbage salad', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Tilapia + Roasted Plantain', emoji: '🐟', cal: 580, protein: 40, carbs: 50, fat: 18, prepTime: '30 min', description: 'Whole tilapia in pepper marinade with caramelised roasted plantain', tags: ['high-protein', 'gluten-free'] },
      { name: 'Goat Meat Pepper Soup (Light)', emoji: '🍜', cal: 480, protein: 36, carbs: 16, fat: 24, prepTime: '25 min', description: 'Clear, fiery broth with tender goat meat, scent leaves and native spices', tags: ['high-protein', 'gluten-free'] },
      { name: 'Efo Riro + Small Eba', emoji: '🥬', cal: 520, protein: 16, carbs: 74, fat: 14, prepTime: '25 min', description: 'Yoruba spinach stew with peppers and locust beans, served with garri eba', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Roasted Corn (Light Butter)', emoji: '🌽', cal: 180, protein: 5, carbs: 36, fat: 4, prepTime: '20 min', description: 'Char-grilled corn on the cob brushed with a whisper of butter and salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Roasted Groundnuts', emoji: '🥜', cal: 200, protein: 8, carbs: 6, fat: 18, prepTime: '10 min', description: 'Handful of dry-roasted peanuts with sea salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Puff Puff (2, Baked)', emoji: '🍩', cal: 220, protein: 5, carbs: 42, fat: 5, prepTime: '30 min', description: 'Two golden baked dough balls, lightly sweet with nutmeg', tags: ['vegetarian', 'vegan'] },
    ],
  },

  'central-africa': {
    breakfast: [
      { name: 'Mikate (Congolese Doughnuts, 2)', emoji: '🍩', cal: 300, protein: 6, carbs: 52, fat: 8, prepTime: '30 min', description: 'Pillowy fried dough balls dusted with sugar, best with ginger tea', tags: ['vegetarian', 'vegan'] },
      { name: 'Boiled Plantain + Groundnut Sauce', emoji: '🍌', cal: 350, protein: 9, carbs: 58, fat: 12, prepTime: '20 min', description: 'Soft boiled plantain fingers with a creamy spiced peanut dipping sauce', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Omelette Congolaise', emoji: '🍳', cal: 320, protein: 20, carbs: 8, fat: 22, prepTime: '15 min', description: 'Three-egg omelette with tomatoes, onions and pili-pili heat', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Sweet Potato + Avocado', emoji: '🍠', cal: 280, protein: 5, carbs: 48, fat: 9, prepTime: '20 min', description: 'Roasted sweet potato wedges with ripe avocado and lime', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Pondu + Fufu', emoji: '🥬', cal: 600, protein: 18, carbs: 88, fat: 20, prepTime: '30 min', description: 'Slow-simmered cassava-leaf stew with palm oil, served with smooth cassava fufu', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Grilled Capitaine + Saka-Saka', emoji: '🐟', cal: 620, protein: 44, carbs: 30, fat: 30, prepTime: '30 min', description: 'Char-grilled Nile perch fillet over cassava leaves cooked in groundnuts', tags: ['high-protein', 'gluten-free'] },
      { name: 'Peanut Stew + Rice', emoji: '🥜', cal: 640, protein: 22, carbs: 72, fat: 28, prepTime: '30 min', description: 'Thick groundnut stew with sweet potato and greens over steamed rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chicken Moambé (Light)', emoji: '🍗', cal: 600, protein: 38, carbs: 42, fat: 26, prepTime: '30 min', description: 'Chicken simmered in a lighter palm-nut sauce with cassava on the side', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Liboke (Fish in Banana Leaf)', emoji: '🐠', cal: 520, protein: 42, carbs: 18, fat: 24, prepTime: '30 min', description: 'Tilapia steamed in banana leaf with tomatoes, onions and pili-pili', tags: ['high-protein', 'gluten-free'] },
      { name: 'Saka-Saka + Smoked Fish', emoji: '🍲', cal: 540, protein: 30, carbs: 40, fat: 26, prepTime: '25 min', description: 'Pounded cassava leaves with smoked mackerel and a little palm oil', tags: ['high-protein', 'gluten-free'] },
      { name: 'Fumbwa in Peanut Sauce', emoji: '🥗', cal: 480, protein: 16, carbs: 34, fat: 32, prepTime: '25 min', description: 'Wild forest spinach wilted into a rich, smoky groundnut sauce', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Beef Brochettes + Fried Cassava', emoji: '🍢', cal: 580, protein: 36, carbs: 44, fat: 24, prepTime: '25 min', description: 'Marinated beef skewers grilled over coals with crispy cassava sticks', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Roasted Groundnuts', emoji: '🥜', cal: 190, protein: 8, carbs: 6, fat: 17, prepTime: '10 min', description: 'Warm dry-roasted peanuts sold in paper cones at every market', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Grilled Plantain Chips (Light)', emoji: '🍌', cal: 160, protein: 2, carbs: 34, fat: 3, prepTime: '15 min', description: 'Thin baked plantain crisps with a pinch of salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Avocado + Lime (Half)', emoji: '🥑', cal: 150, protein: 2, carbs: 9, fat: 14, prepTime: '10 min', description: 'Half a buttery avocado squeezed with lime and sea salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'swahili-coast': {
    breakfast: [
      { name: 'Mandazi (2, Coconut)', emoji: '🍩', cal: 320, protein: 6, carbs: 50, fat: 10, prepTime: '25 min', description: 'Puffy coconut-infused Swahili doughnuts with a hint of cardamom', tags: ['vegetarian', 'vegan'] },
      { name: 'Uji (Millet Porridge)', emoji: '🥣', cal: 260, protein: 8, carbs: 50, fat: 4, prepTime: '15 min', description: 'Silky fermented millet porridge with a drizzle of honey', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Chapati + Maharagwe', emoji: '🫓', cal: 420, protein: 14, carbs: 68, fat: 10, prepTime: '30 min', description: 'Flaky layered flatbread with coconut-braised red kidney beans', tags: ['vegetarian', 'vegan'] },
      { name: 'Vitumbua (3, Coconut Rice Cakes)', emoji: '🥞', cal: 300, protein: 6, carbs: 54, fat: 8, prepTime: '25 min', description: 'Golden rice-flour cakes with coconut and cardamom, griddled crisp', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Ugali + Sukuma Wiki + Beef', emoji: '🥩', cal: 620, protein: 38, carbs: 66, fat: 16, prepTime: '30 min', description: 'Stiff maize ugali with garlicky collard greens and sukuma beef', tags: ['high-protein', 'gluten-free'] },
      { name: 'Chicken Pilau (Light)', emoji: '🍚', cal: 600, protein: 36, carbs: 68, fat: 14, prepTime: '30 min', description: 'Fragrant coastal pilau rice with whole spices and tender chicken', tags: ['high-protein', 'gluten-free'] },
      { name: 'Samaki wa Kupaka', emoji: '🐟', cal: 580, protein: 42, carbs: 24, fat: 30, prepTime: '30 min', description: 'Grilled fish basted in tamarind-coconut kupaka sauce with lime', tags: ['high-protein', 'gluten-free'] },
      { name: 'Mchicha + Ugali', emoji: '🥬', cal: 480, protein: 12, carbs: 62, fat: 20, prepTime: '25 min', description: 'Amaranth spinach simmered in coconut milk with a side of ugali', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Nyama Choma (Lean Goat) + Kachumbari', emoji: '🍖', cal: 560, protein: 44, carbs: 12, fat: 34, prepTime: '30 min', description: 'Slow-grilled lean goat with fresh tomato-onion kachumbari salad', tags: ['high-protein', 'gluten-free'] },
      { name: 'Wali wa Nazi + Grilled Prawns', emoji: '🍤', cal: 620, protein: 36, carbs: 66, fat: 20, prepTime: '25 min', description: 'Coconut rice with smoky grilled prawns and mchicha on the side', tags: ['high-protein', 'gluten-free'] },
      { name: 'Maharagwe + Brown Rice', emoji: '🫘', cal: 540, protein: 20, carbs: 78, fat: 14, prepTime: '30 min', description: 'Creamy coconut kidney-bean stew over nutty brown rice', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Chicken Mishkaki + Ugali', emoji: '🍢', cal: 560, protein: 40, carbs: 54, fat: 16, prepTime: '25 min', description: 'Charred marinated chicken skewers with ugali and kachumbari', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Kashata (Coconut Brittle, 2 pc)', emoji: '🍬', cal: 180, protein: 3, carbs: 28, fat: 7, prepTime: '20 min', description: 'Crunchy caramelised coconut-and-peanut brittle squares', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Madafu (Fresh Coconut)', emoji: '🥥', cal: 120, protein: 2, carbs: 22, fat: 3, prepTime: '10 min', description: 'Chilled young coconut — drink the water, spoon the soft flesh', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Roasted Cassava Chips', emoji: '🍠', cal: 170, protein: 2, carbs: 36, fat: 4, prepTime: '15 min', description: 'Oven-crisped cassava chips with salt and a squeeze of lime', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'ethiopia-east-africa': {
    breakfast: [
      { name: 'Ful + Bread', emoji: '🫘', cal: 380, protein: 18, carbs: 52, fat: 12, prepTime: '20 min', description: 'Mashed fava beans with cumin, olive oil, egg and warm crusty bread', tags: ['vegetarian', 'vegan'] },
      { name: 'Chechebsa', emoji: '🥞', cal: 350, protein: 8, carbs: 58, fat: 10, prepTime: '15 min', description: 'Shredded honey-butter kita flatbread tossed with berbere spice', tags: ['vegetarian'] },
      { name: 'Genfo (Barley Porridge)', emoji: '🥣', cal: 320, protein: 10, carbs: 58, fat: 6, prepTime: '15 min', description: 'Thick barley porridge with a well of spiced butter and berbere', tags: ['vegetarian', 'vegan'] },
      { name: 'Firfir', emoji: '🌯', cal: 300, protein: 10, carbs: 54, fat: 6, prepTime: '10 min', description: 'Torn injera tossed in spicy tomato salsa with onions and jalapeño', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Misir Wot + Injera', emoji: '🍛', cal: 560, protein: 24, carbs: 84, fat: 14, prepTime: '30 min', description: 'Deep-red berbere lentils scooped with tangy teff injera', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Shiro + Injera', emoji: '🥘', cal: 520, protein: 20, carbs: 78, fat: 14, prepTime: '25 min', description: 'Velvety chickpea-flour stew with garlic and ginger on injera', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Tibs (Lean Beef)', emoji: '🥩', cal: 600, protein: 42, carbs: 30, fat: 28, prepTime: '25 min', description: 'Sizzling cubed beef with rosemary, peppers and onions on injera', tags: ['high-protein', 'gluten-free'] },
      { name: 'Kik Alicha + Injera', emoji: '🍲', cal: 500, protein: 20, carbs: 76, fat: 12, prepTime: '25 min', description: 'Mild turmeric split-pea stew with carrots on soft injera', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
    ],
    dinner: [
      { name: 'Doro Wot (Light)', emoji: '🍗', cal: 620, protein: 44, carbs: 48, fat: 24, prepTime: '30 min', description: 'The classic berbere chicken stew with egg, lightened on oil', tags: ['high-protein', 'gluten-free'] },
      { name: 'Gomen + Lentils + Injera', emoji: '🥬', cal: 480, protein: 18, carbs: 72, fat: 14, prepTime: '25 min', description: 'Garlicky collard greens with yellow lentils on teff injera', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Kitfo (Light, Cooked)', emoji: '🍖', cal: 560, protein: 40, carbs: 24, fat: 30, prepTime: '20 min', description: 'Lean minced beef warmed with mitmita spice and a little niter kibbeh', tags: ['high-protein', 'gluten-free'] },
      { name: 'Atakilt Wot + Injera', emoji: '🥕', cal: 460, protein: 12, carbs: 78, fat: 12, prepTime: '25 min', description: 'Gentle cabbage, carrot and potato stew with turmeric on injera', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Kolo (Roasted Barley)', emoji: '🌾', cal: 160, protein: 6, carbs: 30, fat: 3, prepTime: '20 min', description: 'Crunchy roasted barley nibbles with a pinch of salt', tags: ['vegetarian', 'vegan'] },
      { name: 'Roasted Chickpeas (Berbere)', emoji: '🫘', cal: 180, protein: 9, carbs: 26, fat: 5, prepTime: '15 min', description: 'Crisp oven-roasted chickpeas dusted in fiery berbere', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Injera Chips + Shiro Dip', emoji: '🫓', cal: 200, protein: 8, carbs: 32, fat: 5, prepTime: '15 min', description: 'Baked teff chips with a warm spiced chickpea dipping sauce', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'south-africa': {
    breakfast: [
      { name: 'Mielie Pap + Milk (Light)', emoji: '🥣', cal: 300, protein: 10, carbs: 56, fat: 5, prepTime: '15 min', description: 'Creamy maize porridge with warm low-fat milk and a spoon of honey', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Vetkoek (Baked) + Lean Mince', emoji: '🍞', cal: 420, protein: 24, carbs: 42, fat: 16, prepTime: '30 min', description: 'Oven-baked vetkoek stuffed with spiced lean beef mince and chutney', tags: ['high-protein'] },
      { name: 'Smoked Snoek Pâté + Toast', emoji: '🐟', cal: 340, protein: 22, carbs: 30, fat: 12, prepTime: '15 min', description: 'Cape smoked snoek blended with yoghurt and lemon on sourdough toast', tags: ['high-protein'] },
      { name: 'Yoghurt + Granola + Honey', emoji: '🥛', cal: 320, protein: 14, carbs: 44, fat: 9, prepTime: '10 min', description: 'Thick plain yoghurt layered with toasted granola and fynbos honey', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Bobotie (Lean Turkey)', emoji: '🥘', cal: 600, protein: 40, carbs: 48, fat: 24, prepTime: '30 min', description: 'Cape Malay spiced turkey bake with sultanas, almonds and egg custard top', tags: ['high-protein'] },
      { name: 'Bunny Chow (Light Bean Curry)', emoji: '🍛', cal: 580, protein: 22, carbs: 84, fat: 14, prepTime: '30 min', description: 'Durban-style hollowed loaf filled with mild sugar-bean curry', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Snoek + Sweet Potato', emoji: '🐠', cal: 520, protein: 40, carbs: 48, fat: 14, prepTime: '25 min', description: 'Apricot-glazed grilled snoek with roasted sweet potato wedges', tags: ['high-protein', 'gluten-free'] },
      { name: 'Chicken Sosaties (2 Skewers) + Salad', emoji: '🍢', cal: 540, protein: 42, carbs: 18, fat: 28, prepTime: '25 min', description: 'Cape Malay curried chicken skewers with dried apricots and green salad', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Braai Chicken (Lean) + Pap + Chakalaka', emoji: '🍗', cal: 620, protein: 44, carbs: 56, fat: 18, prepTime: '30 min', description: 'Flame-grilled chicken with stiff pap and spicy chakalaka relish', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pap + Lean Boerewors', emoji: '🌭', cal: 600, protein: 32, carbs: 58, fat: 24, prepTime: '25 min', description: 'Grilled lean farm sausage with soft pap and tomato-onion smoor', tags: ['high-protein'] },
      { name: 'Cape Malay Chicken Curry + Brown Rice', emoji: '🍲', cal: 580, protein: 38, carbs: 62, fat: 16, prepTime: '30 min', description: 'Aromatic mild curry with cinnamon and turmeric over brown rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Butternut Soup + Wholewheat Roll', emoji: '🎃', cal: 460, protein: 12, carbs: 70, fat: 14, prepTime: '25 min', description: 'Velvet roast butternut soup with ginger, coconut and a warm roll', tags: ['vegetarian', 'vegan'] },
    ],
    snack: [
      { name: 'Biltong (Lean, 40g)', emoji: '🥩', cal: 140, protein: 22, carbs: 2, fat: 6, prepTime: '10 min', description: 'Air-dried spiced beef strips — the original high-protein snack', tags: ['high-protein', 'gluten-free'] },
      { name: 'Droëwors (2 Sticks)', emoji: '🥓', cal: 180, protein: 14, carbs: 2, fat: 12, prepTime: '10 min', description: 'Dried coriander-spiced sausage sticks, chewy and savoury', tags: ['high-protein', 'gluten-free'] },
      { name: 'Koeksister (1, Light)', emoji: '🍩', cal: 200, protein: 3, carbs: 40, fat: 4, prepTime: '20 min', description: 'One syrup-soaked braided koeksister with cinnamon and lemon', tags: ['vegetarian'] },
    ],
  },

  'central-america': {
    breakfast: [
      { name: 'Gallo Pinto + Eggs', emoji: '🍳', cal: 420, protein: 20, carbs: 58, fat: 12, prepTime: '20 min', description: 'Costa Rican rice-and-beans fried with Salsa Lizano and two eggs', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Baleadas (Bean + Egg, 2)', emoji: '🌯', cal: 450, protein: 20, carbs: 62, fat: 14, prepTime: '20 min', description: 'Soft Honduran flour tortillas folded around refried beans and egg', tags: ['vegetarian', 'high-protein'] },
      { name: 'Pupusas de Frijol (2)', emoji: '🫓', cal: 380, protein: 14, carbs: 62, fat: 8, prepTime: '25 min', description: 'Griddled Salvadoran corn cakes stuffed with beans, curtido on top', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Plátanos + Frijoles', emoji: '🍌', cal: 360, protein: 12, carbs: 70, fat: 6, prepTime: '15 min', description: 'Sweet fried plantain with savory black beans and a little crema', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Casado (Chicken)', emoji: '🍛', cal: 620, protein: 42, carbs: 68, fat: 16, prepTime: '30 min', description: 'The Costa Rican married plate: chicken, rice, beans, salad and plantain', tags: ['high-protein', 'gluten-free'] },
      { name: 'Olla de Carne (Light)', emoji: '🍲', cal: 560, protein: 38, carbs: 52, fat: 18, prepTime: '30 min', description: 'Hearty beef-and-vegetable stew with yuca, plantain and corn', tags: ['high-protein', 'gluten-free'] },
      { name: 'Rondón (Coconut Seafood Stew)', emoji: '🍤', cal: 580, protein: 36, carbs: 48, fat: 24, prepTime: '30 min', description: 'Caribbean-coast coconut stew with fish, shrimp, yuca and plantain', tags: ['high-protein', 'gluten-free'] },
      { name: 'Casado Vegetariano', emoji: '🥗', cal: 520, protein: 20, carbs: 80, fat: 14, prepTime: '25 min', description: 'Meat-free married plate: beans, rice, veg picadillo, salad and plantain', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
    ],
    dinner: [
      { name: 'Pescado Frito + Patacones (Light)', emoji: '🐟', cal: 580, protein: 40, carbs: 52, fat: 20, prepTime: '25 min', description: 'Crisp whole fried fish with twice-cooked green plantain tostones', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pollo en Salsa + Rice', emoji: '🍗', cal: 560, protein: 40, carbs: 58, fat: 16, prepTime: '30 min', description: 'Guatemalan chicken braised in tomato-recado sauce over white rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Jocón (Green Chicken Stew)', emoji: '🥘', cal: 540, protein: 42, carbs: 36, fat: 22, prepTime: '30 min', description: 'Tomatillo-and-cilantro green stew with tender chicken and rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Chiles Rellenos (Baked, Bean)', emoji: '🌶️', cal: 500, protein: 20, carbs: 62, fat: 18, prepTime: '30 min', description: 'Oven-baked poblano peppers stuffed with beans and cheese in tomato sauce', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
    ],
    snack: [
      { name: 'Tostones (2, Baked)', emoji: '🍌', cal: 150, protein: 2, carbs: 32, fat: 2, prepTime: '15 min', description: 'Smashed and baked green plantain rounds with garlic salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Yuca Frita (Baked, Light)', emoji: '🍠', cal: 170, protein: 2, carbs: 38, fat: 2, prepTime: '20 min', description: 'Golden baked yuca sticks with a squeeze of lime', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Atol de Elote (Small)', emoji: '🥛', cal: 180, protein: 5, carbs: 34, fat: 4, prepTime: '15 min', description: 'Warm sweet-corn atole drink with cinnamon', tags: ['vegetarian', 'gluten-free'] },
    ],
  },

  'caribbean': {
    breakfast: [
      { name: 'Ackee + Saltfish (Light)', emoji: '🐟', cal: 380, protein: 26, carbs: 28, fat: 18, prepTime: '20 min', description: 'Jamaican national dish: buttery ackee with flaked saltfish and peppers', tags: ['high-protein', 'gluten-free'] },
      { name: 'Callaloo + Johnny Cakes (Baked)', emoji: '🥬', cal: 340, protein: 10, carbs: 58, fat: 8, prepTime: '25 min', description: 'Steamed island greens with thyme and oven-baked cornmeal johnny cakes', tags: ['vegetarian', 'vegan'] },
      { name: 'Cornmeal Porridge', emoji: '🥣', cal: 300, protein: 8, carbs: 56, fat: 6, prepTime: '15 min', description: 'Silky coconut cornmeal porridge with nutmeg and vanilla', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Boiled Green Banana + Egg', emoji: '🍌', cal: 320, protein: 16, carbs: 52, fat: 6, prepTime: '20 min', description: 'Starchy boiled green bananas with a simply boiled egg and pepper sauce', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Jerk Chicken + Rice & Peas', emoji: '🍗', cal: 640, protein: 46, carbs: 62, fat: 18, prepTime: '30 min', description: 'Fire-jerked chicken with coconut rice and peas and fried plantain', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Snapper + Festival (Baked)', emoji: '🐠', cal: 580, protein: 44, carbs: 50, fat: 16, prepTime: '25 min', description: 'Escovitch-style grilled snapper with pickled veg and baked festival bread', tags: ['high-protein'] },
      { name: 'Mofongo (Small, Shrimp)', emoji: '🍤', cal: 560, protein: 32, carbs: 58, fat: 22, prepTime: '30 min', description: 'Garlic-mashed plantain mound with Creole shrimp sauce', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ital Stew (Vegan Rasta)', emoji: '🥗', cal: 500, protein: 18, carbs: 72, fat: 16, prepTime: '30 min', description: 'Ital coconut stew with pumpkin, beans, callaloo and dumplings', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Curry Goat (Lean)', emoji: '🍛', cal: 600, protein: 42, carbs: 40, fat: 26, prepTime: '30 min', description: 'Slow-braised curried goat with potatoes over rice and peas', tags: ['high-protein', 'gluten-free'] },
      { name: 'Brown Stew Chicken + Rice', emoji: '🥘', cal: 580, protein: 44, carbs: 56, fat: 16, prepTime: '30 min', description: 'Caramel-braised chicken in rich gravy with white rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pepperpot + Cassava', emoji: '🍲', cal: 540, protein: 36, carbs: 52, fat: 20, prepTime: '30 min', description: 'Guyanese slow-cooked beef pepperpot with boiled cassava', tags: ['high-protein', 'gluten-free'] },
      { name: 'Trinidadian Pumpkin Soup', emoji: '🎃', cal: 460, protein: 12, carbs: 74, fat: 14, prepTime: '25 min', description: 'Thick pumpkin-and-coconut soup with corn, dasheen and dumplings', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Plantain Chips (Baked)', emoji: '🍌', cal: 150, protein: 2, carbs: 32, fat: 3, prepTime: '15 min', description: 'Thin baked ripe-plantain crisps with sea salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Coconut Drops (2)', emoji: '🥥', cal: 180, protein: 3, carbs: 30, fat: 7, prepTime: '25 min', description: 'Chewy Jamaican coconut-and-ginger drops', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Roasted Breadfruit Chips', emoji: '🍞', cal: 160, protein: 3, carbs: 36, fat: 2, prepTime: '20 min', description: 'Crisp roasted ulu chips with lime salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'andean': {
    breakfast: [
      { name: 'Quinoa Porridge + Fruit', emoji: '🥣', cal: 320, protein: 12, carbs: 56, fat: 7, prepTime: '15 min', description: 'Creamy quinoa cooked in milk with apple, cinnamon and honey', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Pan con Chicharrón (Light)', emoji: '🥪', cal: 420, protein: 26, carbs: 44, fat: 16, prepTime: '25 min', description: 'Crusty roll with lean crispy pork, sweet potato and salsa criolla', tags: ['high-protein'] },
      { name: 'Humitas (2, Corn)', emoji: '🌽', cal: 300, protein: 8, carbs: 52, fat: 8, prepTime: '30 min', description: 'Steamed fresh-corn tamales with cheese, wrapped in corn husks', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Caldo de Gallina (Light)', emoji: '🍜', cal: 350, protein: 30, carbs: 30, fat: 12, prepTime: '30 min', description: 'Clear Peruvian hen soup with potato, egg noodles and scallions', tags: ['high-protein', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Ceviche Clásico + Camote', emoji: '🐟', cal: 480, protein: 42, carbs: 44, fat: 12, prepTime: '20 min', description: 'Leche-de-tigre cured sea bass with sweet potato and choclo corn', tags: ['high-protein', 'gluten-free'] },
      { name: 'Lomo Saltado (Chicken, Light)', emoji: '🥩', cal: 600, protein: 42, carbs: 58, fat: 18, prepTime: '25 min', description: 'Wok-tossed chicken with tomatoes and onions over rice and fries', tags: ['high-protein'] },
      { name: 'Ajiaco (Chicken-Potato Soup)', emoji: '🍲', cal: 520, protein: 36, carbs: 56, fat: 14, prepTime: '30 min', description: 'Bogotá-style soup of three potatoes, guasca herbs and shredded chicken', tags: ['high-protein', 'gluten-free'] },
      { name: 'Quinoa Chaufa (Veg)', emoji: '🍚', cal: 500, protein: 18, carbs: 74, fat: 14, prepTime: '20 min', description: 'Peruvian-Chinese fried quinoa with egg ribbons, scallions and ginger', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Bandeja Paisa (Light)', emoji: '🍛', cal: 680, protein: 44, carbs: 64, fat: 24, prepTime: '30 min', description: 'Lighter take on the paisa platter: beans, rice, grilled beef, egg and avocado', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pescado a lo Macho (Light)', emoji: '🐠', cal: 560, protein: 44, carbs: 46, fat: 18, prepTime: '30 min', description: 'Pan-fried fish in spicy seafood-tomato sauce with white rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ají de Gallina (Light)', emoji: '🍗', cal: 580, protein: 40, carbs: 52, fat: 20, prepTime: '30 min', description: 'Creamy yellow-chili chicken stew with walnuts over rice', tags: ['high-protein'] },
      { name: 'Locro de Papa', emoji: '🥔', cal: 480, protein: 18, carbs: 68, fat: 16, prepTime: '25 min', description: 'Thick Andean potato-cheese soup with avocado and toasted corn', tags: ['vegetarian', 'gluten-free'] },
    ],
    snack: [
      { name: 'Cancha (Toasted Corn Nuts)', emoji: '🌽', cal: 150, protein: 4, carbs: 30, fat: 3, prepTime: '10 min', description: 'Crunchy toasted choclo corn kernels with salt — the ceviche companion', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Choclo con Queso (Small)', emoji: '🧀', cal: 200, protein: 9, carbs: 32, fat: 5, prepTime: '15 min', description: 'Giant-kernel Andean corn on the cob with a slab of fresh cheese', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Lúcuma Smoothie (Light)', emoji: '🥤', cal: 180, protein: 8, carbs: 32, fat: 3, prepTime: '10 min', description: 'Caramel-sweet lúcuma fruit blended with milk and ice', tags: ['vegetarian', 'gluten-free'] },
    ],
  },

  'brazil': {
    breakfast: [
      { name: 'Tapioca + Eggs + Cheese', emoji: '🍳', cal: 360, protein: 22, carbs: 46, fat: 12, prepTime: '15 min', description: 'Crisp cassava-starch crepe folded around eggs and queijo coalho', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Açaí Bowl (Unsweetened) + Granola', emoji: '🫐', cal: 380, protein: 10, carbs: 58, fat: 14, prepTime: '10 min', description: 'Thick unsweetened açaí topped with granola and banana', tags: ['vegetarian', 'vegan'] },
      { name: 'Pão de Queijo (4, Light)', emoji: '🧀', cal: 320, protein: 10, carbs: 40, fat: 12, prepTime: '25 min', description: 'Four chewy cassava cheese breads, lighter on the oil', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Cuscuz Nordestino + Egg', emoji: '🌽', cal: 340, protein: 14, carbs: 52, fat: 8, prepTime: '15 min', description: 'Steamed corn couscous cake with a fried egg and queijo coalho', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Feijoada (Light, Lean Pork)', emoji: '🫘', cal: 640, protein: 42, carbs: 62, fat: 22, prepTime: '30 min', description: 'Leaner black-bean feijoada with rice, farofa and orange slices', tags: ['high-protein', 'gluten-free'] },
      { name: 'Moqueca de Peixe', emoji: '🐟', cal: 560, protein: 44, carbs: 36, fat: 24, prepTime: '30 min', description: 'Bahian fish stew in coconut milk, dendê and peppers with pirão', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Picanha + Farofa (Light)', emoji: '🥩', cal: 620, protein: 46, carbs: 40, fat: 26, prepTime: '30 min', description: 'Char-grilled picanha slices with light cassava farofa and vinaigrette', tags: ['high-protein', 'gluten-free'] },
      { name: 'Moqueca de Banana-da-Terra', emoji: '🍌', cal: 500, protein: 12, carbs: 78, fat: 18, prepTime: '25 min', description: 'Plantain moqueca in coconut milk with peppers and coriander', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Escondidinho de Frango (Light)', emoji: '🥘', cal: 560, protein: 40, carbs: 52, fat: 18, prepTime: '30 min', description: 'Shredded chicken hidden under creamy cassava mash, gratinéed light', tags: ['high-protein', 'gluten-free'] },
      { name: 'Bobó de Camarão (Light)', emoji: '🍤', cal: 580, protein: 38, carbs: 52, fat: 22, prepTime: '30 min', description: 'Shrimp in velvety cassava-coconut bobó cream with white rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Frango com Quiabo', emoji: '🍗', cal: 520, protein: 44, carbs: 30, fat: 22, prepTime: '30 min', description: 'Mineiro chicken braised with okra, finished with lime', tags: ['high-protein', 'gluten-free'] },
      { name: 'Acarajé (Baked, Light)', emoji: '🧆', cal: 480, protein: 18, carbs: 58, fat: 18, prepTime: '30 min', description: 'Oven-baked black-eyed pea fritter with vatapá and vinaigrette', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Castanha-do-Pará (6 Nuts)', emoji: '🌰', cal: 190, protein: 4, carbs: 4, fat: 19, prepTime: '10 min', description: 'Six buttery Brazil nuts — rich in selenium', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Biscoito de Polvilho (10)', emoji: '🍿', cal: 140, protein: 2, carbs: 30, fat: 2, prepTime: '20 min', description: 'Airy cassava-starch puffs, the classic Brazilian road-trip snack', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Coconut Water + Grated Coconut', emoji: '🥥', cal: 130, protein: 2, carbs: 24, fat: 4, prepTime: '10 min', description: 'Fresh coconut water with spoonfuls of young coconut flesh', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'argentina': {
    breakfast: [
      { name: 'Medialunas (2, Light)', emoji: '🥐', cal: 320, protein: 8, carbs: 48, fat: 10, prepTime: '15 min', description: 'Two buttery half-moon croissants, best dunked in café con leche', tags: ['vegetarian'] },
      { name: 'Yogur + Granola + Frutas', emoji: '🥛', cal: 340, protein: 16, carbs: 50, fat: 8, prepTime: '10 min', description: 'Creamy yoghurt with honey granola and seasonal fruit', tags: ['vegetarian'] },
      { name: 'Tortilla de Papa (Light)', emoji: '🍳', cal: 380, protein: 20, carbs: 40, fat: 14, prepTime: '25 min', description: 'Golden potato-and-onion Spanish omelette, light on the oil', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Avocado Toast + Huevo', emoji: '🥑', cal: 360, protein: 14, carbs: 36, fat: 18, prepTime: '10 min', description: 'Sourdough with smashed avocado, poached egg and chimichurri oil', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Bife de Chorizo (Lean Cut, 180g)', emoji: '🥩', cal: 620, protein: 48, carbs: 12, fat: 36, prepTime: '25 min', description: 'Grilled lean sirloin strip with chimichurri and grilled vegetables', tags: ['high-protein', 'gluten-free'] },
      { name: 'Milanesa de Pollo (Baked)', emoji: '🍗', cal: 580, protein: 44, carbs: 44, fat: 20, prepTime: '30 min', description: 'Oven-crisped breaded chicken cutlet with lemon and mixed salad', tags: ['high-protein'] },
      { name: 'Empanadas (2, Baked, Chicken)', emoji: '🥟', cal: 520, protein: 30, carbs: 48, fat: 18, prepTime: '30 min', description: 'Two golden baked empanadas with juicy chicken, olive and egg', tags: ['high-protein'] },
      { name: 'Humita en Chala + Salad', emoji: '🌽', cal: 480, protein: 14, carbs: 72, fat: 14, prepTime: '30 min', description: 'Sweet-corn humita steamed in its husk with a fresh garden salad', tags: ['vegetarian', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Asado Mix (Lean Cuts) + Grilled Veg', emoji: '🍖', cal: 640, protein: 50, carbs: 18, fat: 38, prepTime: '30 min', description: 'Parrilla-grilled lean cuts — vacío and matambre — with ember-roasted vegetables', tags: ['high-protein', 'gluten-free'] },
      { name: 'Provoleta + Salad + Peppers', emoji: '🧀', cal: 500, protein: 28, carbs: 16, fat: 36, prepTime: '20 min', description: 'Melted provolone wheel with oregano, grilled peppers and green salad', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Milanesa Napolitana (Baked, Light)', emoji: '🍕', cal: 600, protein: 42, carbs: 46, fat: 22, prepTime: '30 min', description: 'Baked milanesa topped with tomato, ham and melted mozzarella', tags: ['high-protein'] },
      { name: 'Tarta de Verdura (2 Slices)', emoji: '🥧', cal: 480, protein: 18, carbs: 52, fat: 22, prepTime: '30 min', description: 'Swiss-chard and ricotta tart with a crisp whole-grain crust', tags: ['vegetarian'] },
    ],
    snack: [
      { name: 'Alfajor de Maicena (1)', emoji: '🍪', cal: 180, protein: 3, carbs: 30, fat: 6, prepTime: '20 min', description: 'Delicate cornstarch sandwich cookie with dulce de leche heart', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Picada Light (Cheese + Olives)', emoji: '🫒', cal: 220, protein: 12, carbs: 4, fat: 18, prepTime: '10 min', description: 'Small-board picada: aged cheese cubes, green olives and walnuts', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Mate + Nuts (30g)', emoji: '🧉', cal: 190, protein: 7, carbs: 7, fat: 17, prepTime: '10 min', description: 'Traditional bitter mate shared gourd-style with a handful of mixed nuts', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'australia-nz': {
    breakfast: [
      { name: 'Avo + Eggs on Sourdough', emoji: '🥑', cal: 420, protein: 20, carbs: 36, fat: 24, prepTime: '15 min', description: 'The café classic: smashed avo, two poached eggs and dukkah on sourdough', tags: ['vegetarian', 'high-protein'] },
      { name: 'Weet-Bix + Yogurt + Berries', emoji: '🥣', cal: 340, protein: 18, carbs: 56, fat: 6, prepTime: '10 min', description: 'Three Weet-Bix with Greek yoghurt, honey and mixed berries', tags: ['vegetarian'] },
      { name: 'Ricotta Hotcakes (2, Light)', emoji: '🥞', cal: 400, protein: 18, carbs: 58, fat: 10, prepTime: '20 min', description: 'Cloud-light ricotta hotcakes with banana and maple syrup', tags: ['vegetarian'] },
      { name: 'Smoked Salmon + Cream Cheese Bagel (Light)', emoji: '🥯', cal: 420, protein: 26, carbs: 44, fat: 16, prepTime: '10 min', description: 'Toasted bagel with light cream cheese, smoked salmon and capers', tags: ['high-protein'] },
    ],
    lunch: [
      { name: 'Grilled Barramundi + Salad', emoji: '🐟', cal: 520, protein: 44, carbs: 28, fat: 24, prepTime: '25 min', description: 'Crispy-skin barramundi with mango-avocado salad and lime', tags: ['high-protein', 'gluten-free'] },
      { name: 'BBQ Chicken + Sweet Potato', emoji: '🍗', cal: 600, protein: 46, carbs: 52, fat: 16, prepTime: '30 min', description: 'Smoky barbecued chicken breast with roast sweet potato and slaw', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Lamb + Veg (Light)', emoji: '🥩', cal: 620, protein: 44, carbs: 40, fat: 28, prepTime: '30 min', description: 'Rosemary lamb backstraps with grilled Mediterranean vegetables', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pumpkin + Feta Salad + Quinoa', emoji: '🥗', cal: 500, protein: 18, carbs: 62, fat: 20, prepTime: '25 min', description: 'Roast pumpkin, feta, spinach and quinoa with balsamic glaze', tags: ['vegetarian', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Grilled Snapper + Asparagus', emoji: '🐠', cal: 540, protein: 46, carbs: 24, fat: 26, prepTime: '25 min', description: 'Whole grilled snapper with lemon butter and charred asparagus', tags: ['high-protein', 'gluten-free'] },
      { name: 'Beef Stir-Fry + Brown Rice', emoji: '🥘', cal: 600, protein: 42, carbs: 58, fat: 20, prepTime: '25 min', description: 'Ginger-soy beef strips with crunchy veg over brown rice', tags: ['high-protein'] },
      { name: 'Chicken Schnitzel (Baked) + Slaw', emoji: '🍖', cal: 580, protein: 46, carbs: 42, fat: 20, prepTime: '30 min', description: 'Oven-crisped crumbed chicken with creamy apple slaw', tags: ['high-protein'] },
      { name: 'Mushroom Risotto (Light)', emoji: '🍚', cal: 520, protein: 16, carbs: 76, fat: 16, prepTime: '30 min', description: 'Creamy arborio rice with roasted mushrooms, thyme and parmesan', tags: ['vegetarian', 'gluten-free'] },
    ],
    snack: [
      { name: 'Tim Tam (1) + Skinny Flat White', emoji: '🍪', cal: 180, protein: 6, carbs: 26, fat: 7, prepTime: '10 min', description: 'One choc-biscuit Tim Tam with a small skinny flat white', tags: ['vegetarian'] },
      { name: 'Vegemite Toast + Cheese', emoji: '🍞', cal: 220, protein: 12, carbs: 30, fat: 6, prepTime: '10 min', description: 'Buttered toast with a scrape of Vegemite and melted tasty cheese', tags: ['vegetarian'] },
      { name: 'Tropical Fruit Salad + Coconut Yoghurt', emoji: '🥭', cal: 160, protein: 8, carbs: 30, fat: 2, prepTime: '10 min', description: 'Mango, pineapple and kiwi with dairy-free coconut yoghurt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'pacific-islands': {
    breakfast: [
      { name: 'Papaya + Lime + Toasted Coconut', emoji: '🥭', cal: 260, protein: 4, carbs: 52, fat: 7, prepTime: '10 min', description: 'Sun-ripe pawpaw with lime juice and toasted coconut flakes', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Taro Pancakes (2, Light)', emoji: '🥞', cal: 320, protein: 8, carbs: 58, fat: 7, prepTime: '20 min', description: 'Fluffy taro-flour pancakes with banana and coconut syrup', tags: ['vegetarian', 'vegan'] },
      { name: 'Egg + Taro Hash', emoji: '🍳', cal: 360, protein: 18, carbs: 44, fat: 12, prepTime: '20 min', description: 'Crispy taro hash browns topped with fried eggs and spring onion', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Grilled Banana + Honey + Lime', emoji: '🍌', cal: 280, protein: 3, carbs: 62, fat: 4, prepTime: '15 min', description: 'Caramelised grilled bananas with honey, lime and cinnamon', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Oka i\'a (Raw Fish in Coconut-Lime)', emoji: '🐟', cal: 480, protein: 40, carbs: 24, fat: 24, prepTime: '20 min', description: 'Samoan-style ceviche: tuna cured in lime with coconut cream and cucumber', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Mahi-Mahi + Taro', emoji: '🐠', cal: 560, protein: 44, carbs: 48, fat: 18, prepTime: '25 min', description: 'Char-grilled mahi-mahi with boiled taro and miti sauce', tags: ['high-protein', 'gluten-free'] },
      { name: 'Palusami (Light Coconut) + Taro', emoji: '🥬', cal: 500, protein: 10, carbs: 68, fat: 22, prepTime: '30 min', description: 'Taro leaves baked in light coconut cream, served with boiled taro', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Poke-Style Bowl (Tuna + Rice)', emoji: '🍚', cal: 580, protein: 42, carbs: 58, fat: 16, prepTime: '15 min', description: 'Diced raw tuna with rice, edamame, mango and gluten-free tamari', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Lovo (Earth-Oven Chicken, Lean)', emoji: '🍗', cal: 600, protein: 46, carbs: 50, fat: 18, prepTime: '30 min', description: 'Fijian lovo-style slow-roasted chicken with taro and palusami', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Octopus + Ulu (Breadfruit)', emoji: '🐙', cal: 520, protein: 42, carbs: 44, fat: 16, prepTime: '30 min', description: 'Tender charred octopus with roasted breadfruit and lime', tags: ['high-protein', 'gluten-free'] },
      { name: 'Fish + Rourou in Coconut', emoji: '🍲', cal: 540, protein: 40, carbs: 42, fat: 22, prepTime: '30 min', description: 'White fish simmered with taro leaves in coconut milk, cassava alongside', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ulu + Coconut Curry (Veg)', emoji: '🍛', cal: 500, protein: 12, carbs: 74, fat: 18, prepTime: '25 min', description: 'Breadfruit and island vegetables in a fragrant coconut curry', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    snack: [
      { name: 'Fresh Coconut (Meat + Water)', emoji: '🥥', cal: 200, protein: 3, carbs: 16, fat: 16, prepTime: '10 min', description: 'Cracked green coconut — drink the water, scoop the jelly flesh', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Pani Popo (1 Bun, Light)', emoji: '🍞', cal: 220, protein: 5, carbs: 40, fat: 5, prepTime: '25 min', description: 'Soft Samoan coconut bun baked in sweet coconut sauce', tags: ['vegetarian'] },
      { name: 'Grilled Pineapple + Lime', emoji: '🍍', cal: 130, protein: 1, carbs: 32, fat: 1, prepTime: '10 min', description: 'Caramelised pineapple rings with lime zest and mint', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'spain': {
    breakfast: [
      { name: 'Tortilla Española (light)', emoji: '🥔', cal: 300, protein: 14, carbs: 28, fat: 14, prepTime: '25 min', description: 'Classic potato and onion omelette, baked light with less oil', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Tostada con Tomate', emoji: '🍞', cal: 290, protein: 8, carbs: 38, fat: 12, prepTime: '10 min', description: 'Whole grain toast rubbed with tomato, garlic and olive oil', tags: ['vegetarian', 'vegan'] },
      { name: 'Yogur con Miel y Nueces', emoji: '🍯', cal: 260, protein: 14, carbs: 24, fat: 12, prepTime: '10 min', description: 'Creamy yogurt with honey, walnuts and cinnamon', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Huevos a la Flamenca (light)', emoji: '🍳', cal: 280, protein: 20, carbs: 18, fat: 14, prepTime: '20 min', description: 'Baked eggs over tomato-pepper sofrito with peas', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
    ],
    lunch: [
      { name: 'Paella de Mariscos', emoji: '🥘', cal: 520, protein: 32, carbs: 65, fat: 14, prepTime: '30 min', description: 'Saffron seafood paella with shrimp, mussels and peas', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ensalada de Garbanzos y Atún', emoji: '🥗', cal: 450, protein: 30, carbs: 45, fat: 16, prepTime: '15 min', description: 'Chickpea salad with tuna, red onion, tomato and sherry vinegar', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pollo al Ajillo con Patatas', emoji: '🍗', cal: 470, protein: 38, carbs: 35, fat: 20, prepTime: '30 min', description: 'Garlic chicken with roasted potatoes and rosemary', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pisto con Huevo y Pan', emoji: '🫑', cal: 460, protein: 24, carbs: 45, fat: 20, prepTime: '25 min', description: 'Manchego ratatouille topped with fried egg and whole grain bread', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Lubina a la Plancha', emoji: '🐟', cal: 480, protein: 40, carbs: 35, fat: 20, prepTime: '25 min', description: 'Grilled sea bass with patatas bravas (light) and green salad', tags: ['high-protein', 'gluten-free'] },
      { name: 'Fabada Asturiana (light)', emoji: '🫘', cal: 450, protein: 28, carbs: 48, fat: 16, prepTime: '30 min', description: 'White bean stew with lean chorizo and morcilla, light on fat', tags: ['gluten-free'] },
      { name: 'Gambas al Ajillo con Arroz', emoji: '🍤', cal: 490, protein: 32, carbs: 45, fat: 20, prepTime: '20 min', description: 'Garlic shrimp sizzled in olive oil over steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Cocido Madrileño (light)', emoji: '🍲', cal: 510, protein: 32, carbs: 55, fat: 18, prepTime: '30 min', description: 'Chickpea stew with chicken, vegetables and a little chorizo', tags: ['gluten-free'] },
    ],
    snack: [
      { name: 'Aceitunas y Manchego', emoji: '🫒', cal: 200, protein: 10, carbs: 4, fat: 16, prepTime: '10 min', description: 'Marinated olives with aged manchego cheese', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Pan con Tomate (small)', emoji: '🍅', cal: 190, protein: 5, carbs: 25, fat: 8, prepTime: '10 min', description: 'Small tomato-rubbed toast with olive oil and sea salt', tags: ['vegetarian', 'vegan'] },
      { name: 'Almendras Marcona', emoji: '🌰', cal: 190, protein: 6, carbs: 6, fat: 16, prepTime: '10 min', description: 'Handful of roasted marcona almonds with sea salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'portugal': {
    breakfast: [
      { name: 'Ovos Mexidos com Queijo', emoji: '🍳', cal: 330, protein: 22, carbs: 20, fat: 18, prepTime: '10 min', description: 'Scrambled eggs with flamengo cheese on toasted broa', tags: ['vegetarian', 'high-protein'] },
      { name: 'Papas de Aveia com Mel', emoji: '🥣', cal: 290, protein: 10, carbs: 48, fat: 6, prepTime: '10 min', description: 'Creamy oatmeal with honey, banana and cinnamon', tags: ['vegetarian'] },
      { name: 'Iogurte com Granola', emoji: '🥛', cal: 300, protein: 14, carbs: 38, fat: 10, prepTime: '10 min', description: 'Natural yogurt layered with granola and seasonal fruit', tags: ['vegetarian'] },
      { name: 'Pão de Centeio com Queijo Fresco', emoji: '🧀', cal: 280, protein: 16, carbs: 32, fat: 10, prepTime: '10 min', description: 'Rye bread with fresh cheese, tomato and oregano', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Bacalhau à Brás', emoji: '🐟', cal: 480, protein: 36, carbs: 40, fat: 20, prepTime: '25 min', description: 'Shredded salt cod with matchstick potatoes, egg and olives', tags: ['high-protein', 'gluten-free'] },
      { name: 'Arroz de Pato (light)', emoji: '🍚', cal: 510, protein: 32, carbs: 55, fat: 18, prepTime: '30 min', description: 'Baked duck rice with chouriço, light on fat', tags: ['high-protein', 'gluten-free'] },
      { name: 'Sardinhas Assadas', emoji: '🐟', cal: 450, protein: 34, carbs: 30, fat: 22, prepTime: '20 min', description: 'Grilled sardines with roasted peppers and boiled potatoes', tags: ['high-protein', 'gluten-free'] },
      { name: 'Feijoada à Transmontana (light)', emoji: '🫘', cal: 470, protein: 30, carbs: 52, fat: 16, prepTime: '30 min', description: 'Red bean stew with lean pork and greens, light version', tags: ['gluten-free'] },
    ],
    dinner: [
      { name: 'Cataplana de Marisco', emoji: '🍲', cal: 450, protein: 38, carbs: 35, fat: 18, prepTime: '30 min', description: 'Seafood cataplana with tomato, peppers and white wine', tags: ['high-protein', 'gluten-free'] },
      { name: 'Frango Piri-Piri com Arroz', emoji: '🍗', cal: 530, protein: 42, carbs: 45, fat: 20, prepTime: '30 min', description: 'Flame-grilled piri-piri chicken with tomato rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Açorda de Camarão', emoji: '🍤', cal: 470, protein: 30, carbs: 52, fat: 16, prepTime: '25 min', description: 'Alentejo bread soup with shrimp, coriander and poached egg', tags: [] },
      { name: 'Bacalhau no Forno', emoji: '🐟', cal: 480, protein: 40, carbs: 40, fat: 18, prepTime: '30 min', description: 'Baked cod loin with potatoes, onions and roasted vegetables', tags: ['high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Queijo da Serra com Maçã', emoji: '🧀', cal: 220, protein: 8, carbs: 20, fat: 12, prepTime: '10 min', description: 'Creamy mountain cheese with crisp apple slices', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Tremoços', emoji: '🫘', cal: 120, protein: 10, carbs: 12, fat: 4, prepTime: '10 min', description: 'Briny lupin beans with lemon — the classic Portuguese bar snack', tags: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
      { name: 'Pastel de Nata (1)', emoji: '🥧', cal: 200, protein: 4, carbs: 28, fat: 8, prepTime: '10 min', description: 'One warm custard tart with cinnamon — portion controlled', tags: ['vegetarian'] },
    ],
  },

  'france': {
    breakfast: [
      { name: 'Omelette aux Fines Herbes', emoji: '🍳', cal: 300, protein: 20, carbs: 6, fat: 22, prepTime: '10 min', description: 'Herb omelette with chives, parsley and a little gruyère', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Tartine Complète', emoji: '🍞', cal: 300, protein: 8, carbs: 45, fat: 10, prepTime: '10 min', description: 'Whole grain toast with butter, jam and a café crème', tags: ['vegetarian'] },
      { name: 'Fromage Blanc aux Fruits', emoji: '🫐', cal: 310, protein: 18, carbs: 42, fat: 8, prepTime: '10 min', description: 'Fromage blanc with muesli, berries and honey', tags: ['vegetarian'] },
      { name: 'Galette Complète (légère)', emoji: '🥞', cal: 340, protein: 20, carbs: 28, fat: 16, prepTime: '15 min', description: 'Buckwheat crêpe with egg, ham and emmental — light version', tags: ['high-protein', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Poulet Rôti et Ratatouille', emoji: '🍗', cal: 510, protein: 42, carbs: 40, fat: 20, prepTime: '30 min', description: 'Roast chicken with provençal ratatouille and quinoa', tags: ['high-protein', 'gluten-free'] },
      { name: 'Bouillabaisse Complète', emoji: '🍲', cal: 470, protein: 38, carbs: 40, fat: 18, prepTime: '30 min', description: 'Provençal fish stew with rouille and toasted bread', tags: ['high-protein'] },
      { name: 'Steak Haché Frites (light)', emoji: '🥩', cal: 460, protein: 36, carbs: 35, fat: 20, prepTime: '20 min', description: 'Lean minute steak with baked frites and green beans', tags: ['high-protein', 'gluten-free'] },
      { name: 'Cassoulet Léger', emoji: '🫘', cal: 490, protein: 32, carbs: 50, fat: 18, prepTime: '30 min', description: 'White bean cassoulet with lean sausage and duck (light)', tags: ['gluten-free'] },
    ],
    dinner: [
      { name: 'Sole aux Légumes et Riz', emoji: '🐟', cal: 490, protein: 36, carbs: 45, fat: 18, prepTime: '25 min', description: 'Dover sole with steamed vegetables and pilaf rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Blanquette de Veau (légère)', emoji: '🍲', cal: 490, protein: 38, carbs: 45, fat: 18, prepTime: '30 min', description: 'Light veal blanquette with carrots and rice, low-cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Gratin Dauphinois au Poulet', emoji: '🍗', cal: 490, protein: 34, carbs: 40, fat: 22, prepTime: '30 min', description: 'Light potato gratin with sliced roast chicken and salad', tags: ['high-protein'] },
      { name: 'Lentilles du Puy', emoji: '🫘', cal: 460, protein: 28, carbs: 50, fat: 16, prepTime: '25 min', description: 'Puy lentils with smoked sausage, carrots and mustard', tags: ['gluten-free'] },
    ],
    snack: [
      { name: 'Pomme et Comté', emoji: '🧀', cal: 210, protein: 9, carbs: 22, fat: 10, prepTime: '10 min', description: 'Apple slices with aged comté cheese', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Yaourt au Miel', emoji: '🍯', cal: 170, protein: 10, carbs: 24, fat: 4, prepTime: '10 min', description: 'Plain yogurt with a spoon of honey and cinnamon', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Noix (30g)', emoji: '🌰', cal: 200, protein: 5, carbs: 4, fat: 18, prepTime: '10 min', description: 'A small handful of walnuts — classic French goûter', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'germany': {
    breakfast: [
      { name: 'Rührei mit Vollkornbrot', emoji: '🍳', cal: 350, protein: 22, carbs: 30, fat: 16, prepTime: '10 min', description: 'Scrambled eggs with chives on whole grain bread', tags: ['vegetarian', 'high-protein'] },
      { name: 'Haferbrei mit Apfel', emoji: '🥣', cal: 290, protein: 10, carbs: 50, fat: 6, prepTime: '10 min', description: 'Oatmeal cooked in oat milk with apple and cinnamon', tags: ['vegetarian', 'vegan'] },
      { name: 'Quark mit Beeren', emoji: '🫐', cal: 320, protein: 22, carbs: 45, fat: 6, prepTime: '10 min', description: 'Low-fat quark with oats, berries and honey', tags: ['vegetarian', 'high-protein'] },
      { name: 'Vollkornbrot mit Käse', emoji: '🧀', cal: 330, protein: 18, carbs: 32, fat: 14, prepTime: '10 min', description: 'Whole grain bread with gouda, tomato and cucumber', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Schnitzel mit Kartoffelsalat', emoji: '🍗', cal: 490, protein: 38, carbs: 45, fat: 18, prepTime: '25 min', description: 'Oven-baked chicken schnitzel with light potato salad', tags: ['high-protein'] },
      { name: 'Erbsensuppe mit Speck', emoji: '🍲', cal: 450, protein: 26, carbs: 50, fat: 16, prepTime: '30 min', description: 'Split pea soup with a little bacon and root vegetables', tags: ['gluten-free'] },
      { name: 'Sauerbraten mit Knödel', emoji: '🥩', cal: 510, protein: 36, carbs: 50, fat: 18, prepTime: '30 min', description: 'Marinated roast beef with potato dumplings and red cabbage', tags: ['high-protein'] },
      { name: 'Hering mit Bratkartoffeln', emoji: '🐟', cal: 450, protein: 32, carbs: 40, fat: 18, prepTime: '20 min', description: 'Pan-fried herring with fried potatoes and apple-onion salad', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Bratwurst mit Sauerkraut', emoji: '🥨', cal: 470, protein: 28, carbs: 35, fat: 24, prepTime: '20 min', description: 'Two lean bratwurst with sauerkraut and mustard, one roll', tags: ['high-protein'] },
      { name: 'Käsespätzle mit Salat', emoji: '🧀', cal: 500, protein: 24, carbs: 55, fat: 20, prepTime: '25 min', description: 'Cheese spaetzle with crispy onions and green salad', tags: ['vegetarian'] },
      { name: 'Schweinefilet mit Kartoffeln', emoji: '🍖', cal: 460, protein: 42, carbs: 38, fat: 16, prepTime: '30 min', description: 'Grilled pork tenderloin with boiled potatoes and vegetables', tags: ['high-protein', 'gluten-free'] },
      { name: 'Linseneintopf', emoji: '🫘', cal: 480, protein: 30, carbs: 55, fat: 16, prepTime: '30 min', description: 'Hearty lentil stew with frankfurter slices and vinegar', tags: ['gluten-free'] },
    ],
    snack: [
      { name: 'Apfel mit Handkäse', emoji: '🍎', cal: 170, protein: 12, carbs: 25, fat: 2, prepTime: '10 min', description: 'Apple wedges with tangy handkäse and caraway', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Nüsse (30g)', emoji: '🌰', cal: 190, protein: 6, carbs: 6, fat: 16, prepTime: '10 min', description: 'A small handful of mixed nuts', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Buttermilch mit Banane', emoji: '🍌', cal: 190, protein: 10, carbs: 32, fat: 2, prepTime: '10 min', description: 'Buttermilk blended with banana — light and filling', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
    ],
  },

  'alpine': {
    breakfast: [
      { name: 'Birchermüesli', emoji: '🥣', cal: 350, protein: 14, carbs: 52, fat: 10, prepTime: '10 min', description: 'Overnight oats with grated apple, yogurt and hazelnuts', tags: ['vegetarian'] },
      { name: 'Rösti mit Spiegelei', emoji: '🍳', cal: 390, protein: 16, carbs: 40, fat: 18, prepTime: '20 min', description: 'Crispy potato rösti topped with a fried egg', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Zopf mit Käse', emoji: '🍞', cal: 350, protein: 16, carbs: 40, fat: 14, prepTime: '10 min', description: 'Braided sunday bread with alpine cheese and jam', tags: ['vegetarian'] },
      { name: 'Joghurt mit Honig und Nüssen', emoji: '🍯', cal: 320, protein: 16, carbs: 36, fat: 12, prepTime: '10 min', description: 'Mountain yogurt with honey, walnuts and dried fruit', tags: ['vegetarian', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Wiener Schnitzel (gebacken)', emoji: '🍗', cal: 470, protein: 36, carbs: 40, fat: 18, prepTime: '25 min', description: 'Oven-baked veal schnitzel with lingonberries and salad', tags: ['high-protein'] },
      { name: 'Käsespätzle mit Salat', emoji: '🧀', cal: 520, protein: 26, carbs: 58, fat: 20, prepTime: '25 min', description: 'Alpine cheese spaetzle with crispy onions and green salad', tags: ['vegetarian'] },
      { name: 'Zürcher Geschnetzeltes', emoji: '🍲', cal: 470, protein: 36, carbs: 42, fat: 18, prepTime: '25 min', description: 'Sliced veal in light cream sauce with rösti', tags: ['high-protein', 'gluten-free'] },
      { name: 'Tiroler Gröstl', emoji: '🥔', cal: 480, protein: 30, carbs: 45, fat: 20, prepTime: '25 min', description: 'Pan-fried potatoes with beef, onion and fried egg', tags: ['gluten-free', 'high-protein'] },
    ],
    dinner: [
      { name: 'Käsefondue Léger', emoji: '🫕', cal: 470, protein: 26, carbs: 28, fat: 28, prepTime: '20 min', description: 'Light half-portion fondue with vegetables for dipping', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Forelle Müllerinart', emoji: '🐟', cal: 450, protein: 36, carbs: 35, fat: 18, prepTime: '25 min', description: 'Pan-fried trout with parsley potatoes and lemon', tags: ['high-protein', 'gluten-free'] },
      { name: 'Älplermagronen (light)', emoji: '🧀', cal: 490, protein: 22, carbs: 60, fat: 18, prepTime: '25 min', description: 'Alpine macaroni with potato, light cheese and applesauce', tags: ['vegetarian'] },
      { name: 'Gulaschsuppe mit Brot', emoji: '🍲', cal: 460, protein: 32, carbs: 48, fat: 16, prepTime: '30 min', description: 'Hearty beef goulash soup with dark bread', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Apfelstrudel (klein)', emoji: '🍎', cal: 260, protein: 4, carbs: 38, fat: 10, prepTime: '10 min', description: 'A small slice of apple strudel with cinnamon', tags: ['vegetarian'] },
      { name: 'Bergkäse mit Trauben', emoji: '🧀', cal: 240, protein: 10, carbs: 18, fat: 14, prepTime: '10 min', description: 'Aged mountain cheese with red grapes', tags: ['vegetarian', 'gluten-free', 'high-protein'] },
      { name: 'Studentenfutter (30g)', emoji: '🌰', cal: 190, protein: 6, carbs: 14, fat: 12, prepTime: '10 min', description: 'Trail mix of nuts, raisins and dark chocolate chips', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'benelux': {
    breakfast: [
      { name: 'Uitsmijter (light)', emoji: '🍳', cal: 380, protein: 24, carbs: 30, fat: 18, prepTime: '15 min', description: 'Two fried eggs on whole-grain bread with ham and cheese, light on butter', tags: ['high-protein'] },
      { name: 'Havermout met Fruit', emoji: '🥣', cal: 320, protein: 12, carbs: 55, fat: 6, prepTime: '10 min', description: 'Oatmeal with yogurt, apple, and cinnamon', tags: ['vegetarian'] },
      { name: 'Roggebrood met Kaas', emoji: '🍞', cal: 350, protein: 16, carbs: 45, fat: 11, prepTime: '10 min', description: 'Dark rye bread with aged cheese and apple slices', tags: ['vegetarian'] },
      { name: 'Wentelteefjes (light)', emoji: '🥞', cal: 340, protein: 14, carbs: 48, fat: 10, prepTime: '15 min', description: 'Light whole-grain French toast with berries and a dusting of sugar', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Hutspot met Rookworst (light)', emoji: '🥘', cal: 620, protein: 26, carbs: 70, fat: 26, prepTime: '30 min', description: 'Mashed potato, carrot and onion with lean smoked sausage', tags: ['high-protein'] },
      { name: 'Waterzooi (light)', emoji: '🍲', cal: 520, protein: 34, carbs: 40, fat: 25, prepTime: '30 min', description: 'Flemish chicken and vegetable stew, light on cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Stamppot Boerenkool (light)', emoji: '🥬', cal: 580, protein: 24, carbs: 65, fat: 24, prepTime: '25 min', description: 'Kale and potato mash with lean sausage and mustard', tags: ['high-protein'] },
      { name: 'Broodje Gezond', emoji: '🥪', cal: 480, protein: 22, carbs: 55, fat: 19, prepTime: '10 min', description: 'Whole-grain sandwich with cheese, egg, and salad', tags: ['vegetarian', 'high-protein'] },
    ],
    dinner: [
      { name: 'Moules-Frites (light)', emoji: '🍟', cal: 650, protein: 38, carbs: 62, fat: 28, prepTime: '25 min', description: 'Mussels steamed in white wine with a small portion of oven fries', tags: ['high-protein'] },
      { name: 'Stoofvlees (light)', emoji: '🍖', cal: 640, protein: 36, carbs: 55, fat: 31, prepTime: '30 min', description: 'Flemish beef stewed in dark beer with light mashed potato', tags: ['high-protein'] },
      { name: 'Zuurkoolstamppot (light)', emoji: '🥬', cal: 540, protein: 22, carbs: 60, fat: 23, prepTime: '25 min', description: 'Sauerkraut and potato mash with light bacon bits', tags: ['high-protein'] },
      { name: 'Erwtensoep (vegetarian)', emoji: '🍲', cal: 460, protein: 20, carbs: 62, fat: 13, prepTime: '30 min', description: 'Thick split-pea soup with carrot, celery, and rye bread, no pork', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
    snack: [
      { name: 'Mini Stroopwafel', emoji: '🍪', cal: 150, protein: 2, carbs: 28, fat: 4, prepTime: '10 min', description: 'Small caramel syrup waffle with black coffee', tags: ['vegetarian'] },
      { name: 'Vlaflip (light)', emoji: '🍮', cal: 180, protein: 10, carbs: 28, fat: 3, prepTime: '10 min', description: 'Layered yogurt dessert with fruit syrup', tags: ['vegetarian', 'high-protein'] },
      { name: 'Kaasblokjes met Appel', emoji: '🧀', cal: 220, protein: 12, carbs: 15, fat: 13, prepTime: '10 min', description: 'Cheese cubes with apple slices', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
  },

  'uk-ireland': {
    breakfast: [
      { name: 'Porridge with Berries', emoji: '🥣', cal: 320, protein: 10, carbs: 58, fat: 7, prepTime: '10 min', description: 'Oat porridge with mixed berries and honey', tags: ['vegetarian'] },
      { name: 'Light Full Breakfast', emoji: '🍳', cal: 430, protein: 28, carbs: 35, fat: 20, prepTime: '20 min', description: 'Two eggs, grilled tomato, mushrooms, one turkey sausage, whole-grain toast', tags: ['high-protein'] },
      { name: 'Kippers on Toast', emoji: '🐟', cal: 360, protein: 26, carbs: 32, fat: 14, prepTime: '15 min', description: 'Smoked kippers with lemon on whole-grain toast', tags: ['high-protein'] },
      { name: 'Welsh Rarebit (light)', emoji: '🧀', cal: 340, protein: 16, carbs: 38, fat: 14, prepTime: '15 min', description: 'Light cheese sauce on toasted whole-grain bread with mustard', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Ploughman\u2019s (light)', emoji: '🧀', cal: 520, protein: 24, carbs: 55, fat: 23, prepTime: '10 min', description: 'Cheese, pickle, and salad with whole-grain bread', tags: ['vegetarian', 'high-protein'] },
      { name: 'Cullen Skink (light)', emoji: '🍲', cal: 480, protein: 30, carbs: 45, fat: 20, prepTime: '25 min', description: 'Smoked haddock and potato soup, light on cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Coronation Chicken Wrap (light)', emoji: '🌯', cal: 540, protein: 32, carbs: 55, fat: 21, prepTime: '15 min', description: 'Curried chicken in light yogurt dressing, whole-grain wrap', tags: ['high-protein'] },
      { name: 'Leek and Potato Soup', emoji: '🍲', cal: 460, protein: 14, carbs: 62, fat: 18, prepTime: '25 min', description: 'Creamy leek and potato soup with a small cheese scone', tags: ['vegetarian'] },
    ],
    dinner: [
      { name: 'Lean Shepherd\u2019s Pie', emoji: '🥧', cal: 620, protein: 34, carbs: 58, fat: 28, prepTime: '30 min', description: 'Lean minced lamb with vegetables under light mashed potato', tags: ['high-protein', 'gluten-free'] },
      { name: 'Roast Chicken Dinner (light)', emoji: '🍗', cal: 640, protein: 42, carbs: 55, fat: 28, prepTime: '30 min', description: 'Roast chicken breast, roast potatoes, carrots, and gravy', tags: ['high-protein'] },
      { name: 'Baked Cod with Mushy Peas', emoji: '🐟', cal: 520, protein: 38, carbs: 50, fat: 19, prepTime: '25 min', description: 'Oven-baked cod with mushy peas and a small portion of chips', tags: ['high-protein'] },
      { name: 'Bubble and Squeak with Eggs', emoji: '🍳', cal: 480, protein: 20, carbs: 55, fat: 21, prepTime: '20 min', description: 'Crisped potato and cabbage cake topped with two poached eggs', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
    snack: [
      { name: 'Small Scone with Jam', emoji: '🍪', cal: 220, protein: 4, carbs: 42, fat: 5, prepTime: '10 min', description: 'One small scone with jam and tea', tags: ['vegetarian'] },
      { name: 'Cheese and Oatcakes', emoji: '🧀', cal: 240, protein: 10, carbs: 22, fat: 13, prepTime: '10 min', description: 'Cheddar with three oatcakes', tags: ['vegetarian', 'high-protein'] },
      { name: 'Apple with Peanut Butter', emoji: '🍎', cal: 200, protein: 6, carbs: 22, fat: 11, prepTime: '10 min', description: 'Sliced apple with a tablespoon of peanut butter', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'nordics': {
    breakfast: [
      { name: 'Skyr with Berries', emoji: '🫐', cal: 280, protein: 24, carbs: 38, fat: 3, prepTime: '10 min', description: 'Icelandic skyr with bilberries and honey', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Rye Porridge with Apple', emoji: '🥣', cal: 300, protein: 8, carbs: 60, fat: 5, prepTime: '15 min', description: 'Danish rye porridge with stewed apple and cinnamon', tags: ['vegetarian', 'vegan'] },
      { name: 'Smoked Salmon on Crispbread', emoji: '🐟', cal: 340, protein: 24, carbs: 32, fat: 13, prepTime: '10 min', description: 'Smoked salmon with light cream cheese on rye crispbread', tags: ['high-protein'] },
      { name: 'Light Egg Cake', emoji: '🍳', cal: 360, protein: 20, carbs: 28, fat: 19, prepTime: '20 min', description: 'Danish oven egg cake with chives, light on butter', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Gravlax on Rye', emoji: '🐟', cal: 520, protein: 32, carbs: 45, fat: 24, prepTime: '15 min', description: 'Cured salmon on dark rye with mustard-dill sauce', tags: ['high-protein'] },
      { name: 'Swedish Pea Soup (light)', emoji: '🍲', cal: 480, protein: 26, carbs: 58, fat: 16, prepTime: '30 min', description: 'Yellow pea soup with vegetables, vegetarian style', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Shrimp Sandwich (light)', emoji: '🦐', cal: 540, protein: 34, carbs: 52, fat: 22, prepTime: '15 min', description: 'Open-faced shrimp sandwich with light mayo, lemon, and dill', tags: ['high-protein'] },
      { name: 'Salmon Soup (light)', emoji: '🍲', cal: 560, protein: 32, carbs: 48, fat: 27, prepTime: '25 min', description: 'Finnish lohikeitto with potato and leek, light cream', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Lean Meatballs with Lingonberry', emoji: '🧆', cal: 640, protein: 36, carbs: 62, fat: 27, prepTime: '30 min', description: 'Swedish meatballs, lean mince, with light mash and lingonberry', tags: ['high-protein'] },
      { name: 'Baked Salmon with Root Veg', emoji: '🐟', cal: 620, protein: 38, carbs: 45, fat: 31, prepTime: '30 min', description: 'Oven salmon with roasted carrots, parsnip, and dill', tags: ['high-protein', 'gluten-free'] },
      { name: 'Herring with New Potatoes', emoji: '🐟', cal: 520, protein: 28, carbs: 55, fat: 21, prepTime: '20 min', description: 'Pickled herring with warm new potatoes, dill, and sour cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Root Vegetable Gratin (light)', emoji: '🥔', cal: 480, protein: 14, carbs: 65, fat: 18, prepTime: '30 min', description: 'Baked celeriac, carrot, and potato gratin with cheese, side salad', tags: ['vegetarian', 'gluten-free'] },
    ],
    snack: [
      { name: 'Mini Skyr with Cloudberry', emoji: '🫐', cal: 140, protein: 14, carbs: 20, fat: 1, prepTime: '10 min', description: 'Small skyr pot with cloudberry jam', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Crispbread with Cheese', emoji: '🧀', cal: 200, protein: 10, carbs: 24, fat: 8, prepTime: '10 min', description: 'Two rye crispbreads with hard cheese', tags: ['vegetarian', 'high-protein'] },
      { name: 'Smoked Almonds (small)', emoji: '🌰', cal: 170, protein: 6, carbs: 6, fat: 15, prepTime: '10 min', description: 'Small handful of smoked almonds', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'poland-eastern-europe': {
    breakfast: [
      { name: 'Owsianka with Apple', emoji: '🥣', cal: 310, protein: 9, carbs: 58, fat: 6, prepTime: '10 min', description: 'Polish oatmeal with grated apple and cinnamon', tags: ['vegetarian'] },
      { name: 'Jajecznica on Rye', emoji: '🍳', cal: 380, protein: 22, carbs: 32, fat: 21, prepTime: '15 min', description: 'Scrambled eggs with chives on dark rye bread', tags: ['vegetarian', 'high-protein'] },
      { name: 'Twarog with Radish', emoji: '🧀', cal: 340, protein: 24, carbs: 34, fat: 12, prepTime: '10 min', description: 'Farmer cheese with radish, chives, and rye bread', tags: ['vegetarian', 'high-protein'] },
      { name: 'Light Berry Pancakes', emoji: '🥞', cal: 360, protein: 12, carbs: 58, fat: 9, prepTime: '20 min', description: 'Thin Polish pancakes with berries and light sour cream', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Zurek with Egg', emoji: '🍲', cal: 520, protein: 24, carbs: 48, fat: 26, prepTime: '25 min', description: 'Sour rye soup with egg and light sausage', tags: ['high-protein'] },
      { name: 'Pierogi Ruskie (light)', emoji: '🥟', cal: 560, protein: 20, carbs: 78, fat: 19, prepTime: '25 min', description: 'Six potato-cheese dumplings with skyr instead of sour cream', tags: ['vegetarian', 'high-protein'] },
      { name: 'Golabki (lean)', emoji: '🥬', cal: 580, protein: 30, carbs: 62, fat: 23, prepTime: '30 min', description: 'Cabbage rolls with lean meat and rice in tomato sauce', tags: ['high-protein', 'gluten-free'] },
      { name: 'Barszcz with Uszka', emoji: '🍲', cal: 420, protein: 12, carbs: 68, fat: 11, prepTime: '25 min', description: 'Clear beet soup with small mushroom dumplings', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Lean Bigos', emoji: '🥘', cal: 540, protein: 34, carbs: 42, fat: 26, prepTime: '30 min', description: 'Hunter stew with turkey, sauerkraut, and mushrooms', tags: ['high-protein', 'gluten-free'] },
      { name: 'Grilled Kielbasa with Beets', emoji: '🌭', cal: 620, protein: 30, carbs: 62, fat: 28, prepTime: '25 min', description: 'Lean grilled sausage with roasted beets and buckwheat', tags: ['high-protein', 'gluten-free'] },
      { name: 'Baked Pork Cutlet', emoji: '🍖', cal: 600, protein: 38, carbs: 45, fat: 27, prepTime: '30 min', description: 'Oven-baked pork cutlet with cucumber salad (mizeria)', tags: ['high-protein'] },
      { name: 'Baked Potato Pancakes', emoji: '🥔', cal: 640, protein: 30, carbs: 65, fat: 29, prepTime: '30 min', description: 'Oven-baked potato pancakes with light beef goulash', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Kisiel with Berries', emoji: '🍮', cal: 130, protein: 2, carbs: 30, fat: 1, prepTime: '10 min', description: 'Polish fruit jelly with fresh berries', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Oscypek with Cranberry', emoji: '🧀', cal: 200, protein: 12, carbs: 8, fat: 14, prepTime: '10 min', description: 'Small smoked mountain cheese with cranberry sauce', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Rye Bread with Hummus', emoji: '🍞', cal: 220, protein: 8, carbs: 34, fat: 7, prepTime: '10 min', description: 'Dark rye bread with hummus and cucumber', tags: ['vegetarian', 'vegan'] },
    ],
  },

  'russia': {
    breakfast: [
      { name: 'Baked Syrniki', emoji: '🥞', cal: 380, protein: 22, carbs: 45, fat: 14, prepTime: '20 min', description: 'Oven-baked cottage cheese pancakes with light sour cream and berries', tags: ['vegetarian', 'high-protein'] },
      { name: 'Buckwheat Kasha', emoji: '🥣', cal: 330, protein: 11, carbs: 62, fat: 6, prepTime: '15 min', description: 'Buckwheat porridge with warm milk and honey', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Blini with Salmon', emoji: '🐟', cal: 360, protein: 20, carbs: 42, fat: 13, prepTime: '20 min', description: 'Two thin blini with smoked salmon and light cream cheese', tags: ['high-protein'] },
      { name: 'Mushroom Omelette', emoji: '🍳', cal: 350, protein: 20, carbs: 28, fat: 19, prepTime: '15 min', description: 'Three-egg omelette with mushrooms and rye bread', tags: ['vegetarian', 'high-protein'] },
    ],
    lunch: [
      { name: 'Borscht (light)', emoji: '🍲', cal: 480, protein: 18, carbs: 62, fat: 18, prepTime: '30 min', description: 'Beet and cabbage soup with light sour cream and rye bread', tags: ['vegetarian'] },
      { name: 'Light Pelmeni', emoji: '🥟', cal: 560, protein: 28, carbs: 58, fat: 24, prepTime: '20 min', description: 'Eight lean-meat dumplings with a spoon of light sour cream', tags: ['high-protein'] },
      { name: 'Light Beef Stroganoff', emoji: '🍖', cal: 620, protein: 38, carbs: 55, fat: 27, prepTime: '30 min', description: 'Beef strips in yogurt sauce over buckwheat', tags: ['high-protein'] },
      { name: 'Shchi with Potato', emoji: '🍲', cal: 420, protein: 14, carbs: 60, fat: 14, prepTime: '30 min', description: 'Cabbage soup with potato and rye bread', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Baked Chicken Kotlety', emoji: '🍗', cal: 600, protein: 36, carbs: 55, fat: 26, prepTime: '30 min', description: 'Oven-baked chicken patties with light mashed potato', tags: ['high-protein'] },
      { name: 'Baked Pike-Perch', emoji: '🐟', cal: 560, protein: 40, carbs: 48, fat: 23, prepTime: '30 min', description: 'Baked sudak with buckwheat and dill', tags: ['high-protein', 'gluten-free'] },
      { name: 'Golubtsy (lean)', emoji: '🥬', cal: 580, protein: 30, carbs: 60, fat: 25, prepTime: '30 min', description: 'Cabbage rolls with lean meat and rice, light sour cream', tags: ['high-protein', 'gluten-free'] },
      { name: 'Light Mushroom Julienne', emoji: '🍄', cal: 460, protein: 16, carbs: 48, fat: 23, prepTime: '25 min', description: 'Baked mushrooms in light cream sauce with rye bread', tags: ['vegetarian'] },
    ],
    snack: [
      { name: 'Small Pryanik', emoji: '🍪', cal: 150, protein: 2, carbs: 32, fat: 2, prepTime: '10 min', description: 'One small honey spice cookie with tea', tags: ['vegetarian'] },
      { name: 'Tvorog with Honey', emoji: '🍯', cal: 190, protein: 16, carbs: 22, fat: 5, prepTime: '10 min', description: 'Cottage cheese with a drizzle of honey', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Pickles with Crispbread', emoji: '🥒', cal: 120, protein: 4, carbs: 22, fat: 2, prepTime: '10 min', description: 'Pickled cucumber with rye crispbread', tags: ['vegetarian', 'vegan'] },
    ],
  },

  'balkans': {
    breakfast: [
      { name: 'Light Cheese Burek', emoji: '🥐', cal: 420, protein: 18, carbs: 48, fat: 17, prepTime: '20 min', description: 'Small flaky burek with cheese and a glass of yogurt', tags: ['vegetarian'] },
      { name: 'Kajgana with Ajvar', emoji: '🍳', cal: 380, protein: 20, carbs: 38, fat: 17, prepTime: '15 min', description: 'Balkan scrambled eggs with ajvar and bread', tags: ['vegetarian', 'high-protein'] },
      { name: 'Proja with Kajmak', emoji: '🌽', cal: 350, protein: 12, carbs: 52, fat: 10, prepTime: '20 min', description: 'Cornbread with light kajmak and tomato', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Savory French Toast', emoji: '🍞', cal: 360, protein: 16, carbs: 44, fat: 13, prepTime: '15 min', description: 'Balkan-style przenice with cheese', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Lean Cevapi', emoji: '🍖', cal: 640, protein: 34, carbs: 55, fat: 31, prepTime: '25 min', description: 'Five lean minced-meat sausages in small lepinja with onions', tags: ['high-protein'] },
      { name: 'Sarma (lean)', emoji: '🥬', cal: 580, protein: 30, carbs: 58, fat: 25, prepTime: '30 min', description: 'Sauerkraut rolls with lean meat and rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Pasulj (light)', emoji: '🫘', cal: 540, protein: 22, carbs: 78, fat: 16, prepTime: '30 min', description: 'White bean stew with vegetables and bread', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Shopska with Chicken', emoji: '🥗', cal: 520, protein: 38, carbs: 28, fat: 28, prepTime: '20 min', description: 'Shopska salad topped with grilled chicken', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Lean Pljeskavica', emoji: '🍖', cal: 620, protein: 38, carbs: 35, fat: 36, prepTime: '25 min', description: 'Baked lean Balkan burger patty with grilled vegetables', tags: ['high-protein', 'gluten-free'] },
      { name: 'Stuffed Peppers (lean)', emoji: '🫑', cal: 560, protein: 30, carbs: 55, fat: 24, prepTime: '30 min', description: 'Peppers stuffed with lean meat and rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Fish Soup with Bread', emoji: '🍲', cal: 480, protein: 32, carbs: 48, fat: 18, prepTime: '30 min', description: 'Balkan river-fish soup with bread', tags: ['high-protein'] },
      { name: 'Prebranac with Salad', emoji: '🫘', cal: 500, protein: 20, carbs: 72, fat: 15, prepTime: '30 min', description: 'Oven-baked beans with onion and green salad', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
    snack: [
      { name: 'Ajvar with Breadsticks', emoji: '🫑', cal: 180, protein: 4, carbs: 32, fat: 5, prepTime: '10 min', description: 'Roasted pepper spread with breadsticks', tags: ['vegetarian', 'vegan'] },
      { name: 'Light Kajmak with Cucumber', emoji: '🥒', cal: 150, protein: 8, carbs: 6, fat: 11, prepTime: '10 min', description: 'Light creamy kajmak with cucumber slices', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Roasted Chestnuts', emoji: '🌰', cal: 200, protein: 3, carbs: 44, fat: 2, prepTime: '20 min', description: 'Handful of roasted chestnuts (kestenje)', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  'caucasus': {
    breakfast: [
      { name: 'Small Khachapuri (light)', emoji: '🧀', cal: 420, protein: 20, carbs: 52, fat: 15, prepTime: '25 min', description: 'Small cheese-filled bread, lighter dough, one egg', tags: ['vegetarian'] },
      { name: 'Lavash with Cheese and Herbs', emoji: '🫓', cal: 360, protein: 20, carbs: 40, fat: 13, prepTime: '10 min', description: 'Lavash wrapped with cheese, egg, and fresh tarragon', tags: ['vegetarian', 'high-protein'] },
      { name: 'Harissa Porridge', emoji: '🥣', cal: 340, protein: 18, carbs: 52, fat: 7, prepTime: '20 min', description: 'Armenian slow-cooked wheat and chicken porridge', tags: ['high-protein'] },
      { name: 'Matzoon with Honey', emoji: '🍯', cal: 300, protein: 14, carbs: 30, fat: 15, prepTime: '10 min', description: 'Thick Armenian yogurt with honey and walnuts', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
    lunch: [
      { name: 'Khinkali (4, lean)', emoji: '🥟', cal: 560, protein: 28, carbs: 60, fat: 23, prepTime: '30 min', description: 'Four Georgian soup dumplings with lean meat and herbs', tags: ['high-protein'] },
      { name: 'Lobio with Mchadi', emoji: '🫘', cal: 520, protein: 20, carbs: 72, fat: 16, prepTime: '30 min', description: 'Red kidney bean stew with cornbread', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Dolma (lean)', emoji: '🍇', cal: 540, protein: 26, carbs: 58, fat: 22, prepTime: '30 min', description: 'Grape leaves stuffed with lean meat and rice, yogurt dip', tags: ['high-protein', 'gluten-free'] },
      { name: 'Badrijani with Lavash', emoji: '🍆', cal: 460, protein: 12, carbs: 42, fat: 27, prepTime: '25 min', description: 'Eggplant rolls with walnut-garlic filling and lavash', tags: ['vegetarian', 'vegan'] },
    ],
    dinner: [
      { name: 'Georgian Chicken Kebab', emoji: '🍗', cal: 620, protein: 42, carbs: 48, fat: 29, prepTime: '30 min', description: 'Marinated chicken skewers with grilled vegetables and lavash', tags: ['high-protein'] },
      { name: 'Chakhokhbili (light)', emoji: '🍲', cal: 600, protein: 38, carbs: 58, fat: 24, prepTime: '30 min', description: 'Georgian chicken and tomato stew with rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Ajapsandali with Cheese', emoji: '🍆', cal: 480, protein: 16, carbs: 55, fat: 22, prepTime: '30 min', description: 'Caucasus vegetable stew with suluguni cheese', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Lean Lamb Lyulya', emoji: '🍖', cal: 640, protein: 36, carbs: 52, fat: 32, prepTime: '30 min', description: 'Lean minced-lamb kebab with bulgur and onion salad', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Small Churchkhela', emoji: '🍇', cal: 180, protein: 4, carbs: 36, fat: 3, prepTime: '10 min', description: 'Grape-and-walnut sweet, one small piece', tags: ['vegetarian', 'vegan'] },
      { name: 'Suluguni with Tomato', emoji: '🧀', cal: 220, protein: 16, carbs: 4, fat: 16, prepTime: '10 min', description: 'Sliced suluguni cheese with tomato', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Walnuts with Apricots', emoji: '🌰', cal: 190, protein: 5, carbs: 20, fat: 12, prepTime: '10 min', description: 'Handful of walnuts with dried apricots', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  // ── KASHMIR (J&K) ───────────────────────────────────────────────────────────
  'kashmir': {
    breakfast: [
      { name: 'Kahwa & Girda', emoji: '🍵', cal: 180, protein: 4, carbs: 32, fat: 5, prepTime: '10 min', description: 'Saffron green tea with almonds and a traditional girda bread', tags: ['vegetarian'] },
      { name: 'Noon Chai & Lavasa', emoji: '🫖', cal: 200, protein: 5, carbs: 30, fat: 7, prepTime: '15 min', description: 'Salted pink tea brewed with milk, served with soft lavasa bread', tags: ['vegetarian'] },
      { name: 'Kashmiri Harissa', emoji: '🥣', cal: 420, protein: 28, carbs: 35, fat: 18, prepTime: '30 min', description: 'Slow-cooked mutton and rice porridge — the classic winter breakfast', tags: ['high-protein', 'gluten-free'] },
      { name: 'Zafrani Doodh & Kulcha', emoji: '🥛', cal: 300, protein: 10, carbs: 42, fat: 10, prepTime: '10 min', description: 'Warm saffron milk with a crisp Kashmiri kulcha', tags: ['vegetarian'] },
    ],
    lunch: [
      { name: 'Rogan Josh & Rice', emoji: '🍛', cal: 580, protein: 38, carbs: 45, fat: 26, prepTime: '30 min', description: 'Slow-braised mutton in Kashmiri chili gravy with steamed rice', tags: ['high-protein', 'gluten-free'] },
      { name: 'Rajma Chawal (Jammu style)', emoji: '🫘', cal: 520, protein: 20, carbs: 85, fat: 12, prepTime: '30 min', description: 'Jammu\'s beloved red kidney beans with steamed basmati rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Mutton Yakhni & Rice', emoji: '🍲', cal: 540, protein: 36, carbs: 42, fat: 24, prepTime: '30 min', description: 'Delicate yogurt-based mutton curry with fennel and dry mint', tags: ['high-protein', 'gluten-free'] },
      { name: 'Haak Saag & Rice', emoji: '🥬', cal: 380, protein: 10, carbs: 55, fat: 14, prepTime: '20 min', description: 'Collard greens sautéed with mustard oil and garlic over rice', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Rista & Rice', emoji: '🧆', cal: 560, protein: 34, carbs: 44, fat: 28, prepTime: '30 min', description: 'Hand-pounded mutton meatballs in fiery red wazwan gravy', tags: ['high-protein'] },
      { name: 'Gushtaba & Rice', emoji: '🍖', cal: 590, protein: 36, carbs: 40, fat: 30, prepTime: '30 min', description: 'The wazwan finale — tender meatballs in creamy yogurt gravy', tags: ['high-protein', 'gluten-free'] },
      { name: 'Nadru Yakhni & Rice', emoji: '🪷', cal: 420, protein: 12, carbs: 58, fat: 16, prepTime: '25 min', description: 'Lotus stem from Dal Lake simmered in spiced yogurt', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Tabak Maaz (grilled) & Rice', emoji: '🍢', cal: 520, protein: 32, carbs: 38, fat: 26, prepTime: '25 min', description: 'Grilled rib chops with Kashmiri spices — lighter than the fried classic', tags: ['high-protein'] },
    ],
    snack: [
      { name: 'Kahwa & Shufta (small)', emoji: '🍵', cal: 200, protein: 4, carbs: 28, fat: 9, prepTime: '10 min', description: 'Saffron tea with a small portion of dry-fruit shufta dessert', tags: ['vegetarian', 'gluten-free'] },
      { name: 'Kaladi Kulcha (Jammu)', emoji: '🧀', cal: 280, protein: 14, carbs: 28, fat: 12, prepTime: '15 min', description: 'Grilled kaladi cheese stuffed in a crisp kulcha — Jammu street classic', tags: ['vegetarian'] },
      { name: 'Roasted Kashmiri Walnuts', emoji: '🌰', cal: 180, protein: 5, carbs: 4, fat: 18, prepTime: '10 min', description: 'A handful of local walnuts, dry-roasted with a pinch of salt', tags: ['vegetarian', 'vegan', 'gluten-free'] },
    ],
  },

  global: {
    breakfast: [
      { name: 'Oatmeal with Berries', emoji: '🥣', cal: 310, protein: 10, carbs: 52, fat: 6, prepTime: '8 min', description: 'Warm rolled oats with mixed berries, banana, and a drizzle of honey', tags: ['vegetarian', 'vegan'] },
      { name: 'Egg White Scramble', emoji: '🍳', cal: 250, protein: 28, carbs: 10, fat: 9, prepTime: '10 min', description: 'Fluffy egg whites with spinach, tomatoes, and bell peppers', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Protein Smoothie', emoji: '🥤', cal: 340, protein: 26, carbs: 42, fat: 6, prepTime: '5 min', description: 'Banana, protein powder, oats, almond milk blended smooth', tags: ['vegetarian', 'high-protein'] },
      { name: 'Soya Chunk Bhurji & Toast', emoji: '🍳', cal: 320, protein: 24, carbs: 38, fat: 6, prepTime: '12 min', description: 'Crumbled soya chunks sautéed with onion-tomato masala on whole wheat toast', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Paneer Bhurji (150g) & 2 Roti', emoji: '🫓', cal: 430, protein: 26, carbs: 36, fat: 18, prepTime: '15 min', description: 'Crumbled paneer with peas, turmeric and coriander, 2 whole wheat rotis', tags: ['vegetarian', 'high-protein'] },
      { name: 'Chana Dal Cheela (3 pc)', emoji: '🥞', cal: 340, protein: 18, carbs: 44, fat: 8, prepTime: '20 min', description: 'Savory chickpea-flour pancakes with onion, green chili and mint chutney', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Milk & Soya Porridge (500ml)', emoji: '🥣', cal: 420, protein: 24, carbs: 52, fat: 10, prepTime: '12 min', description: 'Warm milk porridge with oats, soya granules, banana and jaggery', tags: ['vegetarian', 'high-protein'] },
    ],
    lunch: [
      { name: 'Quinoa Buddha Bowl', emoji: '🥙', cal: 480, protein: 20, carbs: 58, fat: 16, prepTime: '25 min', description: 'Quinoa with roasted vegetables, chickpeas, and tahini dressing', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Lentil Soup & Bread', emoji: '🍲', cal: 380, protein: 18, carbs: 55, fat: 8, prepTime: '30 min', description: 'Hearty red lentil soup with whole grain bread and olive oil', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Chicken & Brown Rice', emoji: '🍗', cal: 450, protein: 38, carbs: 44, fat: 12, prepTime: '25 min', description: 'Simple grilled chicken breast with brown rice and steamed broccoli', tags: ['high-protein', 'gluten-free'] },
      { name: 'Soya Chunk Curry & Rice', emoji: '🍛', cal: 520, protein: 30, carbs: 68, fat: 12, prepTime: '30 min', description: 'Protein-packed soya chunk curry in onion-tomato gravy with steamed rice', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Double Chana Masala & 2 Roti', emoji: '🫘', cal: 540, protein: 24, carbs: 78, fat: 12, prepTime: '35 min', description: 'Extra-chickpea chana masala with 2 whole wheat rotis and onion salad', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Cottage Cheese Veg Sandwich', emoji: '🥪', cal: 450, protein: 22, carbs: 48, fat: 16, prepTime: '10 min', description: 'Low-fat cottage cheese with cucumber, tomato and mint chutney on whole wheat', tags: ['vegetarian', 'high-protein'] },
    ],
    dinner: [
      { name: 'Baked Chicken & Veggies', emoji: '🍗', cal: 420, protein: 42, carbs: 20, fat: 16, prepTime: '35 min', description: 'Herb-baked chicken thighs with roasted zucchini and peppers', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Stir-Fried Tofu & Vegetables', emoji: '🥢', cal: 380, protein: 22, carbs: 38, fat: 14, prepTime: '20 min', description: 'Crispy tofu with bok choy, peppers in ginger-soy sauce over rice', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Masoor Dal Tadka (large) & 2 Roti', emoji: '🍲', cal: 480, protein: 24, carbs: 66, fat: 10, prepTime: '30 min', description: 'Double-portion red lentil dal with garlic tadka, 2 whole wheat rotis', tags: ['vegetarian', 'vegan', 'high-protein'] },
      { name: 'Tofu Soya Fried Rice', emoji: '🍚', cal: 500, protein: 26, carbs: 62, fat: 14, prepTime: '25 min', description: 'Tofu and soya granules tossed with brown rice, spring onion, soy-ginger sauce', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
    snack: [
      { name: 'Mixed Nuts (30g)', emoji: '🥜', cal: 180, protein: 5, carbs: 6, fat: 16, prepTime: '0 min', description: 'Handful of almonds, walnuts, and cashews', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Greek Yogurt & Berries', emoji: '🫐', cal: 150, protein: 12, carbs: 18, fat: 3, prepTime: '2 min', description: 'Plain Greek yogurt topped with fresh or frozen berries', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Roasted Soya Nuts (50g)', emoji: '🥜', cal: 220, protein: 18, carbs: 14, fat: 10, prepTime: '0 min', description: 'Crunchy roasted soya nuts with chaat masala', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Peanut Chana Mix (50g)', emoji: '🥜', cal: 280, protein: 14, carbs: 22, fat: 16, prepTime: '0 min', description: 'Roasted peanuts and black chana with lemon and chili', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Boiled Chana Chaat (large)', emoji: '🫘', cal: 250, protein: 14, carbs: 38, fat: 4, prepTime: '10 min', description: 'Big bowl of boiled black chickpeas with onion, tomato and lemon', tags: ['vegetarian', 'vegan', 'high-protein', 'gluten-free'] },
      { name: 'Paneer Tikka (200g)', emoji: '🧀', cal: 400, protein: 36, carbs: 14, fat: 22, prepTime: '25 min', description: 'Char-grilled spiced paneer cubes with peppers and onion', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Greek Yogurt Peanut Bowl (300g)', emoji: '🥜', cal: 450, protein: 30, carbs: 22, fat: 24, prepTime: '5 min', description: 'Thick Greek yogurt with roasted peanuts, honey and cinnamon', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Paneer Tikka (100g)', emoji: '🧀', cal: 200, protein: 18, carbs: 7, fat: 11, prepTime: '20 min', description: 'Small portion of char-grilled spiced paneer cubes — protein-rich snack', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
      { name: 'Greek Yogurt (200g) + Flaxseed', emoji: '🫐', cal: 190, protein: 20, carbs: 13, fat: 5, prepTime: '2 min', description: 'Thick Greek yogurt with ground flaxseed and cinnamon', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
  },
};

// Alias legacy / alternate region keys to canonical food-database regions.
// detectRegion() now returns canonical keys directly; this is a safety net.
const REGION_ALIASES: Record<string, string> = {
  'saudi': 'gulf', 'uae': 'gulf', 'yemen': 'gulf',
  'iraq': 'levant', 'israel': 'levant',
  'hong-kong': 'china', 'macau': 'china', 'mongolia': 'central-asia',
  'bhutan': 'nepal', 'tibet': 'nepal', 'maldives': 'sri-lanka',
  'canada': 'usa', 'chile': 'argentina', 'uruguay': 'argentina', 'paraguay': 'argentina',
  'guyana': 'caribbean', 'suriname': 'caribbean', 'belize': 'central-america',
  'iceland': 'nordics', 'ireland': 'uk-ireland', 'cyprus': 'greece', 'malta': 'greece',
  'ukraine': 'poland-eastern-europe', 'belarus': 'russia',
  'madagascar': 'swahili-coast', 'mauritius': 'swahili-coast', 'seychelles': 'swahili-coast',
  'somalia': 'ethiopia-east-africa', 'sudan': 'ethiopia-east-africa',
  'west-africa': 'nigeria-west-africa', 'east-africa': 'ethiopia-east-africa',
  'uk': 'uk-ireland', 'europe': 'italy', 'malaysia': 'malaysia-singapore',
};

function resolveRegion(region: string): string {
  return REGION_ALIASES[region] || (REGIONAL_DB[region] ? region : 'global');
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function filterFoods(foods: FoodItem[], profile: UserProfile): FoodItem[] {
  const restrictions = (profile.dietaryRestrictions || []).map(r => r.toLowerCase());
  const allergies = (profile.allergies || []).map(a => a.toLowerCase());

  return foods.filter(f => {
    if (restrictions.includes('vegan') && !f.tags.includes('vegan')) return false;
    if (restrictions.includes('vegetarian') && !f.tags.includes('vegetarian')) return false;
    // Indian-style vegetarian excludes egg (dishes tagged veg but containing egg slip through otherwise)
    if (restrictions.includes('vegetarian') && /egg|huevo/.test(`${f.name} ${f.description}`.toLowerCase())) return false;
    if ((restrictions.includes('keto') || restrictions.includes('low-carb')) && f.carbs > 25) return false;
    if (restrictions.includes('gluten-free') && !f.tags.includes('gluten-free')) return false;
    if (restrictions.includes('high-protein') && !f.tags.includes('high-protein')) return false;
    for (const allergy of allergies) {
      if (f.name.toLowerCase().includes(allergy) || f.description.toLowerCase().includes(allergy)) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET — keyword-based cost tiers (1 = everyday staples, 2 = affordable
// proteins, 3 = premium). Heuristic so all 55 regions work without retagging.
// ─────────────────────────────────────────────────────────────────────────────

function estimateCostTier(f: FoodItem): 1 | 2 | 3 {
  const t = `${f.name} ${f.description}`.toLowerCase();
  if (/(salmon|tuna|prawn|shrimp|lobster|crab|mutton|lamb|quinoa|avocado|blueberr|whey|protein powder|saffron|zafran|kesar|kahwa|pistachio|macadamia|steak|ribeye|scallop|truffle|wagyu|halibut|sea bass|branzino|\bduck\b|sashimi|parmesan|asparagus|artichoke)/.test(t)) return 3;
  if (/(chicken|turkey|\bfish\b|tofu|paneer|cheese|feta|mozzarella|yogurt|yoghurt|\bcurd\b|egg|tempeh|edamame|hummus|tahini|olive oil|almond|walnut|cashew|\boats\b|greek)/.test(t)) return 2;
  return 1;
}

function budgetAllows(tier: 1 | 2 | 3, budget: BudgetTier): boolean {
  if (budget === 'budget') return tier <= 2; // staples + affordable proteins; no luxuries
  return true; // moderate & premium: everything is fair game
}

// ─────────────────────────────────────────────────────────────────────────────
// CUISINE MIX — blend regional comfort food with international variety, so a
// native of a place isn't locked into only local dishes.
// ─────────────────────────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PoolSet = Record<MealType, { regional: FoodItem[]; international: FoodItem[] }>;

function buildMealPools(region: string): PoolSet {
  const globalDb = REGIONAL_DB['global'];
  const otherKeys = shuffled(Object.keys(REGIONAL_DB).filter((k) => k !== 'global' && k !== region)).slice(0, 4);
  const db = REGIONAL_DB[region];
  const pools = {} as PoolSet;
  (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).forEach((mt) => {
    pools[mt] = {
      regional: db[mt] || [],
      international: [
        ...(globalDb[mt] || []),
        ...otherKeys.flatMap((k) => REGIONAL_DB[k][mt] || []),
      ],
    };
  });
  return pools;
}

function rollSource(cuisineMix: CuisineMix): 'regional' | 'international' {
  const r = Math.random();
  if (cuisineMix === 'local') return r < 0.8 ? 'regional' : 'international';
  if (cuisineMix === 'international') return r < 0.8 ? 'international' : 'regional';
  return r < 0.45 ? 'regional' : 'international'; // mixed — the default
}

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE-BASED SELECTION — greedy macro targeting so the day's meals actually
// land on the calculated calorie/protein/carb/fat goals instead of random sums.
// Meal calorie split follows common sports-nutrition distribution; protein is
// spread across meals to support muscle protein synthesis through the day.
// ─────────────────────────────────────────────────────────────────────────────

interface SlotTarget { cal: number; protein: number; carbs: number; fat: number; }

const SLOT_ORDER: { type: MealType; key: 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner'; calShare: number }[] = [
  { type: 'breakfast', key: 'breakfast', calShare: 0.25 },
  { type: 'snack', key: 'morningSnack', calShare: 0.10 },
  { type: 'lunch', key: 'lunch', calShare: 0.30 },
  { type: 'snack', key: 'afternoonSnack', calShare: 0.10 },
  { type: 'dinner', key: 'dinner', calShare: 0.25 },
];

function scoreCandidate(f: FoodItem, t: SlotTarget, proteinWeight: number, budget: BudgetTier): number {
  const calErr = Math.abs(f.cal - t.cal) / Math.max(t.cal, 60);
  // One-sided: only penalize protein SHORTFALL — overshoot is fine (and desirable).
  const pErr = Math.max(0, t.protein - f.protein) / Math.max(t.protein, 6);
  const cErr = Math.abs(f.carbs - t.carbs) / Math.max(t.carbs, 6);
  const fErr = Math.abs(f.fat - t.fat) / Math.max(t.fat, 4);
  const calW = 1 - proteinWeight - 0.15 - 0.10;
  const err = calErr * calW + pErr * proteinWeight + cErr * 0.15 + fErr * 0.10;
  let score = 1 / (1 + err);
  // Prefer protein-DENSE foods when the target demands a high protein share —
  // absolute protein alone can't fix a ratio mismatch (scaling preserves ratios).
  const targetShare = (t.protein * 4) / Math.max(t.cal, 1);
  const foodShare = (f.protein * 4) / Math.max(f.cal, 1);
  score -= Math.max(0, targetShare - foodShare) * proteinWeight * 1.5;
  if (budget === 'budget') score -= (estimateCostTier(f) - 1) * 0.05; // prefer cheaper staples when close
  return score;
}

const FALLBACK_FOOD: FoodItem = {
  name: 'Oats with banana & nuts', emoji: '🥣', cal: 350, protein: 12, carbs: 58, fat: 10,
  prepTime: '10 min', description: 'Rolled oats cooked in milk, topped with banana and mixed nuts.',
  tags: ['vegetarian'],
};

// ── Taste learning helpers (kept local to avoid module cycles) ──
function tasteNorm(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tasteNameMatches(foodName: string, remembered: string): boolean {
  const f = tasteNorm(foodName);
  const r = tasteNorm(remembered);
  if (!f || !r) return false;
  if (f === r) return true;
  const shorter = f.length < r.length ? f : r;
  const longer = f.length < r.length ? r : f;
  return longer.includes(shorter) && shorter.length >= 4;
}
function tasteMatchesAny(foodName: string, list: string[]): boolean {
  return list.some((r) => tasteNameMatches(foodName, r));
}

function pickSmart(
  type: MealType,
  target: SlotTarget,
  pools: PoolSet,
  recent: Record<MealType, string[]>,
  profile: UserProfile,
  budget: BudgetTier,
  cuisineMix: CuisineMix,
  proteinWeight: number,
  taste?: TasteProfile,
): FoodItem {
  const primary = rollSource(cuisineMix);
  const secondary = primary === 'regional' ? 'international' : 'regional';
  const scored: { f: FoodItem; s: number }[] = [];
  const seen = new Set<string>();

  const collect = (
    source: 'regional' | 'international',
    freshOnly: boolean,
    budgetStrict: boolean,
    penalty: number,
  ) => {
    let pool = filterFoods(pools[type][source], profile);
    if (budgetStrict) pool = pool.filter((f) => budgetAllows(estimateCostTier(f), budget));
    for (const f of pool) {
      if (seen.has(f.name)) continue;
      if (freshOnly && recent[type].includes(f.name)) continue;
      seen.add(f.name);
      let s = scoreCandidate(f, target, proteinWeight, budget) - penalty;
      // Taste learning: dislikes are heavily penalized (effectively excluded),
      // likes get a nudge — the plan learns what the user actually eats.
      if (taste) {
        if (tasteMatchesAny(f.name, taste.dislikes)) s -= 2;
        else if (tasteMatchesAny(f.name, taste.likes)) s += 0.25;
      }
      // Familiarity: the plan should feel like THEIR food, made healthier —
      // not a stranger's menu. Boost what they usually eat and love.
      const usualForSlot =
        type === 'breakfast' ? profile.usualBreakfast
        : type === 'lunch' ? profile.usualLunch
        : type === 'dinner' ? profile.usualDinner
        : undefined;
      if (usualForSlot && tasteNameMatches(f.name, usualForSlot)) s += 0.3;
      const favFoods = (profile.favoriteFoods || '').split(',').map((x) => x.trim()).filter(Boolean);
      if (favFoods.length && tasteMatchesAny(f.name, favFoods)) s += 0.2;
      const favCuisine = (profile.favoriteCuisine || '').toLowerCase().trim();
      if (favCuisine.length >= 3 && (f.name + ' ' + f.description).toLowerCase().includes(favCuisine)) s += 0.15;
      scored.push({ f, s });
    }
  };

  // Fresh + budget-respecting first (primary source preferred via penalty on secondary).
  collect(primary, true, true, 0);
  collect(secondary, true, true, 0.06);
  // Then allow repeats, still budget-respecting.
  if (scored.length < 4) {
    collect(primary, false, true, 0.01);
    collect(secondary, false, true, 0.07);
  }
  // Budget is the hardest constraint: relax it only when nothing else works.
  if (scored.length < 2) {
    collect(primary, true, false, 0.06);
    collect(secondary, true, false, 0.08);
  }
  if (!scored.length) return FALLBACK_FOOD;

  scored.sort((a, b) => b.s - a.s);
  // Deterministic best pick — the recent-names exclusion (10 deep per meal type)
  // already forces week-long variety, so we always take the best macro fit.
  return scored[0].f;
}

function toMeal(f: FoodItem): Meal {
  return { name: f.name, description: f.description, calories: f.cal, protein: f.protein, carbs: f.carbs, fat: f.fat, prepTime: f.prepTime, emoji: f.emoji, tags: f.tags };
}

export type SlotKey = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';

export interface MealWhyContext {
  proteinTarget: number; // g/day
  calorieTarget: number; // kcal/day
  dayTotal: number;      // kcal for the whole day
  goal: Goal;
  exercises: boolean;
}

/**
 * One-line reason a meal is in the plan, derived from the numbers — no AI
 * needed, so it's instant and always truthful. Picks the most distinctive
 * true statement about the meal's role in the day.
 */
export function mealWhy(meal: Meal, slotKey: SlotKey, ctx: MealWhyContext): string {
  const kcal = (n: number) => Math.round(n).toLocaleString('en-US');
  // Dinner: frame it as landing the day — the natural bookend.
  if (slotKey === 'dinner') {
    return `Closes the day at ~${kcal(ctx.dayTotal)} of your ${kcal(ctx.calorieTarget)} kcal.`;
  }
  // Training-day lunch: carbs timed around the workout.
  if (slotKey === 'lunch' && ctx.exercises && meal.carbs >= 40) {
    return 'Carbs timed around training — fuel for the session, protein for after.';
  }
  // Protein anchor: this meal does heavy lifting toward the daily protein target.
  if (meal.protein >= 25) {
    return `Protein anchor — ${Math.round(meal.protein)}g toward your ${Math.round(ctx.proteinTarget)}g daily goal.`;
  }
  // Light snack: keeps the day on track.
  if ((slotKey === 'morningSnack' || slotKey === 'afternoonSnack') && meal.calories < 280) {
    return `Light bite — keeps you on track for ${kcal(ctx.calorieTarget)} kcal without spoiling the next meal.`;
  }
  // Solid breakfast protein.
  if (slotKey === 'breakfast' && meal.protein >= 15) {
    return 'Front-loads protein so you stay full till lunch.';
  }
  // Fallback: portioned to fit.
  return `Portioned to fit your ${kcal(ctx.calorieTarget)} kcal day.`;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function generateDietPlan(
  profile: UserProfile,
  calculations: Calculations,
  taste?: TasteProfile,
): Promise<DietPlan> {
  await new Promise(r => setTimeout(r, 1800));

  const rawRegion = detectRegion(profile.location);
  const region = resolveRegion(rawRegion);
  const budget: BudgetTier = profile.budget || 'moderate';
  const cuisineMix: CuisineMix = profile.cuisineMix || 'mixed';
  const pools = buildMealPools(region);
  // High-protein goals get extra protein weighting in meal scoring
  const proteinWeight = profile.goal === 'lose_weight' ? 0.36
    : (profile.goal === 'gain_weight' || profile.goal === 'athletic') ? 0.38 : 0.30;

  const recent: Record<MealType, string[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };

  const weeklyPlan: DayPlan[] = DAYS.map((dayName) => {
    // Greedy fill: each slot targets its share of what's still left for the day,
    // so the day lands on the calculated calorie + macro goals.
    let remCal = calculations.dailyCalorieGoal;
    let remP = calculations.proteinG, remC = calculations.carbsG, remF = calculations.fatG;
    let remShare = 1;
    const picked = {} as Record<'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner', Meal>;
    for (const slot of SLOT_ORDER) {
      const share = slot.calShare / remShare;
      // Per-slot protein soft cap (~0.4 g/kg, the per-meal muscle-protein-synthesis
      // ceiling): keeps targets achievable so the scorer can discriminate between
      // candidates instead of rating everything as a failure.
      const slotProteinCap = 0.4 * profile.weightKg;
      // Taste learning: slots flagged by the weekly review get a protein boost.
      const proteinBoost = taste?.proteinBoostSlots.includes(slot.key) ? 1.5 : 1;
      const target: SlotTarget = {
        cal: remCal * share,
        protein: Math.min(remP * share * proteinBoost, slotProteinCap),
        carbs: remC * share,
        fat: remF * share,
      };
      const food = pickSmart(slot.type, target, pools, recent, profile, budget, cuisineMix, proteinWeight, taste);
      const meal = toMeal(food);
      // Portion-scale (up to 2×) so the slot actually meets its calorie target —
      // pools have fixed serving sizes, and real dietetics adjusts portions, not wishes.
      const rawScale = target.cal / Math.max(food.cal, 1);
      if (rawScale > 1.15) {
        const scale = Math.min(2, Math.round(rawScale * 2) / 2);
        if (scale > 1) {
          meal.calories = Math.round(food.cal * scale);
          meal.protein = Math.round(food.protein * scale * 10) / 10;
          meal.carbs = Math.round(food.carbs * scale * 10) / 10;
          meal.fat = Math.round(food.fat * scale * 10) / 10;
          meal.description = `${food.description} (Portion: ${scale}× serving to meet your calorie goal.)`;
        }
      }
      picked[slot.key] = meal;
      remCal -= meal.calories; remP -= meal.protein; remC -= meal.carbs; remF -= meal.fat;
      remShare -= slot.calShare;
      recent[slot.type].push(food.name);
      if (recent[slot.type].length > 10) recent[slot.type].shift();
    }
    const meals = [picked.breakfast, picked.morningSnack, picked.lunch, picked.afternoonSnack, picked.dinner];
    const totalCalories = meals.reduce((a, m) => a + m.calories, 0);
    // The plan shows its work: every meal gets a one-line reason derived from
    // the numbers behind it.
    const whyCtx: MealWhyContext = {
      proteinTarget: calculations.proteinG,
      calorieTarget: calculations.dailyCalorieGoal,
      dayTotal: totalCalories,
      goal: profile.goal,
      exercises: (profile.exerciseFrequency ?? 0) > 0,
    };
    for (const [key, m] of Object.entries(picked) as [SlotKey, Meal][]) {
      m.why = mealWhy(m, key, whyCtx);
    }
    return {
      day: dayName,
      breakfast: picked.breakfast,
      morningSnack: picked.morningSnack,
      lunch: picked.lunch,
      afternoonSnack: picked.afternoonSnack,
      dinner: picked.dinner,
      totalCalories,
    };
  });

  const { goal } = profile;
  const tips = getTips(goal);

  // Honest protein-gap coaching: if the week's food can't fully reach a very high
  // protein target (e.g. vegetarian + budget constraints), say so and give the fix.
  const avgProtein = weeklyPlan.reduce((a, d) =>
    a + [d.breakfast, d.morningSnack, d.lunch, d.afternoonSnack, d.dinner]
      .reduce((x, m) => x + m.protein, 0), 0) / weeklyPlan.length;
  if (avgProtein < calculations.proteinG * 0.85) {
    const gap = Math.round(calculations.proteinG - avgProtein);
    tips.unshift(`🥛 Your meals average ~${Math.round(avgProtein)}g protein vs the ${calculations.proteinG}g target — close the ${gap}g gap with 200g Greek yogurt (+20g) or a whey shake (+25g).`);
  }
  const hydrationPlan = `Drink ${calculations.waterLiters}L (${Math.round(calculations.waterLiters * 33.8)} oz) of water daily. Start morning with 500ml warm water. Carry a 750ml bottle and refill ${Math.ceil(calculations.waterLiters / 0.75)} times. Add electrolytes if you exercise over 60 minutes.`;

  const supplementSuggestions = [
    'Vitamin D3 (2000–4000 IU) — essential if you spend limited time outdoors',
    'Omega-3 Fish Oil (1–2g EPA+DHA) — reduces inflammation, supports heart health',
    goal === 'gain_weight' || goal === 'athletic' ? 'Creatine Monohydrate (5g/day) — most research-backed supplement for performance' : 'Magnesium Glycinate (300mg before bed) — improves sleep and reduces cortisol',
    'Probiotic (10B+ CFU) — supports gut health and immunity',
  ];

  const shoppingList = generateShoppingList(region, profile);

  const calorieEquivalences = [
    { amount: calculations.dailyCalorieGoal, examples: [`${calculations.dailyCalorieGoal} kcal daily goal`, `≈ ${Math.round(calculations.dailyCalorieGoal / 4)} chapatis`, `≈ ${Math.round(calculations.dailyCalorieGoal / 200)} medium meals`] },
    { amount: Math.abs(calculations.dailyCalorieGoal - calculations.tdee), examples: [`${Math.abs(calculations.dailyCalorieGoal - calculations.tdee)} kcal ${calculations.dailyCalorieGoal < calculations.tdee ? 'deficit' : 'surplus'}`, `≈ ${Math.round(Math.abs(calculations.dailyCalorieGoal - calculations.tdee) / 6)} min brisk walking`, `≈ ${Math.round(Math.abs(calculations.dailyCalorieGoal - calculations.tdee) / 9)} min running`] },
    { amount: Math.round(calculations.dailyCalorieGoal * 0.25), examples: [`Breakfast portion: ${Math.round(calculations.dailyCalorieGoal * 0.25)} kcal`, `≈ 2–3 eggs with toast`, `≈ 1 bowl oats + fruit`] },
  ];

  const progressMilestones = [
    { week: 1, milestone: 'Energy levels begin to improve and digestion stabilizes.' },
    { week: 2, milestone: `~${(Math.abs(calculations.weeklyWeightChangeKg) * 2).toFixed(1)}kg change expected. Clothes may fit differently.` },
    { week: 4, milestone: `One month: ~${(Math.abs(calculations.weeklyWeightChangeKg) * 4).toFixed(1)}kg total progress. Metabolism adapts.` },
    { week: 8, milestone: `Two months: ~${(Math.abs(calculations.weeklyWeightChangeKg) * 8).toFixed(1)}kg total. Habits feel automatic now.` },
    { week: 12, milestone: 'Three months: Visible body recomposition. Consider a goal reassessment!' },
  ];

  const regionLabel: Record<string, string> = {
    'north-india': 'North India', 'south-india': 'South India', 'west-india': 'West India', 'east-india': 'East India',
    'kashmir': 'Kashmir (J&K)', 'pakistan': 'Pakistan', 'bangladesh': 'Bangladesh', 'nepal': 'Nepal & Himalayas', 'sri-lanka': 'Sri Lanka',
    'afghanistan': 'Afghanistan', 'central-asia': 'Central Asia',
    'gulf': 'Middle East / Gulf', 'iran': 'Iran', 'turkey': 'Turkey', 'levant': 'Levant / Middle East',
    'egypt': 'Egypt', 'maghreb': 'North Africa / Maghreb',
    'japan': 'Japan', 'korea': 'Korea', 'china': 'China', 'taiwan': 'Taiwan',
    'thailand': 'Thailand', 'vietnam': 'Vietnam', 'mekong': 'Myanmar / Laos / Cambodia',
    'indonesia': 'Indonesia', 'malaysia-singapore': 'Malaysia / Singapore', 'philippines': 'Philippines',
    'italy': 'Italy', 'spain': 'Spain', 'portugal': 'Portugal', 'greece': 'Greece / Mediterranean',
    'france': 'France', 'germany': 'Germany', 'alpine': 'Switzerland / Austria', 'benelux': 'Benelux',
    'uk-ireland': 'UK / Ireland', 'nordics': 'Nordics', 'poland-eastern-europe': 'Eastern Europe',
    'russia': 'Russia', 'balkans': 'Balkans', 'caucasus': 'Caucasus',
    'nigeria-west-africa': 'West Africa', 'central-africa': 'Central Africa', 'swahili-coast': 'East Africa / Swahili Coast',
    'ethiopia-east-africa': 'Ethiopia / Horn of Africa', 'south-africa': 'Southern Africa',
    'usa': 'USA / Canada', 'mexico': 'Mexico', 'central-america': 'Central America', 'caribbean': 'Caribbean',
    'andean': 'Andean / South America', 'brazil': 'Brazil', 'argentina': 'Argentina / Southern Cone',
    'australia-nz': 'Australia / New Zealand', 'pacific-islands': 'Pacific Islands',
    'global': 'Global',
  };

  const budgetLabel: Record<BudgetTier, string> = { budget: 'budget-friendly', moderate: 'balanced-cost', premium: 'premium' };
  const regionName = (regionLabel[region] || 'regional').toLowerCase();
  const mixLabel = cuisineMix === 'local'
    ? `rooted in ${regionName} favorites`
    : cuisineMix === 'international'
      ? 'full of flavors from around the world'
      : `blending ${regionName} staples with international variety`;
  const summary = `Your ${budgetLabel[budget]} plan is ${mixLabel}. At ${calculations.dailyCalorieGoal} kcal/day with ${calculations.proteinG}g protein · ${calculations.carbsG}g carbs · ${calculations.fatG}g fat — you're on track to meet your ${goal.replace('_', ' ')} goal.`;

  return { summary, weeklyPlan, tips, hydrationPlan, supplementSuggestions, shoppingList, calorieEquivalences, progressMilestones, region };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL ALTERNATIVES — "I can't make this" swaps: dishes with similar calories
// and protein from the same pools, respecting restrictions, allergies & budget.
// ─────────────────────────────────────────────────────────────────────────────

export function getMealAlternatives(
  current: Meal,
  slotType: MealType,
  profile: UserProfile,
  count = 3,
  taste?: TasteProfile,
): Meal[] {
  const region = resolveRegion(detectRegion(profile.location));
  const budget = profile.budget || 'moderate';
  const pools = buildMealPools(region);
  const seen = new Set<string>([current.name]);
  const candidates: FoodItem[] = [];
  // Regional first, then international — same priority as plan generation.
  for (const source of ['regional', 'international'] as const) {
    let pool = filterFoods(pools[slotType][source], profile)
      .filter((f) => budgetAllows(estimateCostTier(f), budget) && !seen.has(f.name));
    if (pool.length === 0) {
      pool = filterFoods(pools[slotType][source], profile).filter((f) => !seen.has(f.name));
    }
    // Taste learning: never suggest something the user keeps rejecting.
    if (taste?.dislikes.length) {
      const filtered = pool.filter((f) => !tasteMatchesAny(f.name, taste.dislikes));
      if (filtered.length >= count) pool = filtered;
    }
    for (const f of pool) {
      seen.add(f.name);
      candidates.push(f);
    }
  }
  // Closest macros to the current meal win — the swap shouldn't break the day.
  const scored = candidates
    .map((f) => {
      const calErr = Math.abs(f.cal - current.calories) / Math.max(current.calories, 1);
      const proErr = Math.abs(f.protein - current.protein) / Math.max(current.protein, 1);
      return { f, s: calErr * 0.6 + proErr * 0.4 };
    })
    .sort((a, b) => a.s - b.s);
  return scored.slice(0, count).map(({ f }) => toMeal(f));
}

function getTips(goal: string): string[] {
  if (goal === 'lose_weight') return [
    '🥤 Drink a large glass of water 20–30 min before each meal to naturally reduce appetite by ~13%.',
    '🍽️ Use a smaller plate — portion perception reduces intake by up to 30% without feeling deprived.',
    '🚶 Post-dinner walk of 15–20 min improves insulin sensitivity and digestion significantly.',
    '😴 Sleep 7–9 hours. Poor sleep raises ghrelin (hunger hormone) by 28% — sabotaging your diet.',
    '📝 Track meals in a food diary — research shows this doubles weight-loss success rates.',
    '🌶️ Add spices like chili, ginger, and cinnamon — they boost metabolism by 4–10%.',
  ];
  if (goal === 'gain_weight') return [
    '🕐 Eat every 3–4 hours — missing meals makes hitting your calorie surplus nearly impossible.',
    '💪 Focus on compound lifts: squats, deadlifts, bench press for maximum anabolic stimulus.',
    '🥛 Consume protein within 30 min post-workout to maximize muscle protein synthesis.',
    '🧈 Add healthy calorie-dense foods: nut butters, avocado, olive oil, whole milk, cheese.',
    '📈 Progressive overload is critical — increase weight or reps weekly to keep muscles growing.',
    '🌙 Eat a slow-digesting casein protein before bed (curd/cottage cheese) for overnight recovery.',
  ];
  if (goal === 'athletic') return [
    '⚡ Carb-load 2–3 hours before intense training — prioritize complex carbs for sustained energy.',
    '🔄 Cycle carbohydrates: higher on training days, lower on rest days for body recomposition.',
    '🏃 Warm up 10 min with dynamic stretches — reduces injury risk by up to 50%.',
    '🧴 Creatine monohydrate (5g/day) is the most proven performance supplement — consider it.',
    '🛌 Aim for 8–9 hours of sleep on heavy training days — recovery is where gains are made.',
    '🧃 Consume fast carbs (banana, sports drink) within 30 min post-workout for glycogen replenishment.',
  ];
  return [
    '🌈 Eat the rainbow — different colored vegetables deliver different essential micronutrients.',
    '🧘 Mindful eating: put your fork down between bites and chew 20–30 times per mouthful.',
    '🫙 Meal prep on Sundays to ensure healthy choices when you\'re tired or busy.',
    '🚫 Avoid ultra-processed foods 80% of the time — cook fresh as much as possible.',
    '📊 The 80/20 rule: eat healthily 80% of the time and enjoy without guilt 20%.',
    '🦠 Eat fermented foods (curd, kimchi, idli) daily — a healthy gut drives overall wellness.',
  ];
}

function generateShoppingList(region: string, profile: UserProfile): string[] {
  const base = [
    '🥚 Eggs (12–18 pack)',
    '🥛 Low-fat milk or plant milk (2L)',
    '🥣 Rolled oats (500g)',
    '🥜 Mixed nuts & seeds (300g)',
    '🫒 Olive oil or cooking oil (500ml)',
    '🧄 Garlic and ginger (fresh)',
    '🍅 Tomatoes, onions (1kg each)',
    '🥦 Mixed vegetables — broccoli, spinach, capsicum (fresh or frozen)',
    '🍌 Bananas (6–8)',
    '🍎 Seasonal fruit (6 pieces)',
    '🫐 Frozen berries (400g)',
    '💧 Drinking water (6L) or filter',
  ];

  const regional: Record<string, string[]> = {
    'north-india': ['🌶️ Spice set: cumin, turmeric, coriander, garam masala, hing', '🫓 Whole wheat atta (2kg)', '🧊 Paneer (250g)', '🫘 Mixed dal (500g)', '🍚 Basmati rice (1kg)', '🥛 Full-fat dahi/curd (500g)'],
    'south-india': ['🫘 Toor dal & urad dal (500g each)', '🍚 Idli rice & regular rice (1kg each)', '🥥 Fresh coconut or coconut milk (2)', '🍃 Curry leaves & coriander (fresh)', '🌶️ South Indian spice mix: mustard seeds, curry leaves, dried chili', '🐟 Fresh fish (500g) if non-veg'],
    'west-india': ['🫘 Chana dal & moong dal (500g)', '🌾 Bajra or jowar flour (1kg)', '🥜 Groundnuts (200g)', '🍋 Lemons (6)', '🌿 Fresh fenugreek (methi) leaves'],
    'east-india': ['🐟 Fresh fish — rohu or catla (500g)', '🌿 Mustard oil (500ml)', '🫘 Yellow mustard seeds (50g)', '🍚 Fine rice — govind bhog (500g)', '🥬 Mustard leaves (fresh or frozen)'],
    'pakistan': ['🫘 Whole masoor & chana (500g each)', '🍖 Mutton or chicken (750g)', '🌶️ Pakistani spice blends: biryani masala, nihari masala', '🫓 All-purpose atta (2kg)', '🥛 Dahi (500g) & cream'],
    'gulf': ['🌴 Medjool dates (250g)', '🫘 Chickpeas & fava beans (500g each)', '🍚 Long grain basmati rice (2kg)', '🐟 Hammour or sea bream (500g)', '🌶️ Baharat, saffron, dried limes (loomi)', '🫙 Tahini (200g)'],
    'japan': ['🍚 Japanese short-grain rice (1kg)', '🫘 Tofu (firm, 400g)', '🌿 Nori sheets & furikake', '🥢 Soy sauce, mirin, sake (small bottles)', '🐟 Fresh salmon or tuna (300g)', '🫛 Edamame (frozen, 400g)'],
    'korea': ['🥬 Napa cabbage for kimchi (1 head)', '🌶️ Gochujang & doenjang (small jars)', '🍜 Japchae noodles (sweet potato, 200g)', '🍚 Short-grain rice (1kg)', '🥩 Pork belly (300g)'],
    'greece': ['🫙 Greek yogurt (500g)', '🧀 Feta cheese (200g)', '🫒 Kalamata olives (150g)', '🌿 Fresh herbs: oregano, dill, parsley', '🐟 Sea bream or sea bass (400g)', '🫒 Extra virgin olive oil (500ml)'],
    'italy': ['🍝 Whole wheat pasta (500g)', '🥫 San Marzano tomatoes (2 cans)', '🧀 Parmesan & mozzarella (200g each)', '🌿 Fresh basil & rosemary', '🐟 Branzino or cod (400g)'],
    'mexico': ['🌽 Corn tortillas (pack of 30)', '🥑 Avocados (4–6)', '🫘 Black & pinto beans (500g each)', '🌶️ Dried chilies: ancho, guajillo', '🍅 Tomatillos (400g canned)', '🌿 Fresh cilantro (bunch)'],
    'usa': ['🥑 Avocados (4)', '🐟 Salmon fillets (500g)', '🍗 Chicken breast (1kg)', '🧁 Protein powder (1 serving pack)', '🫘 Canned chickpeas & black beans', '🥬 Baby spinach & mixed greens (200g)'],
  };

  const extras = regional[region] || [];
  if (!profile.dietaryRestrictions?.includes('vegan') && !extras.some(e => e.includes('chicken') || e.includes('fish'))) {
    base.push('🍗 Lean protein: chicken breast or fish (750g)');
  }

  return [...extras, ...base];
}
