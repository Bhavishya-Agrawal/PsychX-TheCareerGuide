# Vercel Deployment Setup

## Important: Environment Variable Required

Your app **requires the Gemini API key** to work. You must add it as an environment variable in Vercel.

## Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key (starts with `AIza...`)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

## Step 2: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Select **Redeploy**
4. Check "Use existing Build Cache" is **OFF** (unchecked)
5. Click **Redeploy**

## Build Settings (Auto-detected)

Vercel should automatically detect these settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## For Other Users Cloning the Repo

Anyone who clones this repository needs to:

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add their API key:
   ```
   VITE_GEMINI_API_KEY=their_actual_api_key_here
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## What Was Fixed

The blank screen issue was caused by:
1. ❌ Import map in `index.html` that conflicted with Vite's bundler
2. ❌ Using `process.env.API_KEY` which doesn't work in the browser
3. ❌ Missing React TypeScript type definitions

All issues have been resolved! ✅
