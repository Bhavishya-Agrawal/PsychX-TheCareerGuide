
import React, { useState, useEffect } from 'react';
import { User, UserRole, SubscriptionTier } from './types';
import { Navbar, Sidebar } from './components/Layout';
import { Auth } from './pages/Auth';
import { UserPortal } from './pages/UserPortal';
import { AdminPortal } from './pages/AdminPortal';
import { ConsultantPortal } from './pages/ConsultantPortal';
import { db } from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  
  // State to force re-render in child components when DB changes
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // Also refresh current user if logged in to catch tier changes
    if (user) {
      const freshUser = db.users.getById(user.id);
      if (freshUser) setUser(freshUser);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  // Landing Page
  if (showLanding && !user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#1A1A1A] tracking-tight pearl-heading">
            Your Brutally Honest<br />Career Guide.
          </h1>
          <button
            onClick={() => setShowLanding(false)}
            className="px-12 py-4 bg-[#1A1A1A] text-white rounded-full text-lg font-semibold hover:bg-[#2D2D2D] transition-all duration-300 hover:scale-105 hover:shadow-xl pearl-transition"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

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
              key={refreshKey} // Force re-render on refresh
              user={user} 
              activeView={activeTab}
              onNavigate={setActiveTab}
              refreshData={triggerRefresh}
            />
          )}
          
          {user.role === UserRole.ADMIN && (
            <AdminPortal 
              key={refreshKey}
              activeView={activeTab}
              refreshData={triggerRefresh}
            />
          )}

          {user.role === UserRole.CONSULTANT && (
            <ConsultantPortal 
                key={refreshKey}
                activeView={activeTab} 
                user={user}
                refreshData={triggerRefresh}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
