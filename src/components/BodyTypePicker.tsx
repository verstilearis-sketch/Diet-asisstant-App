'use client';

/* ── Body-type figure picker ─────────────────────────────────────────────
   5 illustrated figures per gender (male/female tabs). The user picks the
   closest figure; it maps to an estimated body-fat % (see calculations.ts)
   which refines BMR via the Katch-McArdle equation.
------------------------------------------------------------------------ */

import { useState } from 'react';

export type BodyTypeValue = 'lean' | 'athletic' | 'average' | 'soft' | 'plus';

interface FigureSpec {
  value: BodyTypeValue;
  label: string;
  desc: string;
  src: string;
}

const MALE: FigureSpec[] = [
  { value: 'lean', label: 'Lean', desc: 'Slim, little visible fat', src: '/images/bodytypes/male-lean.png' },
  { value: 'athletic', label: 'Athletic', desc: 'Broad shoulders, toned', src: '/images/bodytypes/male-athletic.png' },
  { value: 'average', label: 'Average', desc: 'Balanced, typical build', src: '/images/bodytypes/male-average.png' },
  { value: 'soft', label: 'Soft', desc: 'Rounder midsection', src: '/images/bodytypes/male-soft.png' },
  { value: 'plus', label: 'Plus', desc: 'Fuller throughout', src: '/images/bodytypes/male-plus.png' },
];

const FEMALE: FigureSpec[] = [
  { value: 'lean', label: 'Lean', desc: 'Slim, little visible fat', src: '/images/bodytypes/female-lean.png' },
  { value: 'athletic', label: 'Athletic', desc: 'Toned, defined', src: '/images/bodytypes/female-athletic.png' },
  { value: 'average', label: 'Average', desc: 'Balanced, typical build', src: '/images/bodytypes/female-average.png' },
  { value: 'soft', label: 'Soft', desc: 'Rounder midsection', src: '/images/bodytypes/female-soft.png' },
  { value: 'plus', label: 'Plus', desc: 'Fuller throughout', src: '/images/bodytypes/female-plus.png' },
];

export function BodyTypePicker({
  value,
  gender,
  onChange,
}: {
  value?: BodyTypeValue;
  gender?: string;
  onChange: (v: BodyTypeValue) => void;
}) {
  const [tab, setTab] = useState<'male' | 'female'>(gender === 'female' ? 'female' : 'male');
  const specs = tab === 'female' ? FEMALE : MALE;
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setTab(g)}
            className={`option-card ${tab === g ? 'selected' : ''}`}
            style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize', padding: '0.6rem', fontWeight: 600, fontSize: '0.88rem' }}
          >
            {g}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        {specs.map((s) => {
          const active = value === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              aria-pressed={active}
              style={{
                border: `2px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: '1rem',
                padding: '0.5rem 0.25rem',
                background: active ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={`${s.label} ${tab} body type`}
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{
                  height: 120, width: 'auto', maxWidth: '100%', objectFit: 'contain',
                  filter: active ? 'none' : 'opacity(0.75)',
                }}
              />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '0.35rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--color-muted)', lineHeight: 1.3, marginTop: '0.1rem' }}>{s.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
