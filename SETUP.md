# Setup Guide for MilEvalAI

This guide will help you set up MilEvalAI locally and configure Supabase for the backend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier available)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: MilEvalAI (or whatever you prefer)
   - Database Password: Choose a strong password
   - Region: Select the closest region to you

Wait for the project to be created (takes about 2 minutes).

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the "Settings" icon in the left sidebar
2. Click on "API" in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## Step 4: Configure Environment Variables

1. In the project root, you'll find `.env.local` file
2. Update it with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 5: Set Up the Database

1. In your Supabase dashboard, click on the "SQL Editor" icon in the left sidebar
2. Click "New Query"
3. Open the `supabase/schema.sql` file in this project
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press Cmd/Ctrl + Enter

You should see a success message. This creates:
- The `evaluations` table
- All necessary indexes
- Row Level Security (RLS) policies
- Automatic triggers for timestamps

## Step 6: Enable Email Authentication (Optional)

By default, Supabase requires email confirmation. For development, you might want to disable this:

1. Go to "Authentication" in your Supabase dashboard
2. Click "Providers" tab
3. Find "Email" and click to configure
4. Disable "Confirm email" for easier testing
5. Save changes

**Note**: For production, keep email confirmation enabled!

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. Click "Get Started" on the landing page
2. Sign up with an email and password
3. Check your email for confirmation (if enabled) or you'll be automatically signed in
4. You should be redirected to the dashboard
5. Click "New Evaluation" to start creating an evaluation

## Troubleshooting

### "Invalid API key" error
- Check that your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure there are no extra spaces or quotes in the `.env.local` file
- Restart your development server after changing environment variables

### "User not found" after signing in
- Make sure you've run the database schema SQL
- Check that Row Level Security policies were created correctly
- In Supabase dashboard, go to Table Editor > evaluations and verify the table exists

### "Cannot read properties of undefined" errors
- Make sure you've run `npm install` and all dependencies are installed
- Clear your `.next` folder: `rm -rf .next` and rebuild
- Check the browser console for more detailed error messages

### Database table doesn't exist
- Run the SQL in `supabase/schema.sql` again in the Supabase SQL Editor
- Check for any error messages in the SQL Editor output
- Verify your database password is correct

## Verifying Your Setup

To verify everything is working:

1. Sign up for a new account
2. Create a new evaluation
3. Check in Supabase:
   - Go to "Authentication" > "Users" - you should see your user
   - Go to "Table Editor" > "evaluations" - you should see your evaluation

## Next Steps

- Read the main README.md for more information
- Explore the code structure
- Start customizing the application
- Deploy to Vercel (see README.md for deployment instructions)

## Getting Help

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Check the browser console for errors
3. Check the terminal where `npm run dev` is running for server errors
4. Review the Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)

## Development Tips

- Use Supabase's Table Editor to view and manually edit data during development
- Use the SQL Editor to run queries and test your database structure
- Check the Supabase Logs section to debug authentication issues
- Use Chrome DevTools Application tab to inspect cookies and local storage

---

**Made for Soldiers by Soldiers** 🪖

