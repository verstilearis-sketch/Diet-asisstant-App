'use client';

import { useState } from 'react';
import { COUNTRY_GROUPS, findCountry, parseLocation } from '@/lib/places';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const CUSTOM = '__custom__';

/**
 * Two-step place picker with native dropdowns (like the festival picker):
 * 1. choose a country,
 * 2. choose its state/province.
 * "Somewhere else…" at the end opens a free-text field.
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const parsed = parseLocation(value);
  const [country, setCountry] = useState(parsed.country ?? '');
  const [state, setState] = useState(parsed.state ?? '');
  const [custom, setCustom] = useState(parsed.custom ?? '');

  const countryEntry = country && country !== CUSTOM ? findCountry(country) : undefined;
  const needsState = !!countryEntry && countryEntry.states.length > 0;
  const isCustom = country === CUSTOM;

  const onCountryChange = (v: string) => {
    setCountry(v);
    setState('');
    if (v === CUSTOM) {
      setCustom('');
      onChange('');
    } else {
      setCustom('');
      // Countries without subdivisions select immediately
      const entry = findCountry(v);
      onChange(entry && entry.states.length === 0 ? v : '');
    }
  };

  const onStateChange = (v: string) => {
    setState(v);
    onChange(v ? `${v}, ${country}` : '');
  };

  const onCustomType = (text: string) => {
    setCustom(text);
    onChange(text);
  };

  return (
    <div>
      <label className="input-label" htmlFor="loc-country">Country</label>
      <select
        id="loc-country" className="input" style={{ marginBottom: '0.8rem' }}
        value={isCustom ? CUSTOM : country}
        onChange={(e) => onCountryChange(e.target.value)}
      >
        <option value="">Select country…</option>
        {COUNTRY_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.countries.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>Somewhere else…</option>
      </select>

      {needsState && !isCustom && (
        <div className="fade-in-up">
          <label className="input-label" htmlFor="loc-state">State / Province</label>
          <select
            id="loc-state" className="input"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
          >
            <option value="">Select state…</option>
            {countryEntry!.states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {isCustom && (
        <div className="fade-in-up">
          <label className="input-label" htmlFor="loc-custom">Your place</label>
          <input
            id="loc-custom" className="input" value={custom}
            onChange={(e) => onCustomType(e.target.value)}
            placeholder="Type your city or town"
          />
        </div>
      )}

      <p style={{ fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.4rem' }}>
        Used only to personalize meal suggestions — never shared.
      </p>
    </div>
  );
}
