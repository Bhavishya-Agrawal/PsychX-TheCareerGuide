
import React, { useState, useEffect } from 'react';
import { User, UserRole, SubscriptionTier, FAQItem, Session, ConsultantAvailability } from './types';
import { Navbar, Sidebar } from './components/Layout';
import { Auth } from './pages/Auth';
import { UserPortal } from './pages/UserPortal';
import { AdminPortal } from './pages/AdminPortal';
import { ConsultantPortal } from './pages/ConsultantPortal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- Global Data State ---

  const [allUsers, setAllUsers] = useState<User[]>([
    // Mock Users
    { id: 'u1', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul@example.com', role: UserRole.USER, tier: SubscriptionTier.STANDARD, currentClass: '12th' },
    { id: 'u2', firstName: 'Priya', lastName: 'Singh', email: 'priya@example.com', role: UserRole.USER, tier: SubscriptionTier.FREE, currentClass: '10th' },
    // Mock Consultants
    { id: 'c1', firstName: 'Dr. Amit', lastName: 'Patel', email: 'amit@expert.com', role: UserRole.CONSULTANT, tier: SubscriptionTier.FREE, currentClass: '' },
    { id: 'c2', firstName: 'Sarah', lastName: 'Khan', email: 'sarah@expert.com', role: UserRole.CONSULTANT, tier: SubscriptionTier.FREE, currentClass: '' },
  ]);

  const [sessions, setSessions] = useState<Session[]>([
    { 
      id: 's1', 
      studentId: 'u1', 
      studentName: 'Rahul Sharma', 
      consultantId: 'c1', 
      consultantName: 'Dr. Amit Patel', 
      date: new Date().toISOString().split('T')[0], // Today
      time: '10:00', 
      status: 'Scheduled' 
    }
  ]);

  const [availabilities, setAvailabilities] = useState<ConsultantAvailability[]>([
    { consultantId: 'c1', days: ['Monday', 'Wednesday', 'Friday'], startTime: '09:00', endTime: '17:00' },
    { consultantId: 'c2', days: ['Tuesday', 'Thursday', 'Saturday'], startTime: '10:00', endTime: '18:00' }
  ]);

  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      category: 'General',
      question: 'How does the career assessment work?',
      answer: 'Our assessment uses a multi-stage adaptive process. We start with broad interest categories, then drill down into specific skills, and finally assess psychological fit.'
    },
    {
      id: '2',
      category: 'Billing',
      question: 'Can I upgrade my plan later?',
      answer: 'Yes, you can upgrade from FreeBe to Standard at any time.'
    }
  ]);

  // --- Handlers ---

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // In a real app, we would fetch that user's data here
    setActiveTab('dashboard');
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (user) {
      const updatedUser = { ...user, tier };
      setUser(updatedUser);
      setAllUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
      alert(`Successfully upgraded to ${tier}!`);
    }
  };

  const handleUpdateAvailability = (newAvailability: ConsultantAvailability) => {
    setAvailabilities(prev => {
      const existingIndex = prev.findIndex(a => a.consultantId === newAvailability.consultantId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newAvailability;
        return updated;
      }
      return [...prev, newAvailability];
    });
  };

  const handleAdminUpdateSession = (newSessions: Session[]) => {
    setSessions(newSessions);
  };

  const handleBookSession = (date: string, time: string): { success: boolean; message: string; consultantName?: string } => {
    if (!user) return { success: false, message: 'Not logged in' };

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Filter Available Consultants based on Day and Time
    const availableConsultants = allUsers.filter(u => u.role === UserRole.CONSULTANT).filter(consultant => {
      const avail = availabilities.find(a => a.consultantId === consultant.id);
      if (!avail) return false;
      
      // Check Day
      if (!avail.days.includes(dayOfWeek)) return false;

      // Check Time Range
      // Simple string comparison works for HH:MM format
      if (time < avail.startTime || time > avail.endTime) return false;

      // Check for Conflicts
      const hasConflict = sessions.some(s => 
        s.consultantId === consultant.id && 
        s.date === date && 
        s.time === time && 
        s.status !== 'Cancelled'
      );

      return !hasConflict;
    });

    if (availableConsultants.length === 0) {
      return { success: false, message: 'At this given time, no counselor is available. Please select another time.' };
    }

    // 2. Assign Consultant (Simple Round Robin or First Available)
    // In a real app, we'd prioritize higher tier consultants or load balance
    const assignedConsultant = availableConsultants[0];

    const newSession: Session = {
      id: Date.now().toString(),
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      consultantId: assignedConsultant.id,
      consultantName: `${assignedConsultant.firstName} ${assignedConsultant.lastName}`,
      date,
      time,
      status: 'Scheduled'
    };

    setSessions([...sessions, newSession]);

    return { success: true, message: 'Session confirmed!', consultantName: assignedConsultant.firstName + ' ' + assignedConsultant.lastName };
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        user={user} 
        onLogout={() => setUser(null)} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          role={user.role} 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 overflow-y-auto relative">
          {user.role === UserRole.USER && (
            <UserPortal 
              user={user} 
              activeView={activeTab}
              onNavigate={setActiveTab}
              upgradeTier={handleUpgrade}
              faqs={faqs}
              sessions={sessions.filter(s => s.studentId === user.id)}
              onBookSession={handleBookSession}
            />
          )}
          
          {user.role === UserRole.ADMIN && (
            <AdminPortal 
              activeView={activeTab}
              faqs={faqs}
              onUpdateFAQs={setFaqs}
              allUsers={allUsers}
              sessions={sessions}
              onUpdateSessions={handleAdminUpdateSession}
            />
          )}

          {user.role === UserRole.CONSULTANT && (
            <ConsultantPortal 
                activeView={activeTab} 
                user={user}
                sessions={sessions.filter(s => s.consultantId === user.id)}
                availability={availabilities.find(a => a.consultantId === user.id)}
                onUpdateAvailability={handleUpdateAvailability}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
