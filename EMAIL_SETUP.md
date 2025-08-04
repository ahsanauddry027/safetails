# 📧 SafeTails Email Service Setup Guide

This guide will help you set up email services for OTP verification and notifications in your SafeTails project.

## 🚀 Quick Setup

### 1. Choose Your Email Service Provider

We've implemented **Resend** as the primary service (recommended for new projects) with **SendGrid** as an alternative.

#### **Option A: Resend (Recommended - Free tier: 3,000 emails/month)**

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to your `.env` file:
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=SafeTails <noreply@yourdomain.com>
```

#### **Option B: SendGrid (Free tier: 100 emails/day)**

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Install SendGrid package:
```bash
npm install @sendgrid/mail
```
4. Replace the import in your API files:
```typescript
// Change this line in API files:
import { EmailService } from "@/utils/emailService";
// To this:
import { EmailService } from "@/utils/emailService-sendgrid";
```
5. Add to your `.env` file:
```env
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=SafeTails <noreply@yourdomain.com>
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Email Service (choose one)
RESEND_API_KEY=your_resend_api_key
# OR
SENDGRID_API_KEY=your_sendgrid_api_key

# Email Configuration
FROM_EMAIL=SafeTails <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Verify Setup

Test your email service by registering a new user:

```bash
npm run dev
```

Navigate to your registration page and create a new account. You should receive:
1. ✅ OTP verification email
2. ✅ Welcome email after verification

## 📋 API Endpoints

Your project now includes these new endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register user + send OTP |
| `/api/auth/verify-email` | POST | Verify email with OTP |
| `/api/auth/resend-verification` | POST | Resend OTP email |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |

## 🎨 Email Templates

The system includes beautiful, responsive email templates for:

- 📧 **OTP Verification** - Professional verification emails with 6-digit codes
- 🎉 **Welcome Email** - Sent after successful email verification
- 🔐 **Password Reset** - Secure password reset with expiring tokens
- 📨 **General Notifications** - Customizable notification emails

## 🔧 Usage Examples

### Frontend Registration Flow

```javascript
// 1. Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user'
  })
});

// 2. Verify email with OTP
const verifyResponse = await fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: '123456'
  })
});

// 3. Resend OTP if needed
const resendResponse = await fetch('/api/auth/resend-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com'
  })
});
```

### Password Reset Flow

```javascript
// 1. Request password reset
const forgotResponse = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com'
  })
});

// 2. Reset password with token (from email link)
const resetResponse = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'reset_token_from_email',
    password: 'newpassword123'
  })
});
```

## 🛡️ Security Features

- ✅ **OTP Expiration** - Codes expire after 10 minutes
- ✅ **Reset Token Expiration** - Password reset links expire after 1 hour
- ✅ **Rate Limiting Ready** - Built to work with rate limiting middleware
- ✅ **Secure Tokens** - Cryptographically secure random tokens
- ✅ **Email Validation** - Server-side email format validation

## 🎯 Free Tier Limits

| Provider | Free Limit | Best For |
|----------|------------|----------|
| **Resend** | 3,000/month, 100/day | New projects, great deliverability |
| **SendGrid** | 100/day (3,000/month) | Established projects |
| **Mailgun** | 5,000/month (3 months) then 1,000/month | High volume initially |
| **Brevo** | 300/day (no monthly limit) | Consistent daily sending |

## 🔍 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check API key is correct
   - Verify environment variables are loaded
   - Check server logs for error details

2. **Emails going to spam**
   - Set up SPF/DKIM records (provider-specific)
   - Use a verified domain for FROM_EMAIL
   - Avoid spam trigger words in templates

3. **Development vs Production**
   - Use different API keys for dev/prod
   - Set correct NEXT_PUBLIC_APP_URL for each environment
   - Consider using a test email service in development

### Email Provider Setup Links

- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [SendGrid Domain Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [Mailgun Domain Setup](https://help.mailgun.com/hc/en-us/articles/203637190-How-Do-I-Add-or-Delete-a-Domain-)

## 🚀 Next Steps

1. **Set up domain authentication** for better deliverability
2. **Add rate limiting** to prevent abuse
3. **Implement email preferences** for users
4. **Add unsubscribe functionality** for notifications
5. **Set up email analytics** and tracking

## 💡 Tips for Production

- Use environment-specific API keys
- Set up proper DNS records (SPF, DKIM, DMARC)
- Monitor email delivery rates
- Implement proper error handling and retry logic
- Consider using email templates from your provider's dashboard
- Set up alerts for email delivery failures

---

**Need help?** Check the logs in your email provider's dashboard for delivery details and error messages.
