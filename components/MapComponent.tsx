'use client';

import { useEffect, useState, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { Activity, Clock, ShieldAlert, CheckCircle2, UserCircle2, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

// Fix Leaflet default icon issues in Next.js
const customIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map re-centering
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const getMarkerColor = (req: any) => {
  if (req.status === 'completed') return 'green';
  const priority = req.priority?.toLowerCase() || 'medium';
  switch (priority) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    default: return 'blue';
  }
};

function MapInternal() {
  const [requests, setRequests] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [zoom, setZoom] = useState(5);
  const [user, setUser] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchRequests();

    const channel = supabase
      .channel('requests-realtime-map-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new, ...prev]);
          if (Notification.permission === 'granted') {
            new Notification('Emergency Alert!', { body: payload.new.description });
          }
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Handle specific location centering from query params
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setZoom(16);
    }
  }, [searchParams]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRequests(data);
      // Only auto-center on load if no specific location is in params
      if (!searchParams.get('lat') && data.length > 0) {
        const active = data.find(r => r.status !== 'completed') || data[0];
        setMapCenter([active.latitude, active.longitude]);
        setZoom(12);
      }
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        toast.success(action === 'volunteer' ? "On your way!" : "Mission completed!");
      } else {
        const result = await res.json();
        toast.error(result.error || "Action failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    toast.info('Locating...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(15);
      },
      () => toast.error('Location access denied')
    );
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={mapCenter} zoom={zoom} className="h-full w-full" zoomControl={false}>
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles" />
        
        {requests.map((req) => (
          <Marker key={req.id} position={[req.latitude, req.longitude]} icon={customIcon(getMarkerColor(req))}>
            <Popup className="custom-popup">
              <div className="p-3 font-sans w-72 bg-slate-900 text-white rounded-xl border border-white/10 shadow-2xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="font-black text-xl uppercase tracking-tighter text-white">{req.category}</h3>
                    <div className="flex items-center gap-1 text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                      <ShieldAlert className={`w-2 h-2 ${req.priority === 'Critical' ? 'text-red-500' : 'text-blue-500'}`} />
                      {req.priority || 'Medium'} Priority
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="my-3 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> AI Summary
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed italic">"{req.summary || req.description.slice(0, 50)}..."</p>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-4 bg-slate-800/30 p-2 rounded-lg">
                  <span className="text-slate-500 flex items-center gap-1"><UserCircle2 className="w-3 h-3"/> {req.volunteer_count || 0} / 10 Responders</span>
                  {req.volunteer_count < 3 && req.status !== 'completed' && (
                    <span className="text-[7px] text-amber-500 animate-pulse font-black">Urgent Support</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {req.status !== 'completed' && req.volunteer_count < 10 && (
                    <button 
                      onClick={() => handleAction(req.id, 'volunteer')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2.5 rounded-lg transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95"
                    >
                      On My Way
                    </button>
                  )}
                  {user?.id === req.user_id && req.status !== 'completed' && (
                    <button 
                      onClick={() => handleAction(req.id, 'complete')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2.5 rounded-lg transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95"
                    >
                      Complete
                    </button>
                  )}
                </div>
                
                {req.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Mission Success</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Locate Me Button */}
      <button 
        onClick={locateUser}
        className="absolute top-6 right-6 z-[1000] p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-blue-400/50 transition-all hover:scale-105 active:scale-95"
        title="Find My Location"
      >
        <MapPin className="w-5 h-5" />
      </button>

      <div className="absolute bottom-6 right-6 z-[1000] glass-panel p-4 rounded-2xl shadow-2xl border border-slate-700/50 hidden md:block bg-slate-900/80 backdrop-blur-md">
        <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
          <Activity className="w-4 h-4 text-blue-400"/> Map Legend
        </h4>
        <div className="space-y-2 text-[9px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-3 text-slate-300"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Critical</div>
          <div className="flex items-center gap-3 text-slate-300"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> High</div>
          <div className="flex items-center gap-3 text-slate-300"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Medium</div>
          <div className="flex items-center gap-3 text-slate-300"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Completed</div>
        </div>
      </div>
    </div>
  );
}

export default function MapComponent() {
  return (
    <Suspense fallback={<div>Loading Search...</div>}>
      <MapInternal />
    </Suspense>
  );
}


