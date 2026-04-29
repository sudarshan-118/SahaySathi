'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Navigation, Search, MapPin, CheckCircle2, Clock, AlertTriangle, Package, Activity, BellRing, UserCircle, Users } from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role) {
          setRole(profile.role);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Here is your emergency response overview.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300 font-medium">System Online</span>
        </div>
      </header>

      {role === 'victim' && <VictimDashboard />}
      {role === 'volunteer' && <VolunteerDashboard />}
      {role === 'ngo' && <NgoDashboard />}
      {role === 'supplier' && <SupplierDashboard />}
    </div>
  );
}

// -------------------------------------------------------------
// VICTIM DASHBOARD
// -------------------------------------------------------------
function VictimDashboard() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical');
  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchMyRequests();
    const channel = supabase
      .channel('my-request-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchMyRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMyRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
        
        const { data: { user } } = await supabase.auth.getUser();

        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: category,
            description: description || aiData.summary || 'Emergency Request',
            latitude: lat,
            longitude: lng,
            user_id: user?.id,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* BIG SOS BUTTON */}
      <div className="flex flex-col items-center justify-center py-12 glass-panel rounded-3xl border border-red-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
        <button 
          onClick={handleSOS}
          disabled={isRequesting}
          className="relative group w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white font-black text-4xl shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:shadow-[0_0_80px_rgba(220,38,38,0.8)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          <div className="absolute inset-0 rounded-full border-4 border-red-400 opacity-0 group-hover:animate-ping"></div>
          {isRequesting ? 'SENDING...' : 'SOS'}
        </button>
        <p className="mt-8 text-slate-300 font-medium">Tap immediately in case of emergency</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" /> Need Specific Help?
          </h3>
          <div className="space-y-4">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option>Medical</option>
              <option>Rescue</option>
              <option>Food / Water</option>
              <option>Shelter</option>
            </select>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your situation briefly..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            ></textarea>
            <button onClick={handleSOS} disabled={isRequesting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
              Submit Request
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="text-yellow-500" /> My Active Requests
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {activeRequests.length === 0 ? (
              <div className="text-slate-500 text-center py-10">You have no active emergency requests.</div>
            ) : (
              activeRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 transition-all hover:border-slate-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                      req.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {req.status === 'accepted' ? 'Volunteer Assigned' : 'Pending Help'}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(req.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h4 className="text-white font-bold leading-tight">{req.category}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{req.description}</p>
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
// VOLUNTEER DASHBOARD
// -------------------------------------------------------------
function VolunteerDashboard() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [view, setView] = useState<'missions' | 'report'>('missions');

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

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          volunteer_id: newStatus === 'accepted' ? user?.id : null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(newStatus === 'solved' ? 'Incident marked as Solved' : 'Mission Accepted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6 bg-slate-800/50 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setView('missions')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'missions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          Missions
        </button>
        <button 
          onClick={() => setView('report')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'report' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          Report SOS
        </button>
      </div>

      {view === 'report' ? (
        <VictimDashboard /> // Re-use VictimDashboard for reporting
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Points', val: '450', icon: Activity, color: 'text-purple-400' },
              { label: 'Helped', val: '12', icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Available', val: missions.length.toString(), icon: AlertTriangle, color: 'text-yellow-400' },
              { label: 'Status', val: 'Active', icon: BellRing, color: 'text-blue-400' },
            ].map((s,i) => (
              <div key={i} className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center border border-slate-700/50">
                <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Active Emergency Feed
              </h3>
              <Link href="/map" className="text-sm text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Live Map
              </Link>
            </div>

            {loadingMissions ? (
              <div className="text-slate-500 text-center py-10">Searching for nearby signals...</div>
            ) : missions.length === 0 ? (
              <div className="text-slate-500 text-center py-10">No active incidents in your area.</div>
            ) : (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <div key={mission.id} className="p-5 bg-slate-800/80 border border-slate-700 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-750">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                          mission.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {mission.status || 'Critical'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3"/> {new Date(mission.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white leading-tight">{mission.category}</h4>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{mission.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {mission.status === 'accepted' ? (
                        <button 
                          onClick={() => updateStatus(mission.id, 'solved')}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20"
                        >
                          Mark Solved
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(mission.id, 'accepted')}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
                        >
                          Accept Help
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
