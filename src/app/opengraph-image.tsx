import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LEAF = 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '0 90px',
          background: 'linear-gradient(135deg, #177245 0%, #0d4d2c 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <svg width="190" height="190" viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6.5" fill="#ffffff" />
          <path d={LEAF} fill="#177245" />
          <g stroke="#ffffff" strokeWidth={1.7} fill="none" strokeLinecap="round">
            <path d="M12 18.6v-5.2" />
            <path d="M12 15.8 9.4 13" />
            <path d="M12 15.8l2.6-2.8" />
            <path d="M12 13.4V10.2" />
          </g>
          <circle cx="12" cy="9" r="1.25" fill="#ffffff" />
          <circle cx="9.4" cy="13" r="1.25" fill="#ffffff" />
          <circle cx="14.6" cy="13" r="1.25" fill="#ffffff" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 118, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
            Nutriq
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.45, opacity: 0.88, maxWidth: 640 }}>
            A diet plan computed from your body, not copied from a template.
          </div>
          <div style={{ fontSize: 24, opacity: 0.6, marginTop: 8 }}>
            diet-asisstant-app.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
