'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { Activity, Clock, ShieldAlert, CheckCircle2, UserCircle2, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

// Color-coded marker icons
const customIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

const getMarkerColor = (req: any): string => {
  if (req.status === 'completed') return 'green';
  const cat = (req.category || '').toLowerCase();
  if (cat.includes('blood') || cat.includes('medical')) return 'blue';
  if (cat.includes('shelter')) return 'violet';
  const priority = (req.priority || '').toLowerCase();
  if (priority === 'critical') return 'red';
  if (priority === 'high') return 'orange';
  return 'yellow';
};

const LEGEND = [
  { color: 'bg-red-500', label: 'Critical / Rescue' },
  { color: 'bg-blue-500', label: 'Medical / Blood' },
  { color: 'bg-orange-500', label: 'High Priority' },
  { color: 'bg-yellow-400', label: 'Food / Water' },
  { color: 'bg-violet-500', label: 'Shelter' },
  { color: 'bg-green-500', label: 'Completed' },
];

function MapInternal() {
  const [requests, setRequests] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(5);
  const [user, setUser] = useState<any>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchRequests();

    const channel = supabase
      .channel('requests-realtime-map-v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new, ...prev]);
          if (Notification.permission === 'granted') {
            new Notification('🚨 New Emergency Alert!', { body: payload.new.description || 'New request received' });
          }
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    if (Notification.permission === 'default') Notification.requestPermission();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setZoom(16);
    }
  }, [searchParams]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
      if (!searchParams.get('lat') && data.length > 0) {
        const active = data.find(r => r.status !== 'completed') || data[0];
        if (active?.latitude && active?.longitude) {
          setMapCenter([active.latitude, active.longitude]);
          setZoom(12);
        }
      }
    }
    setLoading(false);
  };

  const handleAction = async (id: number, action: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, user_id: user?.id }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(action === 'volunteer' ? '🚀 You are on your way!' : '✅ Mission completed!');
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    toast.info('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMapCenter([pos.coords.latitude, pos.coords.longitude]); setZoom(15); },
      () => toast.error('Location access denied')
    );
  };

  const activeCount = requests.filter(r => r.status !== 'completed').length;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={mapCenter} zoom={zoom} className="h-full w-full" zoomControl={false}>
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {requests.map((req) => (
          req.latitude && req.longitude ? (
            <Marker key={req.id} position={[req.latitude, req.longitude]} icon={customIcon(getMarkerColor(req))}>
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-4 font-sans w-72 bg-slate-900 text-white rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight text-white">{req.category}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        <ShieldAlert className={`w-3 h-3 ${req.priority === 'Critical' ? 'text-red-400' : 'text-blue-400'}`} />
                        {req.priority || 'Medium'} Priority
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="my-3 p-2.5 bg-slate-800/60 rounded-lg border border-white/5">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> AI Summary
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      &quot;{req.summary || (req.description || '').slice(0, 60)}&quot;
                    </p>
                  </div>

                  {(req.requester_phone || req.people_count > 1 || req.blood_group) && (
                    <div className="mb-3 p-2 bg-slate-800/40 rounded-lg border border-white/5 space-y-1">
                      {req.requester_phone && (
                        <div className="text-[10px] text-slate-400">📞 {req.requester_phone}</div>
                      )}
                      {req.people_count > 1 && (
                        <div className="text-[10px] text-slate-400">👥 {req.people_count} people affected</div>
                      )}
                      {req.blood_group && (
                        <div className="text-[10px] text-red-400 font-bold">🩸 Blood needed: {req.blood_group}</div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-3 bg-slate-800/30 p-2 rounded-lg">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserCircle2 className="w-3 h-3" /> {req.volunteer_count || 0} / 10 Responders
                    </span>
                    {(req.volunteer_count || 0) < 3 && req.status !== 'completed' && (
                      <span className="text-[8px] text-amber-400 animate-pulse font-black flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>

                  {(req.volunteer_count || 0) >= 10 && req.status !== 'completed' && (
                    <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-400 font-bold text-center">
                      ✋ Enough responders assigned. Help elsewhere!
                    </div>
                  )}

                  <div className="flex gap-2">
                    {req.status !== 'completed' && (req.volunteer_count || 0) < 10 && (
                      <button
                        onClick={() => handleAction(req.id, 'volunteer')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2.5 rounded-lg transition-all uppercase tracking-widest active:scale-95"
                      >
                        On My Way
                      </button>
                    )}
                    {user?.id === req.user_id && req.status !== 'completed' && (
                      <button
                        onClick={() => handleAction(req.id, 'complete')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2.5 rounded-lg transition-all uppercase tracking-widest active:scale-95"
                      >
                        Complete
                      </button>
                    )}
                  </div>

                  {req.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Mission Complete</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>

      {/* Active count badge */}
      {activeCount > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 bg-red-600/90 backdrop-blur-sm text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {activeCount} Active Emergency{activeCount !== 1 ? 'ies' : ''}
        </div>
      )}

      {/* Locate Me Button */}
      <button
        onClick={locateUser}
        className="absolute top-16 right-4 z-[1000] p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-blue-400/50 transition-all hover:scale-105 active:scale-95"
        title="Find My Location"
      >
        <MapPin className="w-5 h-5" />
      </button>

      {/* Legend toggle (mobile-friendly) */}
      <button
        onClick={() => setShowLegend(v => !v)}
        className="absolute bottom-6 right-4 z-[1000] p-3 bg-slate-900/90 backdrop-blur-sm text-white rounded-xl border border-slate-700/50 shadow-lg hover:bg-slate-800 transition-all"
        title="Map Legend"
      >
        <Activity className="w-5 h-5 text-blue-400" />
      </button>

      {showLegend && (
        <div className="absolute bottom-20 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/50 min-w-[180px]">
          <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> Map Legend
          </h4>
          <div className="space-y-2">
            {LEGEND.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapComponent() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Live Map...</p>
        </div>
      </div>
    }>
      <MapInternal />
    </Suspense>
  );
}
