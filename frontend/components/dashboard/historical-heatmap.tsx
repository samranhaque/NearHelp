"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface HeatmapData {
    gridX: number;
    gridY: number;
    count: number;
    types: string[];
}

export default function HistoricalHeatmap({ data }: { data: HeatmapData[] }) {
    const maxCount = Math.max(1, ...(data || []).map(d => d.count));

    return (
        <MapContainer center={[28.6139, 77.2090]} zoom={12} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(data || []).map((point, i) => {
                const intensity = point.count / maxCount;
                // Heatmap colors: yellow (low) -> orange -> red (high)
                const color = intensity > 0.6 ? '#FF3B30' : intensity > 0.3 ? '#FF9F0A' : '#FFD60A';
                
                return (
                    <CircleMarker
                        key={`heat-${i}`}
                        center={[point.gridY, point.gridX]}
                        radius={Math.max(25, intensity * 50)}
                        pathOptions={{ 
                            color: 'transparent', 
                            fillColor: color, 
                            fillOpacity: 0.5 + (intensity * 0.4) 
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <div className="font-bold text-[#161618]">{point.count} Historical Incidents</div>
                                <div className="text-xs text-gray-500 mt-1">Common Types: {point.types.join(", ")}</div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
