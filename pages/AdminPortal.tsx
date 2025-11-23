
import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, DollarSign, Activity, TrendingUp, Edit2, Trash2, Plus, Save, Check, Clock, MessageCircle } from 'lucide-react';
import { FAQItem, User, Session, UserRole, ConsultantAvailability, SubscriptionTier } from '../types';
import { db } from '../services/db';

interface AdminPortalProps {
  activeView: string;
  refreshData: () => void; // Trigger to re-fetch data
}

const data = [
  { name: 'Jan', users: 400, revenue: 2400 },
  { name: 'Feb', users: 300, revenue: 1398 },
  { name: 'Mar', users: 200, revenue: 9800 },
  { name: 'Apr', users: 278, revenue: 3908 },
  { name: 'May', users: 189, revenue: 4800 },
  { name: 'Jun', users: 239, revenue: 3800 },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({ activeView, refreshData }) => {
  
  // Local state to hold data fetched from DB
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [availabilities, setAvailabilities] = useState<ConsultantAvailability[]>([]);

  // --- FAQ Editor State ---
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isCreatingFaq, setIsCreatingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState<Partial<FAQItem>>({});

  // --- Session Editor State ---
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState<Partial<Session>>({});

  // --- User Editor State ---
  const [editingUser, setEditingUser] = useState<string | null>(null); // ID of user being edited
  const [tempTier, setTempTier] = useState<SubscriptionTier | null>(null);


  useEffect(() => {
    // Fetch initial data from Local DB
    setAllUsers(db.users.getAll());
    setSessions(db.sessions.getAll());
    setFaqs(db.faqs.getAll());
    setAvailabilities(db.availability.getAll());
  }, [activeView, isCreatingSession, isCreatingFaq, editingUser]); // Re-fetch on view change or edit close

  // --- Handlers ---

  const handleSaveFaq = () => {
    if (!faqForm.question || !faqForm.answer) return;

    let updatedFaqs = [...faqs];
    if (isCreatingFaq) {
      updatedFaqs.push({
        id: Date.now().toString(),
        question: faqForm.question,
        answer: faqForm.answer,
        category: (faqForm.category as any) || 'General',
        status: 'answered' // Manually created FAQs are answered by default
      });
    } else if (editingFaq) {
      updatedFaqs = updatedFaqs.map(f => f.id === editingFaq.id ? { 
        ...f, 
        ...faqForm, 
        status: 'answered' // Ensure it's marked as answered when edited
      } as FAQItem : f);
    }

    db.faqs.updateAll(updatedFaqs);
    setFaqs(updatedFaqs);
    setEditingFaq(null);
    setIsCreatingFaq(false);
    setFaqForm({});
    refreshData();
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      const updated = faqs.filter(f => f.id !== id);
      db.faqs.updateAll(updated);
      setFaqs(updated);
      refreshData();
    }
  };

  const handleSaveSession = () => {
      if (!sessionForm.studentId || !sessionForm.consultantId || !sessionForm.date || !sessionForm.time) return;

      const student = allUsers.find(u => u.id === sessionForm.studentId);
      const consultant = allUsers.find(u => u.id === sessionForm.consultantId);

      if (!student || !consultant) return;

      if (sessionForm.id) {
          db.sessions.update(sessionForm.id, {
              ...sessionForm,
              studentName: student.firstName + ' ' + student.lastName,
              consultantName: consultant.firstName + ' ' + consultant.lastName,
          });
      } else {
          db.sessions.create({
              id: Date.now().toString(),
              studentId: student.id,
              studentName: student.firstName + ' ' + student.lastName,
              consultantId: consultant.id,
              consultantName: consultant.firstName + ' ' + consultant.lastName,
              date: sessionForm.date,
              time: sessionForm.time,
              status: sessionForm.status || 'Scheduled'
          });
      }
      
      setIsCreatingSession(false);
      setSessionForm({});
      refreshData();
  };

  const handleUpdateTier = (userId: string) => {
    if (tempTier) {
      db.users.update(userId, { tier: tempTier });
      setEditingUser(null);
      setTempTier(null);
      setAllUsers(db.users.getAll()); // Refresh local state
      refreshData(); // Refresh app state
    }
  };

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: allUsers.length, icon: Users, color: 'text-slate-800' },
          { label: 'Revenue', value: '₹ 4.2L', icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Active Sessions', value: sessions.filter(s => s.status === 'Scheduled').length, icon: Activity, color: 'text-slate-700' },
          { label: 'Conversion Rate', value: '12%', icon: TrendingUp, color: 'text-slate-600' },
        ].map((stat, i) => (
          <Card key={i} className="flex items-center p-4">
            <div className={`p-3 rounded-full bg-slate-50 mr-4 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4 text-slate-700">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#1A1A1A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-bold mb-4 text-slate-700">Revenue Overview</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <Card className="animate-fade-in">
      <h3 className="font-bold mb-4 text-slate-700">Student Management</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Subscription Plan</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.filter(u => u.role === UserRole.USER).map((u, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">{u.currentClass}</td>
                <td className="px-4 py-3">
                  {editingUser === u.id ? (
                    <div className="flex items-center gap-2">
                      <select 
                        className="p-1 border rounded text-xs"
                        value={tempTier || u.tier || SubscriptionTier.FREE}
                        onChange={(e) => setTempTier(e.target.value as SubscriptionTier)}
                      >
                        <option value={SubscriptionTier.FREE}>FREE</option>
                        <option value={SubscriptionTier.STANDARD}>STANDARD</option>
                        <option value={SubscriptionTier.PREMIUM}>PREMIUM</option>
                      </select>
                      <button 
                        onClick={() => handleUpdateTier(u.id)} 
                        className="text-green-600 hover:bg-green-50 p-1 rounded"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingUser(null)} 
                        className="text-slate-400 hover:bg-slate-50 p-1 rounded"
                        title="Cancel"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.tier === SubscriptionTier.FREE ? 'bg-slate-100 text-slate-600' : u.tier === SubscriptionTier.STANDARD ? 'bg-slate-800 text-white' : 'bg-slate-700 text-white'}`}>
                      {u.tier || 'FREE'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                    {editingUser !== u.id && (
                      <Button size="sm" variant="outline" className="text-xs py-1 px-2" onClick={() => { setEditingUser(u.id); setTempTier(u.tier || SubscriptionTier.FREE); }}>
                        Edit Plan
                      </Button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderConsultantManager = () => {
    const consultants = allUsers.filter(u => u.role === UserRole.CONSULTANT);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Consultant Management</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {consultants.map(consultant => {
            const availability = availabilities.find(a => a.consultantId === consultant.id);
            return (
              <Card key={consultant.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{consultant.firstName} {consultant.lastName}</h3>
                    <p className="text-sm text-slate-500">{consultant.email}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                    Active Consultant
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <Clock size={14} /> Current Availability
                  </h4>
                  {availability ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-slate-600">Working Days</span>
                        <span className="font-medium text-slate-900 text-right max-w-[60%]">
                          {availability.days.join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-600">Daily Hours</span>
                        <span className="font-medium text-slate-900 bg-white px-2 py-1 rounded border">
                          {availability.startTime} - {availability.endTime}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic flex items-center gap-2">
                      <Activity size={14} /> No availability schedule set.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
          {consultants.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
              No consultants found in the system.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSessionManager = () => (
      <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Session Management</h2>
            <Button onClick={() => { setIsCreatingSession(true); setSessionForm({}); }}>
                <Plus size={18} className="mr-2"/> Create Session
            </Button>
          </div>

          {isCreatingSession && (
              <Card className="border-2 border-slate-800">
                  <h3 className="font-bold mb-4">Create/Edit Session</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                          <select 
                            className="w-full p-2 border rounded-md"
                            value={sessionForm.studentId || ''}
                            onChange={e => setSessionForm({...sessionForm, studentId: e.target.value})}
                          >
                              <option value="">Select Student</option>
                              {allUsers.filter(u => u.role === UserRole.USER).map(u => (
                                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Consultant</label>
                          <select 
                            className="w-full p-2 border rounded-md"
                            value={sessionForm.consultantId || ''}
                            onChange={e => setSessionForm({...sessionForm, consultantId: e.target.value})}
                          >
                              <option value="">Select Consultant</option>
                              {allUsers.filter(u => u.role === UserRole.CONSULTANT).map(u => (
                                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                              ))}
                          </select>
                      </div>
                      <Input type="date" label="Date" value={sessionForm.date || ''} onChange={e => setSessionForm({...sessionForm, date: e.target.value})}/>
                      <Input type="time" label="Time" value={sessionForm.time || ''} onChange={e => setSessionForm({...sessionForm, time: e.target.value})}/>
                  </div>
                  <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveSession}>Save Session</Button>
                      <Button variant="outline" onClick={() => setIsCreatingSession(false)}>Cancel</Button>
                  </div>
              </Card>
          )}

          <Card>
              <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Consultant</th>
                          <th className="px-4 py-3">Date/Time</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {sessions.map(s => (
                          <tr key={s.id} className="border-b border-slate-100">
                              <td className="px-4 py-3">{s.studentName}</td>
                              <td className="px-4 py-3">{s.consultantName}</td>
                              <td className="px-4 py-3">{s.date} @ {s.time}</td>
                              <td className="px-4 py-3"><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">{s.status}</span></td>
                              <td className="px-4 py-3">
                                  <Button size="sm" variant="outline" onClick={() => { setSessionForm(s); setIsCreatingSession(true); }}>Edit</Button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </Card>
      </div>
  );

  const renderContentEditor = () => {
    const pendingFaqs = faqs.filter(f => f.status === 'pending');
    const publishedFaqs = faqs.filter(f => f.status === 'answered' || !f.status);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Content Management</h2>
          <Button onClick={() => { setIsCreatingFaq(true); setEditingFaq(null); setFaqForm({ category: 'General' }); }} disabled={isCreatingFaq || !!editingFaq}>
            <Plus size={18} className="mr-2"/> Add New FAQ
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          {(isCreatingFaq || editingFaq) && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-2 border-slate-800 shadow-xl">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800">
                  {isCreatingFaq ? <Plus size={18}/> : <Edit2 size={18}/>} 
                  {isCreatingFaq ? 'Create FAQ' : 'Answer/Edit Question'}
                </h3>
                <div className="space-y-4">
                  <Input 
                    label="Question" 
                    placeholder="Enter question..." 
                    value={faqForm.question || ''}
                    onChange={e => setFaqForm({...faqForm, question: e.target.value})}
                  />
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-white"
                      value={faqForm.category || 'General'}
                      onChange={e => setFaqForm({...faqForm, category: e.target.value as any})}
                    >
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-800 h-32 outline-none resize-none"
                      placeholder="Enter the answer..."
                      value={faqForm.answer || ''}
                      onChange={e => setFaqForm({...faqForm, answer: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveFaq} className="flex-1">
                      <Save size={16} className="mr-2"/> {editingFaq?.status === 'pending' ? 'Publish Answer' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => { setIsCreatingFaq(false); setEditingFaq(null); }} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* List Panel */}
          <div className={(isCreatingFaq || editingFaq) ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="space-y-6">
              
              {/* Pending Questions Section */}
              {pendingFaqs.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                     <MessageCircle size={20} className="text-orange-500"/> Pending Questions ({pendingFaqs.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingFaqs.map(faq => (
                      <div key={faq.id} className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-100">{faq.category}</span>
                            </div>
                            <h4 className="font-bold text-slate-800">{faq.question}</h4>
                          </div>
                          <Button size="sm" onClick={() => { setEditingFaq(faq); setFaqForm(faq); setIsCreatingFaq(false); }}>
                            Answer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Published FAQs */}
              <div>
                <h3 className="font-bold text-slate-700 mb-3">Published FAQs</h3>
                <div className="space-y-4">
                  {publishedFaqs.map((faq) => (
                    <div key={faq.id} className={`bg-white p-4 rounded-xl border transition-all flex justify-between items-start gap-4 ${editingFaq?.id === faq.id ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{faq.category}</span>
                        </div>
                        <h4 className="font-bold text-slate-800">{faq.question}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="!p-2" onClick={() => { setEditingFaq(faq); setFaqForm(faq); setIsCreatingFaq(false); }}>
                          <Edit2 size={14}/>
                        </Button>
                        <Button size="sm" variant="danger" className="!p-2" onClick={() => handleDeleteFaq(faq.id)}>
                          <Trash2 size={14}/>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {publishedFaqs.length === 0 && (
                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed">
                      No published FAQs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'users' && renderUsers()}
      {activeView === 'consultants' && renderConsultantManager()}
      {activeView === 'sessions' && renderSessionManager()}
      {activeView === 'analytics' && renderDashboard()} 
      {activeView === 'content' && renderContentEditor()}
    </div>
  );
};