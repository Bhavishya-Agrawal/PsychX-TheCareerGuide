

import React from 'react';
import { User, UserRole } from '../types';
import { 
  LogOut, 
  LayoutDashboard, 
  Map, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Video,
  Menu,
  X,
  CreditCard,
  HelpCircle,
  Clock,
  Briefcase,
  Target
} from 'lucide-react';
import { Button } from './UI';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  toggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, toggleSidebar }) => {
  return (
    <nav 
      className="sticky top-0 z-40 w-full backdrop-blur-xl h-20 flex items-center justify-between px-6 lg:px-12 pearl-transition"
      style={{ 
        background: 'rgba(245, 243, 239, 0.9)',
        borderBottom: '1px solid rgba(26, 26, 26, 0.08)'
      }}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden p-2 rounded-xl pearl-transition hover:bg-white"
          style={{ color: 'var(--navy)' }}
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ background: 'var(--navy)' }}
          >
            P
          </div>
          <span className="font-bold text-2xl hidden sm:block pearl-heading" style={{ letterSpacing: '-0.02em' }}>
            PathFinder AI
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex flex-col items-end">
            <span className="text-base font-semibold pearl-heading">{user.firstName} {user.lastName}</span>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--gray)' }}>
              {user.role} {user.tier ? `• ${user.tier}` : ''}
            </span>
          </div>
        )}
        {user && (
          <button
            onClick={onLogout}
            className="p-3 rounded-xl pearl-transition hover:bg-white"
            style={{ color: 'var(--navy)' }}
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </nav>
  );
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, role, activeTab, onTabChange }) => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const userItems = [
    { id: 'assessment', label: 'Career Assessment', icon: BarChart3 },
    { id: 'roadmap', label: 'My Roadmap', icon: Map },
    { id: 'progress', label: 'Progress Tracker', icon: Target }, // New Item
    { id: 'consultation', label: 'Consultation Room', icon: Video },
    { id: 'subscription', label: 'Subscription Plan', icon: CreditCard },
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle },
  ];

  const adminItems = [
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'consultants', label: 'Manage Consultants', icon: Briefcase },
    { id: 'sessions', label: 'Manage Sessions', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content & FAQ', icon: MessageSquare },
  ];

  const consultantItems = [
    { id: 'sessions', label: 'My Sessions', icon: Video },
    { id: 'availability', label: 'My Availability', icon: Clock },
  ];

  let items = baseItems;
  if (role === UserRole.USER) items = [...baseItems, ...userItems];
  if (role === UserRole.ADMIN) items = [...baseItems, ...adminItems];
  if (role === UserRole.CONSULTANT) items = [...baseItems, ...consultantItems];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          style={{ background: 'rgba(26, 26, 26, 0.3)' }}
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          background: 'var(--white)',
          borderRight: '1px solid rgba(26, 26, 26, 0.08)'
        }}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <span className="font-bold text-xl pearl-heading">Menu</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl pearl-transition hover:bg-gray-50"
            >
              <X size={24} style={{ color: 'var(--navy)' }} />
            </button>
          </div>
          
          <div className="space-y-2 flex-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium pearl-transition ${
                  activeTab === item.id ? '' : ''
                }`}
                style={activeTab === item.id ? {
                  background: 'var(--navy)',
                  color: 'var(--white)',
                  transform: 'translateX(4px)'
                } : {
                  color: 'var(--charcoal)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.background = 'var(--cream)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <item.icon size={22} />
                {item.label}
              </button>
            ))}
          </div>

          <div 
            className="p-5 rounded-2xl"
            style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)' }}
          >
            <h4 className="text-xs font-bold uppercase mb-2 tracking-wider" style={{ color: 'var(--gray)' }}>
              Status
            </h4>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--navy)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              System Operational
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};