"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getSocket } from "../../lib/socket";

// Fix default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LiveMapUpdater({ sosLocation, userLocation }: { sosLocation: [number, number], userLocation: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (sosLocation) {
            map.fitBounds([sosLocation, userLocation || sosLocation], { padding: [50, 50] });
        }
    }, [sosLocation, userLocation, map]);
    return null;
}

export default function ResponderMap({ sos, user }: { sos: any, user: any }) {
    const seekerLat = sos?.location?.lat ?? 28.6139;
    const seekerLng = sos?.location?.lng ?? 77.2090;
    const userLat = user?.location?.lat ?? null;
    const userLng = user?.location?.lng ?? null;

    const seekerPos: [number, number] = [seekerLat, seekerLng];
    const userPos: [number, number] | null = userLat && userLng ? [userLat, userLng] : null;

    // Emit live location updates
    useEffect(() => {
        if (!sos?._id) return;
        const socket = getSocket();
        if (!socket) return;

        const interval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    socket.emit('location:update', {
                        sosId: sos._id,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [sos?._id]);

    return (
        <MapContainer
            key={`responder-map-${sos.id || sos._id}`}
            id={`responder-map-${sos.id || sos._id}`}
            center={seekerPos}
            zoom={14}
            className="h-full w-full"
            scrollWheelZoom={false}
        >
            <LiveMapUpdater sosLocation={seekerPos} userLocation={userPos} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Seeker (red) */}
            <CircleMarker
                center={seekerPos}
                pathOptions={{ color: '#FF3B30', fillColor: '#FF3B30', fillOpacity: 0.9 }}
                radius={10}
            >
                <Popup>
                    <div className="font-bold text-red-600">🆘 Person in Need</div>
                    <div className="text-xs text-gray-600">{sos?.type} Emergency</div>
                </Popup>
            </CircleMarker>

            {/* Responder (blue) */}
            {userPos && (
                <CircleMarker
                    center={userPos}
                    pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.9 }}
                    radius={10}
                >
                    <Popup>
                        <div className="font-bold text-blue-600">🚑 You (Responder)</div>
                    </Popup>
                </CircleMarker>
            )}
        </MapContainer>
    );
}
