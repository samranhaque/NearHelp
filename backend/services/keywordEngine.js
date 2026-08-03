// ============================================================
// NearHelp Keyword Response Engine
// Replaces Gemini API — zero external calls, zero cost
// ============================================================

const RESPONSES = {

    // ── FIRE ──────────────────────────────────────────────────
    fire: {
        keywords: ['fire', 'burning', 'flame', 'smoke', 'blaze', 'inferno',
            'caught fire', 'on fire', 'house fire', 'building fire'],
        guidance: `1. Evacuate immediately — do not stop for belongings
2. Stay low to the ground where air is cleaner
3. Close doors behind you to slow fire spread
4. Do not use elevators — use stairs only
5. Call Fire Brigade: 101 or National Emergency: 112
6. Once outside, move far away and do not re-enter
7. If trapped, seal door gaps with clothing and signal from window`,
        firstResponse: 'Fire emergency detected. Evacuate now.',
        category: 'fire'
    },

    // ── MEDICAL ───────────────────────────────────────────────
    medical: {
        keywords: ['medical', 'doctor', 'hospital', 'injury', 'injured',
            'bleeding', 'blood', 'unconscious', 'fainted', 'faint',
            'heart attack', 'chest pain', 'stroke', 'seizure',
            'epilepsy', 'diabetic', 'allergic', 'allergy', 'anaphylaxis',
            'broken bone', 'fracture', 'wound', 'cut', 'head injury',
            'not breathing', 'overdose', 'poisoning', 'vomiting'],
        guidance: `1. Stay calm and keep the person still
2. Call Ambulance: 108 or National Emergency: 112
3. Do not move the person if spinal injury is suspected
4. Apply firm pressure to any bleeding wounds with clean cloth
5. If unconscious and not breathing, begin CPR if trained
6. Do not give food or water to an unconscious person
7. Keep them warm and reassure them until help arrives`,
        firstResponse: 'Medical emergency detected. Keep the person calm and still.',
        category: 'medical'
    },

    // ── CPR ───────────────────────────────────────────────────
    cpr: {
        keywords: ['cpr', 'not breathing', 'no pulse', 'cardiac arrest',
            'heart stopped', 'resuscitation', 'chest compressions'],
        guidance: `1. Check scene safety then tap shoulder — shout "Are you okay?"
2. Call 112 immediately or ask someone nearby to call
3. Tilt head back, lift chin to open airway
4. Give 30 chest compressions — hard and fast, center of chest
5. Give 2 rescue breaths if trained — pinch nose, cover mouth
6. Continue 30:2 cycle until help arrives or person responds
7. Do not stop unless medically trained person takes over`,
        firstResponse: 'CPR guidance activated. Begin compressions immediately.',
        category: 'medical'
    },

    // ── GAS LEAK ──────────────────────────────────────────────
    gas: {
        keywords: ['gas', 'gas leak', 'smell gas', 'lpg', 'cylinder leak',
            'pipeline leak', 'gas smell', 'sulphur smell', 'hissing sound',
            'gas cylinder', 'cooking gas', 'cng'],
        guidance: `1. Do NOT switch on or off any lights or electrical switches
2. Do NOT use your phone inside the building — move outside first
3. Open all windows and doors immediately
4. Turn off the gas cylinder valve if safely reachable
5. Evacuate everyone from the building
6. Do not use lighters, matches, or any open flame
7. Call Fire Brigade: 101 from outside the building`,
        firstResponse: 'Gas leak detected. Do not use any electrical switches.',
        category: 'gas'
    },

    // ── ACCIDENT ──────────────────────────────────────────────
    accident: {
        keywords: ['accident', 'crash', 'collision', 'hit', 'car accident',
            'road accident', 'vehicle crash', 'motorbike', 'bike accident',
            'truck', 'bus crash', 'overturned', 'rollover', 'fallen'],
        guidance: `1. Do not move injured persons unless there is immediate fire risk
2. Call Ambulance: 108 and Police: 100 immediately
3. Turn on hazard lights and place warning triangle if available
4. Keep injured persons warm and reassured
5. Do not remove helmets unless the person cannot breathe
6. Control bleeding with firm pressure using clean cloth
7. Keep crowd away to allow emergency vehicles clear access`,
        firstResponse: 'Road accident detected. Do not move injured persons.',
        category: 'accident'
    },

    // ── CAR BREAKDOWN ─────────────────────────────────────────
    car: {
        keywords: ['breakdown', 'car broke', 'engine', 'tyre', 'flat tyre',
            'puncture', 'battery dead', 'car wont start', 'overheating',
            'car problem', 'vehicle problem', 'stranded', 'stuck on road',
            'brake failure', 'steering', 'transmission', 'gear'],
        guidance: `1. Move vehicle to the left shoulder of the road immediately
2. Turn on hazard warning lights
3. Place warning triangle 50 meters behind vehicle if available
4. Do not stand between your vehicle and moving traffic
5. Stay inside the vehicle if on a highway until help arrives
6. Skilled mechanic responders are being notified nearby
7. Take photos of the issue for the mechanic responder`,
        firstResponse: 'Vehicle breakdown detected. Move to road shoulder now.',
        category: 'car'
    },

    // ── FLOOD ─────────────────────────────────────────────────
    flood: {
        keywords: ['flood', 'flooding', 'water rising', 'submerged', 'waterlogged',
            'swept away', 'drowning', 'drowned', 'river overflow',
            'rain water', 'inundated', 'flash flood'],
        guidance: `1. Move to higher ground immediately — do not wait
2. Do not walk through moving flood water — 6 inches can knock you down
3. Do not drive through flooded roads
4. Turn off electricity at the main breaker if safe to do so
5. Avoid contact with flood water — it may be contaminated
6. Call National Emergency: 112 for evacuation assistance
7. Take essential documents and medicines if evacuating`,
        firstResponse: 'Flood emergency detected. Move to higher ground immediately.',
        category: 'flood'
    },

    // ── EARTHQUAKE ────────────────────────────────────────────
    earthquake: {
        keywords: ['earthquake', 'tremor', 'shaking', 'building shaking',
            'quake', 'seismic', 'aftershock', 'ground shaking',
            'walls cracking', 'collapse', 'building collapsed'],
        guidance: `1. DROP to hands and knees immediately
2. Take COVER under a sturdy table or desk — protect head and neck
3. HOLD ON until shaking completely stops
4. Stay away from windows, exterior walls, and heavy furniture
5. Do not run outside during shaking — most injuries occur from falling debris
6. After shaking stops, check for injuries and evacuate carefully
7. Watch for aftershocks — move to open area away from buildings`,
        firstResponse: 'Earthquake detected. Drop, Cover, and Hold On immediately.',
        category: 'earthquake'
    },

    // ── THREAT / VIOLENCE ─────────────────────────────────────
    threat: {
        keywords: ['threat', 'danger', 'attack', 'robbery', 'theft', 'mugger',
            'violence', 'assault', 'weapon', 'knife', 'gun', 'shooter',
            'kidnap', 'stalker', 'following me', 'unsafe', 'being followed',
            'harassment', 'threatened', 'help me', 'scared'],
        guidance: `1. Move to a safe, locked location immediately
2. Stay silent — do not attract attention
3. Call Police: 100 or National Emergency: 112 silently if possible
4. Do not confront the threat directly
5. Text a trusted contact or guardian your location
6. If in public, move toward crowds and well-lit areas
7. Responders are being notified — stay where you are if safe`,
        firstResponse: 'Safety threat detected. Move to safety immediately.',
        category: 'threat'
    },

    // ── MENTAL HEALTH / SUICIDE ────────────────────────────────
    mentalHealth: {
        keywords: ['suicide', 'suicidal', 'want to die', 'end my life',
            'kill myself', 'no reason to live', 'hopeless', 'worthless',
            'cant go on', 'give up', 'self harm', 'cutting', 'depression',
            'panic attack', 'anxiety attack', 'breakdown', 'crisis',
            'mental health', 'overwhelmed', 'cant breathe', 'panic'],
        guidance: `1. You are not alone — trained counsellors are available right now
2. Call iCall (TISS): 9152987821 — free psychological counselling
3. Call Vandrevala Foundation: 1860-2662-345 — available 24 hours
4. Call iCall: 9152987821 for immediate crisis support
5. Move to a safe, calm location away from harm
6. Text a trusted person your current location
7. Stay on the line with a counsellor until you feel stable`,
        firstResponse: 'Crisis support activated. You are not alone.',
        category: 'mental'
    },

    // ── ELECTRIC SHOCK ────────────────────────────────────────
    electric: {
        keywords: ['electric', 'shock', 'electrocuted', 'electrocution',
            'live wire', 'power line', 'sparks', 'short circuit',
            'electric fire', 'fuse box', 'wiring', 'voltage'],
        guidance: `1. Do NOT touch the person if they are still in contact with electricity
2. Switch off the main power supply immediately
3. Use a non-conductive object (wooden stick, dry rope) to separate person from source
4. Call Ambulance: 108 — electric shock causes internal injuries not visible
5. Once separated safely, check for breathing and begin CPR if needed
6. Do not apply water to electrical burns
7. Keep the person warm and still until ambulance arrives`,
        firstResponse: 'Electrical emergency. Do not touch the person directly.',
        category: 'electric'
    },

    // ── MISSING PERSON ────────────────────────────────────────
    missing: {
        keywords: ['missing', 'lost', 'lost child', 'child missing', 'kidnapped',
            'abducted', 'cannot find', 'gone missing', 'disappeared',
            'lost person', 'elderly missing', 'wandered off'],
        guidance: `1. Call Police: 100 immediately and file a missing report
2. Note the last known location, time, and what they were wearing
3. Check nearby areas, shops, and familiar locations first
4. Share a recent photo with neighbours and local shops
5. Post on local community groups with description and photo
6. Do not leave the home unattended in case they return
7. For missing children call Childline: 1098 immediately`,
        firstResponse: 'Missing person alert. Contact police immediately.',
        category: 'missing'
    },

    // ── STRUCTURAL / BUILDING ─────────────────────────────────
    structural: {
        keywords: ['collapse', 'building collapse', 'wall fell', 'roof collapsed',
            'structure', 'cave in', 'sinkhole', 'foundation', 'crack',
            'debris', 'rubble', 'trapped', 'stuck', 'buried'],
        guidance: `1. Evacuate the building immediately if it is safe to move
2. Do not use elevators — use stairs only
3. If trapped, tap on pipes or walls rhythmically to signal rescuers
4. Cover nose and mouth with cloth to filter dust
5. Call National Emergency: 112 for structural rescue team
6. Do not enter a collapsed structure to rescue — wait for trained team
7. Keep others away from the collapse zone — secondary collapse is possible`,
        firstResponse: 'Structural emergency. Evacuate and call 112 immediately.',
        category: 'structural'
    },

    // ── GENERAL FALLBACK ──────────────────────────────────────
    general: {
        keywords: [],
        guidance: `1. Stay calm and assess your immediate surroundings for safety
2. Call National Emergency: 112 if situation is life-threatening
3. Move to a safe, sheltered location
4. Notify a trusted contact of your location
5. Community responders are being notified and are on their way
6. Keep your phone charged and location services on
7. Do not leave the area unless it is unsafe to remain`,
        firstResponse: 'Emergency detected. Responders are being notified.',
        category: 'general'
    }
};

// ── CHAT KEYWORD RESPONSES ────────────────────────────────────
const CHAT_RESPONSES = {
    fire: [
        {
            trigger: ['fire', 'burning', 'smoke', 'flame', 'blaze'],
            reply: 'Fire emergency: Evacuate immediately, stay low, close doors behind you. Do not use elevators. Call 101.'
        },
    ],
    medical: [
        {
            trigger: ['bleeding', 'blood', 'wound', 'cut'],
            reply: 'For bleeding: Apply firm direct pressure with a clean cloth. Do not remove the cloth. Keep pressure for at least 10 minutes.'
        },
        {
            trigger: ['unconscious', 'fainted', 'not responding', 'collapsed'],
            reply: 'Person unconscious: Check breathing. If not breathing, begin CPR — 30 compressions then 2 breaths. Call 108 now.'
        },
        {
            trigger: ['heart attack', 'chest pain', 'chest tightness'],
            reply: 'Possible heart attack: Keep person still and seated. Loosen tight clothing. Call 108 immediately. Do not let them eat or drink.'
        },
        {
            trigger: ['seizure', 'epilepsy', 'convulsion', 'shaking'],
            reply: 'During seizure: Clear the area of hard objects. Do not restrain. Place something soft under head. Time the seizure. Do not put anything in mouth.'
        },
        {
            trigger: ['allergic', 'allergy', 'anaphylaxis', 'swelling', 'throat'],
            reply: 'Allergic reaction: If they have an EpiPen, use it immediately. Keep them lying down with legs raised. Call 108. Monitor breathing.'
        },
        {
            trigger: ['broken', 'fracture', 'bone', 'cannot move'],
            reply: 'Possible fracture: Do not try to straighten the limb. Immobilise it as it is. Apply ice wrapped in cloth. Call 108 for severe cases.'
        },
        {
            trigger: ['burn', 'burned', 'scalded'],
            reply: 'For burns: Cool with running cold water for 10 minutes minimum. Do not use ice, butter or toothpaste. Cover loosely with clean cloth. Call 108 for serious burns.'
        },
    ],
    gas: [
        {
            trigger: ['gas', 'smell gas', 'gas leak', 'lpg', 'cylinder'],
            reply: 'Gas leak: Do not touch any switches. Open windows. Turn off cylinder valve. Evacuate. Call 101 from outside.'
        },
    ],
    accident: [
        {
            trigger: ['accident', 'crash', 'collision', 'hit by'],
            reply: 'Road accident: Do not move injured persons. Turn on hazard lights. Call 108 and 100. Keep crowd away.'
        },
    ],
    flood: [
        {
            trigger: ['flood', 'water rising', 'drowning', 'submerged'],
            reply: 'Flooding: Move to highest floor or roof. Do not walk in moving water. Turn off electricity. Call 112 for rescue.'
        },
    ],
    earthquake: [
        {
            trigger: ['earthquake', 'shaking', 'tremor', 'quake'],
            reply: 'Earthquake: Drop, cover under sturdy furniture, hold on. Stay away from windows. Do not run outside during shaking.'
        },
    ],
    threat: [
        {
            trigger: ['threat', 'robbery', 'weapon', 'knife', 'gun', 'attack', 'unsafe'],
            reply: 'Safety threat: Move to locked safe location. Stay silent. Call 100 or text someone your location. Do not confront.'
        },
    ],
    mentalHealth: [
        {
            trigger: ['suicide', 'want to die', 'end my life', 'hopeless', 'no reason'],
            reply: 'You are not alone and help is available right now. Call iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345. A trained counsellor will listen.'
        },
        {
            trigger: ['panic attack', 'cant breathe', 'anxiety', 'overwhelmed'],
            reply: 'Panic attack: You are safe. Breathe in for 4 counts, hold for 4, out for 4. Ground yourself — name 5 things you can see right now.'
        },
    ],
    electric: [
        {
            trigger: ['electric', 'shock', 'electrocuted', 'live wire', 'sparks'],
            reply: 'Electrical emergency: Do not touch the person. Cut main power. Use dry non-conductive object to separate. Call 108.'
        },
    ],
    structural: [
        {
            trigger: ['collapse', 'building fell', 'trapped', 'buried', 'rubble'],
            reply: 'Structural collapse: If trapped, tap rhythmically on pipes or walls. Cover nose with cloth. Call 112. Do not try to move heavy debris alone.'
        },
    ],
    missing: [
        {
            trigger: ['missing', 'lost child', 'disappeared', 'cannot find'],
            reply: 'Missing person: Call Police 100 immediately. Note last location and clothing. For missing children call Childline: 1098.'
        },
    ],
    car: [
        {
            trigger: ['flat tyre', 'puncture', 'tyre burst'],
            reply: 'Tyre burst: Grip steering firmly and do not brake suddenly. Ease off accelerator gradually. Steer to road shoulder. Turn on hazard lights.'
        },
        {
            trigger: ['brake', 'brakes failed', 'cannot brake'],
            reply: 'Brake failure: Pump brakes rapidly. Shift to lower gear. Use handbrake gently. Steer toward an uphill slope or soft barrier to slow down.'
        },
        {
            trigger: ['overheating', 'engine hot', 'steam', 'radiator'],
            reply: 'Engine overheating: Pull over immediately. Turn off AC, turn on heater to draw heat away. Do not open radiator cap when hot. Call for assistance.'
        },
        {
            trigger: ['battery', 'car wont start', 'dead battery'],
            reply: 'Dead battery: Turn off all electrics. A nearby mechanic responder has been notified. Avoid jump-starting unless you have proper cables.'
        },
    ],
    cpr: [
        {
            trigger: ['cpr', 'chest compression', 'not breathing', 'no pulse'],
            reply: 'CPR: 30 hard fast compressions center of chest, then 2 rescue breaths. Repeat. Push hard — at least 2 inches deep. Call 108 and keep going.'
        },
    ]
};

// ── MAIN MATCHING FUNCTIONS ───────────────────────────────────

function matchesKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function getGuidance(text) {
    const lower = text.toLowerCase();
    // Check CPR first (more specific than medical)
    if (matchesKeywords(lower, RESPONSES.cpr.keywords)) return RESPONSES.cpr;
    for (const key of Object.keys(RESPONSES)) {
        if (key === 'general' || key === 'cpr') continue;
        if (matchesKeywords(lower, RESPONSES[key].keywords)) return RESPONSES[key];
    }
    return RESPONSES.general;
}

function getChatReply(text) {
    const lower = text.toLowerCase();
    for (const category of Object.values(CHAT_RESPONSES)) {
        for (const item of category) {
            if (item.trigger.some(keyword => lower.includes(keyword))) {
                return item.reply;
            }
        }
    }
    if (matchesKeywords(lower, ['help', 'please help', 'need help', 'emergency'])) {
        return 'Responders are on their way. Stay where you are and keep this chat open. What is the nature of your emergency?';
    }
    if (matchesKeywords(lower, ['where are you', 'how far', 'how long', 'eta', 'coming'])) {
        return 'Your responder is en route. You can see their location moving on the map in real time.';
    }
    if (matchesKeywords(lower, ['okay', 'ok', 'fine', 'better', 'stable', 'calm'])) {
        return 'Good to hear. Stay where you are, keep the area clear for responders. Help is close.';
    }
    if (matchesKeywords(lower, ['thank', 'thanks', 'thank you'])) {
        return 'Stay safe. Your community is here for you.';
    }
    if (matchesKeywords(lower, ['call', 'phone', 'number', 'ambulance', 'police', 'fire'])) {
        return 'Emergency numbers: Police 100 | Fire 101 | Ambulance 108 | National Emergency 112';
    }
    if (matchesKeywords(lower, ['scared', 'afraid', 'fear', 'terrified', 'nervous'])) {
        return 'You are not alone. A verified responder has accepted your SOS and is coming to you. Stay calm and keep breathing.';
    }
    return 'Message received. Responders can see your messages. Stay in a safe location and keep this channel open.';
}

// ── SOS TYPE AUTO-DETECT ──────────────────────────────────────
function getGuidanceBySOSType(sosType) {
    const typeMap = {
        'Medical': RESPONSES.medical,
        'Elderly Care': RESPONSES.medical,
        'Car Problem': RESPONSES.car,
        'Fire': RESPONSES.fire,
        'Gas Leak': RESPONSES.gas,
        'Flood / Water': RESPONSES.flood,
        'Electrical': RESPONSES.electric,
        'Structural Collapse': RESPONSES.structural,
        'Threat to Safety': RESPONSES.threat,
        'Mental Health Crisis': RESPONSES.mentalHealth,
        'Child in Danger': RESPONSES.threat,
        'General Help': RESPONSES.general,
        'Pet Rescue': RESPONSES.general,
        'Food / Shelter': RESPONSES.general,
        'Legal Emergency': RESPONSES.general,
    };
    return typeMap[sosType] || RESPONSES.general;
}

module.exports = { getGuidance, getChatReply, getGuidanceBySOSType, RESPONSES };
