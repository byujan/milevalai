# Supabase Setup Guide for MilEvalAI

This guide will walk you through setting up your Supabase project with all necessary database tables, authentication, and security policies.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Supabase project created
- The following environment variables configured in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 1: Configure Authentication

### Enable Email/Password Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Email** provider and ensure it's **enabled**
4. Configure the following settings:
   - **Enable email confirmations**: Turn this ON (recommended for production)
   - **Enable email change confirmations**: Turn this ON
   - **Secure email change**: Turn this ON

### Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates if desired:
   - **Confirm signup**: Sent when users register
   - **Magic Link**: For passwordless login (if you want to add this later)
   - **Change Email Address**: Sent when users change their email
   - **Reset Password**: Sent when users request password reset

### Configure Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

## Step 2: Set Up Database Tables

### Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `docs/supabase-setup.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This will create:
- **evaluations** table: Stores all evaluation data
- **bullet_library** table: Stores reusable bullet points
- **rater_tendencies** table: Stores rater profile information
- All necessary indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### Verify Tables Were Created

1. Navigate to **Table Editor** in your Supabase Dashboard
2. You should see three new tables:
   - `evaluations`
   - `bullet_library`
   - `rater_tendencies`

## Step 3: Verify Row Level Security

### Check RLS is Enabled

1. Go to **Authentication** → **Policies**
2. You should see policies for all three tables:
   - Each table should have 4 policies: SELECT, INSERT, UPDATE, DELETE
   - All policies should enforce that `auth.uid() = user_id`

### Test RLS Policies

The policies ensure that:
- Users can only view their own data
- Users can only create data associated with their own user_id
- Users can only update their own data
- Users can only delete their own data

## Step 4: Test Authentication Flow

### Create a Test User

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signup`
3. Create a test account with an email and password
4. Check your email for the confirmation link (if email confirmations are enabled)
5. Click the confirmation link
6. Navigate to `http://localhost:3000/auth/signin`
7. Sign in with your test credentials

### Verify Session Management

1. After signing in, you should be redirected to `/dashboard`
2. Open browser DevTools → Application → Cookies
3. You should see Supabase session cookies:
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token-code-verifier`

## Step 5: Test Database Access

### Verify User Can Create Data

Try creating an evaluation through your app. The data should be:
1. Successfully inserted into the `evaluations` table
2. Associated with your user's `user_id`
3. Only visible to you (not other users)

### Test with Supabase SQL Editor

You can also test directly in SQL Editor:

```sql
-- This should return only evaluations for the currently authenticated user
SELECT * FROM evaluations;

-- This should fail (no access to other users' data)
SELECT * FROM evaluations WHERE user_id != auth.uid();
```

## Step 6: Production Configuration

When deploying to production:

### Update Environment Variables

1. Add your production Supabase credentials to your hosting platform
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` points to your project
3. Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly

### Update Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain
3. Add production callback URL to **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`

### Configure Email Settings (Production)

1. Go to **Project Settings** → **Auth**
2. Configure **SMTP Settings** with your email provider:
   - Use a custom SMTP server (e.g., SendGrid, AWS SES, Postmark)
   - This ensures reliable email delivery for production

### Enable Additional Security Features

Consider enabling:
1. **Rate limiting**: Protect against brute force attacks
2. **CAPTCHA**: Add bot protection (reCAPTCHA or hCaptcha)
3. **Multi-factor authentication (MFA)**: For enhanced security
4. **Session limits**: Control how long users stay logged in

## Troubleshooting

### "Invalid JWT" Errors

- Ensure your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check that environment variables are loaded (restart dev server)
- Verify the anon key hasn't been revoked in Supabase Dashboard

### "Row Level Security Policy Violation" Errors

- Ensure user is authenticated before making database queries
- Verify `user_id` in INSERT operations matches `auth.uid()`
- Check that RLS policies were created correctly

### Email Confirmations Not Sending

- Check **Authentication** → **Settings** → Email confirmations are enabled
- For development, check Supabase Dashboard → **Authentication** → **Users** → Click user → Confirm email manually
- For production, configure SMTP settings

### Users Can't Sign In After Signup

- If email confirmations are enabled, users must confirm their email first
- Check spam folder for confirmation emails
- For testing, you can disable email confirmations temporarily

## Database Schema Reference

### evaluations Table

Stores military evaluation data including administrative info, bullets, narratives, and form data.

**Key columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `evaluation_type`: 'NCOER' or 'OER'
- `status`: Workflow status (draft → completed)
- `form_data`: Complete evaluation form as JSONB

### bullet_library Table

Stores reusable bullet points categorized by the six Army leadership attributes.

**Key columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `category`: Character, Presence, Intellect, Leads, Develops, or Achieves
- `content`: The bullet text
- `usage_count`: Tracks how often the bullet is reused

### rater_tendencies Table

Tracks rating patterns and preferences for different raters to help users match their style.

**Key columns:**
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `rater_name`: Name of the rater
- `mq_count`, `hq_count`, `qualified_count`, `nq_count`: Rating distribution
- `tone_profile`: JSONB storing writing style patterns

## Next Steps

- Consider setting up [Supabase Storage](https://supabase.com/docs/guides/storage) for file uploads (predecessor evaluations)
- Review [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) for advanced auth patterns
- Set up [Database Backups](https://supabase.com/docs/guides/platform/backups) for production
- Configure [Realtime](https://supabase.com/docs/guides/realtime) if you need live updates

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
