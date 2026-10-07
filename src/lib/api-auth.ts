// ── Server-side API auth ──────────────────────────────────────────
// Verifies the Supabase JWT from the Authorization header. Use at the top
// of any API route that should require a signed-in user.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

/**
 * Returns the authenticated user's ID, or a 401 JSON response if the
 * request has no valid session. Usage:
 *
 *   const auth = await requireUser(req);
 *   if (auth instanceof NextResponse) return auth;
 *   const userId = auth; // string
 */
export async function requireUser(req: Request): Promise<string | NextResponse> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  try {
    const { data, error } = await serverSupabase().auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    return data.user.id;
  } catch {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
}
