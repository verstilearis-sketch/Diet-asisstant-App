'use client';

import { useState } from 'react';
import { FESTIVALS, getFestival, CUSTOM_FEAST_TIPS, CUSTOM_FAST_TIPS, type FestivalFood } from '@/lib/festivals';
import { SparklesIcon } from '@/components/icons';

export interface FestivalModeValue {
  festivalId: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'feast' | 'fast';
}

interface FestivalModeProps {
  festivalMode?: FestivalModeValue;
  onActivate: (mode: FestivalModeValue) => void;
  onClear: () => void;
  onLogFood: (food: FestivalFood) => void;
}

/**
 * Festival / occasion mode — activate for feasts and fasts, get
 * occasion guidance, and log festive foods. Used as its own sidebar tab.
 */
export function FestivalMode({ festivalMode: fm, onActivate, onClear, onLogFood }: FestivalModeProps) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('diwali');
  const [date, setDate] = useState(getFestival('diwali')?.defaultDate ?? '2026-11-08');
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'feast' | 'fast'>('feast');

  const fest = fm ? getFestival(fm.festivalId) : undefined;
  const isCustom = fm?.festivalId === 'custom';

  const activate = () => {
    let festivalId: string, name: string, type: 'feast' | 'fast';
    if (choice === 'custom') {
      const trimmed = customName.trim();
      if (!trimmed) return;
      festivalId = 'custom';
      name = trimmed;
      type = customType;
    } else {
      const f = getFestival(choice);
      if (!f) return;
      festivalId = f.id;
      name = f.name;
      type = f.type;
    }
    onActivate({ festivalId, name, date, type });
    setOpen(false);
  };

  if (fm && (fest || isCustom)) {
    const blurb = isCustom
      ? (fm.type === 'fast'
          ? 'Your occasion, your rules — the plan adapts around your fast.'
          : 'Your occasion, your rules — enjoy it, fitted into your day.')
      : fest!.blurb;
    const tips = isCustom
      ? (fm.type === 'fast' ? CUSTOM_FAST_TIPS : CUSTOM_FEAST_TIPS)
      : fest!.tips;
    const foods = isCustom ? [] : fest!.foods;
    return (
      <div className="glass-card fade-in-up" style={{ padding: '1.4rem', borderLeft: '4px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
          <h3 style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-accent)' }}><SparklesIcon size={17} /></span>
            {fm.name} mode
          </h3>
          <button type="button" className="btn-ghost" onClick={onClear} style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}>
            End
          </button>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: '0.4rem 0 0.9rem' }}>
          {blurb}
          <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-faint)', marginTop: '0.25rem' }}>
            {new Date(fm.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            {fm.type === 'fast' ? ' · fasting' : ' · feasting'}
          </span>
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.5rem' }}>How to enjoy it</p>
        <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', fontSize: '0.84rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
          {tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        {foods.length > 0 ? (
          <>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.6rem' }}>Festive picks — log as you eat</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {foods.map((food, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', background: 'var(--color-surface2)', borderRadius: '0.7rem', padding: '0.6rem 0.85rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 650 }}>{food.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {food.portion} · {food.calories} kcal · {food.proteinG}g protein
                      {food.tip && <span style={{ display: 'block', fontStyle: 'italic' }}>{food.tip}</span>}
                    </div>
                  </div>
                  <button type="button" className="btn-primary" onClick={() => onLogFood(food)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', flexShrink: 0 }}>
                    Log
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontStyle: 'italic', margin: 0 }}>
            Log what you eat from the tracker below — the coach will keep your targets in view.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card fade-in-up" style={{ padding: '1.4rem' }}>
      <h3 style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ color: 'var(--color-accent)' }}><SparklesIcon size={17} /></span>
        Festival mode
      </h3>
      <p style={{ fontSize: '0.86rem', color: 'var(--color-muted)', lineHeight: 1.65, margin: '0 0 1rem' }}>
        Celebrating something? Turn it on and the plan adapts — feast guidance, fasting windows, and festive foods to log.
      </p>
      <button
        type="button" className="btn-ghost"
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 650, padding: '0.6rem' }}
        aria-expanded={open}
      >
        {open ? 'Hide setup' : 'Set up festival mode'}
      </button>
      {open && (
        <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.7rem', alignItems: 'end' }}>
            <div>
              <label className="input-label" htmlFor="festival-select">Occasion</label>
              <select
                id="festival-select" className="input" value={choice}
                onChange={(e) => {
                  setChoice(e.target.value);
                  const d = getFestival(e.target.value)?.defaultDate;
                  if (d) setDate(d);
                }}
              >
                {FESTIVALS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                <option value="custom">Custom occasion…</option>
              </select>
            </div>
            {choice === 'custom' && (
              <>
                <div>
                  <label className="input-label" htmlFor="festival-custom-name">Occasion name</label>
                  <input
                    id="festival-custom-name" className="input" value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Wedding, Birthday"
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="festival-custom-type">Type</label>
                  <select
                    id="festival-custom-type" className="input" value={customType}
                    onChange={(e) => setCustomType(e.target.value as 'feast' | 'fast')}
                  >
                    <option value="feast">Feast — I’ll be eating</option>
                    <option value="fast">Fast — I’ll be fasting</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="input-label" htmlFor="festival-date">Date</label>
              <input id="festival-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <button type="button" className="btn-primary" onClick={activate} style={{ width: '100%', padding: '0.6rem' }}>
                Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
