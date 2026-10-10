"use client";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

/**
 * Thin monochrome ring loader — full-screen, centred, with gently
 * fading title/subtitle. Same design on desktop and phones.
 */
export function LoaderRing({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`loader-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role="status"
      aria-label="Loading"
    >
      <defs>
        <linearGradient id="zaiq-loader-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="3.5" />
      <circle
        cx="22"
        cy="22"
        r="19"
        fill="none"
        stroke="url(#zaiq-loader-arc)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="42 78"
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

/** Full-page loading screen: ring + optional title/subtitle. */
export function LoadingScreen({ title, subtitle }: LoadingScreenProps) {
  return (
    <div className="loader-screen" role="status" aria-label={title ?? "Loading"}>
      <LoaderRing size={68} className="loader-svg-lg" />
      {(title || subtitle) && (
        <div className="loader-copy">
          {title && <p className="loader-title">{title}</p>}
          {subtitle && <p className="loader-subtitle">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
