// ── UTM tracking ──────────────────────────────────────────────────
// Captures UTM params from the URL on first visit and persists them
// to localStorage for attribution. Call once on app start.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  first_seen?: string;
}

export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const existing = JSON.parse(localStorage.getItem('nutriq-utm') || '{}') as UtmParams;
    // Only capture on first visit — don't overwrite the original source.
    if (existing.utm_source) return existing;

    const utm: UtmParams = {};
    let found = false;
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v) {
        utm[key] = v.slice(0, 200);
        found = true;
      }
    }
    if (found) {
      utm.first_seen = new Date().toISOString();
      localStorage.setItem('nutriq-utm', JSON.stringify(utm));
      return utm;
    }
    return existing;
  } catch {
    return {};
  }
}

export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('nutriq-utm') || '{}') as UtmParams;
  } catch {
    return {};
  }
}
