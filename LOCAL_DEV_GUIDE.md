# Local Development Quick Guide

### Starting Local Server
Run the following command to start your development server:
```bash
npm run dev
```

### Testing Registration
1. Navigate to `http://localhost:3000/register`
2. Fill out the registration form using your email address (`ahsan.habib1@g.bracu.ac.bd`)
3. Verify the OTP sent to your inbox
4. Check for a welcome email upon successful verification

### Point of Caution
- **Domain Verification**: In the free tier, emails must be sent to verified domains or the pre-approved email address.
- **Production**: Verify your domain at Resend to use your custom domain for sending emails.

### Environment Variables
Ensure your `.env.local` file is set up with the following keys:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/safetails

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Email Service (Resend)
RESEND_API_KEY=re_Yva5xHpu_J6i3gTZawag1bCB5KnGrkmYG
FROM_EMAIL=SafeTails <onboarding@resend.dev>

# For development - emails sent to registered testing email
DEV_EMAIL_RECIPIENT=ahsan.habib1@g.bracu.ac.bd

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Ensuring Correct Setup
- Update your `JWT_SECRET` to a secure value before deploying
- Monitor your inbox for verification and welcome emails
- If issues arise, check the server logs for error messages

---
#### Have fun using SafeTails! 🚀

