const express = require('express');
const axios = require('axios');
const router = express.Router();
const pointsOfInterest = require('../data/pointsOfInterest');

const RADIUS_METERS = 5000; // 5km
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// OSM tag mappings to your frontend layer keys
const QUERIES = {
  hospitals:     `node["amenity"="hospital"]`,
  pharmacies:    `node["amenity"="pharmacy"]`,
  policeStations:`node["amenity"="police"]`,
  fireStations:  `node["amenity"="fire_station"]`,
  fireHydrants:  `node["emergency"="fire_hydrant"]`,
  aed:           `node["emergency"="defibrillator"]`,
};

// Cache: key = "lat_lng" rounded to 2 decimal places, value = { data, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Wrap the axios.post in a retry function
async function fetchWithRetry(query, retries = 2) {
  try {
    return await axios.post(OVERPASS_URL,
      `data=${encodeURIComponent(query)}`,
      { 
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'NearHelp/1.0 (contact@nearhelp.com)'
        }, 
        timeout: 30000 
      }
    );
  } catch (err) {
    if (retries > 0 && (err.response?.status === 429 || err.code === 'ECONNABORTED')) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2s
      return fetchWithRetry(query, retries - 1);
    }
    throw err;
  }
}

// Helper: infer a readable name when OSM name tag is missing
function inferName(tags) {
  if (tags.amenity === 'hospital') return 'Hospital';
  if (tags.amenity === 'pharmacy') return 'Pharmacy';
  if (tags.amenity === 'police') return 'Police Station';
  if (tags.amenity === 'fire_station') return 'Fire Station';
  if (tags.emergency === 'fire_hydrant') return 'Fire Hydrant';
  if (tags.emergency === 'defibrillator') return 'AED';
  return 'Resource';
}

// Helper: build a readable address from OSM address tags
function buildAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

// Helper: parse OSM opening_hours into a simple boolean
// OSM format is complex ("Mo-Fr 09:00-18:00") — simplified to current hour check
function parseOpeningHours(hours) {
  if (!hours) return undefined;
  if (hours === '24/7') return true;
  // For anything else return undefined — too complex to parse reliably
  return undefined;
}

// GET /api/map/points-of-interest (static fallback/legacy)
router.get('/points-of-interest', (req, res) => {
    res.json(pointsOfInterest);
});

// GET /api/map/resources?lat=...&lng=...
router.get('/resources', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Invalid lat/lng' });
  }

  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  // Build one combined Overpass query for all 6 types simultaneously
  const overpassQuery = `
    [out:json][timeout:25];
    (
      ${Object.values(QUERIES).map(q => `${q}(around:${RADIUS_METERS},${lat},${lng});`).join('\n      ')}
      ${Object.values(QUERIES).map(q => `way${q.slice(4)}(around:${RADIUS_METERS},${lat},${lng});`).join('\n      ')}
    );
    out center;
  `;

  try {
    const response = await fetchWithRetry(overpassQuery, 2);
    const elements = response.data.elements || [];

    // Categorize each result by its OSM tags and include static fallback
    const result = {
      hospitals: [...(pointsOfInterest.hospitals || [])], 
      pharmacies: [], 
      policeStations: [...(pointsOfInterest.policeStations || [])],
      fireStations: [...(pointsOfInterest.fireStations || [])], 
      fireHydrants: [...(pointsOfInterest.fireHydrants || [])], 
      aed: [...(pointsOfInterest.aed || [])]
    };

    for (const el of elements) {
      // For ways, OSM returns center coordinates
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) continue;

      const tags = el.tags || {};
      const pin = {
        id: `${el.type}_${el.id}`,
        name: tags.name || tags['name:en'] || inferName(tags),
        lat: elLat,
        lng: elLng,
        address: buildAddress(tags),
        open: parseOpeningHours(tags.opening_hours),
        rating: undefined, // OSM doesn't have ratings — leave undefined
      };

      // Assign to correct category based on tags
      if (tags.amenity === 'hospital') result.hospitals.push(pin);
      else if (tags.amenity === 'pharmacy') result.pharmacies.push(pin);
      else if (tags.amenity === 'police') result.policeStations.push(pin);
      else if (tags.amenity === 'fire_station') result.fireStations.push(pin);
      else if (tags.emergency === 'fire_hydrant') result.fireHydrants.push(pin);
      else if (tags.emergency === 'defibrillator') result.aed.push(pin);
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

  } catch (error) {
    console.error('[mapRoute] Overpass API error:', error.message);
    // Return static points of interest as fallback instead of empty arrays
    const fallback = {
      hospitals: pointsOfInterest.hospitals || [],
      pharmacies: [],
      policeStations: pointsOfInterest.policeStations || [],
      fireStations: pointsOfInterest.fireStations || [],
      fireHydrants: pointsOfInterest.fireHydrants || [],
      aed: pointsOfInterest.aed || []
    };
    res.json(fallback);
  }
});

module.exports = router;
