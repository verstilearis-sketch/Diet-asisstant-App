import { NextResponse } from 'next/server';

interface StoredCode {
  code: string;
  expires: number;
  email: string;
  lastSentAt: number;
}

// NOTE: In-memory store is fine for local dev and single-instance deploys.
// On serverless (e.g. Vercel), instances don't share memory, so codes can
// vanish between requests. For production, move this to Redis / a database.
const verificationCodes = new Map<string, StoredCode>();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between code requests per email

function isDev() {
  return process.env.NODE_ENV === 'development';
}

// Opportunistic cleanup — no setInterval (unreliable on serverless).
function purgeExpired() {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < now) verificationCodes.delete(key);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, action, code } = (body ?? {}) as {
    email?: unknown;
    action?: unknown;
    code?: unknown;
  };

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  const normalizedEmail = email.toLowerCase();

  // Product decision: restrict signups to Gmail. Remove this block to allow all domains.
  if (!normalizedEmail.endsWith('@gmail.com')) {
    return NextResponse.json({ error: 'Only Gmail addresses are supported right now.' }, { status: 400 });
  }

  if (action === 'send') {
    purgeExpired();

    const existing = verificationCodes.get(normalizedEmail);
    if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSec}s before requesting a new code.` },
        { status: 429 }
      );
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(normalizedEmail, {
      code: newCode,
      expires: Date.now() + CODE_TTL_MS,
      email: normalizedEmail,
      lastSentAt: Date.now(),
    });

    const sent = await sendVerificationEmail(normalizedEmail, newCode);
    if (!sent) {
      verificationCodes.delete(normalizedEmail);
      return NextResponse.json(
        { error: 'Could not send the verification email. The email service is not configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent. Check your inbox (and spam folder).',
      ...(isDev() && { devCode: newCode }),
    });
  }

  if (action === 'verify') {
    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }
    const stored = verificationCodes.get(normalizedEmail);
    if (!stored) {
      return NextResponse.json(
        { error: 'No code found for this email. Please request a new one.' },
        { status: 400 }
      );
    }
    if (stored.expires < Date.now()) {
      verificationCodes.delete(normalizedEmail);
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }
    if (stored.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }
    verificationCodes.delete(normalizedEmail);
    return NextResponse.json({ success: true, verified: true });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // No provider configured: in dev, log the code so signup still works locally.
    // In production this is a hard failure — returning false surfaces a 500
    // instead of silently pretending the email was sent.
    if (isDev()) {
      console.log(`[DEV] Verification code for ${email}: ${code} (expires in 10 min)`);
      return true;
    }
    console.error('RESEND_API_KEY is not set — cannot send verification email.');
    return false;
  }

  // IMPORTANT: Resend's shared test sender (onboarding@resend.dev) can ONLY
  // deliver to your own Resend account email. To send codes to real users,
  // verify your own domain at resend.com/domains and set:
  //   RESEND_FROM="Zaiq <noreply@yourdomain.com>"
  const from = process.env.RESEND_FROM || 'Zaiq <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Your Zaiq verification code',
        html: verificationEmailHtml(code),
        text: `Your Zaiq verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', response.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Resend request failed:', err);
    return false;
  }
}

function verificationEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="font-size:20px;font-weight:700;color:#111827;">Zaiq</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">Verify your email address</div>
        </td></tr>
        <tr><td style="font-size:14px;color:#374151;line-height:1.6;padding-bottom:24px;">
          Use the code below to complete your sign-up. It expires in <strong>10 minutes</strong>.
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:12px;color:#111827;background:#f3f4f6;border-radius:8px;padding:16px 24px 16px 36px;font-family:ui-monospace,Menlo,monospace;">${code}</div>
        </td></tr>
        <tr><td style="font-size:12px;color:#9ca3af;line-height:1.6;">
          If you didn't request this code, you can safely ignore this email.
        </td></tr>
      </table>
      <div style="font-size:11px;color:#9ca3af;margin-top:16px;">Zaiq · Diet Planning Assistant</div>
    </td></tr>
  </table>
</body>
</html>`;
}
