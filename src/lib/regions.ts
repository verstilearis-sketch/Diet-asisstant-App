// ── Geographic Resolution & Regional Cuisine Metadata ────────────────────────

export type RegionKey =
  | 'north-india' | 'south-india' | 'west-india' | 'east-india'
  | 'pakistan' | 'bangladesh' | 'nepal' | 'sri-lanka'
  | 'gulf' | 'iran' | 'turkey' | 'egypt' | 'levant'
  | 'japan' | 'korea' | 'china' | 'taiwan'
  | 'thailand' | 'vietnam' | 'indonesia' | 'malaysia-singapore' | 'philippines'
  | 'italy' | 'spain' | 'portugal' | 'greece' | 'france' | 'germany' | 'uk-ireland'
  | 'nordics' | 'poland-eastern-europe'
  | 'usa' | 'canada' | 'mexico' | 'brazil' | 'argentina'
  | 'australia-nz'
  | 'south-africa' | 'nigeria-west-africa' | 'ethiopia-east-africa'
  | 'global';

export const REGION_ORDER: RegionKey[] = [
  'north-india','south-india','west-india','east-india',
  'pakistan','bangladesh','nepal','sri-lanka',
  'gulf','iran','turkey','egypt','levant',
  'japan','korea','china','taiwan',
  'thailand','vietnam','indonesia','malaysia-singapore','philippines',
  'italy','spain','portugal','greece','france','germany','uk-ireland',
  'nordics','poland-eastern-europe',
  'usa','canada','mexico','brazil','argentina',
  'australia-nz',
  'south-africa','nigeria-west-africa','ethiopia-east-africa',
  'global',
];

export interface RegionMeta {
  label: string;
  emoji: string;
  hemisphere: 'n' | 's' | 't' | 'b';          // for seasonal produce
  unitSystem: 'metric' | 'us';
  currency: string;
  spiceProfile: string[];
  diningStyles: string;
  typicalMarkets: string;
  altitudeAdj?: string;
  note?: string;
}

export const REGION_META: Record<RegionKey, RegionMeta> = {
  'north-india':   { label: 'North Indian', emoji: '🫓', hemisphere: 'n', unitSystem: 'metric', currency: '₹', spiceProfile: ['cumin','coriander','garam masala','turmeric','ginger'], diningStyles: 'Roti/chapati with dal, curries, and vegetable sabzi; wheat-based breads central to every meal', typicalMarkets: 'kirana stores, local mandi, weekly haat', altitudeAdj: 'Add 10–15% calories at >1500m (e.g. Himalayan states)' },
  'south-india':   { label: 'South Indian', emoji: '🥥', hemisphere: 'n', unitSystem: 'metric', currency: '₹', spiceProfile: ['curry leaves','mustard seeds','coconut','tamarind','chili'], diningStyles: 'Rice-based meals with lentle dals, coconut, and fermented staples; lighter spicing', typicalMarkets: 'local vegetable market, fish market for coastal areas', altitudeAdj: 'High-fiber, lighter meals suit tropical heat' },
  'west-india':    { label: 'West Indian', emoji: '🫘', hemisphere: 'n', unitSystem: 'metric', currency: '₹', spiceProfile: ['mustard seeds','curry leaves','coconut','hing'], diningStyles: 'A mix of roti, bhakri, and rice with lentils; coastal regions use coconut heavily', typicalMarkets: ' Apéth, local fish and vegetable markets', altitudeAdj: 'Gujarati fare is largely vegetarian & low-fat; Mumbai eats chaat & seafood' },
  'east-india':    { label: 'East Indian', emoji: '🌾', hemisphere: 'n', unitSystem: 'metric', currency: '₹', spiceProfile: ['mustard','poppy seed','turmeric','green chili'], diningStyles: 'Rice + fish + lentils; mustard oil and poppy-seed gravies are signature', typicalMarkets: 'local fish market, mustard oil, fresh greens', note: 'Bengali meals balance sweet-savory with panch phoron' },
  'pakistan':      { label: 'Pakistani', emoji: '🍖', hemisphere: 'n', unitSystem: 'metric', currency: '₨', spiceProfile: ['garam masala','cumin','coriander','cardamom','cloves'], diningStyles: 'Meat-heavy gravies (nihari, karahi) with naan/roti/chawal; hearty & spiced', typicalMarkets: 'butcher, local sabzi mandi, naan shops', note: 'Wheat (atta) is the everyday staple, not rice' },
  'bangladesh':    { label: 'Bangladeshi', emoji: '🐟', hemisphere: 'n', unitSystem: 'metric', currency: '৳', spiceProfile: ['panch phoron','turmeric','chili','ginger'], diningStyles: 'Rice + lentils + fish + mustard oil; modest portions, deep flavors', typicalMarkets: 'local fish market, weekly bazaar', note: 'Hilsa (ilish) is the national fish' },
  'nepal':         { label: 'Nepali', emoji: '🏔️', hemisphere: 'n', unitSystem: 'metric', currency: 'N₨', spiceProfile: ['cumin','coriander','timur','ginger'], diningStyles: 'Dhindo (buckwheat/millet porridge) with spicy tarkari; Tibetan-influenced', typicalMarkets: 'local bazaar, dairy cooperative', altitudeAdj: 'High-altitude: higher carb needs, millet/buckwheat staples' },
  'sri-lanka':     { label: 'Sri Lankan', emoji: '🌴', hemisphere: 'n', unitSystem: 'metric', currency: 'රු', spiceProfile: ['cinnamon','cardamom','cloves','coconut','mustard seeds'], diningStyles: 'Rice + coconut sambol + hoppers + seafood curries; fiery & aromatic', typicalMarkets: 'wet market, coconut vendors', note: 'Coconut milk-based curries; hoppers for breakfast' },
  'gulf':          { label: 'Gulf / Middle Eastern', emoji: '🌴', hemisphere: 'n', unitSystem: 'metric', currency: 'AED', spiceProfile: ['cardamom','saffron','sumac','za\'atar','baharat'], diningStyles: 'Shared mezze, rice (kabsa, mandi), grilled meats, flatbreads; dates break fast', typicalMarkets: 'central souq, fish market, date bazaar', note: 'Dates + Arabic coffee (gahwa) are cultural staples' },
  'iran':          { label: 'Iranian / Persian', emoji: '🍊', hemisphere: 'n', unitSystem: 'metric', currency: '﷼', spiceProfile: ['saffron','rose water','cardamom','dried lime','mint'], diningStyles: 'Rice (polo) + kebabs + stews (khoresh) + herbs; fresh herbs on the side', typicalMarkets: 'mosque bazaar, dried lime & saffron shops', note: 'Saffron and dried limes define the cuisine' },
  'turkey':        { label: 'Turkish', emoji: '🥙', hemisphere: 'n', unitSystem: 'metric', currency: '₺', spiceProfile: ['sumac','mint','paprika','oregano','cinnamon'], diningStyles: 'Meze platters, grilled kebabs, börek, menemen; yogurt & bulgur common', typicalMarkets: 'covered bazaar, butcher, spice market', note: 'Çay (black tea) and Turkish breakfast culture' },
  'egypt':         { label: 'Egyptian', emoji: '🫓', hemisphere: 'n', unitSystem: 'metric', currency: '£', spiceProfile: ['coriander','cumin','dill','chili','garlic'], diningStyles: 'Ful medames, koshari, molokhia, grilled meats; bread is central', typicalMarkets: 'local souq, grain and legume stalls', note: 'Koshari is the national comfort dish' },
  'levant':        { label: 'Levantine', emoji: '🧆', hemisphere: 'n', unitSystem: 'metric', currency: '£', spiceProfile: ['za\'atar','sumac','tahini','mint','allspice'], diningStyles: 'Mezze (hummus, falafel, baba ghanoush), grilled meats, fattoush; olive oil', typicalMarkets: 'local souq, olive/tahini vendors', note: 'Za\'atar + olive oil + fresh herbs dominate' },
  'japan':         { label: 'Japanese', emoji: '🍣', hemisphere: 'n', unitSystem: 'metric', currency: '¥', spiceProfile: ['wasabi','miso','mirin','dashi','yuzu'], diningStyles: 'Rice + miso soup + small grilled/fermented dishes; seasonality paramount', typicalMarkets: 'depachika (department store food halls), fish market', note: 'Fresh fish & fermented staples: miso, soy, mirin' },
  'korea':         { label: 'Korean', emoji: '🥢', hemisphere: 'n', unitSystem: 'metric', currency: '₩', spiceProfile: ['gochujang','gochugaru','sesame','garlic','ginger'], diningStyles: 'Rice + kimchi + soups/stews + grilled meats; shared side dishes (banchan)', typicalMarkets: 'wet market, kimchi fridge', note: 'Fermented kimchi & doenjang define Korean flavor' },
  'china':         { label: 'Chinese', emoji: '🥢', hemisphere: 'n', unitSystem: 'metric', currency: '¥', spiceProfile: ['soy sauce','ginger','scallion','chili bean paste','Sichuan pepper'], diningStyles: ''
    + 'Steamed/braised staples with pickles & small dishes; wheat (noodles/buns) north, rice south', typicalMarkets: 'wet market, soy sauce & preserved goods shops', note: 'Eight regional cuisines — use city keyword if known' },
  'taiwan':        { label: 'Taiwanese', emoji: '🥟', hemisphere: 'n', unitSystem: 'metric', currency: 'NT$', spiceProfile: [' soy sauce','ginger','scallion','chili','five-spice'], diningStyles: 'Street snacks, braised meals, oyster omelette, beef noodle soup', typicalMarkets: 'night market vendors, wet market', note: 'Douhua, bubble tea, and braised pork rice are icons' },
  'thailand':      { label: 'Thai', emoji: '🌶️', hemisphere: 'n', unitSystem: 'metric', currency: '฿', spiceProfile: ['fish sauce','chili','galangal','lemongrass','cilantro','palm sugar'], diningStyles: 'Balance of sweet-salty-sour-spicy with sticky rice or jasmine rice', typicalMarkets: 'wet market, floating market produce', note: 'Fish sauce + palm sugar base; fresh herbs at every meal' },
  'vietnam':       { label: 'Vietnamese', emoji: '🥗', hemisphere: 'n', unitSystem: 'metric', currency: '₫', spiceProfile: ['fish sauce','lemongrass','ginger','cilantro','bird\'s eye chili'], diningStyles: 'Rice noodles, fresh herbs, broth (pho, bun); bright & herb-forward', typicalMarkets: 'morning wet market, herb stalls', note: 'Nuoc mam (fish sauce) + fresh herbs + lime = backbone' },
  'indonesia':     { label: 'Indonesian', emoji: '🌴', hemisphere: 's', unitSystem: 'metric', currency: 'Rp', spiceProfile: ['turmeric','galangal','lemongrass','chili','kecap manis','shrimp paste'], diningStyles: 'Rice + sambal + rendang/gulai + satay; coconut milk rich', typicalMarkets: 'pasar tradisional, warung', note: 'Sambal is the fiery condiment table' },
  'malaysia-singapore': { label: 'Malaysian / Singaporean', emoji: '🌺', hemisphere: 's', unitSystem: 'metric', currency: 'RM/$', spiceProfile: ['belacan','chili','turmeric','lemongrass','coconut'], diningStyles: 'Hawker fare: rice/noodle dishes, laksa, satay, fishball noodles', typicalMarkets: 'wet market, hawker centre', note: 'Multi-ethnic: Malay, Chinese, Indian flavors coexist' },
  'philippines':   { label: 'Filipino', emoji: '🍍', hemisphere: 'n', unitSystem: 'metric', currency: '₱', spiceProfile: ['fish sauce','garlic','onion','chili','coconut milk'], diningStyles: 'Rice + adobo, sinigang, lechon, rice meals; soyfish sauce backbone', typicalMarkets: 'palengke (wet market), sari-sari store', note: 'Bagoong, vinegar, coconut milk = flavor base' },
  'italy':         { label: 'Italian', emoji: '🍝', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['basil','oregano','garlic','rosemary','chili flake'], diningStyles: 'Pasta + tomato + olive oil + cheese; regionally varied; produce-driven', typicalMarkets: 'daily market (mercato), salumeria', note: 'Parmigiano, olive oil, San Marzano tomatoes' },
  'spain':         { label: 'Spanish', emoji: '🥘', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['smoked paprika','saffron','garlic','rosemary','sherry vinegar'], diningStyles: 'Olive oil + garlic + tomato; tapas culture; paella, gazpacho, jamón', typicalMarkets: 'mercado de abastos, tapas bars', note: 'Extra-virgin olive oil is the base fat' },
  'portugal':      { label: 'Portuguese', emoji: '🍋', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['piri piri','paprika','garlic','bay leaf','oregano'], diningStyles: 'Bacalhau, caldo verde, francesinha; olive oil + garlic + paprika', typicalMarkets: 'mercado municipal, pastelaria', note: 'Piri-piri & salted cod are national icons' },
  'greece':        { label: 'Greek / Mediterranean', emoji: '🫒', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['oregano','thyme','garlic','lemon zest','rosemary'], diningStyles: 'Olive oil + lemon + oregano + fresh veggies + feta/seafood; mezze style', typicalMarkets: 'laikí agora (local market), fish shop', note: 'Extra virgin olive oil, olives, and feta are core' },
  'france':        { label: 'French', emoji: '🇫🇷', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['butter','thyme','tarragon','shallot','bay leaf'], diningStyles: 'Butter + cream + wine sauces; bread + cheese; regional specialties', typicalMarkets: 'marché couvert, fromagerie, boulangerie', note: 'Regional: coq au vin (Burgundy), bouillabaisse (Provence), cassoulet' },
  'germany':       { label: 'German', emoji: '🇩🇪', hemisphere: 'n', unitSystem: 'metric', currency: '€', spiceProfile: ['caraway','juniper','parsley','paprika','mustard seeds'], diningStyles: 'Pork/sausage + potatoes + bread + sauerkraut; hearty & grain-heavy', typicalMarkets: 'Wochenmarkt, Metzgerei (butcher)', note: 'Regional beers pair with local sausage specialties' },
  'uk-ireland':    { label: 'British / Irish', emoji: '🥧', hemisphere: 'n', unitSystem: 'us', currency: '£/$', spiceProfile: ['thyme','rosemary','black pepper','marmite','brown sauce'], diningStyles: 'Roast dinners, pies, full breakfast, fish & chips; tea culture strong', typicalMarkets: 'local grocer, corner shop, farmers market', note: 'Sunday roast, baked beans, crumpets are everyday staples' },
  'nordics':       { label: 'Nordic (Scandinavian)', emoji: '🦌', hemisphere: 'n', unitSystem: 'metric', currency: 'kr', spiceProfile: ['dill','juniper','lingonberry','cardamom','horseradish'], diningStyles: 'Fresh fish, rye bread, dairy, berries; long winters = preserved foods', typicalMarkets: 'matmarknad, fishmongers', note: 'Smoked/dried fish, rye crispbread, cloudberries in the north' },
  'poland-eastern-europe': { label: 'Polish / Eastern European', emoji: '🥟', hemisphere: 'n', unitSystem: 'metric', currency: 'zł', spiceProfile: ['dill','marjoram','caraway','pierogi filling','horseradish'], diningStyles: 'Pierogi, kielbasa, potatoes, beets, rye bread; dill & sour cream', typicalMarkets: 'bazaar, meat counter', note: 'Bigos, żurek, and pierogi fill the table' },
  'usa':           { label: 'American', emoji: '🇺🇸', hemisphere: 'n', unitSystem: 'us', currency: '$', spiceProfile: ['bbq','chipotle','cajun','ranch','sriracha'], diningStyles: 'Beef/poultry + grains + produce; portion sizes large; global fusion', typicalMarkets: 'supermarket, grocery chain, farmer\'s market', note: 'Protein + vegetable + starchy side is the template' },
  'canada':        { label: 'Canadian', emoji: '🇨🇦', hemisphere: 'n', unitSystem: 'us', currency: '$', spiceProfile: ['maple','poutine gravy','cajun','smoked','herbs'], diningStyles: 'Maple, poutine, hearty stews; huge land → US + northern influences', typicalMarkets: 'grocery chain, LCBO, farmers market', note: 'Maple syrup & poutine are icons; cold winters demand hearty food' },
  'mexico':        { label: 'Mexican', emoji: '🌮', hemisphere: 'n', unitSystem: 'metric', currency: '$', spiceProfile: ['chili','cumin','cilantro','lime','achiote','oregano'], diningStyles: 'Corn + beans + chilies + salsa; fresh toppings; mole & salsas', typicalMarkets: 'tianguis (open-air market), tortillería', note: 'Corn tortillas, dried chilies, and fresh salsas define it' },
  'brazil':        { label: 'Brazilian', emoji: '🇧🇷', hemisphere: 's', unitSystem: 'metric', currency: 'R$', spiceProfile: ['malagueta','cumin','garlic','cilantro','palm oil'], diningStyles: 'Beans + rice + farofa + grilled meats; feijoada on weekends', typicalMarkets: 'mercado municipal, churrasco butcher', note: 'Café da manhã is coffee + bread; feijoada (black bean stew) is the national dish' },
  'argentina':     { label: 'Argentine', emoji: '🇦🇷', hemisphere: 's', unitSystem: 'metric', currency: '$', spiceProfile: ['oregano','chimichurri','paprika','garlic','black pepper'], diningStyles: 'Beef + provoleta + empanadas + dulce de leche; asado culture', typicalMarkets: 'carnicería (butcher), kiosk', note: 'Chimichurri and grass-fed beef are defining' },
  'australia-nz':  { label: 'Australian / New Zealander', emoji: '🇦🇺', hemisphere: 's', unitSystem: 'metric', currency: 'AU$/NZ$', spiceProfile: ['vegemite','lemon myrtle','native pepper','bbq','kawakawa'], diningStyles: 'BBQ, fresh seafood, vegemite on toast, pavlova; British base + modern fusion', typicalMarkets: 'supermarket, weekend market', note: 'Vegemite + avocado smash are the cafe icons' },
  'south-africa':  { label: 'South African', emoji: '🥘', hemisphere: 's', unitSystem: 'metric', currency: 'R', spiceProfile: ['peri-peri','curry powder','chutney','coriander','smoked paprika'], diningStyles: 'Braai (barbecue), bobotie, biltong, pap & vleis; Portuguese + Asian influence', typicalMarkets: 'spaza shop, butchery, fresh produce market', note: 'Braai culture and peri-peri define the flavor' },
  'nigeria-west-africa': { label: 'West African (Nigerian)', emoji: '🍛', hemisphere: 'n', unitSystem: 'metric', currency: '₦', spiceProfile: ['pepper','egusi','locust beans','ginger','garlic','scotch bonnet'], diningStyles: 'Starchy swallow (fufu, garri, rice) + bold soups/stews; communal eating', typicalMarkets: 'open-air market, okra/fufu sellers', note: ' Jollof rice, pounded yam, and egusi are staples' },
  'ethiopia-east-africa': { label: 'Ethiopian / East African', emoji: '🥘', hemisphere: 'n', unitSystem: 'metric', currency: 'Br', spiceProfile: ['berbere','mitmita','niter kibbeh','turmeric','cardamom'], diningStyles: 'Injera flatbread + spicy stews (wot); shared from one large plate', typicalMarkets: 'merkato (market), spice shop', note: 'Berbere-spiced stews and injera (teff flatbread) are the centerpiece' },
  'global':        { label: 'Global', emoji: '🌍', hemisphere: 'n', unitSystem: 'metric', currency: '$', spiceProfile: ['herbs','spice blends','chili','garlic','lemon zest'], diningStyles: 'Fresh produce, whole grains, lean proteins; balanced bowls', typicalMarkets: 'modern supermarket, farmers market', note: 'Default balanced meals for unmapped regions' },
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY + CITY DIRECTORY  →  cuisine region
// ─────────────────────────────────────────────────────────────────────────────

interface CityOption { value: string; label: string; region: RegionKey; hemisphere?: 'n' | 's'; }
interface CountryOption { code: string; label: string; region: RegionKey; cities: CityOption[] }

export const COUNTRIES: CountryOption[] = [
  // India (split by cuisine zones)
  { code: 'IN', label: 'India', region: 'north-india', cities: [
    { value: 'Delhi',        label: 'Delhi',        region: 'north-india' },
    { value: 'Amritsar',     label: 'Amritsar (Punjab)', region: 'north-india' },
    { value: 'Lucknow',      label: 'Lucknow (UP)', region: 'north-india' },
    { value: 'Jaipur',       label: 'Jaipur (Rajasthan)', region: 'north-india' },
    { value: 'Chandigarh',   label: 'Chandigarh',   region: 'north-india' },
    { value: 'Mumbai',       label: 'Mumbai (Maharashtra)', region: 'west-india' },
    { value: 'Pune',         label: 'Pune (Maharashtra)', region: 'west-india' },
    { value: 'Ahmedabad',    label: 'Ahmedabad (Gujarat)', region: 'west-india' },
    { value: 'Surat',        label: 'Surat (Gujarat)', region: 'west-india' },
    { value: 'Bangalore',    label: 'Bangalore (Karnataka)', region: 'south-india' },
    { value: 'Chennai',      label: 'Chennai (Tamil Nadu)', region: 'south-india' },
    { value: 'Hyderabad',    label: 'Hyderabad (Telangana)', region: 'south-india' },
    { value: 'Kochi',        label: 'Kochi (Kerala)', region: 'south-india' },
    { value: 'Kolkata',      label: 'Kolkata (West Bengal)', region: 'east-india' },
    { value: 'Bhubaneswar',  label: 'Bhubaneswar (Odisha)', region: 'east-india' },
    { value: 'Patna',        label: 'Patna (Bihar)', region: 'east-india' },
    { value: 'Guwahati',     label: 'Guwahati (Assam)', region: 'east-india' },
    { value: 'Nagpur',       label: 'Nagpur (MP)',  region: 'central-india' },
    { value: 'Bhopal',       label: 'Bhopal (MP)',  region: 'central-india' },
    { value: 'Indore',       label: 'Indore (MP)',  region: 'central-india' },
    { value: 'Other (India)', label: 'Other Indian city', region: 'north-india' },
  ] },
  { code: 'PK', label: 'Pakistan', region: 'pakistan', cities: [
    { value: 'Karachi', label: 'Karachi', region: 'pakistan' },
    { value: 'Lahore',  label: 'Lahore',  region: 'pakistan' },
    { value: 'Islamabad', label: 'Islamabad', region: 'pakistan' },
    { value: 'Rawalpindi', label: 'Rawalpindi', region: 'pakistan' },
    { value: 'Faisalabad', label: 'Faisalabad', region: 'pakistan' },
  ] },
  { code: 'BD', label: 'Bangladesh', region: 'bangladesh', cities: [
    { value: 'Dhaka', label: 'Dhaka', region: 'bangladesh' },
    { value: 'Chittagong', label: 'Chittagong', region: 'bangladesh' },
    { value: 'Khulna', label: 'Khulna', region: 'bangladesh' },
  ] },
  { code: 'NP', label: 'Nepal', region: 'nepal', cities: [
    { value: 'Kathmandu', label: 'Kathmandu', region: 'nepal' },
    { value: 'Pokhara', label: 'Pokhara', region: 'nepal' },
  ] },
  { code: 'LK', label: 'Sri Lanka', region: 'sri-lanka', cities: [
    { value: 'Colombo', label: 'Colombo', region: 'sri-lanka' },
    { value: 'Kandy', label: 'Kandy', region: 'sri-lanka' },
    { value: 'Galle', label: 'Galle', region: 'sri-lanka' },
  ] },
  // Middle East & North Africa
  { code: 'SA', label: 'Saudi Arabia', region: 'gulf', cities: [
    { value: 'Riyadh', label: 'Riyadh', region: 'gulf' },
    { value: 'Jeddah', label: 'Jeddah', region: 'gulf' },
    { value: 'Dammam', label: 'Dammam', region: 'gulf' },
    { value: 'Mecca',  label: 'Mecca',  region: 'gulf' },
  ] },
  { code: 'AE', label: 'United Arab Emirates', region: 'gulf', cities: [
    { value: 'Dubai', label: 'Dubai', region: 'gulf' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi', region: 'gulf' },
    { value: 'Sharjah', label: 'Sharjah', region: 'gulf' },
  ] },
  { code: 'QA', label: 'Qatar', region: 'gulf', cities: [{ value: 'Doha', label: 'Doha', region: 'gulf' }] },
  { code: 'KW', label: 'Kuwait', region: 'gulf', cities: [{ value: 'Kuwait City', label: 'Kuwait City', region: 'gulf' }] },
  { code: 'OM', label: 'Oman', region: 'gulf', cities: [{ value: 'Muscat', label: 'Muscat', region: 'gulf' }] },
  { code: 'BH', label: 'Bahrain', region: 'gulf', cities: [{ value: 'Manama', label: 'Manama', region: 'gulf' }] },
  { code: 'IR', label: 'Iran', region: 'iran', cities: [
    { value: 'Tehran', label: 'Tehran', region: 'iran' },
    { value: 'Isfahan', label: 'Isfahan', region: 'iran' },
    { value: 'Shiraz', label: 'Shiraz', region: 'iran' },
  ] },
  { code: 'TR', label: 'Turkey', region: 'turkey', cities: [
    { value: 'Istanbul', label: 'Istanbul', region: 'turkey' },
    { value: 'Ankara', label: 'Ankara', region: 'turkey' },
    { value: 'Izmir', label: 'Izmir', region: 'turkey' },
  ] },
  { code: 'EG', label: 'Egypt', region: 'egypt', cities: [
    { value: 'Cairo', label: 'Cairo', region: 'egypt' },
    { value: 'Alexandria', label: 'Alexandria', region: 'egypt' },
    { value: 'Giza', label: 'Giza', region: 'egypt' },
  ] },
  { code: 'LB', label: 'Lebanon', region: 'levant', cities: [
    { value: 'Beirut', label: 'Beirut', region: 'levant' },
    { value: 'Tripoli', label: 'Tripoli', region: 'levant' },
  ] },
  { code: 'JO', label: 'Jordan', region: 'levant', cities: [{ value: 'Amman', label: 'Amman', region: 'levant' }] },
  { code: 'PS', label: 'Palestine', region: 'levant', cities: [{ value: 'Gaza', label: 'Gaza', region: 'levant' }] },
  { code: 'SY', label: 'Syria', region: 'levant', cities: [{ value: 'Damascus', label: 'Damascus', region: 'levant' }] },
  // East Asia
  { code: 'JP', label: 'Japan', region: 'japan', cities: [
    { value: 'Tokyo', label: 'Tokyo', region: 'japan' },
    { value: 'Osaka', label: 'Osaka', region: 'japan' },
    { value: 'Kyoto', label: 'Kyoto', region: 'japan' },
    { value: 'Yokohama', label: 'Yokohama', region: 'japan' },
  ] },
  { code: 'KR', label: 'South Korea', region: 'korea', cities: [
    { value: 'Seoul', label: 'Seoul', region: 'korea' },
    { value: 'Busan', label: 'Busan', region: 'korea' },
    { value: 'Incheon', label: 'Incheon', region: 'korea' },
  ] },
  { code: 'CN', label: 'China', region: 'china', cities: [
    { value: 'Beijing', label: 'Beijing', region: 'china' },
    { value: 'Shanghai', label: 'Shanghai', region: 'china' },
    { value: 'Guangzhou', label: 'Guangzhou', region: 'china' },
    { value: 'Chengdu', label: 'Chengdu', region: 'china' },
    { value: 'Hangzhou', label: 'Hangzhou', region: 'china' },
  ] },
  { code: 'TW', label: 'Taiwan', region: 'taiwan', cities: [
    { value: 'Taipei', label: 'Taipei', region: 'taiwan' },
    { value: 'Kaohsiung', label: 'Kaohsiung', region: 'taiwan' },
  ] },
  // Southeast Asia
  { code: 'TH', label: 'Thailand', region: 'thailand', cities: [
    { value: 'Bangkok', label: 'Bangkok', region: 'thailand' },
    { value: 'Chiang Mai', label: 'Chiang Mai', region: 'thailand' },
    { value: 'Phuket', label: 'Phuket', region: 'thailand' },
  ] },
  { code: 'VN', label: 'Vietnam', region: 'vietnam', cities: [
    { value: 'Ho Chi Minh City', label: 'Ho Chi Minh City', region: 'vietnam' },
    { value: 'Hanoi', label: 'Hanoi', region: 'vietnam' },
    { value: 'Da Nang', label: 'Da Nang', region: 'vietnam' },
  ] },
  { code: 'ID', label: 'Indonesia', region: 'indonesia', cities: [
    { value: 'Jakarta', label: 'Jakarta', region: 'indonesia' },
    { value: 'Bali', label: 'Bali', region: 'indonesia' },
    { value: 'Surabaya', label: 'Surabaya', region: 'indonesia' },
  ] },
  { code: 'MY', label: 'Malaysia', region: 'malaysia-singapore', cities: [
    { value: 'Kuala Lumpur', label: 'Kuala Lumpur', region: 'malaysia-singapore' },
    { value: 'Penang', label: 'Penang', region: 'malaysia-singapore' },
  ] },
  { code: 'SG', label: 'Singapore', region: 'malaysia-singapore', cities: [{ value: 'Singapore', label: 'Singapore', region: 'malaysia-singapore' }] },
  { code: 'PH', label: 'Philippines', region: 'philippines', cities: [
    { value: 'Manila', label: 'Manila', region: 'philippines' },
    { value: 'Cebu', label: 'Cebu', region: 'philippines' },
    { value: 'Davao', label: 'Davao', region: 'philippines' },
  ] },
  // Europe
  { code: 'IT', label: 'Italy', region: 'italy', cities: [
    { value: 'Rome', label: 'Rome', region: 'italy' },
    { value: 'Milan', label: 'Milan', region: 'italy' },
    { value: 'Naples', label: 'Naples', region: 'italy' },
    { value: 'Florence', label: 'Florence', region: 'italy' },
  ] },
  { code: 'ES', label: 'Spain', region: 'spain', cities: [
    { value: 'Madrid', label: 'Madrid', region: 'spain' },
    { value: 'Barcelona', label: 'Barcelona', region: 'spain' },
    { value: 'Seville', label: 'Seville', region: 'spain' },
  ] },
  { code: 'PT', label: 'Portugal', region: 'portugal', cities: [
    { value: 'Lisbon', label: 'Lisbon', region: 'portugal' },
    { value: 'Porto', label: 'Porto', region: 'portugal' },
  ] },
  { code: 'GR', label: 'Greece', region: 'greece', cities: [
    { value: 'Athens', label: 'Athens', region: 'greece' },
    { value: 'Thessaloniki', label: 'Thessaloniki', region: 'greece' },
  ] },
  { code: 'FR', label: 'France', region: 'france', cities: [
    { value: 'Paris', label: 'Paris', region: 'france' },
    { value: 'Lyon', label: 'Lyon', region: 'france' },
    { value: 'Marseille', label: 'Marseille', region: 'france' },
    { value: 'Nice', label: 'Nice', region: 'france' },
  ] },
  { code: 'DE', label: 'Germany', region: 'germany', cities: [
    { value: 'Berlin', label: 'Berlin', region: 'germany' },
    { value: 'Munich', label: 'Munich', region: 'germany' },
    { value: 'Hamburg', label: 'Hamburg', region: 'germany' },
    { value: 'Cologne', label: 'Cologne', region: 'germany' },
  ] },
  { code: 'GB', label: 'United Kingdom', region: 'uk-ireland', cities: [
    { value: 'London', label: 'London', region: 'uk-ireland' },
    { value: 'Manchester', label: 'Manchester', region: 'uk-ireland' },
    { value: 'Birmingham', label: 'Birmingham', region: 'uk-ireland' },
    { value: 'Edinburgh', label: 'Edinburgh', region: 'uk-ireland' },
  ] },
  { code: 'SE', label: 'Sweden', region: 'nordics', cities: [{ value: 'Stockholm', label: 'Stockholm', region: 'nordics' }] },
  { code: 'NO', label: 'Norway', region: 'nordics', cities: [{ value: 'Oslo', label: 'Oslo', region: 'nordics' }] },
  { code: 'DK', label: 'Denmark', region: 'nordics', cities: [{ value: 'Copenhagen', label: 'Copenhagen', region: 'nordics' }] },
  { code: 'FI', label: 'Finland', region: 'nordics', cities: [{ value: 'Helsinki', label: 'Helsinki', region: 'nordics' }] },
  { code: 'PL', label: 'Poland', region: 'poland-eastern-europe', cities: [
    { value: 'Warsaw', label: 'Warsaw', region: 'poland-eastern-europe' },
    { value: 'Krakow', label: 'Krakow', region: 'poland-eastern-europe' },
  ] },
  // Americas
  { code: 'US', label: 'United States', region: 'usa', cities: [
    { value: 'New York', label: 'New York, NY', region: 'usa' },
    { value: 'Los Angeles', label: 'Los Angeles, CA', region: 'usa' },
    { value: 'Chicago', label: 'Chicago, IL', region: 'usa' },
    { value: 'Houston', label: 'Houston, TX', region: 'usa' },
    { value: 'Austin', label: 'Austin, TX', region: 'usa' },
    { value: 'Miami', label: 'Miami, FL', region: 'usa' },
    { value: 'Portland', label: 'Portland, OR', region: 'usa' },
    { value: 'Seattle', label: 'Seattle, WA', region: 'usa' },
  ] },
  { code: 'CA', label: 'Canada', region: 'canada', cities: [
    { value: 'Toronto', label: 'Toronto, ON', region: 'canada' },
    { value: 'Vancouver', label: 'Vancouver, BC', region: 'canada' },
    { value: 'Montreal', label: 'Montreal, QC', region: 'canada' },
    { value: 'Calgary', label: 'Calgary, AB', region: 'canada' },
  ] },
  { code: 'MX', label: 'Mexico', region: 'mexico', cities: [
    { value: 'Mexico City', label: 'Mexico City', region: 'mexico' },
    { value: 'Guadalajara', label: 'Guadalajara', region: 'mexico' },
    { value: 'Monterrey', label: 'Monterrey', region: 'mexico' },
  ] },
  { code: 'BR', label: 'Brazil', region: 'brazil', cities: [
    { value: 'Sao Paulo', label: 'São Paulo', region: 'brazil' },
    { value: 'Rio de Janeiro', label: 'Rio de Janeiro', region: 'brazil' },
    { value: 'Brasilia', label: 'Brasília', region: 'brazil' },
  ] },
  { code: 'AR', label: 'Argentina', region: 'argentina', cities: [
    { value: 'Buenos Aires', label: 'Buenos Aires', region: 'argentina' },
    { value: 'Cordoba', label: 'Cordoba', region: 'argentina' },
  ] },
  // Oceania
  { code: 'AU', label: 'Australia', region: 'australia-nz', cities: [
    { value: 'Sydney', label: 'Sydney, NSW', region: 'australia-nz' },
    { value: 'Melbourne', label: 'Melbourne, VIC', region: 'australia-nz' },
    { value: 'Brisbane', label: 'Brisbane, QLD', region: 'australia-nz' },
    { value: 'Perth', label: 'Perth, WA', region: 'australia-nz' },
  ] },
  { code: 'NZ', label: 'New Zealand', region: 'australia-nz', cities: [
    { value: 'Auckland', label: 'Auckland', region: 'australia-nz' },
    { value: 'Wellington', label: 'Wellington', region: 'australia-nz' },
  ] },
  // Africa
  { code: 'ZA', label: 'South Africa', region: 'south-africa', cities: [
    { value: 'Cape Town', label: 'Cape Town', region: 'south-africa' },
    { value: 'Johannesburg', label: 'Johannesburg', region: 'south-africa' },
    { value: 'Durban', label: 'Durban', region: 'south-africa' },
  ] },
  { code: 'NG', label: 'Nigeria', region: 'nigeria-west-africa', cities: [
    { value: 'Lagos', label: 'Lagos', region: 'nigeria-west-africa' },
    { value: 'Abuja', label: 'Abuja', region: 'nigeria-west-africa' },
  ] },
  { code: 'ET', label: 'Ethiopia', region: 'ethiopia-east-africa', cities: [
    { value: 'Addis Ababa', label: 'Addis Ababa', region: 'ethiopia-east-africa' },
  ] },
];

// Add central-india alias to an existing DB key.
// (handled in food-db as part of north-india fallback family)

// ── Resolution ─────────────────────────────────────────────────────────────────

export interface ResolvedLocation {
  country: CountryOption | null;
  city: CityOption | null;
  region: RegionKey;
  label: string;
  confidence: 'country' | 'city' | 'exact';
  hemisphere: 'n' | 's';
}

const COUNTRY_BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]));
const COUNTRY_BY_NAME = new Map(COUNTRIES.map(c => [c.label.toLowerCase(), c]));

const COUNTRY_KEYWORDS: Record<string, string> = {
  // India states/regions (already mapped per-city, but free-text fallback)
  'maharashtra': 'west-india', 'gujarat': 'west-india', 'goa': 'west-india',
  'karnataka': 'south-india', 'tamil nadu': 'south-india', 'kerala': 'south-india',
  'andhra pradesh': 'south-india', 'telangana': 'south-india', 'pondicherry': 'south-india',
  'west bengal': 'east-india', 'odisha': 'east-india', 'bihar': 'east-india',
  'jharkhand': 'east-india', 'assam': 'east-india', 'meghalaya': 'east-india', 'manipur': 'east-india',
  'uttar pradesh': 'north-india', 'punjab': 'north-india', 'haryana': 'north-india',
  'rajasthan': 'north-india', 'himachal pradesh': 'north-india', 'uttarakhand': 'north-india',
  'delhi': 'north-india', 'chandigarh': 'north-india', 'jammu': 'north-india', 'ladakh': 'north-india',
  'madhya pradesh': 'central-india', 'chhattisgarh': 'central-india',
  'telangana': 'south-india',
  'pakistan': 'pakistan', 'bangladesh': 'bangladesh', 'nepal': 'nepal', 'srilanka': 'sri-lanka', 'sri lanka': 'sri-lanka',
  'saudi': 'gulf', 'uae': 'gulf', 'emirates': 'gulf', 'kuwait': 'gulf', 'qatar': 'gulf',
  'oman': 'gulf', 'bahrain': 'gulf', 'dubai': 'gulf', 'abu dhabi': 'gulf', 'riyadh': 'gulf', 'jeddah': 'gulf',
  'iran': 'iran', 'tehran': 'iran',
  'turkey': 'turkey', 'istanbul': 'turkey',
  'egypt': 'egypt', 'cairo': 'egypt',
  'lebanon': 'levant', 'beirut': 'levant', 'jordan': 'levant', 'amman': 'levant', 'syria': 'levant', 'damascus': 'levant',
  'japan': 'japan', 'tokyo': 'japan', 'osaka': 'japan', 'kyoto': 'japan',
  'korea': 'korea', 'south korea': 'korea', 'seoul': 'korea', 'busan': 'korea',
  'china': 'china', 'beijing': 'china', 'shanghai': 'china', 'guangzhou': 'china', 'chengdu': 'china', 'taiwan': 'taiwan', 'taipei': 'taiwan',
  'thailand': 'thailand', 'bangkok': 'thailand', 'chiang mai': 'thailand', 'phuket': 'thailand',
  'vietnam': 'vietnam', 'hanoi': 'vietnam', 'ho chi minh': 'vietnam', 'da nang': 'vietnam',
  'indonesia': 'indonesia', 'jakarta': 'indonesia', 'bali': 'indonesia',
  'malaysia': 'malaysia-singapore', 'kuala lumpur': 'malaysia-singapore', 'singapore': 'malaysia-singapore', 'penang': 'malaysia-singapore',
  'philippines': 'philippines', 'manila': 'philippines', 'cebu': 'philippines', 'davao': 'philippines',
  'italy': 'italy', 'rome': 'italy', 'milan': 'italy', 'naples': 'italy', 'florence': 'italy',
  'spain': 'spain', 'madrid': 'spain', 'barcelona': 'spain',
  'portugal': 'portugal', 'lisbon': 'portugal', 'porto': 'portugal',
  'greece': 'greece', 'athens': 'greece', 'thessaloniki': 'greece',
  'france': 'france', 'paris': 'france', 'lyon': 'france', 'marseille': 'france',
  'germany': 'germany', 'berlin': 'germany', 'munich': 'germany', 'hamburg': 'germany',
  'uk': 'uk-ireland', 'england': 'uk-ireland', 'great britain': 'uk-ireland', 'scotland': 'uk-ireland', 'wales': 'uk-ireland', 'ireland': 'uk-ireland', 'london': 'uk-ireland', 'manchester': 'uk-ireland',
  'sweden': 'nordics', 'norway': 'nordics', 'denmark': 'nordics', 'finland': 'nordics', 'copenhagen': 'nordics', 'stockholm': 'nordics', 'oslo': 'nordics', 'helsinki': 'nordics',
  'poland': 'poland-eastern-europe', 'warsaw': 'poland-eastern-europe', 'krakow': 'poland-eastern-europe',
  'usa': 'usa', 'united states': 'usa', 'california': 'usa', 'texas': 'usa', 'new york': 'usa', 'los angeles': 'usa',
  'canada': 'canada', 'toronto': 'canada', 'vancouver': 'canada', 'montreal': 'canada',
  'mexico': 'mexico', 'mexico city': 'mexico', 'guadalajara': 'mexico',
  'brazil': 'brazil', 'sao paulo': 'brazil', 'rio': 'brazil', 'rio de janeiro': 'brazil',
  'argentina': 'argentina', 'buenos aires': 'argentina',
  'australia': 'australia-nz', 'sydney': 'australia-nz', 'melbourne': 'australia-nz',
  'new zealand': 'australia-nz', 'auckland': 'australia-nz',
  'south africa': 'south-africa', 'cape town': 'south-africa', 'johannesburg': 'south-africa', 'durban': 'south-africa',
  'nigeria': 'nigeria-west-africa', 'lagos': 'nigeria-west-africa',
  'ethiopia': 'ethiopia-east-africa', 'addis ababa': 'ethiopia-east-africa',
};

function mapRegionKeyword(loc: string): RegionKey | null {
  const m = loc.toLowerCase().trim().replace(/[^a-z0-9\s\-]/g, ' ');
  for (const kw of Object.keys(COUNTRY_KEYWORDS)) {
    if (m.includes(kw)) return COUNTRY_KEYWORDS[kw] as RegionKey;
  }
  return null;
}

/**
 * Resolve a free-text location (country / "city, country" / region keyword) into
 * a precise cuisine zone. Returns highest-confidence match.
 */
export function resolveRegion(input: string): RegionKey {
  const found = resolveLocation(input);
  return found.region;
}

export function resolveLocation(input: string): ResolvedLocation {
  if (!input || !input.trim()) return _defaultLocation();

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // 1) Try exact country code (US, IN, JP ...)
  if (/^[a-z]{2}$/i.test(raw)) {
    const c = COUNTRY_BY_CODE.get(raw.toUpperCase());
    if (c) return _fromCountry(c, null, 'country');
  }

  // 2) Try exact country NAME
  const byName = COUNTRY_BY_NAME.get(lower);
  if (byName) return _fromCountry(byName, null, 'country');

  // 3) Try exact city match anywhere in the directory
  for (const country of COUNTRIES) {
    const city = country.cities.find(c => c.value.toLowerCase() === lower || c.label.toLowerCase() === lower);
    if (city) return _fromCountry(country, city, 'exact');
  }

  // 4) "city, country" parsing
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const maybeCountry = COUNTRY_BY_NAME.get(parts[parts.length - 1].toLowerCase());
    if (maybeCountry) {
      const cityPart = parts.slice(0, -1).join(', ');
      const city = maybeCountry.cities.find(c => c.value.toLowerCase().includes(cityPart.toLowerCase()) || cityPart.toLowerCase().includes(c.value.toLowerCase()));
      if (city) return _fromCountry(maybeCountry, city, 'exact');
      return _fromCountry(maybeCountry, null, 'country');
    }
  }

  // 5) Keyword fallback over the whole string
  const kwRegion = mapRegionKeyword(lower);
  if (kwRegion) return _fallbackRegion(kwRegion, 'country');

  return _defaultLocation();
}

function _fromCountry(country: CountryOption, city: CityOption | null, confidence: 'country' | 'exact'): ResolvedLocation {
  const region = city ? city.region : country.region;
  const hemisphere = REGION_META[region]?.hemisphere ?? 'n';
  return {
    country, city, region,
    label: city ? `${city.label}, ${country.label}` : country.label,
    confidence,
    hemisphere,
  };
}

function _fallbackRegion(region: RegionKey, confidence: 'country'): ResolvedLocation {
  return {
    country: null, city: null, region,
    label: REGION_META[region]?.label ?? region,
    confidence,
    hemisphere: REGION_META[region]?.hemisphere ?? 'n',
  };
}

function _defaultLocation(): ResolvedLocation {
  return {
    country: null, city: null, region: 'global', label: 'Global', confidence: 'country', hemisphere: 'n',
  };
}

// ── Seasonality ─────────────────────────────────────────────────────────────────
// Produce keyed by region, peak in given month(s).

export type Season = 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';

export interface SeasonalProduce {
  name: string;
  emoji: string;
  peakMonths: number[];          // 1-12
  note?: string;
  when: Season;
  localName?: string;
}

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTH_NAMES = monthNames;

export function seasonForMonth(month: number, hemisphere: 'n' | 's'): Season {
  const m = ((month - 1 + 12) % 12) + 1;            // northern-month index
  const northern: Record<number, Season> = {
    1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring',
    6: 'summer', 7: 'summer', 8: 'summer', 9: 'autumn', 10: 'autumn', 11: 'autumn', 12: 'winter',
  };
  const ns = northern[m]!;
  // Monsoon lives on top of summer in the northern hemisphere for South/Southeast Asia.
  if (hemisphere === 'n') {
    if ([6, 7, 8].includes(m) && ['south-india','west-india','east-india','malaysia-singapore','indonesia','philippines','thailand','vietnam','nigeria-west-africa','ethiopia-east-africa'].includes(regionForSeasonOverride())) {
      return 'monsoon';
    }
  }
  if (hemisphere === 's') {
    const southern: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer', monsoon: 'monsoon' };
    return southern[ns] ?? ns;
  }
  return ns;
}

function regionForSeasonOverride(): RegionKey { return 'global'; }

export function currentSeason(hemisphere: 'n' | 's', month?: number): Season {
  return seasonForMonth(month ?? new Date().getMonth() + 1, hemisphere);
}

/** Produce currently in season for a region (by month). */
export function seasonalProduceFor(region: RegionKey, month: number, hemisphere: 'n' | 's'): SeasonalProduce[] {
  const list = SEASONAL_DB[region] || SEASONAL_DB['global'] || [];
  return list.filter(p => {
    const peak = p.peakMonths || [];
    if (peak.length === 0) return true;
    return peak.includes(month);
  });
}

// ── Seasonality database ───────────────────────────────────────────────────────

const SEASONAL_DB: Record<string, SeasonalProduce[]> = {
  'north-india': [
    { name: 'Mango', emoji: '🥭', peakMonths: [3,4,5,6], when: 'summer', localName: 'Aam' },
    { name: 'Watermelon', emoji: '🍉', peakMonths: [5,6,7,8], when: 'summer' },
    { name: 'Guava', emoji: '🟢', peakMonths: [1,2,3,10,11,12], when: 'winter' },
    { name: 'Pomegranate', emoji: '🟣', peakMonths: [10,11,12,1,2], when: 'winter' },
    { name: 'Pumpkin', emoji: '🎃', peakMonths: [10,11,12], when: 'winter' },
    { name: 'Okra', emoji: '�', peakMonths: [3,4,5,6,9,10], when: 'monsoon' },
    { name: 'Spinach', emoji: '🥬', peakMonths: [11,12,1,2], when: 'winter' },
    { name: 'Ladyfinger', emoji: '�', peakMonths: [3,4,9,10], when: 'spring' },
  ],
  'south-india': [
    { name: 'Coconut', emoji: '🥥', peakMonths: [4,5,6,7,8,9], when: 'monsoon' },
    { name: 'Banana', emoji: '🍌', peakMonths: [6,7,8,9,10], when: 'monsoon', localName: 'Kele' },
    { name: 'Jackfruit', emoji: '🍈', peakMonths: [3,4,5,6], when: 'summer' },
    { name: 'Tamarind', emoji: '🫒', peakMonths: [10,11,12,1,2], when: 'winter' },
    { name: 'Bitter Gourd', emoji: '🫛', peakMonths: [6,7,8,9], when: 'monsoon' },
    { name: 'Drumstick', emoji: '🌰', peakMonths: [11,12,1,2], when: 'winter' },
    { name: 'Raw Mango', emoji: '🥭', peakMonths: [3,4,5,6], when: 'summer' },
  ],
  'gulf': [
    { name: 'Dates', emoji: '🌴', peakMonths: [8,9,10,11,12], when: 'autumn', note: 'Dates season — fresh Khalas & Medjool' },
    { name: 'Pomegranate', emoji: '🟣', peakMonths: [9,10,11,12], when: 'autumn' },
    { name: 'Citrus', emoji: '🍋', peakMonths: [11,12,1,2], when: 'winter' },
    { name: 'Fig', emoji: '🫛', peakMonths: [6,7,8], when: 'summer' },
    { name: 'Eggplant', emoji: '�', peakMonths: [10,11,12,1,2], when: 'winter' },
  ],
  'japan': [
    { name: 'Sakura (Cherry) Leaf / Strawberry', emoji: '🍓', peakMonths: [4,5], when: 'spring' },
    { name: 'Sansho Pepper', emoji: '�', peakMonths: [8,9,10], when: 'autumn' },
    { name: 'Mitsuba', emoji: '�', peakMonths: [5,6,7], when: 'summer' },
    { name: 'Daikon', emoji: ' Silence', peakMonths: [10,11,12,1,2], when: 'winter' },
    { name: 'Shiso', emoji: '🍃', peakMonths: [6,7,8], when: 'summer' },
    { name: 'Japanese Persimmon', emoji: '🟠', peakMonths: [10,11,12], when: 'autumn' },
  ],
  'korea': [
    { name: 'Kimchi Napa Cabbage', emoji: '�', peakMonths: [9,10,11], when: 'autumn' },
    { name: 'Perilla Leaves', emoji: '☑', peakMonths: [6,7,8], when: 'summer' },
    { name: 'Asian Pear', emoji: '🍐', peakMonths: [8,9,10], when: 'autumn' },
    { name: 'Radish (Mu)', emoji: ' Silence', peakMonths: [9,10,11,12], when: 'winter' },
  ],
  'usa': [
    { name: 'Corn', emoji: '🌽', peakMonths: [7,8,9], when: 'summer' },
    { name: 'Tomatoes', emoji: '🍅', peakMonths: [7,8,9], when: 'summer' },
    { name: 'Pumpkin', emoji: '🎃', peakMonths: [9,10,11], when: 'autumn' },
    { name: 'Apples', emoji: '🍎', peakMonths: [9,10,11,12], when: 'autumn' },
    { name: 'Citrus', emoji: '🍋', peakMonths: [11,12,1,2], when: 'winter' },
  ],
  'italy': [
    { name: 'San Marzano Tomatoes', emoji: '🍅', peakMonths: [7,8,9], when: 'summer' },
    { name: 'Basil', emoji: '🌿', peakMonths: [6,7,8,9], when: 'summer' },
    { name: 'Artichoke', emoji: ' Silence', peakMonths: [9,10,11], when: 'autumn' },
    { name: 'White Truffle', emoji: ' Silence', peakMonths: [10,11,12], when: 'autumn', note: 'Luxury Piedmont' },
    { name: 'Arugula', emoji: '🥗', peakMonths: [4,5,6], when: 'spring' },
  ],
  'mexico': [
    { name: 'Avocados (Hass)', emoji: '🥑', peakMonths: [10,11,12,1,2,3], when: 'winter' },
    { name: 'Lime', emoji: '🍋', peakMonths: [4,5,6,7,8], when: 'summer' },
    { name: 'Chili Peppers', emoji: '🌶️', peakMonths: [7,8,9], when: 'summer' },
    { name: 'Mamey', emoji: ' Silence', peakMonths: [4,5,6], when: 'summer' },
    { name: 'Jicama', emoji: ' Silence', peakMonths: [9,10,11,12], when: 'winter' },
  ],
  'thailand': [
    { name: 'Mango', emoji: '🥭', peakMonths: [2,3,4,5], when: 'summer' },
    { name: 'Dragon Fruit', emoji: ' Silence', peakMonths: [5,6,7], when: 'monsoon' },
    { name: 'Lemongrass', emoji: ' Silence', peakMonths: [10,11,12,1,2], when: 'winter' },
    { name: 'Thai Basil', emoji: '🌿', peakMonths: [6,7,8,9], when: 'monsoon' },
    { name: 'Long Bean', emoji: ' Silence', peakMonths: [11,12,1,2,3], when: 'winter' },
  ],
  'global': [
    { name: 'Bananas', emoji: '🍌', peakMonths: [1,2,3,4,5,6,7,8,9,10,11,12], when: 'summer' },
    { name: 'Apples', emoji: '🍎', peakMonths: [8,9,10,11,12], when: 'autumn' },
    { name: 'Carrots', emoji: ' Silence', peakMonths: [9,10,11,12,1,2], when: 'winter' },
    { name: 'Mixed Greens', emoji: '🥗', peakMonths: [4,5,6,7,8,9], when: 'summer' },
  ],
};

export { monthNames };
