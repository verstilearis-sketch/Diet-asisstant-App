'use client';

import { useState } from 'react';
import { COUNTRY_GROUPS, findCountry, parseLocation, type CountryEntry } from '@/lib/places';
import { PencilIcon, ChevronLeftIcon } from '@/components/icons';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const rowStyle = (active: boolean): React.CSSProperties => ({
  all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.75rem',
  padding: '0.65rem 0.85rem', borderRadius: '0.6rem',
  background: active ? 'var(--color-accent-soft)' : 'transparent',
  border: `1px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
  transition: 'background 140ms ease, border-color 140ms ease',
});

function RadioDot({ active }: { active: boolean }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {active && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--color-accent)' }} />}
    </span>
  );
}

function ScrollList({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="nice-scroll" role="radiogroup" aria-label={label}
      style={{
        maxHeight: 280, overflowY: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem', padding: '0.4rem',
        background: 'var(--color-surface)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Two-step place picker (like the festival picker):
 * 1. choose a country from the scrollable list,
 * 2. choose its state/province.
 * "Somewhere else…" at the end opens a free-text field.
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const parsed = parseLocation(value);
  const [country, setCountry] = useState<string | null>(parsed.country ?? null);
  const [state, setState] = useState<string | null>(parsed.state ?? null);
  const [customOpen, setCustomOpen] = useState(parsed.custom !== undefined);
  const [customText, setCustomText] = useState(parsed.custom ?? '');

  const countryEntry: CountryEntry | undefined = country ? findCountry(country) : undefined;
  const needsState = !!countryEntry && countryEntry.states.length > 0;

  const emit = (c: string | null, s: string | null) => {
    if (!c) return onChange('');
    onChange(s ? `${s}, ${c}` : c);
  };

  const selectCountry = (name: string) => {
    const entry = findCountry(name);
    setCountry(name);
    setState(null);
    setCustomOpen(false);
    // Countries without subdivisions select immediately
    if (entry && entry.states.length === 0) emit(name, null);
    else onChange('');
  };

  const selectState = (name: string) => {
    setState(name);
    setCustomOpen(false);
    emit(country, name);
  };

  const backToCountries = () => {
    setCountry(null);
    setState(null);
    setCustomOpen(false);
    onChange('');
  };

  const openCustom = () => {
    setCustomOpen(true);
    setCountry(null);
    setState(null);
    setCustomText('');
    onChange('');
  };

  const onCustomType = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  return (
    <div>
      {/* ── Step 1: country ─────────────────────────────────── */}
      {(!country || customOpen) && (
        <div className="fade-in-up">
          <ScrollList label="Choose your country">
            {COUNTRY_GROUPS.map((group) => (
              <div key={group.label} style={{ marginBottom: '0.25rem' }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--color-faint)',
                  padding: '0.55rem 0.85rem 0.25rem',
                }}>
                  {group.label}
                </div>
                {group.countries.map((c) => {
                  const active = country === c.name && !customOpen;
                  return (
                    <button key={c.name} type="button" role="radio" aria-checked={active}
                      onClick={() => selectCountry(c.name)} style={rowStyle(active)}>
                      <RadioDot active={active} />
                      <span style={{ fontSize: '0.88rem', color: active ? 'var(--color-text)' : 'var(--color-muted)' }}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
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
          </ScrollList>
        </div>
      )}

      {/* ── Step 2: state ───────────────────────────────────── */}
      {countryEntry && needsState && !customOpen && (
        <div className="fade-in-up">
          <button
            type="button" onClick={backToCountries}
            style={{
              all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 650, marginBottom: '0.5rem',
            }}
          >
            <ChevronLeftIcon size={14} /> {countryEntry.name}
          </button>
          <ScrollList label={`Choose your state in ${countryEntry.name}`}>
            {countryEntry.states.map((s) => {
              const active = state === s;
              return (
                <button key={s} type="button" role="radio" aria-checked={active}
                  onClick={() => selectState(s)} style={rowStyle(active)}>
                  <RadioDot active={active} />
                  <span style={{ fontSize: '0.88rem', color: active ? 'var(--color-text)' : 'var(--color-muted)' }}>
                    {s}
                  </span>
                </button>
              );
            })}
          </ScrollList>
        </div>
      )}

      <p style={{ fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.4rem' }}>
        Used only to personalize meal suggestions — never shared.
      </p>
    </div>
  );
}
