const axios = require('axios');
const QUERIES = {
  hospitals:     'node["amenity"="hospital"]',
};
const lat = 22.8046;
const lng = 86.2029;
const RADIUS_METERS = 5000;
const overpassQuery = `
    [out:json][timeout:25];
    (
      ${Object.values(QUERIES).map(q => `${q}(around:${RADIUS_METERS},${lat},${lng});`).join('\n      ')}
    );
    out center;
`;
axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(overpassQuery)}`, { 
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'NearHelp/1.0 (contact@nearhelp.com)'
  }, 
  timeout: 30000 
})
.then(res => console.log('GOT DATA:', res.data.elements.length))
.catch(err => console.error('ERROR:', err.message, err.response?.status));
