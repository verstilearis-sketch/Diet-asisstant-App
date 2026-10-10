// ── Country → state/province data for the location picker ──────────────
// Full dataset: every country in the world + all states/provinces
// (built from the countries-states-cities-database, compacted).
// An empty `states` array means the country is used as-is (city-states).

import PLACES_DATA from './places-full.json';

export interface CountryEntry {
  name: string;
  states: string[];
}

export interface CountryGroup {
  label: string;
  countries: CountryEntry[];
}

export const COUNTRY_GROUPS: CountryGroup[] = PLACES_DATA as CountryGroup[];

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
