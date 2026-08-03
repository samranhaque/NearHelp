"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Click-to-pin + also updates the view
function ClickHandler({ onPinSet }: { onPinSet: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPinSet(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

// Fly to new center when the prop changes (e.g. after Detect Location)
function FlyToCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15, { duration: 1.2 });
    }, [center, map]);
    return null;
}

// Custom pulsing marker icon for the selected pin
const pulsingIcon = L.divIcon({
    html: `<div style="
        position:relative;
        width:28px;height:28px;
    ">
        <div style="
            position:absolute;inset:0;border-radius:50%;
            background:#FF3B30;opacity:0.3;
            animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div style="
            position:relative;width:28px;height:28px;border-radius:50%;
            background:#FF3B30;border:3px solid white;
            box-shadow:0 2px 8px rgba(255,59,48,0.5);
        "></div>
    </div>
    <style>
        @keyframes ping {
            75%,100%{transform:scale(2);opacity:0;}
        }
    </style>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: '',
});

interface Props {
    center: [number, number];
    pin: { lat: number; lng: number } | null;
    onPinSet: (lat: number, lng: number) => void;
}

export default function AnonMap({ center, pin, onPinSet }: Props) {
    return (
        <MapContainer
            center={center}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPinSet={onPinSet} />
            <FlyToCenter center={center} />
            {pin && (
                <Marker
                    position={[pin.lat, pin.lng]}
                    icon={pulsingIcon}
                />
            )}
        </MapContainer>
    );
}
