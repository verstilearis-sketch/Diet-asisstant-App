# 📧 Email Verification Setup Guide

## ✅ What's Been Implemented

Your app now requires **Gmail verification** during signup:

1. ✅ User enters Gmail address (@gmail.com only)
2. ✅ 6-digit verification code sent to email
3. ✅ User enters code to verify
4. ✅ Account created only after verification
5. ✅ Codes expire after 10 minutes
6. ✅ Resend option with 60-second cooldown

---

## 🚀 How It Works

### **User Flow:**

```
1. User clicks "Sign Up"
   ↓
2. Fills name, Gmail, password
   ↓
3. Clicks "Continue with Email Verification"
   ↓
4. 6-digit code sent to their Gmail
   ↓
5. User enters code from email
   ↓
6. Account created & redirected to onboarding
```

### **Sign In Flow:**
- No verification needed for existing users
- Just email + password as before

---

## 🔧 Development Mode

**Currently Active:** Development mode shows the verification code in:
- ✅ Terminal/console (where you ran `npm run dev`)
- ✅ Browser console (F12 → Console tab)
- ✅ On-screen dev panel (only in development)

**Example Terminal Output:**
```
📧 VERIFICATION CODE for user@gmail.com: 123456
⏰ Expires in 10 minutes
```

---

## 📨 Email Service Setup (Production)

To send real emails in production, choose one:

### **Option 1: Resend (Recommended)** ⭐

**Why:** Simple, reliable, generous free tier

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for 0-10K users

**Setup:**

1. **Sign up:** https://resend.com/signup
2. **Get API key:** Dashboard → API Keys → Create
3. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. **Verify domain (optional but recommended):**
   - Add domain in Resend dashboard
   - Add DNS records
   - Change `from:` email in API route

5. **Uncomment code in** `src/app/api/verify-email/route.ts`:
   ```typescript
   // Find "OPTION 1: Using Resend" section
   // Remove the /* */ comment wrapper
   ```

**Cost:** Free for 3K emails/mo, then $20/mo for 50K

---

### **Option 2: SendGrid** 

**Why:** Industry standard, robust features

**Free Tier:**
- 100 emails/day forever
- Good for small apps

**Setup:**

1. **Sign up:** https://signup.sendgrid.com/
2. **Create API key:** Settings → API Keys → Create
3. **Add to `.env.local`:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
4. **Verify sender identity:**
   - Settings → Sender Authentication
   - Verify single sender email

5. **Uncomment code in** `src/app/api/verify-email/route.ts`:
   ```typescript
   // Find "OPTION 2: Using SendGrid" section
   // Remove the /* */ comment wrapper
   ```

**Cost:** Free for 100/day, $15/mo for 40K/mo

---

### **Option 3: Gmail SMTP** (Not Recommended)

**Why Not:**
- ❌ Daily sending limits (500/day)
- ❌ Security concerns
- ❌ Can get blocked easily
- ❌ Not suitable for production

**Only use for:** Personal testing

---

## 📋 Configuration Steps

### **1. Update Environment Variables**

Add to `.env.local`:

```env
# Existing
GROQ_API_KEY=your_groq_api_key_here

# Add ONE of these:
RESEND_API_KEY=re_xxxxxxxxxxxx
# OR
SENDGRID_API_KEY=SG.xxxxxxxxxxxx

# Optional: Set environment
NODE_ENV=development  # or production
```

### **2. Update Email Template (Optional)**

In `src/app/api/verify-email/route.ts`, customize the HTML:

```typescript
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
`
```

### **3. Update Sender Email**

Change `from` address to your domain:

```typescript
from: 'DietAI <noreply@yourdomain.com>'
```

**Note:** Must verify domain with email provider first

---

## 🧪 Testing

### **Test in Development:**

1. Run dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign up free"
4. Enter Gmail address
5. Fill form and submit
6. Check terminal for code (e.g., `123456`)
7. Enter code on verification screen
8. Should redirect to onboarding

### **Test in Production:**

1. Deploy app with email service configured
2. Use real Gmail address
3. Check inbox for verification email
4. Enter code and verify

---

## 🔐 Security Features

✅ **Gmail-only validation** - Only @gmail.com addresses accepted
✅ **Code expiration** - Codes expire after 10 minutes
✅ **Rate limiting** - 60-second cooldown between resends
✅ **One-time use** - Codes deleted after successful verification
✅ **Secure storage** - Codes stored server-side (not client)
✅ **Memory cleanup** - Expired codes auto-deleted every 5 minutes

---

## 📊 Scalability

### **Current Implementation:**

**Storage:** In-memory Map (serverless function)

**Limitations:**
- ⚠️ Codes lost if function restarts
- ⚠️ Not shared across multiple serverless instances
- ⚠️ Works fine for <1K users/day

### **For Scale (>10K users):**

Upgrade to **Redis/Upstash** for code storage:

```typescript
// Install: npm install @upstash/redis
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Store code
await redis.setex(`verify:${email}`, 600, code); // 10 min TTL

// Retrieve code
const stored = await redis.get(`verify:${email}`);

// Delete code
await redis.del(`verify:${email}`);
```

**Benefits:**
- ✅ Persistent across restarts
- ✅ Shared across instances
- ✅ Auto-expiration built-in
- ✅ Fast (<50ms reads)

**Cost:** Upstash free tier = 10K requests/day

---

## ⚠️ Important Notes

### **Gmail Restrictions:**

Only `@gmail.com` addresses are accepted because:
1. ✅ Most popular email provider
2. ✅ Less spam/throwaway emails
3. ✅ Easier to verify identity
4. ✅ Better deliverability

**To allow all emails**, remove this check in `route.ts`:

```typescript
// Remove or modify this:
if (!email.toLowerCase().endsWith('@gmail.com')) {
  return NextResponse.json({ error: 'Only Gmail addresses are allowed' }, { status: 400 });
}
```

### **Development vs Production:**

| Feature | Development | Production |
|---------|------------|------------|
| Code display | ✅ Shows in console | ❌ Hidden |
| Email sending | ❌ Simulated | ✅ Real emails |
| Dev panel | ✅ Visible | ❌ Hidden |
| Logs | Verbose | Minimal |

---

## 🐛 Troubleshooting

### **"Failed to send verification email"**

**Cause:** No email service configured

**Fix:**
1. Add `RESEND_API_KEY` or `SENDGRID_API_KEY` to `.env.local`
2. Uncomment email service code in `route.ts`
3. Restart dev server

---

### **"Invalid verification code"**

**Causes:**
1. Code expired (>10 minutes old)
2. Wrong code entered
3. Code already used

**Fix:** Click "Resend code" and try again

---

### **"Only Gmail addresses are allowed"**

**Cause:** User entered non-Gmail email

**Fix:** Use `@gmail.com` address or modify validation

---

### **Code not appearing in terminal**

**Cause:** Not watching terminal output

**Fix:** 
1. Focus terminal window where `npm run dev` is running
2. Or check browser console (F12 → Console)
3. Or look at dev panel in verification screen

---

### **Emails going to spam**

**Causes:**
1. Sender domain not verified
2. No SPF/DKIM records
3. New sending domain

**Fix:**
1. Verify domain with email provider
2. Add DNS records (SPF, DKIM)
3. Warm up sender reputation (start with small volume)

---

## 💰 Cost Estimates

### **Email Service Costs:**

| Users/Month | Emails/Month | Resend Cost | SendGrid Cost |
|-------------|--------------|-------------|---------------|
| 100 | ~300 | Free | Free |
| 1,000 | ~3,000 | Free | $15 |
| 10,000 | ~30,000 | $20 | $60 |
| 50,000 | ~150,000 | $80 | $250 |

**Assumption:** Average 3 verification emails per user (1 signup + 2 resends)

---

## 📈 Upgrade Path

### **Phase 1: Launch (Current)**
- ✅ Development mode
- ✅ Gmail-only
- ✅ In-memory storage
- ✅ Free tier email service
- **Capacity:** 0-1,000 users

### **Phase 2: Growth**
- 🔧 Production email service (Resend)
- 🔧 Verify sender domain
- 🔧 Professional email template
- **Capacity:** 1,000-10,000 users

### **Phase 3: Scale**
- 🔧 Redis for code storage (Upstash)
- 🔧 Allow all email providers
- 🔧 Email analytics
- 🔧 SMS backup verification
- **Capacity:** 10,000+ users

---

## ✅ Checklist Before Launch

- [ ] Choose email service (Resend/SendGrid)
- [ ] Sign up for email service account
- [ ] Get API key
- [ ] Add API key to `.env.local`
- [ ] Uncomment email service code in `route.ts`
- [ ] Verify sender domain (if using custom domain)
- [ ] Test with real Gmail address
- [ ] Confirm emails not going to spam
- [ ] Update email template with your branding
- [ ] Set up email monitoring
- [ ] Deploy to production

---

## 🎯 Quick Start (5 Minutes)

**For immediate testing:**

1. **Keep development mode** (no setup needed)
   ```bash
   npm run dev
   ```

2. **Sign up with any Gmail**
   - Code shows in terminal and browser console

3. **Ready to launch?**
   - Sign up for Resend: https://resend.com/signup
   - Add API key to `.env.local`
   - Uncomment Resend code in `route.ts`
   - Deploy!

---

## 📞 Support & Resources

**Resend Docs:** https://resend.com/docs/send-with-nextjs
**SendGrid Docs:** https://docs.sendgrid.com/
**Upstash Redis:** https://upstash.com/docs/redis/overall/getstarted

---

**Email verification is now live! 🚀**

*Created: October 1, 2026*
