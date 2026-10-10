// ── Country → state/province data for the location picker ──────────────
// States are the major administrative divisions users recognize.
// An empty `states` array means the country is used as-is (city-states).

export interface CountryEntry {
  name: string;
  states: string[];
}

export interface CountryGroup {
  label: string;
  countries: CountryEntry[];
}

export const COUNTRY_GROUPS: CountryGroup[] = [
  {
    label: 'South Asia',
    countries: [
      {
        name: 'India',
        states: [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
          'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
          'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
          'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
          'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
          'Andaman & Nicobar', 'Chandigarh', 'Delhi',
          'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
        ],
      },
      {
        name: 'Pakistan',
        states: [
          'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
          'Gilgit-Baltistan', 'Azad Jammu & Kashmir', 'Islamabad',
        ],
      },
      {
        name: 'Bangladesh',
        states: [
          'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna',
          'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh',
        ],
      },
      {
        name: 'Nepal',
        states: [
          'Koshi', 'Madhesh', 'Bagmati', 'Gandaki',
          'Lumbini', 'Karnali', 'Sudurpashchim',
        ],
      },
      {
        name: 'Sri Lanka',
        states: [
          'Western', 'Central', 'Southern', 'Northern', 'Eastern',
          'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
        ],
      },
      {
        name: 'Bhutan',
        states: ['Thimphu', 'Paro', 'Punakha', 'Wangdue', 'Trashigang'],
      },
      { name: 'Maldives', states: [] },
      {
        name: 'Afghanistan',
        states: ['Kabul', 'Herat', 'Kandahar', 'Balkh', 'Nangarhar'],
      },
    ],
  },
  {
    label: 'Middle East',
    countries: [
      {
        name: 'United Arab Emirates',
        states: [
          'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman',
          'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
        ],
      },
      {
        name: 'Saudi Arabia',
        states: [
          'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir',
          'Tabuk', 'Hail', 'Jazan', 'Najran', 'Qassim',
        ],
      },
      {
        name: 'Qatar',
        states: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail', 'Al Khor'],
      },
      {
        name: 'Kuwait',
        states: ['Al Asimah', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra'],
      },
      {
        name: 'Oman',
        states: ['Muscat', 'Dhofar', 'Al Batinah', 'Ash Sharqiyah', 'Ad Dakhiliyah'],
      },
      { name: 'Bahrain', states: ['Capital', 'Muharraq', 'Northern', 'Southern'] },
      {
        name: 'Iran',
        states: ['Tehran', 'Isfahan', 'Fars', 'Khorasan', 'Khuzestan', 'Yazd'],
      },
      {
        name: 'Iraq',
        states: ['Baghdad', 'Basra', 'Erbil', 'Nineveh', 'Kirkuk'],
      },
      {
        name: 'Turkey',
        states: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Adana'],
      },
    ],
  },
  {
    label: 'Europe',
    countries: [
      {
        name: 'United Kingdom',
        states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      },
      {
        name: 'Germany',
        states: ['Bavaria', 'Berlin', 'Hamburg', 'North Rhine-Westphalia', 'Hesse', 'Saxony'],
      },
      {
        name: 'France',
        states: ['Île-de-France', 'Provence', 'Brittany', 'Normandy', 'Auvergne-Rhône-Alpes', 'Occitanie'],
      },
      {
        name: 'Italy',
        states: ['Lombardy', 'Lazio', 'Campania', 'Sicily', 'Tuscany', 'Piedmont'],
      },
      {
        name: 'Spain',
        states: ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Basque Country', 'Galicia'],
      },
      {
        name: 'Netherlands',
        states: ['North Holland', 'South Holland', 'Utrecht', 'Brabant'],
      },
    ],
  },
  {
    label: 'Americas',
    countries: [
      {
        name: 'United States',
        states: [
          'California', 'Texas', 'New York', 'Florida', 'Illinois',
          'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan',
          'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Massachusetts',
          'Tennessee', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin',
          'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana',
          'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah',
          'Iowa', 'Nevada', 'Arkansas', 'Mississippi', 'Kansas',
          'New Mexico', 'Nebraska', 'Idaho', 'West Virginia', 'Hawaii',
          'New Hampshire', 'Maine', 'Rhode Island', 'Montana', 'Delaware',
          'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming',
        ],
      },
      {
        name: 'Canada',
        states: [
          'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
          'Saskatchewan', 'Nova Scotia', 'New Brunswick',
          'Newfoundland and Labrador', 'Prince Edward Island',
        ],
      },
    ],
  },
  {
    label: 'Asia Pacific',
    countries: [
      {
        name: 'Australia',
        states: [
          'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
          'South Australia', 'Tasmania',
        ],
      },
      {
        name: 'New Zealand',
        states: ['Auckland', 'Wellington', 'Canterbury', 'Otago', 'Waikato'],
      },
      { name: 'Singapore', states: [] },
      {
        name: 'Malaysia',
        states: ['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak', 'Sabah', 'Sarawak'],
      },
      {
        name: 'Indonesia',
        states: ['Jakarta', 'West Java', 'Central Java', 'East Java', 'Bali', 'Sumatra'],
      },
      {
        name: 'Thailand',
        states: ['Bangkok', 'Chiang Mai', 'Phuket', 'Chonburi', 'Krabi'],
      },
      {
        name: 'Japan',
        states: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Okinawa', 'Fukuoka'],
      },
      {
        name: 'South Korea',
        states: ['Seoul', 'Busan', 'Incheon', 'Gyeonggi', 'Jeju'],
      },
      {
        name: 'China',
        states: ['Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Zhejiang', 'Jiangsu'],
      },
    ],
  },
  {
    label: 'Africa',
    countries: [
      {
        name: 'South Africa',
        states: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
      },
      {
        name: 'Nigeria',
        states: ['Lagos', 'Abuja (FCT)', 'Kano', 'Rivers', 'Oyo'],
      },
      {
        name: 'Kenya',
        states: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
      },
      {
        name: 'Egypt',
        states: ['Cairo', 'Giza', 'Alexandria', 'Luxor', 'Aswan'],
      },
    ],
  },
];

/** Find a country entry by name (case-insensitive). */
export function findCountry(name: string): CountryEntry | undefined {
  const n = name.trim().toLowerCase();
  for (const g of COUNTRY_GROUPS)
    for (const c of g.countries)
      if (c.name.toLowerCase() === n) return c;
  return undefined;
}

/**
 * Parse a saved "State, Country" (or plain) location back into its parts,
 * so the picker can restore a previous selection.
 */
export function parseLocation(value: string): { country?: string; state?: string; custom?: string } {
  const v = value.trim();
  if (!v) return {};
  const comma = v.lastIndexOf(',');
  if (comma > 0) {
    const state = v.slice(0, comma).trim();
    const countryName = v.slice(comma + 1).trim();
    const country = findCountry(countryName);
    if (country) {
      const matchedState = country.states.find((s) => s.toLowerCase() === state.toLowerCase());
      return { country: country.name, state: matchedState ?? state };
    }
  }
  const country = findCountry(v);
  if (country) return { country: country.name };
  // Maybe it's a bare state name (legacy free-text like "Kashmir")
  for (const g of COUNTRY_GROUPS)
    for (const c of g.countries) {
      const s = c.states.find((st) => st.toLowerCase() === v.toLowerCase());
      if (s) return { country: c.name, state: s };
    }
  return { custom: v };
}
