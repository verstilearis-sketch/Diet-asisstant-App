import { NextResponse } from 'next/server';

// ── Direct Google OAuth callback ────────────────────────────────
// We run Google OAuth ourselves (instead of via Supabase Auth) so the
// Google consent screen shows the user's own domain ("to continue to
// nutriq.app") instead of the Supabase project hostname.
//
// Flow: Google redirects here with ?code=…&state=…. We exchange the code
// for tokens server-side (client secret never leaves the server), then
// redirect to /auth/callback with the ID token in the URL hash (never sent
// to any server, never logged). The client completes sign-in via
// supabase.auth.signInWithIdToken().

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Always land back in the app — the client callback page shows errors.
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/auth/callback?error=${encodeURIComponent(msg)}`, url.origin));

  if (error) return fail(`Google sign-in was cancelled (${error})`);
  if (!code) return fail('Google did not return a sign-in code');

  // CSRF check: state must match the cookie set when the flow started.
  const expectedState = req.headers.get('cookie')?.match(/(?:^|;\s*)nutriq_oauth_state=([^;]+)/)?.[1];
  if (!state || !expectedState || state !== decodeURIComponent(expectedState)) {
    return fail('Sign-in request expired. Please try again.');
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Google OAuth: NEXT_PUBLIC_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    return fail('Google sign-in is not configured. Please try again later.');
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    // Exchange the authorization code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const errText = (await tokenRes.text()).slice(0, 200);
      console.error('Google OAuth token exchange failed:', tokenRes.status, errText);
      return fail('Could not complete Google sign-in. Please try again.');
    }
    const tokens = (await tokenRes.json()) as { id_token?: string };
    const idToken = tokens.id_token;
    if (!idToken) {
      console.error('Google OAuth: no id_token in token response');
      return fail('Could not complete Google sign-in. Please try again.');
    }

    // Hand the ID token to the client via a short-lived cookie (more
    // reliable than a URL fragment across the redirect). The client reads
    // it, signs in, and clears it immediately.
    const res = NextResponse.redirect(new URL('/auth/callback', url.origin));
    res.cookies.set('nutriq_id_token', idToken, {
      httpOnly: false, // client JS must read it
      secure: true,
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });
    // Clear the one-time state cookie.
    res.cookies.set('nutriq_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    return fail('Could not complete Google sign-in. Please try again.');
  }
}

