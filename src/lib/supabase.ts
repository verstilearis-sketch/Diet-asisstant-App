// ── Supabase browser client ─────────────────────────────────────────────────
// Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
// Created lazily so importing this module never throws during builds;
// the error surfaces only when a storage call actually runs without config.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local and restart the dev server.'
    );
  }
  client = createClient(url, key, {
    // PKCE is the modern, secure OAuth flow: Google returns ?code=… and the
    // callback exchanges it. Without this, the client falls back to the
    // legacy implicit flow (#access_token in the URL hash), which the
    // callback page is not built to handle.
    //
    // detectSessionInUrl is OFF on purpose: the client would otherwise
    // auto-exchange ?code= during initialization and race the callback
    // page's own exchangeCodeForSession call — one of the two redeems the
    // code and the other fails with "code already used".
    auth: { flowType: 'pkce', detectSessionInUrl: false },
  });
  return client;
}
