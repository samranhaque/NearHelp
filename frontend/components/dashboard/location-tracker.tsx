"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function LocationTracker() {
    const { user, setUser } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;

                // Only update if location changed significantly (e.g. > 10 meters) or first time
                const hasMoved = !user.location ||
                    Math.abs(user.location.lat - lat) > 0.0001 ||
                    Math.abs(user.location.lng - lng) > 0.0001;

                if (hasMoved) {
                    try {
                        await api.put("/users/location", { lat, lng });
                        setUser((prev: any) => ({
                            ...prev,
                            location: { lat, lng }
                        }));
                        setError(null);
                    } catch (err) {
                        console.error("Location sync failed:", err);
                    }
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [user, setUser]);

    // Hidden component, just provides background tracking
    return null;
}
