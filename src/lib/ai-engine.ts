// ── Smart AI Diet Plan Engine — Enhanced Regional Food Database ──────────────
import type { UserProfile, Calculations } from './calculations';

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
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function detectRegion(location?: string): string {
  const loc = (location || '').toLowerCase();

  // India sub-regions
  if (/delhi|punjab|haryana|uttar pradesh|rajasthan|himachal|jammu|chandigarh|up\b|lucknow|jaipur|amritsar|agra|varanasi/.test(loc)) return 'north-india';
  if (/mumbai|maharashtra|goa|gujarat|pune|nagpur|surat|ahmedabad|nashik/.test(loc)) return 'west-india';
  if (/chennai|tamil|kerala|bangalore|karnataka|andhra|telangana|hyderabad|kochi|coimbatore|mysore/.test(loc)) return 'south-india';
  if (/kolkata|bengal|odisha|bihar|jharkhand|assam|northeast|guwahati|bhubaneswar/.test(loc)) return 'east-india';
  if (/india|indian/.test(loc)) return 'north-india'; // default Indian

  // Neighbouring South Asia
  if (/pakistan|karachi|lahore|islamabad|peshawar/.test(loc)) return 'pakistan';
  if (/bangladesh|dhaka|chittagong/.test(loc)) return 'bangladesh';
  if (/sri lanka|colombo/.test(loc)) return 'south-india';
  if (/nepal|kathmandu/.test(loc)) return 'nepal';

  // Middle East
  if (/saudi|riyadh|jeddah|mecca|medina/.test(loc)) return 'saudi';
  if (/uae|dubai|abu dhabi|sharjah/.test(loc)) return 'uae';
  if (/iran|tehran/.test(loc)) return 'iran';
  if (/turkey|istanbul|ankara/.test(loc)) return 'turkey';
  if (/egypt|cairo|alexandria/.test(loc)) return 'egypt';
  if (/lebanon|beirut/.test(loc)) return 'levant';
  if (/middle east|arab|gulf|kuwait|qatar|bahrain|oman/.test(loc)) return 'gulf';

  // East Asia
  if (/japan|tokyo|osaka|kyoto|yokohama/.test(loc)) return 'japan';
  if (/china|beijing|shanghai|guangzhou|shenzhen|chengdu/.test(loc)) return 'china';
  if (/korea|seoul|busan|south korea/.test(loc)) return 'korea';

  // Southeast Asia
  if (/thailand|bangkok|chiang mai/.test(loc)) return 'thailand';
  if (/vietnam|hanoi|ho chi minh/.test(loc)) return 'vietnam';
  if (/indonesia|jakarta|bali/.test(loc)) return 'indonesia';
  if (/malaysia|kuala lumpur/.test(loc)) return 'malaysia';
  if (/philippines|manila/.test(loc)) return 'philippines';

  // Europe & Mediterranean
  if (/italy|rome|milan|naples/.test(loc)) return 'italy';
  if (/greece|athens|thessaloniki/.test(loc)) return 'greece';
  if (/spain|madrid|barcelona|seville/.test(loc)) return 'spain';
  if (/france|paris|lyon/.test(loc)) return 'france';
  if (/uk|england|london|britain|scotland|wales/.test(loc)) return 'uk';
  if (/germany|berlin|munich/.test(loc)) return 'germany';
  if (/europe|european/.test(loc)) return 'europe';

  // Americas
  if (/mexico|guadalajara|monterrey|oaxaca/.test(loc)) return 'mexico';
  if (/brazil|sao paulo|rio|brasilia/.test(loc)) return 'brazil';
  if (/colombia|bogota|medellin/.test(loc)) return 'colombia';
  if (/usa|united states|new york|los angeles|chicago|texas|california/.test(loc)) return 'usa';
  if (/canada|toronto|vancouver|montreal/.test(loc)) return 'canada';

  // Africa
  if (/nigeria|lagos|abuja/.test(loc)) return 'west-africa';
  if (/ethiopia|addis ababa/.test(loc)) return 'east-africa';
  if (/south africa|cape town|johannesburg/.test(loc)) return 'south-africa';

  return 'global';
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOD DATABASE — Organized by region and meal type
// ─────────────────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
  global: {
    breakfast: [
      { name: 'Oatmeal with Berries', emoji: '🥣', cal: 310, protein: 10, carbs: 52, fat: 6, prepTime: '8 min', description: 'Warm rolled oats with mixed berries, banana, and a drizzle of honey', tags: ['vegetarian', 'vegan'] },
      { name: 'Egg White Scramble', emoji: '🍳', cal: 250, protein: 28, carbs: 10, fat: 9, prepTime: '10 min', description: 'Fluffy egg whites with spinach, tomatoes, and bell peppers', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Protein Smoothie', emoji: '🥤', cal: 340, protein: 26, carbs: 42, fat: 6, prepTime: '5 min', description: 'Banana, protein powder, oats, almond milk blended smooth', tags: ['vegetarian', 'high-protein'] },
    ],
    lunch: [
      { name: 'Quinoa Buddha Bowl', emoji: '🥙', cal: 480, protein: 20, carbs: 58, fat: 16, prepTime: '25 min', description: 'Quinoa with roasted vegetables, chickpeas, and tahini dressing', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Lentil Soup & Bread', emoji: '🍲', cal: 380, protein: 18, carbs: 55, fat: 8, prepTime: '30 min', description: 'Hearty red lentil soup with whole grain bread and olive oil', tags: ['vegetarian', 'vegan'] },
      { name: 'Grilled Chicken & Brown Rice', emoji: '🍗', cal: 450, protein: 38, carbs: 44, fat: 12, prepTime: '25 min', description: 'Simple grilled chicken breast with brown rice and steamed broccoli', tags: ['high-protein', 'gluten-free'] },
    ],
    dinner: [
      { name: 'Baked Chicken & Veggies', emoji: '🍗', cal: 420, protein: 42, carbs: 20, fat: 16, prepTime: '35 min', description: 'Herb-baked chicken thighs with roasted zucchini and peppers', tags: ['high-protein', 'low-carb', 'gluten-free'] },
      { name: 'Stir-Fried Tofu & Vegetables', emoji: '🥢', cal: 380, protein: 22, carbs: 38, fat: 14, prepTime: '20 min', description: 'Crispy tofu with bok choy, peppers in ginger-soy sauce over rice', tags: ['vegetarian', 'vegan', 'high-protein'] },
    ],
    snack: [
      { name: 'Mixed Nuts (30g)', emoji: '🥜', cal: 180, protein: 5, carbs: 6, fat: 16, prepTime: '0 min', description: 'Handful of almonds, walnuts, and cashews', tags: ['vegetarian', 'vegan', 'gluten-free'] },
      { name: 'Greek Yogurt & Berries', emoji: '🫐', cal: 150, protein: 12, carbs: 18, fat: 3, prepTime: '2 min', description: 'Plain Greek yogurt topped with fresh or frozen berries', tags: ['vegetarian', 'high-protein', 'gluten-free'] },
    ],
  },
};

// Alias regions to base regions
const REGION_ALIASES: Record<string, string> = {
  'saudi': 'gulf', 'uae': 'gulf', 'iran': 'gulf', 'turkey': 'gulf', 'egypt': 'gulf', 'levant': 'gulf',
  'spain': 'greece', 'france': 'italy', 'germany': 'italy', 'europe': 'italy', 'uk': 'usa', 'canada': 'usa',
  'bangladesh': 'east-india', 'nepal': 'north-india',
  'thailand': 'global', 'vietnam': 'global', 'indonesia': 'global', 'malaysia': 'global', 'philippines': 'global',
  'brazil': 'global', 'colombia': 'global',
  'west-africa': 'global', 'east-africa': 'global', 'south-africa': 'global',
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
    if ((restrictions.includes('keto') || restrictions.includes('low-carb')) && f.carbs > 25) return false;
    if (restrictions.includes('gluten-free') && !f.tags.includes('gluten-free')) return false;
    if (restrictions.includes('high-protein') && !f.tags.includes('high-protein')) return false;
    for (const allergy of allergies) {
      if (f.name.toLowerCase().includes(allergy) || f.description.toLowerCase().includes(allergy)) return false;
    }
    return true;
  });
}

function pickMeal(foods: FoodItem[], fallback: FoodItem[], used: Set<number>): FoodItem {
  const pool = foods.length >= 2 ? foods : fallback;
  const available = pool.map((f, i) => ({ f, i })).filter(({ i }) => !used.has(i));
  if (!available.length) { used.clear(); return pool[0]; }
  const sorted = available.sort((a, b) => a.i - b.i);
  const pick = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))];
  used.add(pick.i);
  return pick.f;
}

function toMeal(f: FoodItem): Meal {
  return { name: f.name, description: f.description, calories: f.cal, protein: f.protein, carbs: f.carbs, fat: f.fat, prepTime: f.prepTime, emoji: f.emoji, tags: f.tags };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function generateDietPlan(profile: UserProfile, calculations: Calculations): Promise<DietPlan> {
  await new Promise(r => setTimeout(r, 1800));

  const rawRegion = detectRegion(profile.location);
  const region = resolveRegion(rawRegion);
  const db = REGIONAL_DB[region];
  const globalDb = REGIONAL_DB['global'];

  const filtered = {
    breakfast: filterFoods(db.breakfast, profile),
    lunch: filterFoods(db.lunch, profile),
    dinner: filterFoods(db.dinner, profile),
    snack: filterFoods(db.snack, profile),
  };

  const usedB = new Set<number>(), usedL = new Set<number>(), usedD = new Set<number>(), usedS = new Set<number>();

  const weeklyPlan: DayPlan[] = DAYS.map(day => {
    const breakfast      = toMeal(pickMeal(filtered.breakfast, globalDb.breakfast, usedB));
    const morningSnack   = toMeal(pickMeal(filtered.snack, globalDb.snack, usedS));
    const lunch          = toMeal(pickMeal(filtered.lunch, globalDb.lunch, usedL));
    const afternoonSnack = toMeal(pickMeal(filtered.snack, globalDb.snack, usedS));
    const dinner         = toMeal(pickMeal(filtered.dinner, globalDb.dinner, usedD));
    const totalCalories  = breakfast.calories + morningSnack.calories + lunch.calories + afternoonSnack.calories + dinner.calories;
    return { day, breakfast, morningSnack, lunch, afternoonSnack, dinner, totalCalories };
  });

  const { goal } = profile;
  const tips = getTips(goal);
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
    'pakistan': 'Pakistan', 'gulf': 'Middle East / Gulf', 'japan': 'Japan', 'korea': 'Korea',
    'greece': 'Mediterranean', 'italy': 'Italy', 'mexico': 'Mexico', 'usa': 'USA / Canada', 'global': 'Global',
  };

  const summary = `Your personalized plan is crafted with ${regionLabel[region] || 'regionally relevant'} meals. At ${calculations.dailyCalorieGoal} kcal/day with ${calculations.proteinG}g protein · ${calculations.carbsG}g carbs · ${calculations.fatG}g fat — you're on track to meet your ${goal.replace('_', ' ')} goal.`;

  return { summary, weeklyPlan, tips, hydrationPlan, supplementSuggestions, shoppingList, calorieEquivalences, progressMilestones, region };
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
