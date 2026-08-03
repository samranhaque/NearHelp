"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, setPinSet }: { position: any, setPosition: any, setPinSet: any }) {
    useMapEvents({
        click(e: any) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
            setPinSet(true);
        },
    });
    return position === null ? null : <Marker position={position} />;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function SignupMap({
    center,
    pinPosition,
    setPosition,
    setPinSet,
}: {
    center: [number, number];
    pinPosition: { lat: number; lng: number } | null;
    setPosition: (p: any) => void;
    setPinSet: (v: boolean) => void;
}) {
    return (
        <MapContainer
            center={center}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <MapUpdater center={center} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
                position={pinPosition}
                setPosition={(pos: any) => {
                    setPosition(pos);
                }}
                setPinSet={setPinSet}
            />
        </MapContainer>
    );
}
