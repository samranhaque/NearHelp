// ============================================================
// AetherNet AI Service — Gemini AI Powered
// Fixed: removed non-existent gemini-3.5-flash model,
//        429 (quota) is per-model — falls through to next model,
//        only 401/403 (bad API key) short-circuit globally,
//        improved logging and fallback chain.
// ============================================================

// Initialize using process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
const { getEmergencyLocation } = require('../utils/geocoding');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── MARKDOWN STRIPPER ────────────────────────────────────────
/**
 * Remove markdown formatting from AI-generated text
 * Strips: **bold**, *italic*, __underline__, `code`, etc.
 * Preserves the actual text content
 */
function stripMarkdown(text) {
    if (!text) return text;
    
    return text
        // Remove bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        // Remove italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        // Remove inline code: `text`
        .replace(/`(.+?)`/g, '$1')
        // Remove headers: ## text or ### text
        .replace(/^#{1,6}\s+/gm, '')
        // Clean up any remaining asterisks or underscores
        .replace(/\*+/g, '')
        .replace(/_+/g, '')
        // Clean up extra spaces but KEEP newlines
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

// ─── GEMINI API CORE HELPER ──────────────────────────────────
async function callGemini(prompt, maxRetries = 2) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

    const models = [
        'gemini-2.5-flash',   // Primary — fastest, most capable
        'gemini-2.0-flash',   // Fallback — stable
        'gemini-2.5-pro',     // Last resort — always available
    ];

    for (const modelName of models) {
        let attempts = 0;
        while (attempts <= maxRetries) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text && text.trim().length > 0) {
                        const cleanText = stripMarkdown(text.trim());
                        console.log(`[aiService] ✅ Gemini response generated using model: ${modelName}`);
                        return cleanText;
                    }
                    console.warn(`[aiService] ⚠️ ${modelName} returned empty response.`);
                    break; // Move to next model
                }

                if (res.status === 400) {
                    throw new Error(`Gemini bad request: ${await res.text()}`);
                }
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Gemini auth error ${res.status}: check API key`);
                }

                if (res.status === 429 || res.status === 503) {
                    attempts++;
                    if (attempts <= maxRetries) {
                        const delayMs = 1500 * Math.pow(2, attempts); // 3s, 6s
                        console.warn(`[aiService] ⚠️ ${modelName} hit ${res.status}. Retrying in ${delayMs}ms (Attempt ${attempts})...`);
                        await delay(delayMs);
                        continue;
                    } else {
                        console.warn(`[aiService] ⚠️ ${modelName} exhausted retries for ${res.status}. Trying next model...`);
                        break; // Exhausted retries, move to next model
                    }
                }
                
                // Other errors
                const errText = await res.text();
                console.warn(`[aiService] ⚠️ ${modelName} failed (${res.status}): ${errText}`);
                break; // Move to next model

            } catch (err) {
                console.warn(`[aiService] ⚠️ ${modelName} network/fetch error: ${err.message}`);
                break; // Move to next model
            }
        }
    }

    throw new Error('All Gemini models failed. Unable to generate AI response. Please contact emergency services immediately at 112.');
}

// ─── 1. DYNAMIC FIRST-RESPONSE GUIDANCE ──────────────────────
const generateFirstResponseGuidance = async (sosType, modalData, userProfile) => {
    const description = modalData?.description || '';
    const bloodGroup = userProfile?.blood_group || '';
    const healthConditions = userProfile?.health_conditions || '';

    const prompt = `You are an expert emergency assistant operating in India.
The system context is classified as a "${sosType}" alert.

User-Provided Crisis Context:
- Description of the situation: "${description}"
- Medical history/conditions: ${healthConditions || 'None registered'}
- Blood group: ${bloodGroup || 'Not specified'}

Task:
Analyze the specific situation details. If the description mentions a low-severity issue (like a simple headache), provide calm relief tips. If the description indicates a high-severity crisis (like a heart attack, deep wound, or cardiac distress), immediately list life-saving emergency actions. 
Provide relevant emergency dispatch numbers (like 108 for medical or 112) depending on what the severity demands.
CRITICAL: Format your response as a clear, readable numbered list with each step on a new line. Do not write a single block of text.`;

    try {
        return await callGemini(prompt);
    } catch (err) {
        console.error('[aiService] ❌ CRITICAL: Unable to generate first-response guidance:', err.message);
        throw new Error(`AI service unavailable: ${err.message}. Please contact emergency services immediately at 112.`);
    }
};

// ─── 2. DYNAMIC EMERGENCY CALL SCRIPT ────────────────────────
const generateCallScript = async (sosType, modalData, userProfile, locationHint = '', lat = null, lng = null) => {
    const name = userProfile?.name || 'an individual';
    const description = modalData?.description || '';
    const bloodGroup = userProfile?.blood_group || '';
    const healthConditions = userProfile?.health_conditions || '';

    // Get human-readable address from GPS coordinates
    let locationInfo = locationHint || 'Current location';
    
    if (lat && lng) {
        try {
            console.log(`[aiService] 🗺️ Reverse geocoding: ${lat}, ${lng}`);
            const address = await getEmergencyLocation(lat, lng, locationHint);
            locationInfo = address;
            console.log(`[aiService] ✅ Location resolved: ${address}`);
        } catch (error) {
            console.error('[aiService] ⚠️ Geocoding failed, using coordinates:', error.message);
            locationInfo = locationHint 
                ? `${locationHint} (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)})`
                : `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    let contextDetails = `Blood Group: ${bloodGroup || 'Unknown'}\nHealth Conditions: ${healthConditions || 'None reported'}\n`;
    
    // Add type-specific context
    if (sosType === 'Car Problem') {
        const make = modalData?.make || '';
        const model = modalData?.model || '';
        const plate = modalData?.plate || '';
        contextDetails += `Vehicle: ${make} ${model}\nPlate Number: ${plate}\nLocation: ${locationInfo}`;
    } else {
        contextDetails += `Location: ${locationInfo}`;
    }

    const prompt = `You are helping prepare an emergency call script for calling 112 in India.

CALLER DETAILS:
Name: ${name}
Emergency Type: ${sosType}
Situation: ${description || 'Emergency situation'}

CONTEXT:
${contextDetails}

TASK: Write the EXACT words the caller should speak to the 112 emergency dispatcher. Requirements:

1. Write in FIRST PERSON (as if you ARE the caller speaking)
2. Start with: "Hello, this is ${name}."
3. Clearly state the emergency type
4. Describe the specific situation
5. State the COMPLETE location address (CRITICAL - say the full address exactly as provided above)
6. CRITICAL: You MUST explicitly state the caller's blood group in the script (e.g., "My blood group is ${bloodGroup || 'Unknown'}").
7. Request immediate assistance
8. Mention that a NearHelp community alert has been triggered
9. End with urgency if life-threatening

DO NOT include:
- Any preamble like "Here's a script..." or "This is what to say..."
- Stage directions like "*pauses*" or "[location]"
- Your own commentary
- Incomplete sentences

Write a complete, professional emergency call script (4-6 sentences). Start now with "Hello, this is ${name}..."`;

    try {
        return await callGemini(prompt);
    } catch (err) {
        console.error('[aiService] ❌ Unable to generate call script:', err.message);
        throw new Error(`AI service unavailable: ${err.message}`);
    }
};

// ─── 3. POST-RESOLUTION DEBRIEF ──────────────────────────────
const generateDebriefPrompt = async (sos) => {
    const durationMin = sos.resolved_at
        ? Math.round((new Date(sos.resolved_at) - new Date(sos.created_at)) / 60000)
        : null;

    const prompt = `Act as a supportive coordinator. An emergency situation of type "${sos.type}" with the details "${sos.modal_data?.description || 'medical distress'}" has just been successfully resolved after lasting ${durationMin || 'a few'} minutes.

Generate a short, thoughtful decompression message checking in on their well-being based on what they just went through.`;

    try {
        return await callGemini(prompt);
    } catch (err) {
        console.error('[aiService] ❌ Unable to generate debrief:', err.message);
        throw new Error(`AI service unavailable: ${err.message}`);
    }
};

// ─── 4. INCIDENT SUMMARY ─────────────────────────────────────
const generateResolutionSummary = async (sos) => {
    const duration = sos.response_time_seconds
        ? `${Math.floor(sos.response_time_seconds / 60)}m ${sos.response_time_seconds % 60}s`
        : 'Variable';

    const prompt = `Generate a concise summary log entry for this incident:
- Incident Type: ${sos.type}
- Total Active Duration: ${duration}
- Responders deployed: ${sos.responders?.length || 0}
- Log description: "${sos.modal_data?.description || 'No user input metadata available'}"`;

    try {
        return await callGemini(prompt);
    } catch (err) {
        console.error('[aiService] ❌ Unable to generate resolution summary:', err.message);
        throw new Error(`AI service unavailable: ${err.message}`);
    }
};

module.exports = {
    generateFirstResponseGuidance,
    generateCallScript,
    generateDebriefPrompt,
    generateResolutionSummary,
};