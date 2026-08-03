"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Pin {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    open?: boolean;
    rating?: number;
    layerColor: string;
    layerLetter: string;
}

const createIcon = (color: string, letter: string) =>
    L.divIcon({
        html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:bold;font-size:12px;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">${letter}</div>`,
        iconSize: [32, 32],
        className: '',
    });

interface Props {
    center: [number, number];
    pins: Pin[];
}

export default function ResourceLeafletMap({ center, pins }: Props) {
    return (
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pins.map(pin => (
                <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createIcon(pin.layerColor, pin.layerLetter)}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-bold text-[#161618]">{pin.name}</p>
                            {pin.address && <p className="text-[#A0A0A8] text-xs mt-1">{pin.address}</p>}
                            <div className="flex items-center gap-2 mt-1">
                                {pin.open !== undefined && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${pin.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {pin.open ? 'Open now' : 'Closed'}
                                    </span>
                                )}
                                {pin.rating && <span className="text-xs text-[#A0A0A8]">{pin.rating} / 5</span>}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
