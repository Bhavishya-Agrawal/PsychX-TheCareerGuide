import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AssessmentProfile, CareerRecommendation, RoadmapStep, CareerCategory, Answer, Question, WeeklyPlan, WeeklyTask, QuizQuestion, WeeklyQuiz } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Schemas ---

const QuestionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      text: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['scale', 'multiple_choice', 'text'] },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      category: { type: Type.STRING },
    },
    required: ["id", "text", "type", "category"],
  },
};

const RecommendationListSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          careerTitle: { type: Type.STRING },
          description: { type: Type.STRING, description: "A brief, exciting description of what this professional does." },
          reasonWhyChosen: { type: Type.STRING, description: "Detailed explanation focusing on the psychological fit and user's mentality." },
          aptitudeScore: { type: Type.INTEGER, description: "Score from 0 to 100 representing fit. BE STRICT." },
          learningCurve: { type: Type.STRING, description: "A tiny report (2 sentences) on the difficulty and nature of the learning curve." },
          realityCheck: {
            type: Type.OBJECT,
            properties: {
              isRealistic: { type: Type.BOOLEAN },
              feasibilityRating: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
              verdict: { type: Type.STRING, description: "Brutally honest reality check text." },
              financialGap: { type: Type.STRING, description: "Analysis of budget vs required cost." },
              locationVerdict: { type: Type.STRING, description: "Analysis of location constraints." },
            }
          },
          immediateNextStep: { type: Type.STRING },
        }
      }
    }
  }
};

const RoadmapSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      phase: { type: Type.STRING, description: "Name of the career phase (e.g. Foundation, Entrance Prep)" },
      duration: { type: Type.STRING, description: "Specific duration (e.g. 6 Months)" },
      milestones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable steps to take" },
      resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific books, portals, exams, or courses" },
      locationAdvice: { type: Type.STRING, description: "Best cities or hubs in India for this phase" },
    },
    required: ["phase", "duration", "milestones", "resources", "locationAdvice"]
  }
};

const WeeklyPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    weekTitle: { type: Type.STRING, description: "Theme of the week" },
    aiFeedback: { type: Type.STRING, description: "Motivational feedback based on last week's performance" },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Learning', 'Practice', 'Networking'] }
        },
        required: ["id", "text", "category"]
      }
    }
  },
  required: ["weekTitle", "tasks", "aiFeedback"]
};

const QuizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          text: { type: Type.STRING, description: "The question text" },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 multiple choice options" },
          correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" }
        },
        required: ["id", "text", "options", "correctOptionIndex"]
      }
    }
  }
};

// --- Functions ---

export const generateQuestions = async (
  categories: CareerCategory[],
  studentClass: string,
  previousAnswers: Answer[] = []
): Promise<Question[]> => {
  const categoriesStr = categories.join(", ");
  
  // Determine context based on previous answers
  const batchSize = 5;
  const nextBatchNumber = Math.floor(previousAnswers.length / batchSize) + 1;
  const isFollowUp = previousAnswers.length > 0;

  let contextPrompt = "";
  if (isFollowUp) {
    contextPrompt = `
      This is Batch ${nextBatchNumber} of the assessment.
      
      CONTEXT FROM PREVIOUS ANSWERS:
      The student has already answered the following:
      ${JSON.stringify(previousAnswers, null, 2)}
      
      INSTRUCTION:
      Based on these answers, refine the line of questioning.
      - If they answered "I don't know" or showed weakness, DO NOT ask harder technical questions. Instead, switch to psychological questions to find out *why* (e.g., lack of interest vs lack of exposure).
      - If they showed strong interest, ask a deeper situational question (e.g. "If you had to lead this team...") to see how they THINK.
    `;
  } else {
    contextPrompt = `
      This is Batch 1 (Initial Assessment).
      Generate 5 questions that broadly cover the selected fields: ${categoriesStr}.
      The goal is to gauge Mentality, Interest, and Willingness to learn.
    `;
  }

  const prompt = `
    You are an expert Career Counselor. You are talking to a Class ${studentClass} student.
    
    YOUR GOAL: Perform a "Deep Psychometric & Aptitude Discovery".
    The user is likely anxious about their future. Do NOT behave like a teacher giving an exam. Behave like a mentor trying to understand what makes them tick.
    
    Target Student: Class ${studentClass}
    Selected Fields: ${categoriesStr}
    
    ${contextPrompt}

    STRICT GUIDELINES FOR QUESTION GENERATION:
    1. **NO TEXTBOOK DEFINITIONS**: Do NOT ask "What is the formula for..." or "Define X". The student can Google that.
    2. **FOCUS ON MENTALITY (40%)**: Ask questions to test Resilience, Patience, Curiosity, and Stress Tolerance.
    3. **FOCUS ON INTEREST (40%)**: Ask "A vs B" scenarios to find what they naturally enjoy.
    4. **BASIC DOMAIN INTUITION (20%)**: Ask *conceptual* questions to see if they have the *aptitude*.

    CLARITY INSTRUCTIONS:
    - Questions must be **self-contained** and easy to read.
    - If asking a situational question (e.g., "You hit a wall in a project"), ensure the options are **distinct behaviors**, not vague feelings.
      - BAD Option: "I feel bad."
      - GOOD Option: "I take a break and come back later." or "I keep trying until I solve it."
    - Avoid ambiguous phrasing. Explicitly state the context of the situation.
    - **FOR SCALE QUESTIONS**: Ensure the wording aligns with a 1-5 Scale where **1 is "Strongly Disagree" or "Worst"** and **5 is "Strongly Agree" or "Best"**.

    Generate EXACTLY 5 questions following this mix:
    - Question 1: Pure Psychology/Mentality (Grit, Leadership, Introvert/Extrovert).
    - Question 2: Specific Interest Scenario (A vs B choice within the selected fields).
    - Question 3: Real-world Problem Solving (How would they approach a vague problem?).
    - Question 4: Lifestyle/Work Environment Preference.
    - Question 5: Technical Intuition (Simple concept check, but phrased as a scenario).

    Use a mix of 'scale' (for personality/willingness), 'multiple_choice' (for scenarios), and 'text'.
    IMPORTANT: For EVERY 'multiple_choice' question, you MUST include "I don't know" or "Unsure" as the final option.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: QuestionSchema,
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

export const analyzeProfile = async (profile: AssessmentProfile): Promise<CareerRecommendation[]> => {
  const categoriesStr = profile.categories.join(", ");
  const prompt = `
    You are a Senior Career Strategist.
    
    CLIENT PROFILE:
    - Class: ${profile.studentClass}
    - Budget: ₹${profile.yearlyBudgetINR}/year
    - Location Constraint: ${profile.willingnessToTravel}
    - Living in: ${profile.locationCurrent}
    - Years to Invest: ${profile.yearsToInvest}
    
    ASSESSMENT DATA (Answers to psychometric and situational questions):
    ${JSON.stringify(profile.answers)}

    YOUR TASK:
    Recommend 3 careers based PRIMARILY on **Mentality, Personality, and Interest** (70% weight), and secondarily on **Technical Knowledge** (30% weight).
    
    CORE PHILOSOPHY:
    - **Mentality > Memorization**: A 12th grader can learn technical skills, but they cannot easily change their personality.
    - **Identify the Vibe**: Is this student a "Builder", a "Thinker", a "Leader", or a "Helper"?
    - **Brutally Honest**: If they have a "lazy" mentality but want a "high-grind" career (like Medicine or CA), tell them honestly that they will fail unless they change.

    OUTPUT:
    Return 3 distinct recommendations:
    1. **The Soulmate Career**: Matches their psychology and natural interest perfectly (Best Fit).
    2. **The Strategic Bet**: A balance of their current skills and high market demand.
    3. **The Moonshot**: A high-reward career that fits their personality but requires hard work.

    For each, provide:
    - Aptitude Score (0-100): Based on *Psychological Fit*.
    - Reality Check: Focus on the LIFESTYLE and STRUGGLE of the career. (e.g., "Software Engineering isn't just coding; it's sitting for 10 hours debugging. Do you have the patience?").
    - Reason Why Chosen: Explicitly link their personality traits to the career.
    - Feasibility: Assess based on their budget and location constraints.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RecommendationListSchema,
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data.recommendations || [];
  } catch (error) {
    console.error("Error analyzing profile:", error);
    return [];
  }
};

export const generateRoadmap = async (careerTitle: string, currentClass: string, duration: number): Promise<RoadmapStep[]> => {
  const prompt = `
    Create a comprehensive, step-by-step career roadmap for becoming a ${careerTitle} in India.
    Current Status: Class ${currentClass} Student.
    Time Horizon: ${duration} years.

    Generate 4-6 distinct phases (e.g., "Foundation & Entrance Prep", "Undergraduate Studies", "Skill Specialization", "Internships & Portfolio", "Job Hunt").

    For EACH phase, strictly provide:
    1. Phase Name
    2. Duration (e.g., "1 Year", "6 Months")
    3. Milestones: 3-4 clear, actionable bullet points on EXACTLY what to do next (e.g., "Register for JEE Mains", "Learn Python Basics on Codecademy", "Apply for internships at X type of companies").
    4. Resources: Specific names of Exams, Books, Online Courses (Coursera, Udemy, etc.), or Portals.
    5. Location Advice: Specific education hubs or job market cities in India relevant to this phase (e.g., "Kota for Prep", "Bangalore/Pune for IT jobs", "Mumbai for Finance").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RoadmapSchema,
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return [];
  }
};

export const generateWeeklyQuiz = async (
  completedTasks: WeeklyTask[]
): Promise<WeeklyQuiz> => {
  if (completedTasks.length === 0) return { questions: [] };

  const taskTexts = completedTasks.map(t => t.text).join("; ");
  
  const prompt = `
    The student has completed the following Learning tasks this week:
    "${taskTexts}"

    Generate 3 multiple-choice verification questions to test if they actually understood these specific topics.
    
    CRITICAL INSTRUCTIONS:
    1. **STRICT RELEVANCE**: Questions must be derived EXCLUSIVELY from the specific tasks listed above. Do not ask about general topics not covered in the tasks.
    2. **CONCEPTUAL CHECK**: Do not just ask for definitions. Ask conceptual questions that prove they did the work.
    3. **OPTIONS**: Provide 4 clear options. One correct, three plausible distractors.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: QuizSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      questions: data.questions,
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    return { questions: [] };
  }
};

export const generateWeeklyPlan = async (
  careerTitle: string,
  currentPhase: string,
  weekNumber: number,
  previousPlan?: WeeklyPlan
): Promise<WeeklyPlan> => {
  
  let adaptationContext = "";
  
  if (previousPlan) {
    const completedCount = previousPlan.tasks.filter(t => t.isCompleted).length;
    const totalCount = previousPlan.tasks.length;
    const rate = Math.round((completedCount / totalCount) * 100);
    
    const quizPassed = previousPlan.quiz?.passed;
    const quizScore = previousPlan.quiz?.score; // e.g., 2 (out of 3)
    
    // --- LOGIC: Combine Completion Rate + Quiz Score for Adaptation ---
    
    if (quizPassed === false) {
       // Case: FAILED QUIZ -> Remedial Week
       adaptationContext = `
         CRITICAL STATUS: The student completed tasks but FAILED the verification quiz (Score: ${quizScore}/3).
         They did not understand the concepts from Week ${previousPlan.weekNumber}.
         
         ACTION: Create a REMEDIAL PLAN. 
         - **Re-assign the core topics from last week**. Do NOT move to new topics yet.
         - Change the resources (e.g., if they read a book last time, suggest a YouTube tutorial this time).
         - Lower the difficulty.
         - Week Title should be "Remedial: [Topic Name]".
         
         Previous Tasks (that they failed to learn): ${JSON.stringify(previousPlan.tasks)}
       `;
    } else if (rate < 50) {
      // Case: LOW COMPLETION -> Easier Week
      adaptationContext = `
        STATUS: The student struggled with consistency. They only completed ${rate}% of the tasks.
        ACTION: Make this week's tasks EASIER and FEWER (max 4 tasks).
        Break down the previous incomplete tasks into smaller steps.
        Previous Incomplete Tasks: ${JSON.stringify(previousPlan.tasks.filter(t => !t.isCompleted))}
      `;
    } else if (rate === 100 && (quizScore === 3 || quizScore === undefined)) {
       // Case: PERFECT WEEK -> Challenge Week
      adaptationContext = `
        STATUS: The student CRUSHED last week (100% completion, Perfect Quiz).
        ACTION: CHALLENGE them. Introduce a slightly advanced concept or a mini-project.
      `;
    } else {
      // Case: STANDARD -> Continue
      adaptationContext = `
        STATUS: Good progress (${rate}% completion).
        ACTION: Continue with the standard roadmap progression.
      `;
    }
  } else {
    adaptationContext = "This is the VERY FIRST week. Start with foundational, easy wins to build momentum. Pick the first few milestones from the roadmap phase.";
  }

  const prompt = `
    You are an AI Accountability Coach.
    Career Goal: ${careerTitle}
    Current Phase: ${currentPhase}
    Week Number: ${weekNumber}
    
    ${adaptationContext}

    Generate a Weekly Plan.
    1. **Week Title**: A catchy theme.
    2. **AI Feedback**: A 1-sentence comment based on their previous performance (stats + quiz result).
    3. **Tasks**: Generate exactly 5-7 actionable, checkbox-style tasks.
       - Categories: 'Learning' (Studying), 'Practice' (Doing), 'Networking' (Connecting/Researching).
       - Tasks must be concrete (e.g., NOT "Learn Java", BUT "Complete Chapter 1 of Head First Java").

    Output JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: WeeklyPlanSchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      weekNumber: weekNumber,
      title: data.weekTitle,
      tasks: data.tasks.map((t: any) => ({...t, isCompleted: false})),
      status: 'active',
      completionRate: 0,
      aiFeedback: data.aiFeedback
    };

  } catch (error) {
    console.error("Error generating weekly plan:", error);
    // Fallback stub
    return {
      weekNumber: weekNumber,
      title: "Plan Generation Failed",
      tasks: [],
      status: 'active',
      completionRate: 0,
      aiFeedback: "Error connecting to AI coach."
    };
  }
};