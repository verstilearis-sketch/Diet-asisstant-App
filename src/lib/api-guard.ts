// ── API protection: rate limiting + input validation ─────────────
// Simple in-memory rate limiter for API routes. Resets on redeploy —
// good enough to blunt abuse, not a distributed solution.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key  Unique per client (e.g. IP + route)
 * @param max  Max requests per window
 * @param windowMs  Window length in ms
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Prevent unbounded growth
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) {
        if (now > v.resetAt) buckets.delete(k);
        if (buckets.size < 5000) break;
      }
    }
    return true;
  }
  b.count += 1;
  return b.count <= max;
}

/** Extract a client identifier from the request (IP-based). */
export function clientKey(req: Request, route: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${route}:${ip}`;
}

/**
 * Validate that a value is a string within length bounds.
 * Returns the trimmed string, or null if invalid.
 */
export function validString(v: unknown, maxLen: number, minLen = 1): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t.length < minLen || t.length > maxLen) return null;
  return t;
}

/**
 * Validate that a value is a finite number within bounds.
 * Returns the number, or null if invalid.
 */
export function validNumber(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}
