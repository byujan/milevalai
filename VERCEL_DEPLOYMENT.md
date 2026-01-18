# Vercel Deployment Guide for MilEvalAI

This guide will help you deploy your MilEvalAI application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Supabase project already set up

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository:
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Find and select the `milevalai` repository
   - Click "Import"

4. Configure your project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. Add Environment Variables:
   Click "Environment Variables" and add the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://johoielxyulapyxmipgc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jIXG7tuFfblaSjisklh-DQ_vNFRmUZL
   ```

   **Important**: Make sure to add these to all environments (Production, Preview, Development)

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project root:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **milevalai**
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

5. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # Paste: https://johoielxyulapyxmipgc.supabase.co

   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Paste: sb_publishable_jIXG7tuFfblaSjisklh-DQ_vNFRmUZL
   ```

6. Deploy to production:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Supabase for Vercel

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URLs to the allowed list:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs:
     - `https://your-project.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

## Step 4: Verify Deployment

1. Visit your Vercel deployment URL (e.g., `https://milevalai.vercel.app`)
2. Test the authentication flow:
   - Try signing up
   - Try signing in
   - Check if redirects work properly
3. Test the evaluation workflow:
   - Create a new evaluation
   - Navigate through the steps
   - Verify breadcrumb navigation works

## Environment Variables Reference

Your project requires these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGc...` |

## Troubleshooting

### Build Fails

If your build fails on Vercel:

1. Check the build logs in Vercel dashboard
2. Make sure all environment variables are set
3. Try running `npm run build` locally to reproduce the error
4. Clear the build cache in Vercel: Settings → General → Clear Build Cache & Deploy

### Authentication Issues

If authentication doesn't work:

1. Verify environment variables are set correctly in Vercel
2. Check Supabase redirect URLs are configured correctly
3. Make sure the Supabase URL and key match your project

### Middleware Issues

If you see middleware errors:

1. Ensure `middleware.ts` is in the root directory
2. Check that Supabase SSR package is installed
3. Verify the middleware configuration matches your auth flow

## Custom Domain (Optional)

To add a custom domain:

1. Go to your Vercel project
2. Click "Settings" → "Domains"
3. Add your domain and follow DNS configuration instructions
4. Update Supabase redirect URLs to include your custom domain

## Automatic Deployments

Vercel automatically deploys when you push to your repository:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## Monitoring and Logs

Access logs and monitoring:

1. Go to your Vercel project dashboard
2. Click "Deployments" to see deployment history
3. Click "Runtime Logs" to see application logs
4. Click "Analytics" to see usage metrics

## Cost Optimization

Free tier includes:
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Edge Functions

For production with higher traffic, consider upgrading to Pro or Enterprise.

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
