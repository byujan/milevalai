# MilEvalAI Local Setup Guide for Non-Technical Users

This guide will help you run MilEvalAI on your laptop, step by step. No technical experience required!

## What You'll Need

- A Mac, Windows, or Linux computer
- About 30 minutes
- Internet connection (for initial setup)
- 10GB of free disk space

---

## Step 1: Install Required Software

### A. Install Git (for downloading the code)

**Mac:**
1. Open **Terminal** (search for "Terminal" in Spotlight)
2. Type this and press Enter:
   ```bash
   git --version
   ```
3. If you see a version number, Git is already installed! Skip to Step B.
4. If not, it will prompt you to install it. Click "Install" and follow the prompts.

**Windows:**
1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Click "Next" through all screens (default settings are fine)
4. Click "Finish"

**Linux:**
```bash
sudo apt-get install git
```

---

### B. Install Node.js (JavaScript runtime)

**Mac & Windows:**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (left button, says "Recommended for most users")
3. Run the installer
4. Click "Next" through all screens
5. Click "Install" when prompted

**To verify it worked:**
- Open Terminal (Mac) or Command Prompt (Windows)
- Type: `node --version`
- You should see something like `v20.x.x`

---

### C. Install Ollama (AI engine)

**Mac:**
1. Go to: https://ollama.ai/download
2. Click "Download for Mac"
3. Open the downloaded file
4. Drag Ollama to your Applications folder
5. Open Ollama from Applications

**Windows:**
1. Go to: https://ollama.ai/download
2. Click "Download for Windows"
3. Run the installer
4. Follow the installation prompts

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

**Verify Ollama is running:**
- You should see an Ollama icon in your menu bar (Mac) or system tray (Windows)
- If not, open Ollama from your Applications/Programs

---

## Step 2: Download the AI Model

The app uses a language model called "llama3.2". Let's download it:

1. **Open Terminal** (Mac) or **Command Prompt** (Windows)
   - Mac: Search for "Terminal" in Spotlight
   - Windows: Search for "cmd" in the Start menu

2. **Type this command and press Enter:**
   ```bash
   ollama pull llama3.2
   ```

3. **Wait for the download**
   - This downloads about 2-4GB
   - May take 5-15 minutes depending on your internet speed
   - You'll see a progress bar

4. **When it says "success"**, the model is ready!

---

## Step 3: Get the Code from GitHub

1. **Find the GitHub repository URL**
   - Ask your cofounder for the GitHub link
   - It looks like: `https://github.com/byujan/milevalai`

2. **Open Terminal** (Mac) or **Command Prompt** (Windows)

3. **Navigate to where you want to put the code**
   ```bash
   # Example: Put it on your Desktop
   cd Desktop
   ```

4. **Download (clone) the code:**
   ```bash
   git clone https://github.com/byujan/milevalai
   ```

5. **Go into the folder:**
   ```bash
   cd milevalai
   ```

---

## Step 4: Set Up Environment Variables

The app needs some secret keys to work (for the database). Your cofounder needs to give you these.

1. **Create a file called `.env.local`:**

   **Mac/Linux:**
   ```bash
   touch .env.local
   open .env.local
   ```

   **Windows:**
   ```bash
   notepad .env.local
   ```

2. **Paste this into the file** (ask your cofounder for the actual values):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://johoielxyulapyxmipgc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaG9pZWx4eXVsYXB5eG1pcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjIyNjksImV4cCI6MjA4NDEzODI2OX0.gmHHD_Gdw4gOLqR9-8WBakz22jX4yUGgYZ4vrXQeFUA
   ```

3. **Save and close the file**

**Important:** Your cofounder can find these values in:
- Supabase Dashboard → Project Settings → API
- Or they can send you their `.env.local` file contents

---

## Step 5: Install App Dependencies

The app uses lots of code libraries. Let's install them:

1. **Make sure you're in the `milevalai` folder:**
   ```bash
   pwd
   ```
   Should show something ending in `/milevalai`

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Wait for it to finish**
   - Takes 2-5 minutes
   - You'll see lots of text scrolling by
   - When you see a command prompt again, it's done!

---

## Step 6: Start Ollama Server

The AI needs to be running before we start the app:

1. **Open a NEW Terminal/Command Prompt window**
   - Keep your original window open
   - We need two windows running at the same time

2. **In the new window, type:**
   ```bash
   ollama serve
   ```

3. **Keep this window open!**
   - You should see: "Ollama is running"
   - Don't close this window while using the app
   - This is the AI server running in the background

---

## Step 7: Start the App

Now let's start the actual app!

1. **Go back to your FIRST Terminal window** (the one in the `milevalai` folder)

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Wait for it to start**
   - You'll see text scrolling
   - When you see "Ready in X seconds" or "Local: http://localhost:3000", it's ready!

---

## Step 8: Open the App in Your Browser

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to:**
   ```
   http://localhost:3000
   ```

3. **You should see the MilEvalAI login page!** 🎉

---

## Using the App

### First Time Setup

1. **Create an account:**
   - Click "Sign Up"
   - Enter your email and password
   - Click "Sign Up"

2. **You're in!** You can now:
   - Create evaluations
   - Upload predecessor evals
   - Generate AI-powered bullets
   - Complete full NCOERs and OERs

### Daily Use

Every time you want to use the app:

1. **Start Ollama** (if not running):
   ```bash
   ollama serve
   ```
   Keep this window open.

2. **Start the app** (in a new window):
   ```bash
   cd Desktop/milevalai  # or wherever you put it
   npm run dev
   ```
   Keep this window open too.

3. **Open browser** and go to `http://localhost:3000`

4. **When you're done:**
   - Close the browser
   - Press `Ctrl+C` in both Terminal windows to stop the servers
   - Close the Terminal windows

---

## Troubleshooting

### "Port 3000 is already in use"

**Problem:** Something else is using port 3000.

**Solution:**
1. Stop anything else using that port
2. Or use a different port:
   ```bash
   npm run dev -- -p 3001
   ```
   Then visit `http://localhost:3001`

---

### "Cannot connect to Ollama"

**Problem:** Ollama server isn't running.

**Solution:**
1. Open a new Terminal window
2. Run: `ollama serve`
3. Keep it open
4. Refresh your browser

---

### "Module not found" errors

**Problem:** Dependencies didn't install correctly.

**Solution:**
1. Delete the `node_modules` folder:
   ```bash
   rm -rf node_modules
   ```
2. Delete `package-lock.json`:
   ```bash
   rm package-lock.json
   ```
3. Reinstall:
   ```bash
   npm install
   ```

---

### "Database connection failed"

**Problem:** Your `.env.local` file has wrong credentials.

**Solution:**
1. Check with your cofounder for the correct values
2. Make sure the file is named exactly `.env.local` (note the dot at the start)
3. Restart the app after fixing

---

### AI is really slow

**Problem:** Your computer is processing the AI model slowly.

**Solutions:**
1. **Close other apps** to free up memory
2. **Use a smaller model:**
   ```bash
   ollama pull llama3.2:1b
   ```
   Then update `lib/ai/ollama.ts` line 32 to:
   ```typescript
   const MODEL = 'llama3.2:1b';
   ```
3. **Be patient** - first generation is slower, subsequent ones are faster

---

## Updating the App

When your cofounder makes changes:

1. **Stop the app** (Ctrl+C in Terminal)

2. **Pull the latest code:**
   ```bash
   git pull
   ```

3. **Install any new dependencies:**
   ```bash
   npm install
   ```

4. **Restart the app:**
   ```bash
   npm run dev
   ```

---

## Quick Reference

### Must Be Running (2 Terminal Windows)

**Window 1: Ollama**
```bash
ollama serve
```

**Window 2: The App**
```bash
cd Desktop/milevalai
npm run dev
```

### Then Open Browser
```
http://localhost:3000
```

---

## Getting Help

If something isn't working:

1. **Check this guide again** - did you miss a step?
2. **Look at the error message** - it often tells you what's wrong
3. **Ask your cofounder** - send them a screenshot of the error
4. **Restart everything:**
   - Close all Terminal windows
   - Quit Ollama
   - Start from Step 6 again

---

## What's Happening Under the Hood?

You don't need to know this, but if you're curious:

- **Node.js** runs the JavaScript code
- **Next.js** (npm run dev) is the web framework
- **Ollama** runs the AI model locally on your computer
- **Supabase** is the cloud database (stores evaluations)
- **localhost:3000** means "this website is running on YOUR computer only"

Everything runs on your computer - no one else can access it unless you share your screen!

---

## Tips for Success

✅ **Keep both Terminal windows open** while using the app
✅ **Don't close the browser tab** while AI is processing
✅ **Give Ollama 4-8GB of RAM** (close other apps if needed)
✅ **Be patient** - AI processing takes 30-60 seconds
✅ **Save often** - the app auto-saves, but manual saves don't hurt

---

**You're all set!** 🎉

Now you can test MilEvalAI locally and help improve it before it goes to real users.

**Questions?** Ask your cofounder or check the troubleshooting section above.
