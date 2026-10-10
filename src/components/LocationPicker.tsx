'use client';

import { useState } from 'react';
import { MapPinIcon, PencilIcon } from '@/components/icons';

/* ── Preset places, grouped. Free text still works via "Somewhere else". ── */

interface PlaceGroup { label: string; places: string[] }

const PLACE_GROUPS: PlaceGroup[] = [
  {
    label: 'Jammu & Kashmir',
    places: [
      'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Leh', 'Kargil',
      'Kupwara', 'Pulwama', 'Kathua', 'Udhampur', 'Rajouri', 'Poonch',
      'Doda', 'Kishtwar', 'Samba', 'Ganderbal',
    ],
  },
  {
    label: 'India',
    places: [
      'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Amritsar',
      'Ludhiana', 'Shimla', 'Dehradun', 'Bhopal', 'Indore', 'Patna',
      'Ranchi', 'Bhubaneswar', 'Guwahati', 'Kochi', 'Thiruvananthapuram',
      'Coimbatore', 'Surat', 'Vadodara', 'Nagpur', 'Mysuru', 'Mangaluru',
      'Vijayawada', 'Visakhapatnam', 'Agra', 'Varanasi', 'Gurgaon', 'Noida',
      'Jodhpur', 'Udaipur', 'Gwalior', 'Jabalpur', 'Raipur', 'Siliguri',
      'Shillong', 'Puducherry', 'Panaji (Goa)',
    ],
  },
  {
    label: 'Around the world',
    places: [
      'Dubai', 'Abu Dhabi', 'Doha', 'Riyadh', 'Jeddah', 'London',
      'Birmingham', 'New York', 'Toronto', 'Sydney', 'Melbourne',
      'Singapore', 'Kuala Lumpur',
    ],
  },
];

const ALL_PRESETS = PLACE_GROUPS.flatMap((g) => g.places);

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Scrollable place picker: choose from preset places, or pick
 * "Somewhere else" at the end and type a custom place.
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const normalized = value.trim().toLowerCase();
  const matchedPreset = ALL_PRESETS.find((p) => p.toLowerCase() === normalized);
  const [customOpen, setCustomOpen] = useState(!matchedPreset && normalized !== '');
  const [customText, setCustomText] = useState(matchedPreset ? '' : value);

  const selectPreset = (place: string) => {
    setCustomOpen(false);
    onChange(place);
  };

  const openCustom = () => {
    setCustomOpen(true);
    setCustomText(matchedPreset ? '' : value);
  };

  const onCustomType = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  const rowStyle = (active: boolean): React.CSSProperties => ({
    all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.65rem 0.85rem', borderRadius: '0.6rem',
    background: active ? 'var(--color-accent-soft)' : 'transparent',
    border: `1px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
    transition: 'background 140ms ease, border-color 140ms ease',
  });

  return (
    <div>
      <div
        className="nice-scroll"
        role="radiogroup"
        aria-label="Choose your place"
        style={{
          maxHeight: 300, overflowY: 'auto',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem', padding: '0.4rem',
          background: 'var(--color-surface)',
        }}
      >
        {PLACE_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: '0.25rem' }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--color-faint)',
              padding: '0.55rem 0.85rem 0.25rem',
            }}>
              {group.label}
            </div>
            {group.places.map((place) => {
              const active = matchedPreset === place;
              return (
                <button key={place} type="button" role="radio" aria-checked={active}
                  onClick={() => selectPreset(place)} style={rowStyle(active)}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: active ? 'var(--color-text)' : 'var(--color-muted)' }}>
                    {place}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        {/* Custom option — always last */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
          <button type="button" role="radio" aria-checked={customOpen}
            onClick={openCustom} style={rowStyle(customOpen)}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: `1.5px solid ${customOpen ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: customOpen ? 'var(--color-accent)' : 'var(--color-faint)',
            }}>
              <PencilIcon size={10} />
            </span>
            <span style={{ fontSize: '0.88rem', color: customOpen ? 'var(--color-text)' : 'var(--color-muted)', fontStyle: 'italic' }}>
              Somewhere else…
            </span>
          </button>
          {customOpen && (
            <div style={{ padding: '0.35rem 0.45rem 0.5rem' }}>
              <input
                className="input" value={customText}
                onChange={(e) => onCustomType(e.target.value)}
                placeholder="Type your city or town"
                aria-label="Type your city or town"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.4rem' }}>
        Used only to personalize meal suggestions — never shared.
      </p>
    </div>
  );
}

export function LocationSummary({ value }: { value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <MapPinIcon size={13} />
      {value || 'Not set'}
    </span>
  );
}
