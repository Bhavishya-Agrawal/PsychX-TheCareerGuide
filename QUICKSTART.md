# 🚀 Quick Start Guide - PathFinder AI

This guide will get you up and running in 5 minutes!

## Step 1: Get Your API Key (2 minutes)

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## Step 2: Setup Project (2 minutes)

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env
```

Now open `.env` and paste your API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Step 3: Run the App (1 minute)

```bash
npm run dev
```

Open your browser to: http://localhost:3000/

## 🎉 You're Ready!

### Try These Demo Flows:

#### 1. **Student Journey** (Recommended First)
- Click "Sign Up"
- Enter any details (use your real class level)
- Click "Log In" instead
- Select role: "Student (User)"
- Click "Access Portal"
- Navigate to "Career Assessment" in sidebar
- Complete the assessment (be honest!)
- View your AI-generated career recommendations
- Generate a detailed roadmap (requires Standard tier - upgrade on Subscription page)

#### 2. **Admin View**
- Log out (top-right)
- Log in with email: `admin@pathfinder.ai`
- Select role: "Administrator"
- Explore:
  - Analytics Dashboard
  - User Management (try upgrading a user's tier)
  - Content & FAQ Management
  - Session Management

#### 3. **Consultant View**
- Log out
- Log in with email: `amit@expert.com`
- Select role: "Consultant"
- Set your availability
- View scheduled sessions

## 💡 Pro Tips

1. **Testing Progress Tracker**: 
   - Create a Standard account
   - Complete an assessment
   - Generate a roadmap
   - Go to "Progress Tracker"
   - Initialize tracking and mark tasks as complete
   - Take the weekly quiz!

2. **Booking Sessions**:
   - Upgrade to Premium tier
   - Go to "Consultation Room"
   - Book a session (make sure it's within consultant availability)

3. **Data Persistence**:
   - All data is saved in browser LocalStorage
   - Survives page refreshes
   - Lost when cache is cleared

## 🆘 Need Help?

- Check `DOCUMENTATION.md` for detailed information
- Review `README.md` for architecture details
- Check browser console for any errors
- Ensure your API key is valid

## 📝 Quick Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Happy Testing! 🎯**
