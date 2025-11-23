
import React, { useState } from 'react';
import { UserRole, SubscriptionTier, User } from '../types';
import { Button, Input, Card } from '../components/UI';
import { db } from '../services/db';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: UserRole.USER, // Default
    class: '10th'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (isLogin) {
        // Login - check if user exists with correct password
        const user = db.users.login(formData.email, formData.password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid email or password.');
          setLoading(false);
          return;
        }
      } else {
        // Simulate Signup
        const existing = db.users.getByEmail(formData.email);
        if (existing) {
          setError('User with this email already exists.');
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: Date.now().toString(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: UserRole.USER, // Force role to USER for signup
          tier: SubscriptionTier.FREE,
          currentClass: formData.class
        };
        db.users.create(newUser);
        onLogin(newUser);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-slide-up">
          <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-2xl shadow-black/10 animate-scale-in" style={{ background: 'var(--navy)' }}>
            P
          </div>
          <h1 className="text-5xl font-bold mb-3 pearl-heading" style={{ letterSpacing: '-0.03em' }}>
            PsychX
          </h1>
          <p className="text-lg pearl-body" style={{ color: 'var(--gray)' }}>
            Your brutal, honest, data-driven career guide.
          </p>
        </div>

        <Card className="pearl-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center mb-8 pb-6" style={{ borderBottom: '1px solid var(--cream-dark)' }}>
            <button 
              onClick={() => { setIsLogin(true); setFormData({...formData, role: UserRole.USER}); setError(''); }}
              className={`px-6 py-2 text-base font-semibold pearl-transition ${isLogin ? 'border-b-3' : ''}`}
              style={{ 
                color: isLogin ? 'var(--navy)' : 'var(--gray-light)',
                borderBottom: isLogin ? '3px solid var(--navy)' : 'none'
              }}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setFormData({...formData, role: UserRole.USER}); setError(''); }}
              className={`px-6 py-2 text-base font-semibold pearl-transition ${!isLogin ? 'border-b-3' : ''}`}
              style={{ 
                color: !isLogin ? 'var(--navy)' : 'var(--gray-light)',
                borderBottom: !isLogin ? '3px solid var(--navy)' : 'none'
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="First Name" 
                  required 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
                <Input 
                  placeholder="Last Name" 
                  required 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            )}
            
            <Input 
              type="email" 
              placeholder="Email Address" 
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
            
            <Input 
              type="password" 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />

            {/* Role Selector - ONLY VISIBLE IN LOGIN (For Demo/Prototype access) */}
            {isLogin && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Role (Demo Access)</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-800 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.USER}>Student (User)</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                  <option value={UserRole.CONSULTANT}>Consultant</option>
                </select>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Current Education Level</label>
                 <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={formData.class}
                  onChange={e => setFormData({...formData, class: e.target.value})}
                >
                  <option value="10th">10th Grade</option>
                  <option value="12th">12th Grade</option>
                  <option value="Graduate">Undergraduate</option>
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#FEE', color: '#C00' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-full font-semibold text-base pearl-btn-primary mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Access Portal' : 'Create Student Account'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--gray-light)' }}>
              By continuing, you agree to our{' '}
              <a href="#" className="font-medium" style={{ color: 'var(--navy)' }}>Terms</a>
              {' & '}
              <a href="#" className="font-medium" style={{ color: 'var(--navy)' }}>Privacy Policy</a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
