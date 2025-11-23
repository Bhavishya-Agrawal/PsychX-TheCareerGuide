
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { Calendar, Clock, Video, Save } from 'lucide-react';
import { Session, User as UserType, ConsultantAvailability } from '../types';
import { db } from '../services/db';

interface ConsultantPortalProps {
    activeView: string;
    user: UserType;
    refreshData: () => void;
}

export const ConsultantPortal: React.FC<ConsultantPortalProps> = ({ activeView, user, refreshData }) => {
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<ConsultantAvailability | undefined>(undefined);
  
  // Form state
  const [availForm, setAvailForm] = useState<ConsultantAvailability>({
      consultantId: user.id,
      days: [],
      startTime: '09:00',
      endTime: '17:00'
  });

  useEffect(() => {
    // Fetch data from Persistent DB
    const allSessions = db.sessions.getAll();
    setSessions(allSessions.filter(s => s.consultantId === user.id));

    const avail = db.availability.getByConsultantId(user.id);
    if (avail) {
      setAvailability(avail);
      setAvailForm(avail);
    } else {
      setAvailForm({
        consultantId: user.id,
        days: ['Monday', 'Wednesday', 'Friday'], // Default defaults
        startTime: '09:00',
        endTime: '17:00'
      });
    }
  }, [activeView, user.id]);

  const toggleDay = (day: string) => {
    if (availForm.days.includes(day)) {
        setAvailForm({...availForm, days: availForm.days.filter(d => d !== day)});
    } else {
        setAvailForm({...availForm, days: [...availForm.days, day]});
    }
  };

  const handleUpdateAvailability = () => {
    db.availability.upsert(availForm);
    setAvailability(availForm);
    refreshData();
    alert('Availability saved successfully.');
  };

  const isSessionJoinable = (dateStr: string, timeStr: string) => {
      const sessionDate = new Date(dateStr);
      const today = new Date();
      
      // Check if same day
      if (sessionDate.toDateString() !== today.toDateString()) return false;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const sessionTime = new Date(today);
      sessionTime.setHours(hours, minutes, 0);

      const diffInMinutes = (sessionTime.getTime() - today.getTime()) / 1000 / 60;

      // Joinable if within 10 mins before start or 30 mins after start
      return diffInMinutes > -30 && diffInMinutes < 10;
  };

  const renderSessions = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Consultant Workspace</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-slate-700">My Sessions</h2>
          {sessions.length === 0 && <div className="text-slate-500">No sessions scheduled.</div>}
          {sessions.map((session) => {
            const joinable = isSessionJoinable(session.date, session.time);
            return (
            <Card key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-400 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-800 font-bold">
                  {session.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{session.studentName}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {session.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {session.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {joinable ? (
                    <Button className="text-xs bg-emerald-600 hover:bg-emerald-700"><Video size={14} className="mr-2"/> Join Room</Button>
                ) : (
                    <Button disabled variant="outline" className="text-xs">
                        {new Date(session.date) < new Date() && !joinable ? 'Completed' : 'Join Later'}
                    </Button>
                )}
              </div>
            </Card>
          )})}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800 text-white border-none">
            <h3 className="font-bold text-lg mb-2">Overview</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-xs text-slate-300">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-xs text-slate-300">Rating</p>
                <p className="text-2xl font-bold">4.9</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => (
      <div className="space-y-6 animate-fade-in max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-800">Manage Availability</h2>
          <Card>
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Working Days</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <label key={day} className={`flex items-center justify-center p-2 rounded border cursor-pointer transition-all ${availForm.days.includes(day) ? 'bg-slate-800 border-slate-800 text-white font-medium' : 'border-slate-200 hover:bg-slate-50'}`}>
                                  <input 
                                      type="checkbox" 
                                      className="hidden"
                                      checked={availForm.days.includes(day)}
                                      onChange={() => toggleDay(day)}
                                  />
                                  {day}
                              </label>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                          type="time" 
                          label="Start Time" 
                          value={availForm.startTime}
                          onChange={e => setAvailForm({...availForm, startTime: e.target.value})}
                      />
                      <Input 
                          type="time" 
                          label="End Time" 
                          value={availForm.endTime}
                          onChange={e => setAvailForm({...availForm, endTime: e.target.value})}
                      />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                      <Button onClick={handleUpdateAvailability} className="w-full">
                          <Save size={16} className="mr-2"/> Save Availability
                      </Button>
                  </div>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
       {activeView === 'dashboard' && renderSessions()}
       {activeView === 'sessions' && renderSessions()}
       {activeView === 'availability' && renderAvailability()}
    </div>
  );
};
