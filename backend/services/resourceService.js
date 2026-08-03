const axios = require('axios');

const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function fetchFromGoogleMaps(lat, lng, type, keyword = '') {
    if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') return null;
    try {
        const { data } = await axios.get(GOOGLE_PLACES_URL, {
            params: { location: `${lat},${lng}`, radius: 5000, type, keyword, key: process.env.GOOGLE_MAPS_API_KEY }
        });
        return data.results.map(p => ({
            id: p.place_id, name: p.name,
            lat: p.geometry.location.lat, lng: p.geometry.location.lng,
            address: p.vicinity,
            open: p.opening_hours?.open_now,
            rating: p.rating, source: 'google'
        }));
    } catch { return null; }
}

async function fetchFromOSM(lat, lng, amenity) {
    const query = `[out:json][timeout:10];node["amenity"="${amenity}"](around:5000,${lat},${lng});out body;`;
    try {
        const { data } = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return (data.elements || []).map(e => ({
            id: String(e.id),
            name: e.tags?.name || amenity.charAt(0).toUpperCase() + amenity.slice(1),
            lat: e.lat, lng: e.lon,
            address: e.tags?.['addr:full'] || e.tags?.['addr:street'] || '',
            source: 'osm'
        }));
    } catch { return []; }
}

async function getNearbyResources(lat, lng) {
    const [hospitals, pharmacies, police, fire] = await Promise.all([
        fetchFromGoogleMaps(lat, lng, 'hospital') || fetchFromOSM(lat, lng, 'hospital'),
        fetchFromGoogleMaps(lat, lng, 'pharmacy') || fetchFromOSM(lat, lng, 'pharmacy'),
        fetchFromGoogleMaps(lat, lng, 'police') || fetchFromOSM(lat, lng, 'police'),
        fetchFromGoogleMaps(lat, lng, 'fire_station') || fetchFromOSM(lat, lng, 'fire_station'),
    ]);

    const poi = require('../data/pointsOfInterest');

    return {
        hospitals: (hospitals || []).slice(0, 8),
        pharmacies: (pharmacies || []).slice(0, 8),
        policeStations: (police || []).slice(0, 6),
        fireStations: (fire || []).slice(0, 6),
        fireHydrants: poi.fireHydrants || [],
        aed: poi.aed || []
    };
}

module.exports = { getNearbyResources };
