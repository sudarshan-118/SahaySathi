'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

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
  map.setView(center, zoom);
  return null;
}

const getMarkerColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'rescue': return 'red';
    case 'medical': return 'blue';
    case 'food / water': return 'orange';
    case 'shelter': return 'green';
    default: return 'violet';
  }
};

export default function MapComponent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to center of India
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('public:requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .neq('status', 'solved')
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      setRequests(data);
      // Auto-center on the most recent incident
      setMapCenter([data[0].latitude, data[0].longitude]);
      setZoom(12);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        className="h-full w-full"
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {requests.map((req) => (
          <Marker 
            key={req.id} 
            position={[req.latitude, req.longitude]}
            icon={customIcon(getMarkerColor(req.category || 'rescue'))}
          >
            <Popup className="custom-popup">
              <div className="p-3 font-sans w-72 bg-slate-900 text-white rounded-xl border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-xl leading-none uppercase tracking-tighter">{req.category}</h3>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(req.created_at)}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mb-4 leading-relaxed line-clamp-3">{req.description}</p>
                
                {/* AI REQUIREMENTS IN POPUP */}
                <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5 mb-4">
                  <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Rescue Gear Needed
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.rescue_requirements || 'Standard Rescue Kit').split(',').map((item: string, idx: number) => (
                      <span key={idx} className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/20">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-black rounded uppercase tracking-tighter">Critical</span>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-95 uppercase tracking-widest">
                  Accept This Mission
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-[1000] glass-panel p-4 rounded-xl shadow-xl border border-slate-700/50 hidden md:block">
        <h4 className="text-white font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/> Map Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> Rescue / Critical</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> Medical Assistance</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div> Food & Water</div>
          <div className="flex items-center gap-2 text-slate-300"><div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div> Shelter Active</div>
        </div>
      </div>
    </div>
  );
}
