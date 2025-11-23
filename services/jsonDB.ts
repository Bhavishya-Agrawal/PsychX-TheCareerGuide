/**
 * JSON Database Service
 * Provides data persistence using localStorage with JSON structure
 * Automatically syncs with database.json structure
 */

import { User, UserRole, SubscriptionTier, Session, ConsultantAvailability, FAQItem, AssessmentResult, RoadmapEntry, ProgressTracker } from '../types';

// Database structure interface
interface Database {
  users: User[];
  sessions: Session[];
  availability: ConsultantAvailability[];
  faqs: FAQItem[];
  assessments: AssessmentResult[];
  roadmaps: RoadmapEntry[];
  progress: ProgressTracker[];
}

// Default database structure (matches database.json)
const getDefaultDatabase = (): Database => ({
  users: [
    { id: 'u1', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul@example.com', password: 'student123', role: UserRole.USER, tier: SubscriptionTier.STANDARD, currentClass: '12th' },
    { id: 'u2', firstName: 'Priya', lastName: 'Singh', email: 'priya@example.com', password: 'student123', role: UserRole.USER, tier: SubscriptionTier.FREE, currentClass: '10th' },
    { id: 'a1', firstName: 'System', lastName: 'Admin', email: 'admin@psychx.com', password: 'admin123', role: UserRole.ADMIN, currentClass: '' },
    { id: 'c1', firstName: 'Dr. Amit', lastName: 'Patel', email: 'consultant@psychx.com', password: 'consultant123', role: UserRole.CONSULTANT, currentClass: '' },
    { id: 'c2', firstName: 'Sarah', lastName: 'Khan', email: 'sarah@expert.com', password: 'consultant123', role: UserRole.CONSULTANT, currentClass: '' },
  ],
  sessions: [
    { 
      id: 's1', 
      studentId: 'u1', 
      studentName: 'Rahul Sharma', 
      consultantId: 'c1', 
      consultantName: 'Dr. Amit Patel', 
      date: new Date().toISOString().split('T')[0], 
      time: '10:00', 
      status: 'Scheduled' 
    }
  ],
  availability: [
    { consultantId: 'c1', days: ['Monday', 'Wednesday', 'Friday'], startTime: '09:00', endTime: '17:00' },
    { consultantId: 'c2', days: ['Tuesday', 'Thursday', 'Saturday'], startTime: '10:00', endTime: '18:00' }
  ],
  faqs: [
    {
      id: '1',
      category: 'General',
      question: 'How does the career assessment work?',
      answer: 'Our assessment uses a multi-stage adaptive process. We start with broad interest categories, then drill down into specific skills, and finally assess psychological fit.',
      status: 'answered'
    },
    {
      id: '2',
      category: 'Billing',
      question: 'Can I upgrade my plan later?',
      answer: 'Yes, you can upgrade from Free to Standard at any time.',
      status: 'answered'
    },
    {
      id: '3',
      category: 'Technical',
      question: 'How is my data stored?',
      answer: 'Your data is stored locally in your browser and also synced to our JSON database for persistence. All sensitive information is encrypted.',
      status: 'answered'
    },
    {
      id: '4',
      category: 'General',
      question: 'What makes PsychX different from other career platforms?',
      answer: 'PsychX uses advanced AI to provide brutally honest feedback, adapts to your learning pace, and verifies your progress through weekly quizzes. It\'s not just assessment - it\'s accountability.',
      status: 'answered'
    }
  ],
  assessments: [],
  roadmaps: [],
  progress: []
});

// Storage key for the entire database
const DB_STORAGE_KEY = 'psychx_db';

/**
 * Database Class - Handles all data persistence operations
 */
class JSONDatabase {
  private data: Database;
  private autoSave: boolean = true;

  constructor() {
    this.data = this.loadDatabase();
  }

  /**
   * Load database from localStorage or initialize with defaults
   */
  private loadDatabase(): Database {
    try {
      // Check for old storage key and clear it
      const oldKey = localStorage.getItem('pathfinder_db');
      if (oldKey) {
        console.log('🔄 Clearing old database key...');
        localStorage.removeItem('pathfinder_db');
      }

      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Validate that users have password field (migration check)
        if (parsed.users && parsed.users.length > 0) {
          const firstUser = parsed.users[0];
          if (!firstUser.password) {
            console.log('🔄 Database missing password field, resetting...');
            const defaultDB = getDefaultDatabase();
            this.saveDatabase(defaultDB);
            return defaultDB;
          }
        }
        
        console.log('✅ Database loaded from localStorage');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
    }
    
    console.log('🔄 Initializing new database with default data');
    const defaultDB = getDefaultDatabase();
    this.saveDatabase(defaultDB);
    return defaultDB;
  }

  /**
   * Save database to localStorage
   */
  private saveDatabase(data?: Database): void {
    try {
      const dataToSave = data || this.data;
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(dataToSave, null, 2));
      console.log('💾 Database saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving database:', error);
    }
  }

  /**
   * Auto-save after operations (if enabled)
   */
  private persist(): void {
    if (this.autoSave) {
      this.saveDatabase();
    }
  }

  /**
   * Export database as JSON string
   */
  exportJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import database from JSON string
   */
  importJSON(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      this.data = imported;
      this.saveDatabase();
      console.log('✅ Database imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing database:', error);
      return false;
    }
  }

  /**
   * Reset database to defaults
   */
  reset(): void {
    this.data = getDefaultDatabase();
    this.saveDatabase();
    console.log('🔄 Database reset to defaults');
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      users: this.data.users.length,
      sessions: this.data.sessions.length,
      faqs: this.data.faqs.length,
      assessments: this.data.assessments.length,
      roadmaps: this.data.roadmaps.length,
      progressTrackers: this.data.progress.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // ==================== USER OPERATIONS ====================
  
  users = {
    getAll: (): User[] => [...this.data.users],
    
    getById: (id: string): User | undefined => 
      this.data.users.find(u => u.id === id),
    
    getByEmail: (email: string): User | undefined => 
      this.data.users.find(u => u.email === email),
    
    create: (user: User): User => {
      this.data.users.push(user);
      this.persist();
      return user;
    },
    
    update: (id: string, updates: Partial<User>): User | null => {
      const index = this.data.users.findIndex(u => u.id === id);
      if (index !== -1) {
        this.data.users[index] = { ...this.data.users[index], ...updates };
        this.persist();
        return this.data.users[index];
      }
      return null;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.users.length;
      this.data.users = this.data.users.filter(u => u.id !== id);
      const deleted = this.data.users.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    },
    
    login: (email: string, password: string): User | undefined => 
      this.data.users.find(u => u.email === email && u.password === password)
  };

  // ==================== SESSION OPERATIONS ====================
  
  sessions = {
    getAll: (): Session[] => [...this.data.sessions],
    
    getById: (id: string): Session | undefined => 
      this.data.sessions.find(s => s.id === id),
    
    getByStudent: (studentId: string): Session[] => 
      this.data.sessions.filter(s => s.studentId === studentId),
    
    getByConsultant: (consultantId: string): Session[] => 
      this.data.sessions.filter(s => s.consultantId === consultantId),
    
    create: (session: Session): Session => {
      this.data.sessions.push(session);
      this.persist();
      return session;
    },
    
    update: (id: string, updates: Partial<Session>): Session | null => {
      const index = this.data.sessions.findIndex(s => s.id === id);
      if (index !== -1) {
        this.data.sessions[index] = { ...this.data.sessions[index], ...updates };
        this.persist();
        return this.data.sessions[index];
      }
      return null;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.sessions.length;
      this.data.sessions = this.data.sessions.filter(s => s.id !== id);
      const deleted = this.data.sessions.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };

  // ==================== AVAILABILITY OPERATIONS ====================
  
  availability = {
    getAll: (): ConsultantAvailability[] => [...this.data.availability],
    
    getByConsultantId: (consultantId: string): ConsultantAvailability | undefined => 
      this.data.availability.find(a => a.consultantId === consultantId),
    
    upsert: (avail: ConsultantAvailability): ConsultantAvailability => {
      const index = this.data.availability.findIndex(a => a.consultantId === avail.consultantId);
      if (index !== -1) {
        this.data.availability[index] = avail;
      } else {
        this.data.availability.push(avail);
      }
      this.persist();
      return avail;
    },
    
    delete: (consultantId: string): boolean => {
      const initialLength = this.data.availability.length;
      this.data.availability = this.data.availability.filter(a => a.consultantId !== consultantId);
      const deleted = this.data.availability.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };

  // ==================== FAQ OPERATIONS ====================
  
  faqs = {
    getAll: (): FAQItem[] => [...this.data.faqs],
    
    getById: (id: string): FAQItem | undefined => 
      this.data.faqs.find(f => f.id === id),
    
    getByCategory: (category: string): FAQItem[] => 
      this.data.faqs.filter(f => f.category === category),
    
    getPending: (): FAQItem[] => 
      this.data.faqs.filter(f => f.status === 'pending'),
    
    create: (faq: FAQItem): FAQItem => {
      this.data.faqs.push(faq);
      this.persist();
      return faq;
    },
    
    update: (id: string, updates: Partial<FAQItem>): FAQItem | null => {
      const index = this.data.faqs.findIndex(f => f.id === id);
      if (index !== -1) {
        this.data.faqs[index] = { ...this.data.faqs[index], ...updates };
        this.persist();
        return this.data.faqs[index];
      }
      return null;
    },
    
    updateAll: (faqs: FAQItem[]): FAQItem[] => {
      this.data.faqs = faqs;
      this.persist();
      return this.data.faqs;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.faqs.length;
      this.data.faqs = this.data.faqs.filter(f => f.id !== id);
      const deleted = this.data.faqs.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };

  // ==================== ASSESSMENT OPERATIONS ====================
  
  assessments = {
    getAll: (): AssessmentResult[] => [...this.data.assessments],
    
    getById: (id: string): AssessmentResult | undefined => 
      this.data.assessments.find(a => a.id === id),
    
    getAllByUserId: (userId: string): AssessmentResult[] => 
      this.data.assessments.filter(a => a.userId === userId),
    
    getLatestByUserId: (userId: string): AssessmentResult | null => {
      const userResults = this.data.assessments.filter(a => a.userId === userId);
      return userResults.length > 0 ? userResults[userResults.length - 1] : null;
    },
    
    save: (assessment: AssessmentResult): AssessmentResult => {
      this.data.assessments.push(assessment);
      this.persist();
      return assessment;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.assessments.length;
      this.data.assessments = this.data.assessments.filter(a => a.id !== id);
      const deleted = this.data.assessments.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };

  // ==================== ROADMAP OPERATIONS ====================
  
  roadmaps = {
    getAll: (): RoadmapEntry[] => [...this.data.roadmaps],
    
    getById: (id: string): RoadmapEntry | undefined => 
      this.data.roadmaps.find(r => r.id === id),
    
    getAllByUserId: (userId: string): RoadmapEntry[] => 
      this.data.roadmaps.filter(r => r.userId === userId),
    
    save: (roadmap: RoadmapEntry): RoadmapEntry => {
      this.data.roadmaps.push(roadmap);
      this.persist();
      return roadmap;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.roadmaps.length;
      this.data.roadmaps = this.data.roadmaps.filter(r => r.id !== id);
      const deleted = this.data.roadmaps.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };

  // ==================== PROGRESS TRACKER OPERATIONS ====================
  
  progress = {
    getAll: (): ProgressTracker[] => [...this.data.progress],
    
    getById: (id: string): ProgressTracker | undefined => 
      this.data.progress.find(p => p.id === id),
    
    getByUserId: (userId: string): ProgressTracker[] => 
      this.data.progress.filter(p => p.userId === userId),
    
    getByRoadmapId: (roadmapId: string): ProgressTracker | undefined => 
      this.data.progress.find(p => p.roadmapId === roadmapId),
    
    save: (tracker: ProgressTracker): ProgressTracker => {
      const index = this.data.progress.findIndex(p => p.id === tracker.id);
      if (index !== -1) {
        this.data.progress[index] = tracker;
      } else {
        this.data.progress.push(tracker);
      }
      this.persist();
      return tracker;
    },
    
    delete: (id: string): boolean => {
      const initialLength = this.data.progress.length;
      this.data.progress = this.data.progress.filter(p => p.id !== id);
      const deleted = this.data.progress.length < initialLength;
      if (deleted) this.persist();
      return deleted;
    }
  };
}

// Create and export singleton instance
export const jsonDB = new JSONDatabase();

// Export for direct access if needed
export default jsonDB;

// Also make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).jsonDB = jsonDB;
  console.log('🗄️ JSON Database initialized. Access via window.jsonDB for debugging.');
}
