# PathFinder AI - Project Documentation

## 🎯 Project Overview

PathFinder AI is an intelligent career counseling platform that leverages Google Gemini AI to provide personalized career guidance to students. Unlike traditional aptitude tests, it acts as a "Brutally Honest" AI Accountability Coach that doesn't just suggest careers - it builds roadmaps, breaks them into weekly tasks, tracks execution, and verifies learning through AI-generated quizzes.

## ✨ Key Features

### For Students (User Role)
- **AI-Powered Career Assessment** - Multi-batch psychometric questionnaire that adapts based on previous answers
- **Reality Check Analysis** - Honest feasibility ratings based on budget, location, and lifestyle preferences
- **Detailed Roadmaps** - Phase-by-phase career paths with milestones, resources, and location advice
- **Smart Progress Tracker** - Weekly task planner with AI-generated quizzes to verify learning
- **Consultation Booking** - Schedule 1-on-1 sessions with career experts
- **Tiered Subscription Plans** - Free, Standard, and Premium tiers with increasing features

### For Consultants
- **Availability Management** - Set working days and hours
- **Session Dashboard** - View upcoming consultations
- **Time-based Room Access** - Join video sessions 10 minutes before scheduled time

### For Admins
- **User Management** - View and manage student accounts and subscription tiers
- **Consultant Management** - Oversee career counselors and their availability
- **Session Management** - Create, edit, and monitor consultation sessions
- **Analytics Dashboard** - Track user growth and revenue metrics
- **Content Management** - Manage FAQs and answer pending student questions

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **AI Service**: Google Gemini API (@google/genai)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks + LocalStorage
- **Type Safety**: Full TypeScript implementation

## 📦 Installation & Setup

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager
- Google Gemini API key

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pathfinder-ai---career-counseling
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Google Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```
   - Get your API key from: https://aistudio.google.com/app/apikey

4. **Start development server**
   ```bash
   npm run dev
   ```
   - App will be available at: http://localhost:3000/

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## 🏗️ Project Structure

```
pathfinder-ai---career-counseling/
├── components/
│   ├── Layout.tsx          # Navbar & Sidebar components
│   └── UI.tsx              # Reusable UI components (Button, Card, Modal, etc.)
├── pages/
│   ├── Auth.tsx            # Login/Signup page with demo role selector
│   ├── UserPortal.tsx      # Student dashboard (main product)
│   ├── AdminPortal.tsx     # Admin panel
│   └── ConsultantPortal.tsx # Consultant workspace
├── services/
│   ├── db.ts               # LocalStorage persistence layer
│   └── geminiService.ts    # Google Gemini AI integration
├── App.tsx                 # Main application component
├── index.tsx               # React root mount point
├── types.ts                # TypeScript type definitions
├── index.html              # HTML entry point
├── index.css               # Global CSS styles
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── .env.example            # Environment variables template
└── README.md               # Project documentation

```

## 🔑 Key Concepts

### Subscription Tiers

| Feature | Free | Standard | Premium |
|---------|------|----------|---------|
| Career Assessments | 3 | 6 | Unlimited |
| Detailed Roadmaps | ❌ | ✅ (6) | ✅ (Unlimited) |
| Progress Tracker | ❌ | ✅ | ✅ |
| 1-on-1 Consultations | ❌ | ❌ | ✅ |
| Price | ₹0 | ₹499/year | ₹1499/year |

### AI Assessment Flow

1. **Category Selection** - Student selects fields of interest (multiple allowed)
2. **Details Input** - Budget, location, travel willingness, study duration
3. **Multi-Batch Questionnaire**
   - Batch 1: Initial 5 questions (broad assessment)
   - Batch 2: Adaptive 5 questions based on Batch 1 answers
   - Batch 3: Final 5 questions for refined analysis
4. **AI Analysis** - Generates 3 career recommendations:
   - The Soulmate Career (best psychological fit)
   - The Strategic Bet (balanced market demand)
   - The Moonshot (high reward, requires effort)
5. **Reality Check** - Honest feasibility rating with financial/location analysis

### Progress Tracker Logic

The Progress Tracker is a premium feature that converts static roadmaps into dynamic weekly plans:

1. **Initialization** - AI generates Week 1 tasks from roadmap Phase 1
2. **Task Execution** - Student marks tasks as completed
3. **Weekly Verification** - AI generates quiz based on completed learning tasks
4. **Adaptive Planning**:
   - **Quiz Failed** (< 60%): Generate remedial week (repeat core topics)
   - **Low Completion** (< 50%): Generate easier week with fewer tasks
   - **Perfect Week** (100% + quiz passed): Generate challenging advanced week
   - **Standard Progress**: Continue with normal roadmap progression
5. **Consistency Scoring** - Overall progress score based on completion rates + quiz performance

## 🔐 Demo Access

The Auth page includes a "Demo Role Selector" for easy testing:

### Demo Credentials
You can log in with any email and select a role:
- **Student**: Select "Student (User)" role
- **Admin**: Select "Administrator" role
- **Consultant**: Select "Consultant" role

**Tip**: Existing demo accounts:
- `rahul@example.com` - Standard tier student
- `priya@example.com` - Free tier student
- `admin@pathfinder.ai` - Admin account
- `amit@expert.com` - Consultant account
- `sarah@expert.com` - Consultant account

## 📊 Data Persistence

All data is stored in browser LocalStorage under these keys:
- `pf_users_table` - User accounts
- `pf_sessions_table` - Consultation sessions
- `pf_availability_table` - Consultant availability
- `pf_faqs_table` - Help articles
- `pf_assessments_table` - Assessment results
- `pf_roadmaps_table` - Generated career roadmaps
- `pf_progress_table` - Progress tracker data

**Note**: Data persists across page refreshes but is cleared if browser cache is cleared.

## 🚀 Deployment

### Recommended Platforms
- **Vercel** (Recommended for React + Vite)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**

### Environment Variables for Production
Ensure `GEMINI_API_KEY` is set in your hosting platform's environment variables.

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## 🐛 Troubleshooting

### Issue: API Key Not Working
- Verify your API key in `.env` file
- Ensure variable name is `GEMINI_API_KEY` (not `API_KEY`)
- Restart dev server after changing `.env`

### Issue: TypeScript Errors
- Run `npm install` to ensure @types/node is installed
- Check `tsconfig.json` has `"types": ["node"]`

### Issue: LocalStorage Data Lost
- Data is cleared when browser cache is cleared
- Export important data before clearing cache
- Future: Implement backend database for production

## 🔮 Future Enhancements

- **Video Integration** - Replace mock "Join Room" with WebRTC/Daily.co
- **Payment Gateway** - Integrate Stripe/Razorpay for subscriptions
- **Email/SMS Notifications** - Alerts for sessions and weekly deadlines
- **Backend Database** - Replace LocalStorage with PostgreSQL/MongoDB
- **Mobile App** - React Native version
- **Multi-language Support** - Hindi, regional languages
- **Career Success Stories** - Alumni testimonials
- **Skill Assessment Tests** - Coding tests, design challenges

## 📄 License

This is a hackathon project. License TBD.

## 👥 Credits

- Built with Google AI Studio
- Uses Google Gemini 2.5 Flash model
- Styled with Tailwind CSS
- Icons by Lucide React

---

**Last Updated**: November 2025  
**Version**: 1.0.0
