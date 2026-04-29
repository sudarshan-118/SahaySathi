'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

// Fix Leaflet default icon issues in Next.js
const customIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, payload => {
        fetchRequests(); // Re-fetch on any change for simplicity
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .neq('status', 'solved') // Hide solved requests
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRequests(data);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[28.6139, 77.2090]} // Default to New Delhi
        zoom={12} 
        className="h-full w-full"
        zoomControl={false}
      >
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
              <div className="p-2 font-sans w-64">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-none">{req.category}</h3>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {formatTime(req.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3 line-clamp-3">{req.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-blue-600 capitalize">{req.status || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Reported:</span>
                    <span className="text-slate-600">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded transition-colors shadow-lg shadow-blue-500/30">
                  Accept Mission
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
