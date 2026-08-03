// ============================================================
// Geocoding Utility - Convert GPS coordinates to readable address
// ============================================================

const axios = require('axios');

/**
 * Reverse geocode: convert lat/lng to human-readable address
 * Uses OpenStreetMap Nominatim (free, no API key required)
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Formatted address or fallback message
 */
async function reverseGeocode(lat, lng) {
    if (!lat || !lng) {
        return 'Location unavailable';
    }

    try {
        // Attempt 1: OpenStreetMap Nominatim
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: lat,
                lon: lng,
                format: 'json',
                addressdetails: 1,
                zoom: 18,
            },
            headers: {
                'User-Agent': 'AetherNet-Emergency-App/1.0'
            },
            timeout: 5000
        });

        if (response.data && response.data.display_name) {
            const fullAddress = response.data.display_name;
            const addr = response.data.address || {};
            let parts = [];
            
            if (addr.road) parts.push(addr.road);
            if (addr.house_number) parts.unshift(addr.house_number);
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            else if (addr.suburb) parts.push(addr.suburb);
            if (addr.city) parts.push(addr.city);
            else if (addr.town) parts.push(addr.town);
            else if (addr.village) parts.push(addr.village);
            if (addr.state) parts.push(addr.state);
            if (addr.postcode) parts.push(addr.postcode);
            
            const structuredAddress = parts.length > 0 ? parts.join(', ') : fullAddress;
            console.log(`[Geocoding] ✅ Nominatim Resolved: ${structuredAddress}`);
            return structuredAddress;
        }
    } catch (error) {
        console.warn(`[Geocoding] ⚠️ Nominatim failed (${error.message}), trying BigDataCloud fallback...`);
    }

    try {
        // Attempt 2: BigDataCloud (Free, no API key, Cloud-friendly)
        const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
        const fallbackRes = await axios.get(fallbackUrl, { timeout: 5000 });
        
        if (fallbackRes.data && fallbackRes.data.city) {
            const data = fallbackRes.data;
            let parts = [];
            
            if (data.locality) parts.push(data.locality);
            if (data.city && data.city !== data.locality) parts.push(data.city);
            if (data.principalSubdivision) parts.push(data.principalSubdivision);
            
            if (parts.length > 0) {
                const fallbackAddress = parts.join(', ');
                console.log(`[Geocoding] ✅ BigDataCloud Resolved: ${fallbackAddress}`);
                return fallbackAddress;
            }
        }
    } catch (error) {
        console.error(`[Geocoding] ❌ BigDataCloud failed too: ${error.message}`);
    }

    // Ultimate fallback
    console.warn(`[Geocoding] ⚠️ All geocoders failed, using coordinates`);
    return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Get a short location description suitable for emergency calls
 * Prioritizes most relevant info for emergency responders
 */
async function getEmergencyLocation(lat, lng, landmark = '') {
    try {
        const address = await reverseGeocode(lat, lng);
        
        // If we have a landmark, include it
        if (landmark && landmark.trim().length > 0) {
            return `${landmark}, ${address}`;
        }
        
        return address;
    } catch (error) {
        console.error('[Geocoding] ❌ Emergency location error:', error.message);
        
        // Ultimate fallback
        if (landmark) {
            return `${landmark} (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        }
        return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

module.exports = {
    reverseGeocode,
    getEmergencyLocation,
};
