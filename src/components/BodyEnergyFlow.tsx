'use client';

/* ── Animated body: shows where your calories go ─────────────────────
   A stylized figure with flowing energy — food in, BMR burn at the core,
   movement burn along the limbs — plus the user's real numbers as steps.
---------------------------------------------------------------------- */

interface BodyEnergyFlowProps {
  bmr: number;
  tdee: number;
  target: number;
  goalLabel: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

export function BodyEnergyFlow({ bmr, tdee, target, goalLabel }: BodyEnergyFlowProps) {
  const movement = Math.max(0, tdee - bmr);
  const deficit = tdee - target;
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
        Your plan, visualized on your body.
      </p>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Animated figure */}
        <svg
          viewBox="0 0 220 340" role="img" aria-label="Animated diagram of calorie flow through the body"
          style={{ width: 150, height: 'auto', flexShrink: 0, overflow: 'visible' }}
        >
          {/* food intake dots */}
          {[0, 1, 2].map((i) => (
            <circle
              key={i} cx={110} cy={8} r={4.5} fill="#2fa866"
              className="energy-dot" style={{ animationDelay: `${i * 0.7}s` }}
            />
          ))}
          {/* body */}
          <g stroke="var(--color-text)" strokeLinecap="round" fill="none" opacity={0.88}>
            <circle cx={110} cy={42} r={19} strokeWidth={10} />
            <path d="M110 72 V186" strokeWidth={24} />
            <path d="M110 104 L68 152 M110 104 L152 152" strokeWidth={12} />
            <path d="M110 186 L86 296 M110 186 L134 296" strokeWidth={14} />
          </g>
          {/* BMR core pulse */}
          <circle cx={110} cy={128} r={11} fill="#f0a63c" className="core-pulse" />
          <circle cx={110} cy={128} r={5} fill="#f0a63c" opacity={0.95} />
          {/* movement flow along limbs */}
          <g fill="none" stroke="#6aa8e8" strokeWidth={3.5} strokeLinecap="round"
             strokeDasharray="7 8" className="flow-dash" opacity={0.9}>
            <path d="M110 104 L68 152" />
            <path d="M110 104 L152 152" />
            <path d="M110 186 L86 296" />
            <path d="M110 186 L134 296" />
          </g>
        </svg>
        {/* Steps */}
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
