# Supabase Setup Checklist

Use this checklist to ensure your Supabase project is fully configured for MilEvalAI.

## ✅ Configuration Checklist

### 1. Authentication Setup

- [ ] Email/Password provider is **enabled** in Authentication → Providers
- [ ] Email confirmations are **configured** (enabled/disabled as desired)
- [ ] Site URL is set to your domain
- [ ] Redirect URLs include `/auth/callback` for all environments
- [ ] Email templates are reviewed (optional)

### 2. Database Setup

- [ ] Run `docs/supabase-setup.sql` in SQL Editor
- [ ] Verify `evaluations` table exists in Table Editor
- [ ] Verify `bullet_library` table exists in Table Editor
- [ ] Verify `rater_tendencies` table exists in Table Editor
- [ ] Check that indexes were created successfully

### 3. Security Configuration

- [ ] Row Level Security (RLS) is **enabled** on all tables
- [ ] RLS policies exist for `evaluations` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- [ ] RLS policies exist for `bullet_library` (4 policies)
- [ ] RLS policies exist for `rater_tendencies` (4 policies)
- [ ] All policies enforce `auth.uid() = user_id`

### 4. Environment Variables

- [ ] `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Environment variables match your Supabase project
- [ ] Development server restarted after updating env vars

### 5. Testing

- [ ] Can create a new user via `/auth/signup`
- [ ] Email confirmation works (or disabled for testing)
- [ ] Can sign in via `/auth/signin`
- [ ] Session cookies are created after sign in
- [ ] Can access `/dashboard` after authentication
- [ ] Can create an evaluation (tests database INSERT)
- [ ] Can view own evaluations (tests RLS SELECT policy)
- [ ] Cannot view other users' data (tests RLS security)

### 6. Production Readiness (When Deploying)

- [ ] Production environment variables configured on hosting platform
- [ ] Production redirect URLs added to Supabase Auth settings
- [ ] SMTP configured for reliable email delivery
- [ ] Rate limiting enabled (recommended)
- [ ] Database backups configured
- [ ] Consider enabling MFA for enhanced security
- [ ] Consider adding CAPTCHA for bot protection

## Quick Start Commands

```bash
# 1. Ensure environment variables are set
cat .env.local

# 2. Install dependencies (if needed)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to: http://localhost:3000
```

## Verification SQL Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('evaluations', 'bullet_library', 'rater_tendencies');

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('evaluations', 'bullet_library', 'rater_tendencies');

-- Check policies exist (should return 12 total: 4 per table)
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('evaluations', 'bullet_library', 'rater_tendencies');
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid JWT" error | Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct and restart dev server |
| Can't sign in after signup | Check email for confirmation link, or disable email confirmations for testing |
| RLS policy violation | Ensure user is authenticated and `user_id` matches `auth.uid()` |
| Tables not created | Re-run `supabase-setup.sql` script in SQL Editor |
| No email received | Check spam folder, or configure SMTP in production |

## Need Help?

- 📖 Full guide: `docs/SUPABASE_SETUP_GUIDE.md`
- 💬 Supabase Discord: https://discord.supabase.com
- 📚 Supabase Docs: https://supabase.com/docs
