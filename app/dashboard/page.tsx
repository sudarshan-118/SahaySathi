'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Navigation, Search, MapPin, CheckCircle2, Clock, AlertTriangle, Package, Activity, BellRing, UserCircle, Users, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const [role, setRole] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile?.role) setRole(profile.role);
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">SahaySathi Unified Response Center</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300 font-medium">System Online</span>
        </div>
      </header>

      {role === 'ngo' ? <NgoDashboard /> : <UnifiedUserDashboard user={user} />}
    </div>
  );
}

// -------------------------------------------------------------
// VICTIM DASHBOARD (SOS REPORTING)
// -------------------------------------------------------------
function VictimDashboard({ user }: { user: any }) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical');
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchMyRequests();
    const channel = supabase
      .channel('my-request-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchMyRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchMyRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'solved')
      .order('created_at', { ascending: false });
    
    if (data) setActiveRequests(data);
  };
  
  const handleSOS = async () => {
    if (!user) {
      toast.error('Session lost. Please login again.');
      return;
    }
    setIsRequesting(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const aiResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description || 'Emergency SOS Button Pressed' })
        });
        const aiData = await aiResponse.json();
        
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: category,
            description: description || aiData.summary || 'Emergency Request',
            latitude: lat,
            longitude: lng,
            user_id: user.id,
            rescue_requirements: aiData.requirements
          })
        });
        
        const resData = await response.json();
        
        if (response.ok) {
          toast.success(`SOS Sent! Priority: ${aiData.priority || 'High'}`);
          setDescription('');
          fetchMyRequests();
        } else {
          toast.error(`Failed: ${resData.error || 'Unknown'}`);
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message || 'generation failed'}`);
      } finally {
        setIsRequesting(false);
      }
    }, () => {
      toast.error('Could not get your location.');
      setIsRequesting(false);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* EMERGENCY MODE HEADER */}
      <div className="bg-red-950/30 border border-red-500/20 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Emergency Mode</h2>
            <p className="text-red-400/80 text-sm font-medium">Your location is being shared with nearby responders.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8 relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5">
          <button 
            onClick={handleSOS}
            disabled={isRequesting}
            className="relative group w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white font-black text-4xl shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:shadow-[0_0_80px_rgba(220,38,38,0.8)] transition-all transform active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-0 group-hover:animate-ping"></div>
            {isRequesting ? '...' : 'SOS'}
          </button>
          <p className="mt-6 text-slate-400 text-sm font-bold uppercase tracking-widest">Tap for instant help</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/40">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-red-500" /> Dispatch Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Incident Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-4 py-4 focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none"
              >
                <option>Medical</option>
                <option>Rescue</option>
                <option>Food / Water</option>
                <option>Shelter</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Situation Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's happening..."
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-4 py-4 h-32 focus:ring-2 focus:ring-red-500 outline-none resize-none transition-all"
              ></textarea>
            </div>
            <button onClick={handleSOS} disabled={isRequesting} className="w-full bg-slate-100 hover:bg-white text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98]">
              SEND EMERGENCY ALERT
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/40">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-red-500" /> My Incident Log
          </h3>
          <div className="space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-2">
            {activeRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">No active reports</p>
              </div>
            ) : (
              activeRequests.map((req) => (
                <div key={req.id} className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 transition-all hover:bg-slate-800/60 group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      req.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {req.status === 'accepted' ? 'Rescue In-Progress' : 'Broadcasting SOS'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(req.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">{req.category}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{req.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// UNIFIED USER DASHBOARD (RESCUE MODE)
// -------------------------------------------------------------
function UnifiedUserDashboard({ user }: { user: any }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [view, setView] = useState<'missions' | 'report'>('missions');
  const [activeMission, setActiveMission] = useState<any>(null);

  useEffect(() => {
    fetchNearbyRequests();
    const channel = supabase
      .channel('volunteer-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchNearbyRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNearbyRequests = async () => {
    setLoadingMissions(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .neq('status', 'solved')
      .order('created_at', { ascending: false });
    
    if (data) setMissions(data);
    setLoadingMissions(false);
  };

  const updateStatus = async (id: number, newStatus: string, progress?: number) => {
    if (!user) return;
    try {
      if (newStatus === 'accepted') {
        const { data: currentMission } = await supabase
          .from('requests')
          .select('status')
          .eq('id', id)
          .single();

        if (currentMission?.status === 'accepted' && !progress) {
          toast.warning('Mission already claimed.');
          fetchNearbyRequests();
          return;
        }
      }

      const updateData: any = { status: newStatus };
      if (newStatus === 'accepted') updateData.volunteer_id = user.id;
      if (progress !== undefined) updateData.progress = progress;

      const { error } = await supabase
        .from('requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      if (!progress) toast.success(newStatus === 'solved' ? 'Mission Cleared!' : 'Mission Joined!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-800/80 p-1.5 rounded-3xl flex gap-2 border border-white/5 backdrop-blur-xl">
          <button 
            onClick={() => setView('missions')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${view === 'missions' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            Rescue Missions
          </button>
          <button 
            onClick={() => setView('report')}
            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${view === 'report' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            Report SOS
          </button>
        </div>
      </div>

      {view === 'report' ? (
        <VictimDashboard user={user} />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeMission && (
            <MissionChat 
              mission={activeMission} 
              user={user} 
              onClose={() => setActiveMission(null)} 
              onProgressUpdate={(p) => updateStatus(activeMission.id, 'accepted', p)}
            />
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Rank Points', val: '450', icon: Activity, color: 'text-emerald-400' },
              { label: 'Lives Saved', val: '12', icon: CheckCircle2, color: 'text-blue-400' },
              { label: 'Open Alerts', val: missions.length.toString(), icon: AlertTriangle, color: 'text-yellow-400' },
              { label: 'Vitals', val: 'Active', icon: BellRing, color: 'text-emerald-400' },
            ].map((s,i) => (
              <div key={i} className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center border border-white/5 bg-slate-900/40">
                <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
                <div className="text-2xl font-black text-white tracking-tighter">{s.val}</div>
                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-slate-900/40">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Active Rescue Missions
              </h3>
              <Link href="/map" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <MapPin className="w-3 h-3" /> View Realtime Map
              </Link>
            </div>

            {loadingMissions ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold uppercase tracking-widest">Scanning disaster zones...</p>
              </div>
            ) : missions.length === 0 ? (
              <div className="text-slate-500 text-center py-20 font-bold uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl">
                All zones cleared. Standby.
              </div>
            ) : (
              <div className="grid gap-6">
                {missions.map((mission) => (
                  <div key={mission.id} className="p-6 bg-slate-800/40 border border-white/5 rounded-[1.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-emerald-500/30 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-20"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                          mission.status === 'accepted' ? 'bg-blue-500 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {mission.status === 'accepted' ? 'Rescuers Onsite' : 'Immediate Help Needed'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3"/> {new Date(mission.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-white leading-none mb-2">{mission.category}</h4>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2 max-w-2xl leading-relaxed">{mission.description}</p>
                      
                      {/* PROGRESS BAR */}
                      {mission.status === 'accepted' && (
                        <div className="mb-4 max-w-xs">
                          <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            <span>Mission Progress</span>
                            <span className="text-emerald-400">{mission.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${mission.progress || 0}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* AI RESCUE REQUIREMENTS */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-4">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest w-full mb-1 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> AI Analysis: Gear & Skills Required
                        </span>
                        {(mission.rescue_requirements || 'First Aid Kit, Basic Rescue Gear').split(',').map((item: string, idx: number) => (
                          <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-[10px] font-bold">
                            {item.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[160px]">
                      {mission.status === 'accepted' ? (
                        <>
                          <button 
                            onClick={() => setActiveMission(mission)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-3 h-3" /> Situation Room
                          </button>
                          <button 
                            onClick={() => updateStatus(mission.id, 'solved')}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98]"
                          >
                            Finish Rescue
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => updateStatus(mission.id, 'accepted')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98]"
                        >
                          Join Mission
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MISSION CHAT & AI SITUATION ANALYST
// -------------------------------------------------------------
function MissionChat({ mission, user, onClose, onProgressUpdate }: { mission: any, user: any, onClose: () => void, onProgressUpdate: (p: number) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [aiSummary, setAiSummary] = useState('Analysing live intel...');
  const [loadingAi, setLoadingAi] = useState(false);
  const [localProgress, setLocalProgress] = useState(mission.progress || 0);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`mission-chat-${mission.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_messages', filter: `request_id=eq.${mission.id}` }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mission.id]);

  useEffect(() => {
    if (messages.length > 0) {
      generateAiBriefing();
    }
  }, [messages.length]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('mission_messages')
      .select('*')
      .eq('request_id', mission.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const generateAiBriefing = async () => {
    if (messages.length < 2) return;
    setLoadingAi(true);
    try {
      const chatContent = messages.map(m => `${m.user_name}: ${m.message}`).join('\n');
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: `ACT AS TACTICAL COORDINATOR. ANALYZE THIS RESCUE CHAT AND PROVIDE A 2-SENTENCE LIVE BRIEFING FOR NEW ARRIVALS. FOCUS ON PROGRESS AND REMAINING DANGER.
          CHAT HISTORY:
          ${chatContent}` 
        })
      });
      const data = await response.json();
      setAiSummary(data.summary || 'Scene coordination in progress.');
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = parseInt(e.target.value);
    setLocalProgress(p);
  };

  const submitProgress = () => {
    onProgressUpdate(localProgress);
    toast.success(`Progress updated to ${localProgress}%`);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('mission_messages').insert({
      request_id: mission.id,
      user_id: user.id,
      user_name: user.email?.split('@')[0] || 'Responder',
      message: newMessage
    });

    if (!error) setNewMessage('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-[85vh] bg-slate-900 border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tighter">Mission Situation Room</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{mission.category} | Zone ID: {mission.id.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* PROGRESS TRACKER IN CHAT */}
        <div className="px-6 py-4 bg-slate-800/30 border-b border-white/5 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              <span>Live Mission Progress</span>
              <span className="text-emerald-400">{localProgress}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={localProgress}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <button 
            onClick={submitProgress}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
          >
            Update
          </button>
        </div>

        {/* AI TACTICAL BRIEFING */}
        <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/10 flex gap-4 items-start">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Sparkles className={`w-4 h-4 text-emerald-400 ${loadingAi ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">AI Tactical Briefing (Live)</span>
            <p className="text-xs text-emerald-100/80 italic">"{aiSummary}"</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <MessageSquare className="w-12 h-12 mb-2 text-white" />
              <p className="text-xs font-bold uppercase tracking-widest text-white">No comms yet. Start briefing.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.user_id === user.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">{m.user_name}</span>
                <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${
                  m.user_id === user.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {m.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-slate-800/30 border-t border-white/5 flex gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type status update..."
            className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <button type="submit" className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// NGO DASHBOARD
// -------------------------------------------------------------
function NgoDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', val: '1,240', icon: Activity, color: 'text-blue-400' },
          { label: 'Pending', val: '342', icon: Clock, color: 'text-yellow-400' },
          { label: 'Volunteers', val: '89', icon: Users, color: 'text-emerald-400' },
          { label: 'Critical', val: '15', icon: AlertTriangle, color: 'text-red-400' },
        ].map((s,i) => (
          <div key={i} className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
            <div className="text-2xl font-bold text-white">{s.val}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Recent Coordination Tasks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="p-3 rounded-tl-lg rounded-bl-lg">Category</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-tr-lg rounded-br-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[1,2,3,4].map((i) => (
                  <tr key={i} className="text-white">
                    <td className="p-3">Medical Supplies</td>
                    <td className="p-3 text-slate-400">Sector {i}</td>
                    <td className="p-3"><span className="text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-xs">Pending Setup</span></td>
                    <td className="p-3"><button className="text-blue-400 hover:text-blue-300">Assign Team</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="text-red-400"/> AI Fraud Check
          </h3>
          <p className="text-slate-400 text-sm mb-4">Our AI systems have flagged potential duplicate or non-urgent requests in the last hour.</p>
          
          <div className="space-y-3 flex-1">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-white font-medium text-sm">Possible Duplicate</div>
              <div className="text-slate-400 text-xs mt-1">2 requests from same IP for Rescue within 5 mins.</div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-white font-medium text-sm">Low Priority Flagged</div>
              <div className="text-slate-400 text-xs mt-1">"Need extra blankets" marked as Critical. Reclassified to Medium.</div>
            </div>
          </div>
          
          <button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm transition-colors">View All Logs</button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUPPLIER DASHBOARD
// -------------------------------------------------------------
function SupplierDashboard() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl mb-6 bg-gradient-to-r from-emerald-900/40 to-slate-900 border-emerald-500/20">
        <h2 className="text-2xl font-bold text-white mb-2">Donate Resources</h2>
        <p className="text-emerald-100/70 mb-4">Your contributions directly save lives. Let us know what you can provide.</p>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">Add Inventory</button>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-4">Current Shelter Needs</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { name: 'Bottled Water', need: 'High', current: '200 L', required: '1000 L', icon: Activity },
          { name: 'First Aid Kits', need: 'Critical', current: '15', required: '100', icon: Package },
          { name: 'Blankets', need: 'Medium', current: '50', required: '150', icon: ShieldAlert },
        ].map((item, i) => (
          <div key={i} className="glass-panel p-5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">{item.name}</h4>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Need Level:</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${item.need === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.need}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 mt-4">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{item.current}</span>
              <span>{item.required}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
