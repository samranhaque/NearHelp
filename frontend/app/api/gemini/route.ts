import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  console.log("[Gemini API] Received request");

  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter(
    (key): key is string =>
      typeof key === "string" && key.trim().length > 0
  );

  if (apiKeys.length === 0) {
    return NextResponse.json(
      { error: "No Gemini API key configured." },
      { status: 500 }
    );
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ];

  let lastError: any = null;

  for (const apiKey of apiKeys) {
    for (const model of models) {
      try {
        console.log(`[Gemini API] Trying model: ${model}`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        const data = await response.json();

        console.log(
          `[Gemini API] ${model} responded with ${response.status}`
        );

        if (response.ok) {
          const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('╔' + '═'.repeat(78) + '╗');
          console.log('║ ✅ GEMINI API SUCCESS - THIS IS AN AI-GENERATED RESPONSE ║');
          console.log('╠' + '═'.repeat(78) + '╣');
          console.log('║ Model:', model.padEnd(67), '║');
          console.log('║ Response Length:', (aiResponse.length + ' characters').padEnd(58), '║');
          console.log('╠' + '═'.repeat(78) + '╣');
          console.log('║ First 150 characters of AI response:'.padEnd(79), '║');
          console.log('║ ' + aiResponse.substring(0, 150).replace(/\n/g, ' ').padEnd(77) + '║');
          console.log('╚' + '═'.repeat(78) + '╝');
          return NextResponse.json(data);
        }

        console.error(
          `[Gemini API] ${model} error:`,
          JSON.stringify(data, null, 2)
        );

        lastError = data;

        // Try next model
        if (
          response.status === 404 ||
          response.status === 503 ||
          data?.error?.status === "NOT_FOUND" ||
          data?.error?.status === "UNAVAILABLE"
        ) {
          continue;
        }

        // Try next model if this one is exhausted, since quotas are often per-model
        if (
          response.status === 429 ||
          data?.error?.status === "RESOURCE_EXHAUSTED"
        ) {
          continue;
        }
      } catch (error) {
        console.error(
          `[Gemini API] Network error with ${model}:`,
          error
        );

        lastError = error;
      }
    }
  }

  console.log('⚠️  [Gemini API] All models failed, using fallback responses');
  
  // Fallback to hardcoded emergency responses
  const userMsg = getUserMessage(body);
  const reply = getFallbackResponse(userMsg);
  
  return NextResponse.json({
    candidates: [{
      content: {
        parts: [{ text: reply }],
        role: "model"
      },
      finishReason: "STOP"
    }]
  });
}

function getUserMessage(body: any): string {
  try {
    if (!body?.contents || !Array.isArray(body.contents)) return '';
    
    for (let i = body.contents.length - 1; i >= 0; i--) {
      const content = body.contents[i];
      if (!content.role || content.role === 'user') {
        const parts = content.parts || [];
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text.trim()) {
            const text = part.text.trim();
            // Try to extract just the user's message from the prompt wrapper
            const match = text.match(/The user is asking:\s*"([^"]+)"/);
            if (match && match[1]) {
              return match[1].trim();
            }
            return text;
          }
        }
      }
    }
    return '';
  } catch {
    return '';
  }
}

function getFallbackResponse(message: string): string {
  if (!message) {
    return "Emergency assistance mode activated. Please clearly describe what happened (fire, injury, accident, gas leak, etc.). For immediate life-threatening emergencies, call 112 right now.";
  }

  const lowerMsg = message.toLowerCase();

  // Fire emergencies
  if (/fire|burning|smoke|flame|blaze/.test(lowerMsg)) {
    return 'Fire emergency: Evacuate immediately, stay low, close doors behind you. Do not use elevators. Call Fire Brigade: 101.';
  }

  // Medical emergencies
  if (/bleeding|blood|wound|cut/.test(lowerMsg)) {
    return 'For bleeding: Apply firm direct pressure with a clean cloth. Do not remove the cloth. Keep pressure for at least 10 minutes.';
  }

  if (/unconscious|fainted|not responding|collapsed|not breathing/.test(lowerMsg)) {
    return 'Person unconscious: Check breathing. If not breathing, begin CPR — 30 compressions then 2 breaths. Call 108 now.';
  }

  if (/heart attack|chest pain|chest tightness/.test(lowerMsg)) {
    return 'Possible heart attack: Keep person still and seated. Loosen tight clothing. Call 108 immediately. Do not let them eat or drink.';
  }

  if (/cpr|no pulse|cardiac arrest|chest compression/.test(lowerMsg)) {
    return 'CPR: 30 hard fast compressions at the center of the chest, then 2 rescue breaths. Push at least 2 inches deep. Call 108 and keep going.';
  }

  if (/seizure|epilepsy|convulsion/.test(lowerMsg)) {
    return 'During seizure: Clear the area of hard objects. Do not restrain. Place something soft under the head. Do not put anything in the mouth.';
  }

  if (/allergic|allergy|anaphylaxis|swelling throat/.test(lowerMsg)) {
    return 'Allergic reaction: If they have an EpiPen, use it immediately. Keep them lying down with legs raised. Call 108. Monitor breathing.';
  }

  if (/broken|fracture|bone|cannot move/.test(lowerMsg)) {
    return 'Possible fracture: Do not try to straighten the limb. Immobilise it as it is. Apply ice wrapped in cloth. Call 108 for severe cases.';
  }

  if (/burn|burned|scalded/.test(lowerMsg)) {
    return 'For burns: Cool with running cold water for 10 minutes minimum. Do not use ice, butter or toothpaste. Cover loosely. Call 108 for serious burns.';
  }

  // Gas and electrical
  if (/gas|smell gas|gas leak|lpg|cylinder/.test(lowerMsg)) {
    return 'Gas leak: Do NOT touch any electrical switches. Open windows. Turn off cylinder valve. Evacuate. Call 101 from outside.';
  }

  if (/electric|shock|electrocuted|live wire|sparks/.test(lowerMsg)) {
    return 'Electrical emergency: Do NOT touch the person. Cut main power first. Use a dry wooden object to separate. Call 108.';
  }

  // Accidents and disasters
  if (/accident|crash|collision|hit by/.test(lowerMsg)) {
    return 'Road accident: Do not move injured persons. Turn on hazard lights. Call 108 and Police 100. Keep crowd away.';
  }

  if (/flood|water rising|drowning|submerged/.test(lowerMsg)) {
    return 'Flooding: Move to the highest floor or roof. Do not walk in moving water. Turn off electricity. Call 112 for rescue.';
  }

  if (/earthquake|shaking|tremor|quake/.test(lowerMsg)) {
    return 'Earthquake: Drop, cover under sturdy furniture, hold on. Stay away from windows. Do not run outside during shaking.';
  }

  if (/collapse|building fell|trapped|buried|rubble/.test(lowerMsg)) {
    return 'Structural collapse: If trapped, tap rhythmically on pipes or walls. Cover nose with cloth. Call 112. Do not try to move heavy debris alone.';
  }

  // Vehicle issues
  if (/flat tyre|puncture|tyre burst/.test(lowerMsg)) {
    return 'Tyre burst: Grip steering firmly, do not brake suddenly. Ease off accelerator. Steer to road shoulder. Turn on hazard lights.';
  }

  if (/brake|brakes failed|cannot brake/.test(lowerMsg)) {
    return 'Brake failure: Pump brakes rapidly. Shift to a lower gear. Use the handbrake gently. Steer toward an uphill slope or soft barrier.';
  }

  if (/overheating|engine hot|steam|radiator/.test(lowerMsg)) {
    return 'Engine overheating: Pull over immediately. Turn off AC. Do not open the radiator cap when hot. Call for roadside assistance.';
  }

  if (/battery|car wont start|dead battery/.test(lowerMsg)) {
    return 'Dead battery: Turn off all electrics. A nearby mechanic responder has been notified. Avoid jump-starting without proper cables.';
  }

  // Safety threats
  if (/threat|robbery|weapon|knife|gun|attack|unsafe/.test(lowerMsg)) {
    return 'Safety threat: Move to a locked safe location. Stay silent. Call 100 or text someone your location. Do not confront.';
  }

  if (/missing|lost child|disappeared|cannot find/.test(lowerMsg)) {
    return 'Missing person: Call Police 100 immediately. Note last known location and clothing. For missing children call Childline: 1098.';
  }

  // Mental health
  if (/suicide|want to die|end my life|hopeless|no reason to live/.test(lowerMsg)) {
    return 'You are not alone. Help is available right now. Call iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345. A trained counsellor will listen.';
  }

  if (/panic attack|cant breathe|anxiety|overwhelmed/.test(lowerMsg)) {
    return 'Panic attack: You are safe. Breathe in for 4 counts, hold for 4, out for 4. Name 5 things you can see right now.';
  }

  // Generic emergency
  if (/help|emergency|please help|need help/.test(lowerMsg)) {
    return 'Emergency services: Police 100 | Fire 101 | Ambulance 108 | National Emergency 112. Describe your situation and help will be dispatched.';
  }

  // Default fallback
  return "Thank you for sharing the situation. Please stay calm and follow basic safety steps. For any serious emergency in India, call 112 (all services), 100 (Police), 101 (Fire), or 108 (Ambulance). Describe more details if you can.";
}
