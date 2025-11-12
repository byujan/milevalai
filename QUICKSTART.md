# Quick Start Guide

Get MilEvalAI running in 5 minutes!

## 🚀 Fast Setup

### 1. Install Dependencies (30 seconds)
```bash
npm install
```

### 2. Create Supabase Project (2 minutes)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for project creation

### 3. Get Your Keys (30 seconds)
In your Supabase dashboard:
1. Click Settings (gear icon) → API
2. Copy the **Project URL** and **anon public** key

### 4. Configure Environment (30 seconds)
Edit `.env.local` with your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Set Up Database (1 minute)
1. In Supabase, go to SQL Editor
2. Create new query
3. Copy & paste everything from `supabase/schema.sql`
4. Click Run (or Cmd+Enter)

### 6. Run the App! (10 seconds)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 First Test

1. Click **"Get Started"**
2. Sign up with any email/password
3. Create your first evaluation
4. Play around with the interface!

## 🐛 Common Issues

**"Invalid API key"**
- Check your `.env.local` for typos
- Restart dev server: Kill it (Ctrl+C) and run `npm run dev` again

**"Table doesn't exist"**
- Run the SQL from step 5 again
- Check for errors in SQL Editor

**"User not found"**
- Database schema might not be set up
- Check Supabase Table Editor → evaluations table exists

## 📚 Next Steps

- Read [README.md](./README.md) for full documentation
- Read [SETUP.md](./SETUP.md) for detailed setup guide
- Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for technical details

## 💡 Pro Tips

- **Disable email confirmation** in Supabase (Auth → Settings → Email) for faster testing
- Use **Supabase Table Editor** to view your data
- Check **browser console** (F12) for errors
- Check **terminal** for server errors

## 🎨 What You Get

- ✅ Modern dark UI
- ✅ Complete auth flow
- ✅ Dashboard
- ✅ Evaluation creation wizard
- ✅ Bullet generation interface
- ✅ Narrative editor
- ✅ Review & validation
- ✅ Export to EES/PDF/DOCX

## 🔥 Ready for Development

The app is **production-ready** in terms of architecture but needs AI integration for full functionality:

- Bullet generation → TODO: Add AI API
- Narrative generation → TODO: Add AI API
- PDF export → TODO: Add PDF library
- DOCX export → TODO: Add DOCX library

## 📞 Need Help?

1. Check the error message
2. Read the detailed [SETUP.md](./SETUP.md)
3. Check Supabase logs (in dashboard)
4. Check browser console (F12)

---

**That's it! You're ready to start developing! 🎖️**

