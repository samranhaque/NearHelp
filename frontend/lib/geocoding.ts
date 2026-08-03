// ============================================================
// Frontend Geocoding Utility - Convert GPS to readable address
// ============================================================

/**
 * Reverse geocode: convert lat/lng to human-readable address
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!lat || !lng) {
        return 'Location unavailable';
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
            {
                headers: {
                    'User-Agent': 'AetherNet-Emergency-App/1.0'
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.display_name) {
            // Try to extract structured info
            const addr = data.address || {};
            
            // Build a concise but informative address
            const parts: string[] = [];
            
            // Street-level info
            if (addr.road) parts.push(addr.road);
            if (addr.house_number) parts.unshift(addr.house_number);
            
            // Locality
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            else if (addr.suburb) parts.push(addr.suburb);
            
            // City/town
            if (addr.city) parts.push(addr.city);
            else if (addr.town) parts.push(addr.town);
            else if (addr.village) parts.push(addr.village);
            
            // State
            if (addr.state) parts.push(addr.state);
            
            // Postal code
            if (addr.postcode) parts.push(addr.postcode);
            
            // If we got structured data, use it; otherwise use full address
            const structuredAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
            
            console.log(`[Geocoding] ✅ Resolved: ${structuredAddress}`);
            return structuredAddress;
        }

        // Fallback to coordinates
        console.warn(`[Geocoding] ⚠️ No address found, using coordinates`);
        return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    } catch (error) {
        console.error('[Geocoding] ❌ Error:', error);
        
        // Fallback to raw coordinates on error
        return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

/**
 * Get emergency location with caching to avoid repeated API calls
 */
const locationCache = new Map<string, { address: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getEmergencyLocation(
    lat: number, 
    lng: number, 
    landmark: string = ''
): Promise<string> {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache first
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[Geocoding] 📦 Using cached address');
        return landmark ? `${landmark}, ${cached.address}` : cached.address;
    }

    try {
        const address = await reverseGeocode(lat, lng);
        
        // Cache the result
        locationCache.set(cacheKey, {
            address,
            timestamp: Date.now()
        });
        
        // If we have a landmark, include it
        if (landmark && landmark.trim().length > 0) {
            return `${landmark}, ${address}`;
        }
        
        return address;
    } catch (error) {
        console.error('[Geocoding] ❌ Emergency location error:', error);
        
        // Ultimate fallback
        if (landmark) {
            return `${landmark} (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        }
        return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}
