# Vercel Deployment Guide

## Changes Made to Fix Middleware Error

The middleware has been updated to be compatible with Vercel's Edge Runtime:

1. **Better error handling** - Middleware now gracefully handles errors
2. **Environment variable checks** - Validates env vars before creating Supabase client
3. **Updated cookie handling** - Uses `getAll()` and `setAll()` methods (latest @supabase/ssr)
4. **Updated matcher** - Excludes API routes to prevent unnecessary middleware runs

## Deployment Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Fix middleware for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure your project

### 3. Set Environment Variables

**CRITICAL**: In your Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to add them:**
1. In Vercel, go to your project
2. Click "Settings" → "Environment Variables"
3. Add both variables
4. Make sure to add them for **Production**, **Preview**, and **Development**
5. Click "Save"

### 4. Redeploy

After adding environment variables:
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Common Issues & Solutions

### Issue: 500 MIDDLEWARE_INVOCATION_FAILED

**Cause**: Environment variables not set in Vercel

**Solution**:
1. Go to Vercel project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

### Issue: "Missing Supabase environment variables" in logs

**Cause**: Environment variables not configured

**Solution**: See above - add environment variables in Vercel dashboard

### Issue: Authentication not working on Vercel

**Cause**: Supabase redirect URLs not configured

**Solution**:
1. Go to your Supabase project
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to "Site URL"
4. Add these to "Redirect URLs":
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**` (wildcard)

### Issue: Database errors / RLS policy errors

**Cause**: Database schema not set up

**Solution**:
1. Go to Supabase SQL Editor
2. Run the SQL from `supabase/schema.sql`
3. Verify the `evaluations` table exists in Table Editor

## Verifying Deployment

After deployment, test these:

1. **Landing page loads**: `https://your-app.vercel.app`
2. **Sign up works**: Create a new account
3. **Sign in works**: Log in with your account
4. **Dashboard loads**: Should redirect after login
5. **Create evaluation**: Test the full flow

## Checking Logs

If something goes wrong:

1. In Vercel, go to your deployment
2. Click "Functions" tab
3. Click on any function to see logs
4. Look for error messages

## Performance on Vercel

Expected performance:
- **Cold start**: ~500ms (Edge Runtime)
- **Warm requests**: ~50-100ms
- **First Load JS**: ~87-152 KB
- **Lighthouse Score**: 90+

## Debugging Tips

### Check Vercel Logs
```bash
vercel logs your-deployment-url
```

### Check Build Logs
In Vercel dashboard → Deployments → Click deployment → "Building" section

### Test Locally First
```bash
# Build production version locally
npm run build
npm start

# Or use Vercel CLI
npm i -g vercel
vercel dev
```

## Environment Variables Checklist

Make sure these are set in Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Applied to all environments (Production, Preview, Development)
- [ ] Redeployed after adding variables

## Supabase Configuration Checklist

- [ ] Database schema created (`supabase/schema.sql` executed)
- [ ] Site URL set to your Vercel URL
- [ ] Redirect URLs include `/auth/callback`
- [ ] Email confirmation enabled/disabled as desired
- [ ] RLS policies active on `evaluations` table

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update Supabase Site URL to your custom domain
5. Update Supabase Redirect URLs

## Rollback

If deployment fails:

1. Go to Deployments tab
2. Find a working deployment
3. Click three dots → "Promote to Production"

## Support

If you still have issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Supabase Documentation](https://supabase.com/docs)
- Review Vercel deployment logs
- Review Supabase logs

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Project imported in Vercel
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Landing page loads
- [ ] Authentication works
- [ ] Database operations work

**You're deployed! 🚀**

