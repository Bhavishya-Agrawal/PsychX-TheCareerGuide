

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  CONSULTANT = 'CONSULTANT'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM'
}

export enum CareerCategory {
  TECHNICAL = 'Technical',
  SPORTS = 'Sports',
  CREATIVE = 'Creative',
  HEALTHCARE = 'Healthcare',
  BUSINESS = 'Business',
  SERVICES = 'Services'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  tier?: SubscriptionTier; // Optional: Consultants/Admins won't have this
  currentClass: string; 
}

export interface Question {
  id: number;
  text: string;
  type: 'scale' | 'multiple_choice' | 'text';
  options?: string[];
  category: string; // psychological, technical, situational
}

export interface Answer {
  questionId: number;
  questionText: string;
  answer: string;
}

export interface AssessmentProfile {
  categories: CareerCategory[]; // Changed to array for multiple selection
  answers: Answer[];
  locationCurrent: string;
  willingnessToTravel: string; // "Local", "State", "National", "International"
  yearlyBudgetINR: number;
  yearsToInvest: number;
  studentClass: string; // Added for context
}

export interface CareerRecommendation {
  careerTitle: string;
  description: string;
  reasonWhyChosen: string; // The "why" logic
  aptitudeScore: number; // 0-100
  learningCurve: string; // Tiny report on what the learning path looks like
  realityCheck: {
    isRealistic: boolean;
    feasibilityRating: 'High' | 'Medium' | 'Low';
    verdict: string;
    financialGap: string;
    locationVerdict: string;
  };
  immediateNextStep: string;
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  milestones: string[];
  resources: string[];
  locationAdvice: string; // Added for Tier 2 roadmap details
}

export interface RoadmapEntry {
  id: string;
  userId: string;
  careerTitle: string;
  date: string;
  steps: RoadmapStep[];
}

export interface WeeklyTask {
  id: string;
  text: string;
  isCompleted: boolean;
  category: 'Learning' | 'Practice' | 'Networking';
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number; // 0-3
}

export interface WeeklyQuiz {
  questions: QuizQuestion[];
  userAnswers?: number[]; // Indices
  score?: number;
  passed?: boolean; // > 60% score
}

export interface WeeklyPlan {
  weekNumber: number;
  title: string; // e.g., "Week 1: Python Basics"
  tasks: WeeklyTask[];
  status: 'active' | 'completed' | 'pending';
  completionRate: number; // 0-100
  aiFeedback?: string; // Feedback generated after week completion
  quiz?: WeeklyQuiz; // New: Quick assessment verification
}

export interface ProgressTracker {
  id: string;
  userId: string;
  roadmapId: string; // Links to a specific RoadmapEntry
  careerTitle: string;
  currentPhaseIndex: number; // Which phase of the roadmap are we in?
  totalWeeksCompleted: number;
  overallProgressScore: number; // Calculated score based on consistency
  history: WeeklyPlan[]; // Past weeks
  currentWeek: WeeklyPlan; // Active week
}

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  consultantId: string;
  consultantName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24hr format)
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  meetingLink?: string;
}

export interface ConsultantAvailability {
  consultantId: string;
  days: string[]; // ["Monday", "Tuesday", ...]
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Billing' | 'Technical';
  status: 'pending' | 'answered';
}

export interface AssessmentResult {
  id: string;
  userId: string;
  date: string;
  recommendations: CareerRecommendation[];
}