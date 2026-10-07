// ── Authenticated API client ────────────────────────────────────────
// Wraps fetch() to attach the current Supabase session token, so API
// routes can verify the caller is signed in.

import { getSupabase } from './supabase';

/** fetch() with the user's access token in the Authorization header. */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  try {
    const { data } = await getSupabase().auth.getSession();
    token = data.session?.access_token ?? null;
  } catch {
    // No session — the request goes out unauthenticated and the API
    // route will answer 401.
  }
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
