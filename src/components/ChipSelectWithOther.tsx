'use client';

/* ── Chip multi-select with an "Others" free-text option ────────────────── */

import { useState } from 'react';
import { CheckIcon } from '@/components/icons';

export function ChipSelectWithOther({
  options,
  values,
  onToggle,
  label,
  placeholder = 'Type your own…',
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState('');
  const lower = values.map((v) => v.toLowerCase());
  const customValues = values.filter((v) => !options.map((o) => o.toLowerCase()).includes(v.toLowerCase()));

  const addOther = () => {
    const t = otherText.trim();
    if (t && !lower.includes(t.toLowerCase())) onToggle(t);
    setOtherText('');
    setShowOther(false);
  };

  return (
    <div>
      <span className="input-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
        {label} <span style={{ color: 'var(--color-faint)', fontWeight: 500 }}>— select all that apply</span>
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map((o) => {
          const isChecked = lower.includes(o.toLowerCase());
          return (
            <button key={o} type="button" className={`checkbox-item ${isChecked ? 'checked' : ''}`}
              onClick={() => onToggle(o)}>
              {isChecked && <CheckIcon size={13} />} {o}
            </button>
          );
        })}
        {customValues.map((v) => (
          <button key={v} type="button" className="checkbox-item checked"
            onClick={() => onToggle(v)} title="Tap to remove">
            <CheckIcon size={13} /> {v}
          </button>
        ))}
        <button type="button" className={`checkbox-item ${showOther ? 'checked' : ''}`}
          onClick={() => setShowOther((s) => !s)}>
          Others
        </button>
      </div>
      {showOther && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
          <input
            className="input-field"
            style={{ marginBottom: 0, flex: 1 }}
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder={placeholder}
            maxLength={60}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther(); } }}
          />
          <button type="button" className="btn-primary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
            onClick={addOther}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
