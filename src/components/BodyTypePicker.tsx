'use client';

/* ── Body-type figure picker ─────────────────────────────────────────────
   5 parametric SVG silhouettes per gender. The user picks the closest
   figure; it maps to an estimated body-fat % (see calculations.ts) which
   refines BMR via the Katch-McArdle equation.
------------------------------------------------------------------------ */

import { useState } from 'react';

export type BodyTypeValue = 'lean' | 'athletic' | 'average' | 'soft' | 'plus';

interface FigureSpec {
  value: BodyTypeValue;
  label: string;
  desc: string;
  shoulder: number;
  waist: number;
  hip: number;
}

const MALE: FigureSpec[] = [
  { value: 'lean', label: 'Lean', desc: 'Slim, little visible fat', shoulder: 40, waist: 28, hip: 30 },
  { value: 'athletic', label: 'Athletic', desc: 'Broad shoulders, toned', shoulder: 50, waist: 30, hip: 33 },
  { value: 'average', label: 'Average', desc: 'Balanced, typical build', shoulder: 44, waist: 37, hip: 39 },
  { value: 'soft', label: 'Soft', desc: 'Rounder midsection', shoulder: 44, waist: 45, hip: 45 },
  { value: 'plus', label: 'Plus', desc: 'Fuller throughout', shoulder: 48, waist: 55, hip: 55 },
];

const FEMALE: FigureSpec[] = [
  { value: 'lean', label: 'Lean', desc: 'Slim, little visible fat', shoulder: 34, waist: 25, hip: 33 },
  { value: 'athletic', label: 'Athletic', desc: 'Toned, defined', shoulder: 38, waist: 27, hip: 35 },
  { value: 'average', label: 'Average', desc: 'Balanced, typical build', shoulder: 38, waist: 31, hip: 41 },
  { value: 'soft', label: 'Soft', desc: 'Rounder midsection', shoulder: 40, waist: 39, hip: 47 },
  { value: 'plus', label: 'Plus', desc: 'Fuller throughout', shoulder: 42, waist: 49, hip: 55 },
];

function Figure({ spec, selected }: { spec: FigureSpec; selected: boolean }) {
  const cx = 60;
  const sW = spec.shoulder / 2, wW = spec.waist / 2, hW = spec.hip / 2;
  const color = selected ? 'var(--color-accent)' : 'var(--color-text)';
  const opacity = selected ? 0.95 : 0.55;
  return (
    <svg viewBox="0 0 120 240" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden>
      {/* head */}
      <circle cx={cx} cy={22} r={13} fill={color} opacity={opacity} />
      {/* neck */}
      <rect x={cx - 6} y={32} width={12} height={14} rx={4} fill={color} opacity={opacity} />
      {/* torso */}
      <path
        d={`M ${cx - sW} 50
            C ${cx - sW} 72, ${cx - wW - 3} 92, ${cx - wW} 112
            C ${cx - wW} 132, ${cx - hW} 142, ${cx - hW} 154
            L ${cx + hW} 154
            C ${cx + hW} 142, ${cx + wW} 132, ${cx + wW} 112
            C ${cx + wW + 3} 92, ${cx + sW} 72, ${cx + sW} 50
            Q ${cx} 60, ${cx - sW} 50 Z`}
        fill={color} opacity={opacity}
      />
      {/* arms */}
      <path
        d={`M ${cx - sW - 1} 56 C ${cx - sW - 9} 88, ${cx - sW - 7} 116, ${cx - sW - 3} 138
            L ${cx - sW + 5} 138 C ${cx - sW + 7} 116, ${cx - sW + 5} 88, ${cx - sW + 3} 56 Z`}
        fill={color} opacity={opacity}
      />
      <path
        d={`M ${cx + sW + 1} 56 C ${cx + sW + 9} 88, ${cx + sW + 7} 116, ${cx + sW + 3} 138
            L ${cx + sW - 5} 138 C ${cx + sW - 7} 116, ${cx + sW - 5} 88, ${cx + sW - 3} 56 Z`}
        fill={color} opacity={opacity}
      />
      {/* legs */}
      <path
        d={`M ${cx - hW + 5} 154 L ${cx - 7} 154 L ${cx - 9} 224 Q ${cx - 9} 230, ${cx - 15} 230 L ${cx - 21} 230 Q ${cx - 25} 230, ${cx - 24} 224 L ${cx - hW - 1} 158 Z`}
        fill={color} opacity={opacity}
      />
      <path
        d={`M ${cx + hW - 5} 154 L ${cx + 7} 154 L ${cx + 9} 224 Q ${cx + 9} 230, ${cx + 15} 230 L ${cx + 21} 230 Q ${cx + 25} 230, ${cx + 24} 224 L ${cx + hW + 1} 158 Z`}
        fill={color} opacity={opacity}
      />
    </svg>
  );
}

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
                padding: '0.7rem 0.3rem 0.6rem',
                background: active ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Figure spec={s} selected={active} />
              <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '0.4rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--color-muted)', lineHeight: 1.35, marginTop: '0.15rem' }}>{s.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
