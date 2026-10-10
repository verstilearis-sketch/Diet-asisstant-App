'use client';

/* ── Daily burn, visualized as professional activity rings ────────────
   Three concentric rings: resting burn (amber), movement (blue),
   and your target vs total burn (green) — with your real numbers.
---------------------------------------------------------------------- */

interface BodyEnergyFlowProps {
  bmr: number;
  tdee: number;
  target: number;
  goalLabel: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

function Ring({
  r, pct, gradientId, trackOpacity = 1, delay = 0,
}: {
  r: number; pct: number; gradientId: string; trackOpacity?: number; delay?: number;
}) {
  const c = 2 * Math.PI * r;
  return (
    <g style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}>
      <circle cx={100} cy={100} r={r} fill="none" stroke="var(--color-surface2)"
        strokeWidth={13} opacity={trackOpacity} />
      <circle
        cx={100} cy={100} r={r} fill="none" stroke={`url(#${gradientId})`}
        strokeWidth={13} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c}
        className="ring-draw"
        style={{ '--ring-c': c, '--ring-target': c * (1 - pct), animationDelay: `${delay}s` } as React.CSSProperties}
      />
      {/* slow orbiting highlight */}
      <circle
        cx={100} cy={100} r={r} fill="none" stroke="#ffffff"
        strokeWidth={13} strokeLinecap="round" opacity={0.07}
        strokeDasharray={`${c * 0.06} ${c * 0.94}`}
        className="ring-orbit" style={{ animationDelay: `${delay}s` }}
      />
    </g>
  );
}

export function BodyEnergyFlow({ bmr, tdee, target, goalLabel }: BodyEnergyFlowProps) {
  const movement = Math.max(0, tdee - bmr);
  const deficit = tdee - target;
  const pct = (v: number) => Math.min(1, Math.max(0.04, v / tdee));

  const steps = [
    {
      color: '#f0a63c',
      title: `${fmt(bmr)} kcal — at rest`,
      text: 'Your body burns this just keeping you alive: breathing, heartbeat, brain.',
    },
    {
      color: '#6aa8e8',
      title: `+${fmt(movement)} kcal — movement`,
      text: 'Daily activity and exercise stack on top of your resting burn.',
    },
    {
      color: '#2fa866',
      title: `${fmt(target)} kcal — your target`,
      text: deficit > 0
        ? `Eat this to land ~${fmt(deficit)} kcal under burn — steady fat loss. ${goalLabel}.`
        : deficit < 0
          ? `Eat this to land ~${fmt(-deficit)} kcal over burn — steady, lean gains. ${goalLabel}.`
          : `Eat this to match your burn exactly. ${goalLabel}.`,
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '1.4rem' }}>
      <h3 style={{ fontSize: '0.98rem', marginBottom: '0.25rem' }}>Where your calories go</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: '0 0 1rem' }}>
        Your plan, visualized.
      </p>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <svg
          viewBox="0 0 200 200" role="img" aria-label="Activity rings showing calorie burn breakdown"
          style={{ width: 168, height: 'auto', flexShrink: 0, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="ring-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0a63c" /><stop offset="100%" stopColor="#d97f2b" />
            </linearGradient>
            <linearGradient id="ring-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6aa8e8" /><stop offset="100%" stopColor="#4a7fc9" />
            </linearGradient>
            <linearGradient id="ring-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2fa866" /><stop offset="100%" stopColor="#1f7a48" />
            </linearGradient>
          </defs>
          <Ring r={82} pct={pct(bmr)} gradientId="ring-amber" delay={0} />
          <Ring r={63} pct={pct(movement)} gradientId="ring-blue" delay={0.25} />
          <Ring r={44} pct={pct(target)} gradientId="ring-green" delay={0.5} />
          <text x={100} y={96} textAnchor="middle" fill="var(--color-text)"
            fontSize={21} fontWeight={800} fontVariantNumeric="tabular-nums">
            {fmt(tdee)}
          </text>
          <text x={100} y={114} textAnchor="middle" fill="var(--color-muted)" fontSize={10.5}>
            kcal burned daily
          </text>
        </svg>
        <ol style={{ flex: 1, minWidth: 200, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `${s.color}22`, color: s.color,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 800,
              }}>
                {i + 1}
              </span>
              <div>
                <div style={{ fontSize: '0.87rem', fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: '0.79rem', color: 'var(--color-muted)', lineHeight: 1.55, marginTop: '0.15rem' }}>{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
