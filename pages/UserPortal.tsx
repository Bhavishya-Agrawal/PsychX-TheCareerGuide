import React, { useState, useEffect } from 'react';
import { User, CareerCategory, Question, AssessmentProfile, CareerRecommendation, RoadmapStep, SubscriptionTier, Answer, FAQItem, Session, UserRole, RoadmapEntry, ProgressTracker, WeeklyPlan, WeeklyQuiz } from '../types';
import { Button, Card, Input, Select, Modal } from '../components/UI';
import { generateQuestions, analyzeProfile, generateRoadmap, generateWeeklyPlan, generateWeeklyQuiz } from '../services/geminiService';
import { db } from '../services/db';
import { CheckCircle, AlertTriangle, Lock, MapPin, DollarSign, ArrowRight, Play, Check, Sparkles, TrendingUp, BookOpen, AlertCircle, Info, ChevronDown, ChevronUp, Calendar, Clock, Video, MessageCircle, Send, Book, HelpCircle, Brain, History, Plus, Target, BarChart2, Shield, XCircle, GraduationCap, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface UserPortalProps {
  user: User;
  activeView: string;
  onNavigate: (view: string) => void;
  refreshData: () => void; // Function to trigger app refresh
  upgradeTier?: (tier: SubscriptionTier) => void;
  faqs?: FAQItem[];
  sessions?: Session[];
  onBookSession?: (date: string, time: string) => { success: boolean; message: string; consultantName?: string };
}

// Limits Configuration
const LIMITS = {
  [SubscriptionTier.FREE]: { assessments: 3, roadmaps: 0 },
  [SubscriptionTier.STANDARD]: { assessments: 6, roadmaps: 6 },
  [SubscriptionTier.PREMIUM]: { assessments: 100, roadmaps: 100 }
};

export const UserPortal: React.FC<UserPortalProps> = ({ 
  user, 
  activeView, 
  onNavigate, 
  refreshData,
  upgradeTier,
  faqs: propFaqs,
  sessions: propSessions,
  onBookSession
}) => {
  
  // DB State Fetching
  const [faqs, setFaqs] = useState<FAQItem[]>(propFaqs || []);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Internal state for assessment flow
  const [assessmentStep, setAssessmentStep] = useState(0); // 0: Category, 1: Details, 2: Questions, 3: Result
  
  // Assessment State
  const [selectedCategories, setSelectedCategories] = useState<CareerCategory[]>([]);
  const [assessmentDetails, setAssessmentDetails] = useState({
    budget: '',
    location: '',
    willingness: 'State',
    years: '4'
  });
  
  // Question Batching State
  const BATCH_SIZE = 5;
  const TOTAL_BATCHES = 3;
  const [currentBatch, setCurrentBatch] = useState(1);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]); // Only the 5 currently visible
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Master list of all fetched questions
  const [answers, setAnswers] = useState<{ [key: number]: string }>({}); // ID -> Answer mapping
  
  const [loading, setLoading] = useState(false);
  
  // Recommendation State
  const [results, setResults] = useState<CareerRecommendation[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerRecommendation | null>(null);
  
  // Roadmap State
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [savedRoadmaps, setSavedRoadmaps] = useState<RoadmapEntry[]>([]);
  const [viewingRoadmap, setViewingRoadmap] = useState<RoadmapEntry | null>(null);

  // Progress Tracker State
  const [activeTracker, setActiveTracker] = useState<ProgressTracker | null>(null);
  const [loadingTracker, setLoadingTracker] = useState(false);
  
  // Quiz State
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<WeeklyQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({}); // QuestionIndex -> OptionIndex
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);

  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [askQuestionModal, setAskQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({ tag: 'General', question: '' });

  // Booking State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingResult, setBookingResult] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    if (propFaqs) setFaqs(propFaqs);
    else setFaqs(db.faqs.getAll());

    if (propSessions) setSessions(propSessions);
    else setSessions(db.sessions.getAll().filter(s => s.studentId === user.id));
    
    // Restore selected career from sessionStorage if returning from subscription
    const savedCareer = sessionStorage.getItem('selected_career');
    if (savedCareer && activeView === 'assessment') {
      try {
        setSelectedCareer(JSON.parse(savedCareer));
        sessionStorage.removeItem('selected_career');
      } catch (e) {
        console.error('Failed to restore selected career:', e);
      }
    }
    
    // Load persisted assessment results
    const savedResult = db.assessments.getLatestByUserId(user.id);
    if (savedResult) {
        setResults(savedResult.recommendations);
    }

    // Load persisted roadmaps
    const roadmaps = db.roadmaps.getAllByUserId(user.id);
    setSavedRoadmaps(roadmaps.reverse()); // Newest first
    
    // Load Progress Tracker
    const trackers = db.progress.getByUserId(user.id);
    if (trackers.length > 0) setActiveTracker(trackers[0]); // Load first active tracker

  }, [activeView, user.id, propFaqs, propSessions]);

  useEffect(() => {
    // Only reset if we are explicitly starting a new assessment, NOT if we are just navigating back to view results
    if (activeView === 'assessment' && assessmentStep === 0 && results.length === 0) {
      setSelectedCategories([]);
      setAllQuestions([]);
      setCurrentQuestions([]);
      setAnswers({});
      setCurrentBatch(1);
    }
    // Reset view roadmap when leaving tab
    if (activeView !== 'roadmap') {
      setViewingRoadmap(null);
    }
  }, [activeView, assessmentStep, results.length]);

  const toggleCategory = (category: CareerCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleUpgradeTier = (newTier: SubscriptionTier) => {
    if (upgradeTier) {
      upgradeTier(newTier);
    } else {
      db.users.update(user.id, { tier: newTier });
      refreshData();
      alert(`Successfully upgraded to ${newTier}`);
    }
    
    // Return to assessment results if user was there, otherwise dashboard
    const returnTo = sessionStorage.getItem('subscription_return_path') || 'dashboard';
    sessionStorage.removeItem('subscription_return_path');
    onNavigate(returnTo);
  };

  const handleAskQuestion = () => {
    if (!questionForm.question.trim()) return;
    
    db.faqs.create({
      id: Date.now().toString(),
      question: questionForm.question,
      answer: '', // Pending status implied
      category: questionForm.tag as any,
      status: 'pending'
    });

    setAskQuestionModal(false);
    setQuestionForm({ tag: 'General', question: '' });
    alert("Your question has been sent! An admin will answer it shortly.");
    refreshData();
  };

  const checkUsageLimit = (type: 'assessments' | 'roadmaps'): boolean => {
    const tier = user.tier || SubscriptionTier.FREE;
    const limit = LIMITS[tier][type];
    
    let currentCount = 0;
    if (type === 'assessments') {
      currentCount = db.assessments.getAllByUserId(user.id).length;
    } else {
      currentCount = db.roadmaps.getAllByUserId(user.id).length;
    }

    if (currentCount >= limit) {
      alert(`You have reached the limit of ${limit} ${type} for your ${tier} plan. Please upgrade to continue.`);
      // Store current view so we can return after subscription
      sessionStorage.setItem('subscription_return_path', activeView);
      onNavigate('subscription');
      return false;
    }
    return true;
  };

  const startAssessment = async () => {
    if (!checkUsageLimit('assessments')) return;
    if (selectedCategories.length === 0) return;

    setLoading(true);
    setAnswers({});
    setAllQuestions([]);
    setCurrentBatch(1);
    
    // Generate Batch 1
    const rawQuestions = await generateQuestions(selectedCategories, user.currentClass, []);
    
    // Remap IDs to ensure they are 1-based and sequential for the session
    const mappedQuestions = rawQuestions.map((q, i) => ({ ...q, id: i + 1 }));
    
    setCurrentQuestions(mappedQuestions);
    setAllQuestions(mappedQuestions);
    setLoading(false);
    setAssessmentStep(2);
  };

  const handleNextBatch = async () => {
    setLoading(true);
    
    // Prepare answers from all previous batches to send as context
    const accumulatedAnswers: Answer[] = allQuestions.map(q => ({
      questionId: q.id,
      questionText: q.text,
      answer: answers[q.id] || ""
    })).filter(a => a.answer);
    
    // Generate next batch
    const rawQuestions = await generateQuestions(selectedCategories, user.currentClass, accumulatedAnswers);
    
    // Remap IDs for the new batch to continue sequentially
    const startId = allQuestions.length + 1;
    const mappedQuestions = rawQuestions.map((q, i) => ({ ...q, id: startId + i }));
    
    setCurrentQuestions(mappedQuestions);
    setAllQuestions(prev => [...prev, ...mappedQuestions]);
    setCurrentBatch(prev => prev + 1);
    setLoading(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitAssessment = async () => {
    setLoading(true);
    
    const profile: AssessmentProfile = {
      categories: selectedCategories,
      answers: allQuestions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        answer: answers[q.id] || ""
      })),
      locationCurrent: assessmentDetails.location,
      willingnessToTravel: assessmentDetails.willingness,
      yearlyBudgetINR: parseInt(assessmentDetails.budget),
      yearsToInvest: parseInt(assessmentDetails.years),
      studentClass: user.currentClass
    };

    const recommendations = await analyzeProfile(profile);
    
    // Persist results to DB
    db.assessments.save({
        id: Date.now().toString(),
        userId: user.id,
        date: new Date().toISOString(),
        recommendations: recommendations
    });

    setResults(recommendations);
    setLoading(false);
    setAssessmentStep(3);
  };

  const fetchRoadmap = async (career: CareerRecommendation) => {
    if (!checkUsageLimit('roadmaps')) return;

    setLoadingRoadmap(true);
    
    const steps = await generateRoadmap(career.careerTitle, user.currentClass, parseInt(assessmentDetails.years || '4'));
    
    // Save to DB
    const newRoadmap: RoadmapEntry = {
      id: Date.now().toString(),
      userId: user.id,
      careerTitle: career.careerTitle,
      date: new Date().toISOString(),
      steps: steps
    };
    db.roadmaps.save(newRoadmap);

    setSavedRoadmaps(prev => [newRoadmap, ...prev]);
    setViewingRoadmap(newRoadmap);
    setLoadingRoadmap(false);
    setSelectedCareer(null); // Close modal
    onNavigate('roadmap');
  };

  const initProgressTracker = async (roadmap: RoadmapEntry) => {
    if (!roadmap || !roadmap.steps || roadmap.steps.length === 0) {
      alert("Invalid roadmap data. Please regenerate the roadmap.");
      return;
    }
    
    setLoadingTracker(true);
    
    try {
      // Generate Week 1 Plan using AI
      const phase1 = roadmap.steps[0].phase;
      const week1Plan = await generateWeeklyPlan(roadmap.careerTitle, phase1, 1);

      const newTracker: ProgressTracker = {
        id: Date.now().toString(),
        userId: user.id,
        roadmapId: roadmap.id,
        careerTitle: roadmap.careerTitle,
        currentPhaseIndex: 0,
        totalWeeksCompleted: 0,
        overallProgressScore: 0,
        history: [],
        currentWeek: week1Plan
      };

      db.progress.save(newTracker);
      setActiveTracker(newTracker);
    } catch (error) {
      console.error("Failed to init tracker", error);
      alert("AI Coach is busy. Please try again.");
    } finally {
      setLoadingTracker(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    if (!activeTracker) return;

    const updatedTasks = activeTracker.currentWeek.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );

    const updatedTracker = {
      ...activeTracker,
      currentWeek: { ...activeTracker.currentWeek, tasks: updatedTasks }
    };
    
    // Optimistic Update locally
    setActiveTracker(updatedTracker);
  };

  const handleWeeklySubmitStart = async () => {
    if (!activeTracker) return;
    
    // Filter Completed Learning Tasks
    const learningTasks = activeTracker.currentWeek.tasks.filter(t => t.category === 'Learning' && t.isCompleted);
    
    // If no learning tasks completed, skip quiz and direct submit (or force them to do at least one? letting them skip for now)
    if (learningTasks.length === 0) {
       submitWeeklyProgress();
       return;
    }

    // Generate Quiz
    setLoadingTracker(true);
    const quiz = await generateWeeklyQuiz(learningTasks);
    
    setCurrentQuiz({ ...quiz, userAnswers: [] });
    setQuizAnswers({});
    setQuizResult(null);
    setLoadingTracker(false);
    setQuizModalOpen(true);
  };

  const handleQuizSubmit = () => {
    if (!currentQuiz) return;

    let score = 0;
    currentQuiz.questions.forEach((q, idx) => {
       if (quizAnswers[idx] === q.correctOptionIndex) {
         score++;
       }
    });

    const passed = score >= 2; // Pass if 2 out of 3 correct
    setQuizResult({ score, passed });

    // Update the current quiz object with result
    setCurrentQuiz({
       ...currentQuiz,
       score: score,
       passed: passed
    });
  };

  const submitWeeklyProgress = async () => {
    if (!activeTracker) return;
    setLoadingTracker(true);
    setQuizModalOpen(false); // Close modal if open

    const currentWeek = activeTracker.currentWeek;
    
    // Attach quiz result if exists
    if (currentQuiz && quizResult) {
       currentWeek.quiz = { ...currentQuiz };
    }

    const completedCount = currentWeek.tasks.filter(t => t.isCompleted).length;
    const totalCount = currentWeek.tasks.length;
    const rate = Math.round((completedCount / totalCount) * 100);

    // Finalize current week
    const finalizedWeek: WeeklyPlan = {
      ...currentWeek,
      status: 'completed',
      completionRate: rate
    };

    // Update Scores
    // Logic: +10 for Perfect Task, +5 for >50%.
    // Bonus: +10 for Passing Quiz.
    let scoreAdd = rate === 100 ? 10 : rate >= 50 ? 5 : 0;
    if (quizResult?.passed) scoreAdd += 10;

    const newScore = activeTracker.overallProgressScore + scoreAdd;

    // Generate Next Week
    const roadmap = savedRoadmaps.find(r => r.id === activeTracker.roadmapId);
    const currentPhase = roadmap ? roadmap.steps[activeTracker.currentPhaseIndex].phase : "General Progression";
    
    // Pass finalizedWeek as "previousPlan" so AI can see quiz score
    const nextWeekPlan = await generateWeeklyPlan(
      activeTracker.careerTitle, 
      currentPhase, 
      activeTracker.totalWeeksCompleted + 2, 
      finalizedWeek 
    );

    const updatedTracker: ProgressTracker = {
      ...activeTracker,
      totalWeeksCompleted: activeTracker.totalWeeksCompleted + 1,
      overallProgressScore: newScore,
      history: [...activeTracker.history, finalizedWeek],
      currentWeek: nextWeekPlan
    };

    db.progress.save(updatedTracker);
    setActiveTracker(updatedTracker);
    setLoadingTracker(false);
    setQuizResult(null);
    setCurrentQuiz(null);
  };

  const handleSessionBooking = () => {
    setBookingResult(null);
    if(!bookingDate || !bookingTime) return;

    if (onBookSession) {
      const result = onBookSession(bookingDate, bookingTime);
      setBookingResult({ type: result.success ? 'success' : 'error', msg: result.message });
      if (result.success) {
         setBookingDate('');
         setBookingTime('');
      }
      return;
    }

    // Fallback if no prop handler (direct DB mode)
    const dayOfWeek = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long' });
    const allUsers = db.users.getAll();
    const allSessions = db.sessions.getAll();
    const allAvailabilities = db.availability.getAll();

    // Filter Available Consultants
    const availableConsultants = allUsers.filter(u => u.role === UserRole.CONSULTANT).filter(consultant => {
        const avail = allAvailabilities.find(a => a.consultantId === consultant.id);
        if (!avail) return false;
        
        if (!avail.days.includes(dayOfWeek)) return false;
        if (bookingTime < avail.startTime || bookingTime > avail.endTime) return false;

        const hasConflict = allSessions.some(s => 
          s.consultantId === consultant.id && 
          s.date === bookingDate && 
          s.time === bookingTime && 
          s.status !== 'Cancelled'
        );

        return !hasConflict;
      });

    if (availableConsultants.length === 0) {
      setBookingResult({ type: 'error', msg: 'No counselors available at this time.' });
      return;
    }

    const assignedConsultant = availableConsultants[0];

    db.sessions.create({
      id: Date.now().toString(),
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      consultantId: assignedConsultant.id,
      consultantName: `${assignedConsultant.firstName} ${assignedConsultant.lastName}`,
      date: bookingDate,
      time: bookingTime,
      status: 'Scheduled'
    });

    setBookingResult({ type: 'success', msg: `Session booked with ${assignedConsultant.firstName} ${assignedConsultant.lastName}!`});
    setBookingDate('');
    setBookingTime('');
    setSessions(db.sessions.getAll().filter(s => s.studentId === user.id)); // Refresh local list
  };

  // --- Render Components ---

  const renderCategorySelection = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Select Fields of Interest</h2>
          <p className="text-slate-500 mt-1">Select multiple fields. Be honest about your interests.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-medium text-slate-800 bg-slate-200 px-3 py-1 rounded-full">
            {selectedCategories.length} Selected
            </span>
            {results.length > 0 && (
                <button 
                    onClick={() => setAssessmentStep(3)} 
                    className="text-xs text-slate-700 underline font-medium hover:text-slate-900"
                >
                    View Last Results ({results.length})
                </button>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(CareerCategory).map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`p-6 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                isSelected 
                  ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-400' 
                  : 'border-slate-200 hover:border-slate-400 hover:shadow-md bg-white'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-slate-800">
                  <CheckCircle size={20} className="fill-slate-200" />
                </div>
              )}
              <span className={`font-semibold text-lg block mb-2 ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                {cat}
              </span>
              <span className="text-sm text-slate-500">Explore careers in {cat.toLowerCase()}.</span>
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-end pt-6">
        <Button 
          disabled={selectedCategories.length === 0} 
          onClick={() => setAssessmentStep(1)}
          className="w-full md:w-auto"
        >
          Next: Personal Details <ArrowRight className="ml-2" size={16}/>
        </Button>
      </div>
    </div>
  );

  const renderDetailsInput = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">Reality Check Parameters</h2>
      <Card>
        <div className="space-y-4">
          <Input 
            label="Current City/Town" 
            value={assessmentDetails.location}
            onChange={e => setAssessmentDetails({...assessmentDetails, location: e.target.value})}
            placeholder="e.g., Mumbai, Indore"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Yearly Budget (INR)" 
              type="number"
              value={assessmentDetails.budget}
              onChange={e => setAssessmentDetails({...assessmentDetails, budget: e.target.value})}
              placeholder="e.g., 200000"
            />
             <Input 
              label="Years willing to study" 
              type="number"
              value={assessmentDetails.years}
              onChange={e => setAssessmentDetails({...assessmentDetails, years: e.target.value})}
              placeholder="3"
            />
          </div>
          <Select
            label="How far can you travel for education/work?"
            options={[
              {label: 'Within my City', value: 'Local'},
              {label: 'Within my State', value: 'State'},
              {label: 'Anywhere in India', value: 'National'},
              {label: 'International', value: 'International'},
            ]}
            value={assessmentDetails.willingness}
            onChange={e => setAssessmentDetails({...assessmentDetails, willingness: e.target.value})}
          />
          <div className="pt-4 flex justify-between">
             <Button variant="outline" onClick={() => setAssessmentStep(0)}>Back</Button>
             <Button 
               onClick={startAssessment} 
               isLoading={loading}
               disabled={!assessmentDetails.budget || !assessmentDetails.location}
            >
              Start Mindset Assessment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderQuestionnaire = () => {
    const currentBatchIds = currentQuestions.map(q => q.id);
    const allCurrentAnswered = currentBatchIds.every(id => answers[id] && answers[id].trim() !== '');

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Brain className="text-slate-800"/> Mindset & Aptitude Analysis</h2>
              <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                Batch {currentBatch}/{TOTAL_BATCHES}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              We are analyzing your psychological fit, interests, and potential. This is NOT an exam.
            </p>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-sm font-medium text-slate-600">
               Total Progress: {Math.round(((currentBatch - 1) * BATCH_SIZE + Object.keys(answers).filter(k => currentBatchIds.includes(parseInt(k))).length) / (TOTAL_BATCHES * BATCH_SIZE) * 100)}%
             </span>
             <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
               <div 
                 className="h-full bg-slate-800 transition-all duration-500" 
                 style={{ width: `${((currentBatch - 1) / TOTAL_BATCHES) * 100}%` }} 
               />
             </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {currentQuestions.map((q, idx) => (
            <Card key={q.id} className="border-l-4 border-l-slate-800">
              <div className="flex justify-between items-start mb-3">
                 <h3 className="font-medium text-lg">
                   {((currentBatch - 1) * BATCH_SIZE) + idx + 1}. {q.text}
                 </h3>
                 <span className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">{q.category}</span>
              </div>
              
              {q.type === 'scale' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 font-semibold mb-2 px-1">
                     <span>1 (Strongly Disagree / Worst)</span>
                     <span>5 (Strongly Agree / Best)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setAnswers({...answers, [q.id]: num.toString()})}
                        className={`flex-1 min-w-[50px] py-3 rounded-lg border font-medium transition-all ${
                          answers[q.id] === num.toString() 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    {/* Add explicit Don't Know button for Scale questions */}
                    <button
                      onClick={() => setAnswers({...answers, [q.id]: "I don't know"})}
                      className={`flex-1 min-w-[100px] py-3 rounded-lg border font-medium transition-all ${
                        answers[q.id] === "I don't know"
                          ? 'bg-slate-600 text-white border-slate-600 shadow-md'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Unsure
                    </button>
                  </div>
                </div>
              )}
              
              {q.type === 'multiple_choice' && q.options && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                   {q.options.map((opt) => (
                     <button
                        key={opt}
                        onClick={() => setAnswers({...answers, [q.id]: opt})}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          answers[q.id] === opt
                            ? 'bg-slate-100 border-slate-800 text-slate-900 ring-1 ring-slate-800'
                            : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                        }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
              )}

              {(q.type === 'text' || (q.type === 'multiple_choice' && !q.options)) && (
                 <div className="space-y-2">
                   <Input 
                     placeholder="Type your answer here..." 
                     value={answers[q.id] !== "I don't know" ? (answers[q.id] || '') : ''}
                     onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                     className="mt-2"
                     disabled={answers[q.id] === "I don't know"}
                   />
                    <button
                      onClick={() => setAnswers({...answers, [q.id]: answers[q.id] === "I don't know" ? "" : "I don't know"})}
                      className={`text-xs px-3 py-1 rounded border ${answers[q.id] === "I don't know" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      I don't know
                    </button>
                 </div>
              )}
            </Card>
          ))}
        </div>
        
        <div className="sticky bottom-4 bg-white/90 backdrop-blur p-4 border rounded-xl shadow-lg flex justify-between z-20 items-center">
          <div className="text-sm text-slate-500 hidden md:block">
             {allCurrentAnswered ? "Ready to proceed!" : "Please answer all questions. Use 'Unsure' if needed."}
          </div>
          <Button 
            onClick={currentBatch < TOTAL_BATCHES ? handleNextBatch : submitAssessment} 
            isLoading={loading}
            disabled={!allCurrentAnswered}
            className="w-full md:w-auto shadow-lg"
          >
            {currentBatch < TOTAL_BATCHES ? (
              <>Next Batch <ArrowRight size={16} className="ml-2"/></>
            ) : (
              <>Analyze My Mindset <Sparkles size={16} className="ml-2"/></>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results || results.length === 0) return null;

    const getFeasibilityColor = (rating: string) => {
      switch(rating) {
        case 'High': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Low': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-slate-100 text-slate-800';
      }
    };

    return (
      <div className="space-y-8 animate-slide-up pb-12">
        <div className="text-center mb-12 relative">
            <h2 className="text-3xl font-bold text-slate-800">Your Psychological Profile & Career Fit</h2>
            <p className="text-slate-500 mt-2">Matches based on your mentality, interests, and current ability.</p>
            <Button 
                variant="outline" 
                size="sm"
                className="absolute right-0 top-0 hidden md:flex"
                onClick={() => { setAssessmentStep(0); setResults([]); }}
            >
                Retake Assessment
            </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {results.map((career, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedCareer(career)}
              className="bg-white rounded-2xl border border-slate-200 p-8 cursor-pointer hover:shadow-xl hover:border-slate-400 transition-all group relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[220px]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 group-hover:h-2 transition-all duration-300"></div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-slate-700 transition-colors">
                {career.careerTitle}
              </h3>
              
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full border mb-6 ${getFeasibilityColor(career.realityCheck.feasibilityRating)}`}>
                {career.realityCheck.feasibilityRating} Feasibility
              </span>

              <div className="mt-auto text-slate-700 text-sm font-medium flex items-center opacity-75 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                View Full Analysis <ArrowRight size={16} className="ml-2"/>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Modal */}
        <Modal 
          isOpen={!!selectedCareer} 
          onClose={() => setSelectedCareer(null)}
          title="Career Feasibility Report"
        >
          {selectedCareer && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700 rounded-full mix-blend-multiply filter blur-2xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-2xl font-bold relative z-10">{selectedCareer.careerTitle}</h2>
                <p className="text-slate-300 mt-2 relative z-10">{selectedCareer.description}</p>
                <div className="mt-4 flex gap-4 relative z-10">
                  <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span className="block text-xs text-slate-400">Psychological Fit</span>
                    <span className={`text-xl font-bold ${selectedCareer.aptitudeScore > 75 ? 'text-emerald-400' : selectedCareer.aptitudeScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {selectedCareer.aptitudeScore}/100
                    </span>
                  </div>
                  <div className={`bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10`}>
                    <span className="block text-xs text-slate-400">Feasibility</span>
                    <span className={`text-xl font-bold ${selectedCareer.realityCheck.feasibilityRating === 'High' ? 'text-emerald-400' : selectedCareer.realityCheck.feasibilityRating === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {selectedCareer.realityCheck.feasibilityRating}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                  <Info size={18} className="text-slate-800" /> Why this fits your Mindset
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed bg-slate-100 p-4 rounded-lg border border-slate-200">
                  {selectedCareer.reasonWhyChosen}
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                  <TrendingUp size={18} className="text-slate-800" /> Learning Curve
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-slate-800 pl-4">
                  {selectedCareer.learningCurve}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h3 className="flex items-center gap-2 font-bold text-red-800 mb-3">
                  <AlertTriangle size={18} /> Brutal Reality Check
                </h3>
                <p className="text-slate-800 font-medium text-sm mb-3">{selectedCareer.realityCheck.verdict}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2 rounded border border-red-100 shadow-sm">
                    <span className="block text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={12}/> Financial</span>
                    <span className="text-slate-800">{selectedCareer.realityCheck.financialGap}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-red-100 shadow-sm">
                    <span className="block text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Location</span>
                    <span className="text-slate-800">{selectedCareer.realityCheck.locationVerdict}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                  <AlertCircle size={18} className="text-orange-600" /> Immediate Next Step
                </h3>
                <p className="text-slate-600 text-sm">{selectedCareer.immediateNextStep}</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {user.tier === SubscriptionTier.FREE ? (
                  <Button 
                    onClick={() => { 
                      // Save selected career to sessionStorage before navigating
                      sessionStorage.setItem('selected_career', JSON.stringify(selectedCareer));
                      sessionStorage.setItem('subscription_return_path', 'assessment');
                      onNavigate('subscription'); 
                    }} 
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    <Lock size={16} className="mr-2"/> Unlock Detailed Roadmap (Standard)
                  </Button>
                ) : (
                  <Button 
                    onClick={() => fetchRoadmap(selectedCareer)} 
                    isLoading={loadingRoadmap}
                    className="w-full"
                  >
                    <BookOpen size={16} className="mr-2"/> Generate Detailed Roadmap
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  };

  const renderRoadmapView = () => (
    <div className="space-y-8 animate-fade-in">
      {!viewingRoadmap ? (
        // LIST VIEW OF SAVED ROADMAPS
        <div className="space-y-8">
           <div className="flex justify-between items-center">
             <div>
               <h2 className="text-2xl font-bold text-slate-800">My Saved Roadmaps</h2>
               <p className="text-sm text-slate-500">Access your personalized guides.</p>
             </div>
             {savedRoadmaps.length > 0 && user.tier === SubscriptionTier.FREE && (
                <div className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
                    Upgrade to view detailed steps
                </div>
             )}
          </div>
          
          {savedRoadmaps.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-700">No Roadmaps Yet</h3>
                <p className="text-slate-500 mb-6">Complete an assessment to generate your first career roadmap.</p>
                <Button onClick={() => onNavigate('assessment')}>Start Assessment</Button>
             </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {savedRoadmaps.map((map) => (
                  <Card key={map.id} className="cursor-pointer hover:border-slate-400 transition-colors" onClick={() => setViewingRoadmap(map)}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-200 p-2 rounded-lg text-slate-800">
                           <MapPin size={24} />
                        </div>
                        <span className="text-xs text-slate-400">{new Date(map.date).toLocaleDateString()}</span>
                     </div>
                     <h3 className="font-bold text-lg text-slate-800 mb-2">{map.careerTitle}</h3>
                     <p className="text-sm text-slate-500">{map.steps.length} Phases • {user.currentClass}</p>
                     <div className="mt-4 text-slate-700 text-sm font-medium flex items-center">
                        View Details <ArrowRight size={16} className="ml-2"/>
                     </div>
                  </Card>
               ))}
            </div>
          )}
        </div>
      ) : (
        // DETAIL VIEW
        <div>
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
               <button onClick={() => setViewingRoadmap(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowRight size={24} className="rotate-180 text-slate-600"/>
               </button>
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">Path to {viewingRoadmap.careerTitle}</h2>
                 <p className="text-sm text-slate-500">Generated on {new Date(viewingRoadmap.date).toLocaleDateString()}</p>
               </div>
             </div>
          </div>

          {user.tier === SubscriptionTier.FREE ? (
            <Card className="text-center py-12">
              <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-800">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Unlock Detailed Roadmap</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                You're on the Free tier. Upgrade to Standard to view the detailed steps for {viewingRoadmap.careerTitle}.
              </p>
              <Button onClick={() => onNavigate('subscription')}>
                View Upgrade Options
              </Button>
            </Card>
          ) : (
            <div className="relative border-l-4 border-slate-300 ml-4 space-y-12 py-4">
              {viewingRoadmap.steps.map((step, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-800 rounded-full border-4 border-white shadow-sm"></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{step.phase}</h3>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-800 bg-slate-200 px-2 py-1 rounded mb-3 inline-block">{step.duration}</span>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-2 hover:shadow-md transition-shadow">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-700">
                      <CheckCircle size={16} className="text-emerald-500"/> Milestones (Next Steps):
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 mb-5 bg-slate-50 p-3 rounded-lg">
                      {step.milestones.map((m, i) => <li key={i} className="text-sm leading-relaxed">{m}</li>)}
                    </ul>

                    <h4 className="font-semibold mb-2 text-sm text-slate-500 flex items-center gap-2">
                       <Book size={14}/> Recommended Resources:
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {step.resources.map((r, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-medium">{r}</span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="font-semibold text-sm text-slate-500 mb-2 flex items-center gap-2">
                            <MapPin size={14} /> Best Locations / Hubs:
                        </h4>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-800 flex-shrink-0"></span>
                            {step.locationAdvice}
                        </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderProgressTracker = () => {
    // 1. Tier Check
    if (user.tier === SubscriptionTier.FREE) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <Card className="text-center p-12 max-w-md w-full border-2 border-slate-300 shadow-xl">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
               <Shield size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Premium Progress Tracker</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Unlock a smart, AI-driven weekly planner that adapts to your speed. Track milestones, get consistency scores, and never feel lost again.
            </p>
            <div className="space-y-4">
               <Button onClick={() => onNavigate('subscription')} className="w-full py-3 text-lg shadow-slate-200 shadow-lg">
                 Upgrade to Standard
               </Button>
               <button onClick={() => onNavigate('dashboard')} className="text-slate-400 text-sm hover:text-slate-600">
                 No thanks, take me back
               </button>
            </div>
          </Card>
        </div>
      );
    }

    // 2. No Active Tracker - Init State
    if (!activeTracker) {
       return (
         <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto py-12">
               <h2 className="text-3xl font-bold text-slate-800 mb-4">Start Tracking Your Journey</h2>
               <p className="text-slate-500 mb-8">Select a roadmap to turn into a weekly actionable plan.</p>
               
               {savedRoadmaps.length === 0 ? (
                 <Card>
                    <p className="mb-4">You need a roadmap first!</p>
                    <Button onClick={() => onNavigate('assessment')}>Generate Roadmap</Button>
                 </Card>
               ) : (
                 <div className="grid md:grid-cols-2 gap-4">
                    {savedRoadmaps.map(rm => (
                       <Card key={rm.id} className="text-left border hover:border-slate-400 transition-all">
                          {loadingTracker ? (
                             <div className="flex flex-col items-center justify-center py-6 text-slate-700">
                                <Loader2 size={32} className="animate-spin mb-2" />
                                <span className="text-sm font-medium">Initializing AI Coach...</span>
                             </div>
                          ) : (
                             <>
                                <div className="mb-4">
                                  <h3 className="font-bold text-lg text-slate-800">{rm.careerTitle}</h3>
                                  <p className="text-sm text-slate-500 mt-1">Created: {new Date(rm.date).toLocaleDateString()}</p>
                                </div>
                                <Button className="w-full" onClick={() => initProgressTracker(rm)}>
                                   Start Tracking <ArrowRight size={16} className="ml-2"/>
                                </Button>
                             </>
                          )}
                       </Card>
                    ))}
                 </div>
               )}
            </div>
         </div>
       );
    }

    // 3. Active Tracker Dashboard
    const completedTasks = activeTracker.currentWeek.tasks.filter(t => t.isCompleted).length;
    const totalTasks = activeTracker.currentWeek.tasks.length;
    const weekProgress = Math.round((completedTasks / totalTasks) * 100);

    // Chart Data
    const progressData = [
      { name: 'Completed', value: completedTasks, color: '#4f46e5' },
      { name: 'Remaining', value: totalTasks - completedTasks, color: '#e2e8f0' }
    ];
    
    // History Data for Chart
    const historyData = activeTracker.history.map(w => ({
      name: `W${w.weekNumber}`,
      score: w.completionRate
    }));

    return (
      <div className="space-y-8 animate-fade-in pb-12">
         {/* Header */}
         <div className="flex justify-between items-start">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded uppercase tracking-wide">
                     Week {activeTracker.currentWeek.weekNumber}
                  </span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wide">
                     {activeTracker.careerTitle}
                  </span>
               </div>
               <h2 className="text-3xl font-bold text-slate-900">{activeTracker.currentWeek.title}</h2>
               <p className="text-slate-500 mt-2 max-w-2xl">{activeTracker.currentWeek.aiFeedback}</p>
            </div>
            <div className="text-right hidden md:block">
               <div className="text-3xl font-bold text-slate-800">{activeTracker.overallProgressScore}</div>
               <div className="text-xs text-slate-500 uppercase tracking-wide">Consistency Score</div>
            </div>
         </div>

         <div className="grid lg:grid-cols-3 gap-8">
            {/* Task List */}
            <div className="lg:col-span-2 space-y-6">
               <Card className="border-t-4 border-t-slate-800">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-slate-800">This Week's Targets</h3>
                     <span className="text-sm font-medium text-slate-500">{completedTasks}/{totalTasks} Completed</span>
                  </div>
                  
                  <div className="space-y-3">
                     {activeTracker.currentWeek.tasks.map(task => (
                        <div 
                           key={task.id} 
                           onClick={() => toggleTaskCompletion(task.id)}
                           className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${task.isCompleted ? 'bg-slate-100 border-slate-400' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                        >
                           <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.isCompleted ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>
                              {task.isCompleted && <Check size={14} className="text-white" />}
                           </div>
                           <div className="flex-1">
                              <p className={`font-medium text-slate-800 ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                                 {task.text}
                              </p>
                              <span className="text-xs text-slate-400 uppercase mt-1 inline-block">{task.category}</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                     <div className="text-xs text-slate-400 hidden sm:block">
                        Verify learning before continuing.
                     </div>
                     <Button 
                        onClick={handleWeeklySubmitStart} 
                        isLoading={loadingTracker}
                        disabled={loadingTracker}
                     >
                        {loadingTracker ? "Generating Next Week..." : "Take Skills Quiz & Submit Week"} <ArrowRight size={16} className="ml-2"/>
                     </Button>
                  </div>
               </Card>
            </div>

            {/* Charts & Stats */}
            <div className="space-y-6">
               <Card>
                  <h3 className="font-bold text-slate-700 mb-4">Weekly Goal</h3>
                  <div className="h-48 relative flex items-center justify-center">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={progressData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              paddingAngle={5}
                           >
                              {progressData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0}/>
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-slate-800">{weekProgress}%</span>
                        <span className="text-xs text-slate-400">DONE</span>
                     </div>
                  </div>
               </Card>

               <Card>
                  <h3 className="font-bold text-slate-700 mb-4">Consistency Trend</h3>
                  {historyData.length > 0 ? (
                     <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={historyData}>
                              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false}/>
                              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px'}}/>
                              <Bar dataKey="score" fill="#818cf8" radius={[4, 4, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  ) : (
                     <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-lg">
                        Complete your first week to see trends.
                     </div>
                  )}
               </Card>
            </div>
         </div>
         
         {/* QUIZ MODAL */}
         <Modal isOpen={quizModalOpen} onClose={() => { if(!quizResult) setQuizModalOpen(false) }} title="Skill Verification">
           {currentQuiz && (
             <div className="space-y-6">
               {!quizResult ? (
                 <>
                    <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-4">
                       <p className="text-sm text-slate-800 flex items-start gap-2">
                         <GraduationCap size={18} className="flex-shrink-0"/>
                         Quickly verify your understanding of this week's topics to unlock the next phase.
                       </p>
                    </div>
                    <div className="space-y-6">
                      {currentQuiz.questions.map((q, idx) => (
                         <div key={q.id}>
                            <h4 className="font-semibold text-slate-900 mb-3">{idx + 1}. {q.text}</h4>
                            <div className="space-y-2">
                               {q.options.map((opt, optIdx) => (
                                  <button 
                                    key={optIdx}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${quizAnswers[idx] === optIdx ? 'border-slate-800 bg-slate-100 text-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                                    onClick={() => setQuizAnswers({...quizAnswers, [idx]: optIdx})}
                                  >
                                    {opt}
                                  </button>
                               ))}
                            </div>
                         </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                      onClick={handleQuizSubmit}
                    >
                      Submit Verification
                    </Button>
                 </>
               ) : (
                 <div className="text-center py-6 animate-fade-in">
                    {quizResult.passed ? (
                       <div className="mb-6">
                          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                             <CheckCircle size={32}/>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">Verified!</h3>
                          <p className="text-slate-500 mt-1">You scored {quizResult.score}/{currentQuiz.questions.length}. Good job.</p>
                       </div>
                    ) : (
                       <div className="mb-6">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                             <XCircle size={32}/>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">Review Needed</h3>
                          <p className="text-slate-500 mt-1">You scored {quizResult.score}/{currentQuiz.questions.length}. Let's review these topics.</p>
                       </div>
                    )}
                    
                    <Button onClick={submitWeeklyProgress} isLoading={loadingTracker} className="w-full">
                       {quizResult.passed ? "Continue to Next Week" : "Generate Remedial Plan"} <ArrowRight size={16} className="ml-2"/>
                    </Button>
                 </div>
               )}
             </div>
           )}
         </Modal>
      </div>
    );
  };

  const renderSubscriptionPage = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Invest in Your Future</h2>
        <p className="text-slate-600">Choose the plan that fits your career goals. Upgrade anytime to unlock exclusive features and professional guidance.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Tier */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative flex flex-col">
          <div className="mb-6">
            <span className="text-sm font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">Tier 1</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">Free</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">₹0</span>
            </div>
            <p className="text-slate-500 mt-2 text-sm">Basic career discovery.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>3 Career Assessments</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>3 Career Recommendations</span>
            </li>
             <li className="flex items-start gap-3 text-sm text-slate-400">
              <Lock size={18} className="flex-shrink-0" />
              <span>Detailed Roadmap</span>
            </li>
             <li className="flex items-start gap-3 text-sm text-slate-400">
              <Lock size={18} className="flex-shrink-0" />
              <span>1-on-1 Consultation</span>
            </li>
          </ul>
          <Button 
            variant={user.tier === SubscriptionTier.FREE ? "outline" : "primary"} 
            disabled={user.tier === SubscriptionTier.FREE}
            className="w-full"
            onClick={() => handleUpgradeTier(SubscriptionTier.FREE)}
          >
            {user.tier === SubscriptionTier.FREE ? 'Current Plan' : 'Select Free'}
          </Button>
        </div>

        {/* Standard Tier */}
        <div className="bg-white rounded-2xl p-8 border-2 border-slate-800 shadow-xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
          <div className="mb-6">
            <span className="text-sm font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">Tier 2</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">Standard</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">₹499</span>
              <span className="text-slate-500 ml-2">/year</span>
            </div>
            <p className="text-slate-500 mt-2 text-sm">Actionable roadmaps & deeper insights.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>6 Career Assessments</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>6 Detailed Roadmaps</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Smart Progress Tracker</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Priority Email Support</span>
            </li>
          </ul>
          <Button 
             variant={user.tier === SubscriptionTier.STANDARD ? "outline" : "primary"}
             disabled={user.tier === SubscriptionTier.STANDARD}
             className="w-full"
             onClick={() => handleUpgradeTier(SubscriptionTier.STANDARD)}
          >
            {user.tier === SubscriptionTier.STANDARD ? 'Current Plan' : 'Upgrade Now'}
          </Button>
        </div>

        {/* Premium Tier */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative flex flex-col">
          <div className="mb-6">
            <span className="text-sm font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">Tier 3</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-4">Premium</h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">₹1499</span>
              <span className="text-slate-500 ml-2">/year</span>
            </div>
            <p className="text-slate-500 mt-2 text-sm">Expert guidance & personal mentorship.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
             <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Unlimited Assessments & Roadmaps</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>1-on-1 Expert Consultation</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Monthly Progress Tracking</span>
            </li>
             <li className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Scholarship Alerts</span>
            </li>
          </ul>
          <Button 
            variant={user.tier === SubscriptionTier.PREMIUM ? "outline" : "primary"}
            disabled={user.tier === SubscriptionTier.PREMIUM}
            className="w-full"
            onClick={() => handleUpgradeTier(SubscriptionTier.PREMIUM)}
          >
            {user.tier === SubscriptionTier.PREMIUM ? 'Current Plan' : 'Go Premium'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderConsultation = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultation Room</h2>
          <p className="text-slate-500">Book a session with a career expert.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={20} className="text-slate-800"/> Book a Session</h3>
            {user.tier === SubscriptionTier.FREE ? (
               <div className="text-center py-6">
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Lock size={20}/>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Premium Feature</h4>
                  <p className="text-sm text-slate-500 mb-4">Upgrade to Premium to book 1-on-1 sessions with expert counselors.</p>
                  <Button size="sm" onClick={() => onNavigate('subscription')}>Upgrade Now</Button>
               </div>
            ) : (
              <div className="space-y-4">
                 <Input 
                   type="date" 
                   label="Select Date" 
                   value={bookingDate}
                   onChange={e => setBookingDate(e.target.value)}
                   min={new Date().toISOString().split('T')[0]}
                 />
                 <Input 
                   type="time" 
                   label="Select Time" 
                   value={bookingTime}
                   onChange={e => setBookingTime(e.target.value)}
                 />
                 
                 {bookingResult && (
                    <div className={`p-3 rounded-lg text-sm ${bookingResult.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {bookingResult.msg}
                    </div>
                 )}

                 <Button className="w-full" onClick={handleSessionBooking} disabled={!bookingDate || !bookingTime}>
                   Confirm Booking
                 </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
           <h3 className="font-bold text-lg text-slate-800">Your Sessions</h3>
           {sessions.length === 0 && <div className="text-slate-500 italic">No upcoming sessions.</div>}
           {sessions.map(session => (
             <Card key={session.id} className="flex items-center justify-between">
               <div>
                  <h4 className="font-bold text-slate-900">{session.consultantName}</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {session.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {session.time}</span>
                  </div>
               </div>
               <Button variant="outline" size="sm" className="text-xs" disabled>
                 {session.status}
               </Button>
             </Card>
           ))}
        </div>
      </div>
    </div>
  );
  
  const renderHelp = () => (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Help & Support</h2>
            <p className="text-slate-500">Frequently asked questions and support.</p>
        </div>

        <div className="space-y-4">
          {faqs.map(faq => (
            <Card 
                key={faq.id} 
                className={`cursor-pointer transition-all hover:border-slate-400 ${expandedFaq === faq.id ? 'ring-2 ring-slate-100 border-slate-400' : ''}`}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            >
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-800 pr-8">{faq.question}</h3>
                    {expandedFaq === faq.id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                </div>
                {expandedFaq === faq.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-slate-600 text-sm leading-relaxed animate-fade-in">
                        {faq.answer || <span className="text-orange-500 italic">Waiting for an answer from the team...</span>}
                    </div>
                )}
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
            <p className="text-slate-500 mb-4">Can't find what you're looking for?</p>
            <Button onClick={() => setAskQuestionModal(true)}>
                <MessageCircle size={18} className="mr-2"/> Ask a Question
            </Button>
        </div>

        <Modal isOpen={askQuestionModal} onClose={() => setAskQuestionModal(false)} title="Ask a Question">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select 
                        className="w-full px-3 py-2 border rounded-lg"
                        value={questionForm.tag}
                        onChange={e => setQuestionForm({...questionForm, tag: e.target.value})}
                    >
                        <option value="General">General</option>
                        <option value="Technical">Technical</option>
                        <option value="Billing">Billing</option>
                    </select>
                </div>
                <Input 
                    placeholder="Type your question here..."
                    value={questionForm.question}
                    onChange={e => setQuestionForm({...questionForm, question: e.target.value})}
                />
                <Button onClick={handleAskQuestion} className="w-full">
                    <Send size={16} className="mr-2"/> Submit Question
                </Button>
            </div>
        </Modal>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-24">
      {activeView === 'dashboard' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.firstName}!</h1>
                <p className="text-slate-500 mt-1">Class {user.currentClass} • {user.tier || 'Free'} Plan</p>
             </div>
             {results.length > 0 ? (
                 <div className="flex gap-3">
                     <Button variant="outline" onClick={() => { onNavigate('assessment'); setAssessmentStep(3); }}>
                        <ArrowRight size={16} className="mr-2"/> View Results
                     </Button>
                     <Button onClick={() => { onNavigate('roadmap'); }}>
                        <MapPin size={16} className="mr-2"/> View Saved Roadmaps
                     </Button>
                 </div>
             ) : (
                 <Button onClick={() => onNavigate('assessment')}>
                    <Play size={16} className="mr-2"/> Start Assessment
                 </Button>
             )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-800 text-white border-none relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1">Assessment Status</h3>
                    <p className="text-slate-300 text-sm mb-4">
                        {results.length > 0 ? "Completed on " + new Date(db.assessments.getLatestByUserId(user.id)?.date || "").toLocaleDateString() : "Not Started"}
                    </p>
                    {results.length > 0 ? (
                         <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 inline-block">
                             <span className="font-bold text-2xl">{results[0].aptitudeScore}%</span>
                             <span className="text-xs block text-slate-200">Top Match Score</span>
                         </div>
                    ) : (
                        <Button size="sm" variant="secondary" onClick={() => onNavigate('assessment')}>Begin Now</Button>
                    )}
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Sparkles size={150} />
                </div>
            </Card>

            <Card className="md:col-span-2">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Career Matches</span>
                        <span className="text-2xl font-bold text-slate-800">{results.length}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Sessions</span>
                        <span className="text-2xl font-bold text-slate-800">{sessions.length}</span>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Plan</span>
                        <span className="text-2xl font-bold text-slate-800">{user.tier || 'Free'}</span>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="block text-slate-400 text-xs uppercase font-bold mb-1">Roadmaps</span>
                        <span className="text-2xl font-bold text-slate-800">{savedRoadmaps.length}</span>
                    </div>
                </div>
            </Card>
          </div>
        </div>
      )}

      {activeView === 'assessment' && (
        <>
           {assessmentStep === 0 && renderCategorySelection()}
           {assessmentStep === 1 && renderDetailsInput()}
           {assessmentStep === 2 && renderQuestionnaire()}
           {assessmentStep === 3 && renderResults()}
        </>
      )}

      {activeView === 'roadmap' && renderRoadmapView()}

      {activeView === 'progress' && renderProgressTracker()}
      
      {activeView === 'subscription' && renderSubscriptionPage()}
      
      {activeView === 'consultation' && renderConsultation()}

      {activeView === 'faq' && renderHelp()}

    </div>
  );
};