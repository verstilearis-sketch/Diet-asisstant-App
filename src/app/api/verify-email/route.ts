import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number; email: string }>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (value.expires < now) {
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, action } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Validate Gmail
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json({ error: 'Only Gmail addresses are allowed' }, { status: 400 });
    }

    if (action === 'send') {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store code
      verificationCodes.set(email.toLowerCase(), { code, expires, email });

      // In production, send actual email via SendGrid, Resend, or similar
      // For now, we'll log it (you'll see it in terminal)
      console.log(`\n📧 VERIFICATION CODE for ${email}: ${code}\n`);
      console.log(`⏰ Expires in 10 minutes\n`);

      // Simulate email sending
      const emailSent = await sendVerificationEmail(email, code);

      if (!emailSent) {
        return NextResponse.json({
          success: false,
          error: 'Failed to send verification email. Check your email configuration.'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        // In development, return the code for testing
        ...(process.env.NODE_ENV === 'development' && { devCode: code })
      });
    }

    if (action === 'verify') {
      const { code } = body;

      if (!code) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const stored = verificationCodes.get(email.toLowerCase());

      if (!stored) {
        return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      if (stored.expires < Date.now()) {
        verificationCodes.delete(email.toLowerCase());
        return NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 });
      }

      if (stored.code !== code) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Code is valid - remove it
      verificationCodes.delete(email.toLowerCase());

      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err: any) {
    console.error('Email verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // OPTION 1: Using Resend (recommended - free tier: 3,000 emails/month)
  // Uncomment and add RESEND_API_KEY to .env.local
  /*
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DietAI <noreply@yourdomain.com>',
          to: email,
          subject: 'Your DietAI Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">🥗 Welcome to DietAI!</h2>
              <p>Your verification code is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #10b981; letter-spacing: 8px; font-size: 36px; margin: 0;">${code}</h1>
              </div>
              <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
              <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        }),
      });
      return response.ok;
    } catch (err) {
      console.error('Resend error:', err);
    }
  }
  */

  // OPTION 2: Using SendGrid
  // Uncomment and add SENDGRID_API_KEY to .env.local
  /*
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (sendGridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: 'noreply@yourdomain.com', name: 'DietAI' },
          subject: 'Your DietAI Verification Code',
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">🥗 Welcome to DietAI!</h2>
                <p>Your verification code is:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <h1 style="color: #10b981; letter-spacing: 8px; font-size: 36px; margin: 0;">${code}</h1>
                </div>
                <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
                <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
              </div>
            `
          }],
        }),
      });
      return response.ok;
    } catch (err) {
      console.error('SendGrid error:', err);
    }
  }
  */

  // DEVELOPMENT MODE: Just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`📧 [DEV MODE] Email would be sent to: ${email}`);
    console.log(`🔐 Code: ${code}`);
    return true; // Simulate success in development
  }

  // No email service configured
  console.warn('⚠️ No email service configured. Add RESEND_API_KEY or SENDGRID_API_KEY to .env.local');
  return false;
}
