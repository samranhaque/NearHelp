"use client";

import { AlertTriangle, Car, CheckCircle, Flame, ShieldAlert, HeartPulse, Users, Wind, Zap, Waves, Building2, PawPrint, Baby, Scale, Utensils, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Circle, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const typeConfig: any = {
  "Medical": { color: "#FF3B30", icon: HeartPulse },
  "Mental Health Crisis": { color: "#8B5CF6", icon: Users },
  "Elderly Care": { color: "#F43F5E", icon: HeartPulse },
  "Car Problem": { color: "#FF9F0A", icon: Car },
  "Fire": { color: "#F97316", icon: Flame },
  "Gas Leak": { color: "#EAB308", icon: Wind },
  "Electrical": { color: "#FACC15", icon: Zap },
  "Flood / Water": { color: "#3B82F6", icon: Waves },
  "Structural Collapse": { color: "#78716C", icon: Building2 },
  "Pet Rescue": { color: "#84CC16", icon: PawPrint },
  "Child in Danger": { color: "#EC4899", icon: Baby },
  "Threat to Safety": { color: "#7C3AED", icon: ShieldAlert },
  "Legal Emergency": { color: "#6366F1", icon: Scale },
  "Food / Shelter": { color: "#22C55E", icon: Utensils },
  "General Help": { color: "#6B7280", icon: AlertTriangle },
};

const LEGEND = [
  { color: "#FF3B30", label: "Medical / Fire Issues" },
  { color: "#FF9F0A", label: "Car / Gas Issues" },
  { color: "#8A2BE2", label: "Threat Issue" },
  { color: "#34C759", label: "General Issues" },
  { color: "#3B82F6", label: "Hospital", isPOI: true },
  { color: "#6366F1", label: "Police", isPOI: true }
];

// SVG strings for markers (since L.divIcon needs raw HTML string)
const ICON_SVG = {
  hospital: '<path d="m21 6-5-3-5 3-5-3-5 3v15l5-3 5 3 5-3 5 3V6Z"/><path d="M12 9v12"/><path d="M12 3v6"/><path d="M12 21h-2"/><path d="M14 21h-2"/>', // building
  police: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', // shield
  extinguisher: '<path d="M15 7h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1"/><path d="M9 7h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7Z"/><path d="M9 13h6"/><path d="M11 3v4"/><path d="M13 3v4"/><path d="M10 3h4"/>' // extinguisher
};

const createCustomIcon = (color: string, path: string) => {
  if (typeof window === 'undefined') return null;
  return L.divIcon({
    html: `<div style="background-color: ${color}; padding: 6px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
               ${path}
             </svg>
           </div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LiveMapCard() {
  const { user } = useAuth();
  const [pins, setPins] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default Delhi
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [poiCenter, setPoiCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [pois, setPois] = useState<any>({ hospitals: [], fireStations: [], policeStations: [], extinguishers: [] });

  const handleAccept = async (sosId: string) => {
    try {
      await api.post(`/sos/${sosId}/presence`, { available: true });
    } catch (err: any) {
      if (err.response?.status === 400) {
        alert(err.response?.data?.message || 'SOS already accepted');
      } else {
        console.error('Accept failed:', err);
      }
    }
  };

  const handleFlag = async (sosId: string) => {
    try {
      await api.post(`/sos/${sosId}/flag`);
      setToastMessage("Flagged the SOS and sent to the admin. Necessary actions will be taken against the user.");
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert("Only responders can flag this SOS.");
      } else {
        console.error('Flag failed:', err);
      }
    }
  };

  const fetchPOIs = async (lat: number, lng: number) => {
    try {
      const { data } = await api.get(`/map/resources?lat=${lat}&lng=${lng}`);
      setPois(data);
      setPoiCenter({ lat, lng });
    } catch (err) {
      console.error("Failed to fetch POIs", err);
    }
  };

  // Fetch POIs initially for default center
  useEffect(() => {
    fetchPOIs(mapCenter[0], mapCenter[1]);
  }, []);

  const recenterMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setMapCenter([lat, lng]);
          setUserLocation({ lat, lng });

          if (user) {
            try {
              // Update profile location in DB
              await api.put('/users/location', { lat, lng });
            } catch (e) {
              console.error("Failed to save location", e);
            }
          }

          const socket = getSocket();
          if (socket) {
            socket.emit('location:update', { lat, lng });
          }
        },
        (err) => {
          console.log("Geolocation error:", err);
          // Fallback: use saved location from profile (Supabase: user.lat/lng)
          const fallbackLat = user?.lat ?? user?.location?.lat;
          const fallbackLng = user?.lng ?? user?.location?.lng;
          if (fallbackLat) {
            setMapCenter([fallbackLat, fallbackLng]);
            setUserLocation({ lat: fallbackLat, lng: fallbackLng });
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });

        if (isAutoFollow) {
          setMapCenter([lat, lng]);
        }

        // Distance check: regenerate if moved > 2km or first time
        const getDistance = (l1: any, l2: any) => {
          if (!l1 || !l2) return 999;
          const dy = l1.lat - l2.lat;
          const dx = l1.lng - l2.lng;
          return Math.sqrt(dx * dx + dy * dy) * 111; // Approx km
        };

        if (getDistance({ lat, lng }, poiCenter) > 2) {
          fetchPOIs(lat, lng);
        }

        if (user) {
          // Update profile & socket (no need to await here, just fire and forget)
          api.put('/users/location', { lat, lng }).catch(() => { });
          const socket = getSocket();
          if (socket) socket.emit('location:update', { lat, lng });
        }
      },
      (err) => console.log("WatchPosition error:", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    setWatchId(id);
    return () => navigator.geolocation.clearWatch(id);
  }, [user, isAutoFollow]);

  useEffect(() => {
    if (!user) return;

    const isAdmin = user.email === 'municipal@community.gov.in';

    const fetchMapData = async () => {
      try {
        if (isAdmin) {
          const { data } = await api.get('/admin/live-map');
          formatPins(data.activeSOS || [], data.onlineUsers || []);
        } else {
          // Send lat/lng if we have it to filter radius, else just call base array
          const query = userLocation ? `?lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
          const { data } = await api.get(`/sos/active${query}`);
          formatPins(data, []);
        }
      } catch (err) {
        console.error("Map fetch error:", err);
      }
    };

    const formatPins = (sosList: any[], usersList: any[]) => {
      const newPins: any[] = [];
      sosList.forEach((sos: any) => {
        // Support both Supabase (sos.lat) and legacy MongoDB (sos.location.lat)
        const lat = sos.lat ?? sos.location?.lat;
        const lng = sos.lng ?? sos.location?.lng;
        if (lat == null || lng == null) return;
        const conf = typeConfig[sos.type] || typeConfig["General Help"] || { color: "#6B7280", icon: AlertTriangle };
        newPins.push({
          id: sos.id || sos._id,
          lat,
          lng,
          color: conf.color,
          ring: conf.color,
          icon: conf.icon,
          label: sos.type,
          status: sos.status,
          active: true,
          responders: sos.responders || [],
          seekerId: sos.seeker_id
        });
      });
      setPins(newPins);
    };

    fetchMapData();

    const socket = getSocket();
    if (socket) {
      // Listen for general updates
      socket.on('sos:new', fetchMapData);
      socket.on('sos:update', fetchMapData);
      socket.on('sos:resolved', fetchMapData);

      if (isAdmin) {
        socket.on('admin:current_state', (data: any) => formatPins(data.activeSOS, data.onlineUsers));
        socket.on('admin:sos_created', fetchMapData);
        socket.on('admin:sos_updated', fetchMapData);
        socket.on('admin:sos_resolved', fetchMapData);
      }
    }

    return () => {
      if (socket) {
        socket.off('sos:new', fetchMapData);
        socket.off('sos:update', fetchMapData);
        socket.off('sos:resolved', fetchMapData);
        if (isAdmin) {
          socket.off('admin:current_state');
          socket.off('admin:sos_created', fetchMapData);
          socket.off('admin:sos_updated', fetchMapData);
          socket.off('admin:sos_resolved', fetchMapData);
        }
      }
    };

  }, [user]);

  return (
    <div className="flex flex-col h-full rounded-3xl border border-[#E5E5E5] bg-[#FFFFFF] p-4 lg:p-6 text-black">
      {/* Card header */}
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-base font-semibold text-black">Live Incident Map</h2>
          <p className="text-xs text-[#A0A0A8] mt-0.5">5km community radius</p>
        </div>
        {toastMessage && (
          <div className="bg-green-100 text-green-700 text-xs px-3 py-2 rounded-lg max-w-xs text-right shadow-sm border border-green-200">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Map area */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-[#FFFFFF] z-0 h-[250px] lg:h-[288px]"
        id="live-map"
      >
        <MapContainer
          key="live-map-container"
          id="live-map-container"
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <MapUpdater center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />

          {/* User's Own Location & 5km Radius */}
          {userLocation && (
            <>
              <CircleMarker
                center={[userLocation.lat, userLocation.lng]}
                pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 1 }}
                radius={6}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={5000} // 5km
                pathOptions={{ color: '#FF3B30', fillColor: '#FF3B30', fillOpacity: 0.05, dashArray: '8' }}
              />
            </>
          )}

          {/* SOS Incidents */}
          {pins.map((pin: any) => (
            <CircleMarker
              key={pin.id}
              center={[pin.lat, pin.lng]}
              pathOptions={{ color: pin.color, fillColor: pin.color, fillOpacity: 0.8 }}
              radius={8}
            >
              <Popup>
                <div className="text-black font-semibold text-sm">{pin.label} Emergency</div>
                <div className="mt-1 flex flex-col gap-2">
                  {/* Hide Respond if already accepted or if user is the seeker */}
                  {(!pin.responders || pin.responders.length === 0) && pin.seekerId !== user?.id && (
                    <button 
                      className="bg-black text-white text-xs px-2 py-1.5 rounded font-medium"
                      onClick={() => handleAccept(pin.id)}
                    >
                      Respond
                    </button>
                  )}
                  <button 
                    className="bg-red-100 text-red-600 text-xs px-2 py-1.5 rounded font-medium border border-red-200"
                    onClick={() => handleFlag(pin.id)}
                  >
                    Flag as Fake
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* POIs */}
          {pois.hospitals?.map((h: any, i: number) => {
            const icon = createCustomIcon('#3B82F6', ICON_SVG.hospital);
            return icon ? (
              <Marker key={`h-${i}`} position={[h.lat, h.lng]} icon={icon}>
                <Popup><span className="font-bold text-blue-600">Hospital:</span> {h.name}</Popup>
              </Marker>
            ) : null;
          })}
          {pois.policeStations?.map((p: any, i: number) => {
            const icon = createCustomIcon('#6366F1', ICON_SVG.police);
            return icon ? (
              <Marker key={`p-${i}`} position={[p.lat, p.lng]} icon={icon}>
                <Popup><span className="font-bold text-indigo-500">Police:</span> {p.name}</Popup>
              </Marker>
            ) : null;
          })}
        </MapContainer>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
          {/* Auto-Follow Toggle */}
          <button
            onClick={() => setIsAutoFollow(!isAutoFollow)}
            className={`p-3 rounded-full shadow-lg border transition-all ${isAutoFollow ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-white text-gray-400 border-gray-200'}`}
            title={isAutoFollow ? "Auto-Follow Enabled" : "Auto-Follow Disabled"}
          >
            <Users className="h-5 w-5" />
          </button>

          {/* Recenter Button */}
          <button
            onClick={recenterMap}
            className="bg-white text-black font-bold p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
          >
            <AlertTriangle className="h-5 w-5 text-[#007AFF]" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEGEND.map(({ color, label, isPOI }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={isPOI ? "h-3 w-3 rounded-full border border-white shadow-sm" : "h-2 w-2 rounded-full"}
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#A0A0A8]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
