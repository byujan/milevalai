# Quick Start: Deploy to Vercel

## Fastest Way to Deploy (5 minutes)

### 1. Push to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your `milevalai` repository
5. Add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://johoielxyulapyxmipgc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jIXG7tuFfblaSjisklh-DQ_vNFRmUZL
   ```
6. Click "Deploy"

### 3. Update Supabase
1. Go to your Supabase dashboard
2. Settings → Authentication → URL Configuration
3. Add your Vercel URL to redirect URLs:
   ```
   https://your-project.vercel.app/auth/callback
   ```

### Done! 🎉

Your app should be live at `https://your-project.vercel.app`

---

## Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

**Build fails?**
- Check environment variables are set
- Run `npm run build` locally first

**Auth not working?**
- Update Supabase redirect URLs
- Check environment variables match

**Need help?**
- See `VERCEL_DEPLOYMENT.md` for detailed guide
- Check Vercel build logs
