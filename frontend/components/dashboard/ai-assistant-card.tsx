"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User } from "lucide-react";
import { motion } from "framer-motion";

// ─── KEYWORD ENGINE (inline — zero backend, zero API) ────────────────────────
const CHAT_RULES: { triggers: string[]; reply: string }[] = [
  {
    triggers: ["fire", "burning", "smoke", "flame", "blaze"],
    reply: "Fire emergency: Evacuate immediately, stay low, close doors behind you. Do not use elevators. Call Fire Brigade: 101."
  },
  {
    triggers: ["bleeding", "blood", "wound", "cut"],
    reply: "For bleeding: Apply firm direct pressure with a clean cloth. Do not remove the cloth. Keep pressure for at least 10 minutes."
  },
  {
    triggers: ["unconscious", "fainted", "not responding", "collapsed", "not breathing"],
    reply: "Person unconscious: Check breathing. If not breathing, begin CPR — 30 compressions then 2 breaths. Call 108 now."
  },
  {
    triggers: ["heart attack", "chest pain", "chest tightness"],
    reply: "Possible heart attack: Keep person still and seated. Loosen tight clothing. Call 108 immediately. Do not let them eat or drink."
  },
  {
    triggers: ["cpr", "no pulse", "cardiac arrest", "chest compression"],
    reply: "CPR: 30 hard fast compressions at the center of the chest, then 2 rescue breaths. Push at least 2 inches deep. Call 108 and keep going."
  },
  {
    triggers: ["seizure", "epilepsy", "convulsion"],
    reply: "During seizure: Clear the area of hard objects. Do not restrain. Place something soft under the head. Do not put anything in the mouth."
  },
  {
    triggers: ["allergic", "allergy", "anaphylaxis", "swelling throat"],
    reply: "Allergic reaction: If they have an EpiPen, use it immediately. Keep them lying down with legs raised. Call 108. Monitor breathing."
  },
  {
    triggers: ["broken", "fracture", "bone", "cannot move"],
    reply: "Possible fracture: Do not try to straighten the limb. Immobilise it as it is. Apply ice wrapped in cloth. Call 108 for severe cases."
  },
  {
    triggers: ["burn", "burned", "scalded"],
    reply: "For burns: Cool with running cold water for 10 minutes minimum. Do not use ice, butter or toothpaste. Cover loosely. Call 108 for serious burns."
  },
  {
    triggers: ["gas", "smell gas", "gas leak", "lpg", "cylinder"],
    reply: "Gas leak: Do NOT touch any electrical switches. Open windows. Turn off cylinder valve. Evacuate. Call 101 from outside."
  },
  {
    triggers: ["accident", "crash", "collision", "hit by"],
    reply: "Road accident: Do not move injured persons. Turn on hazard lights. Call 108 and Police 100. Keep crowd away."
  },
  {
    triggers: ["flood", "water rising", "drowning", "submerged"],
    reply: "Flooding: Move to the highest floor or roof. Do not walk in moving water. Turn off electricity. Call 112 for rescue."
  },
  {
    triggers: ["earthquake", "shaking", "tremor", "quake"],
    reply: "Earthquake: Drop, cover under sturdy furniture, hold on. Stay away from windows. Do not run outside during shaking."
  },
  {
    triggers: ["flat tyre", "puncture", "tyre burst"],
    reply: "Tyre burst: Grip steering firmly, do not brake suddenly. Ease off accelerator. Steer to road shoulder. Turn on hazard lights."
  },
  {
    triggers: ["brake", "brakes failed", "cannot brake"],
    reply: "Brake failure: Pump brakes rapidly. Shift to a lower gear. Use the handbrake gently. Steer toward an uphill slope or soft barrier."
  },
  {
    triggers: ["overheating", "engine hot", "steam", "radiator"],
    reply: "Engine overheating: Pull over immediately. Turn off AC. Do not open the radiator cap when hot. Call for roadside assistance."
  },
  {
    triggers: ["battery", "car wont start", "dead battery"],
    reply: "Dead battery: Turn off all electrics. A nearby mechanic responder has been notified. Avoid jump-starting without proper cables."
  },
  {
    triggers: ["electric", "shock", "electrocuted", "live wire", "sparks"],
    reply: "Electrical emergency: Do NOT touch the person. Cut main power first. Use a dry wooden object to separate. Call 108."
  },
  {
    triggers: ["collapse", "building fell", "trapped", "buried", "rubble"],
    reply: "Structural collapse: If trapped, tap rhythmically on pipes or walls. Cover nose with cloth. Call 112. Do not try to move heavy debris alone."
  },
  {
    triggers: ["missing", "lost child", "disappeared", "cannot find"],
    reply: "Missing person: Call Police 100 immediately. Note last known location and clothing. For missing children call Childline: 1098."
  },
  {
    triggers: ["threat", "robbery", "weapon", "knife", "gun", "attack", "unsafe"],
    reply: "Safety threat: Move to a locked safe location. Stay silent. Call 100 or text someone your location. Do not confront."
  },
  {
    triggers: ["suicide", "want to die", "end my life", "hopeless", "no reason to live"],
    reply: "You are not alone. Help is available right now. Call iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345. A trained counsellor will listen."
  },
  {
    triggers: ["panic attack", "cant breathe", "anxiety", "overwhelmed"],
    reply: "Panic attack: You are safe. Breathe in for 4 counts, hold for 4, out for 4. Name 5 things you can see right now."
  },
  {
    triggers: ["help", "emergency", "please help", "need help"],
    reply: "Responders are on their way. Stay where you are and keep this chat open. What is the nature of your emergency?"
  },
  {
    triggers: ["where are you", "how far", "how long", "eta", "coming"],
    reply: "Your responder is en route. You can see their location on the map in real time."
  },
  {
    triggers: ["okay", "ok", "fine", "better", "stable", "calm"],
    reply: "Good to hear. Stay where you are and keep the area clear for responders. Help is close."
  },
  {
    triggers: ["thank", "thanks", "thank you"],
    reply: "Stay safe. Your community is here for you."
  },
  {
    triggers: ["call", "phone", "number", "ambulance", "police"],
    reply: "Emergency numbers: Police 100 | Fire 101 | Ambulance 108 | National Emergency 112"
  },
  {
    triggers: ["scared", "afraid", "fear", "terrified"],
    reply: "You are not alone. A verified responder has accepted your SOS and is coming. Stay calm and keep breathing."
  },
  {
    triggers: ["first aid", "what to do", "how to"],
    reply: "Describe your emergency and I will give you step-by-step first aid guidance. Examples: 'someone is bleeding', 'fire in building', 'chest pain'."
  },
];

function getReply(text: string): string {
  const lower = text.toLowerCase();
  for (const rule of CHAT_RULES) {
    if (rule.triggers.some(t => lower.includes(t))) return rule.reply;
  }
  return "Message received. Describe your emergency in more detail and I will provide specific guidance. Emergency line: 112.";
}
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  text: string;
}

function renderMessageText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AiAssistantCard({ guidance, activeSOS }: { guidance?: string[]; activeSOS?: any }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: "I'm your AI Crisis Assistant. Ask me anything — first aid, what to do in an emergency, or describe what's happening right now."
  }]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Inject guidance when SOS is active
  useEffect(() => {
    if (guidance && guidance.length > 0) {
      setMessages(prev => [...prev, { role: "assistant", text: guidance.join("\n") }]);
    }
  }, [guidance]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    setMessages(prev => [...prev, { role: "user", text }]);

    try {
      // Call Gemini API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ 
                text: `You are an emergency crisis assistant. The user is asking: "${text}". Provide clear, concise, actionable emergency guidance. If it's a medical emergency, give first aid steps. If it's a safety threat, give safety instructions. Include relevant emergency numbers for India (Police: 100, Fire: 101, Ambulance: 108, National Emergency: 112). CRITICAL: If the user's query is NOT related to an emergency, safety, first-aid, or crisis situation, you MUST refuse to answer it completely. Respond ONLY with "This is not an emergency or safety-related question. I am an AI Crisis Assistant and can only provide guidance for emergencies, first-aid, and safety threats." Do NOT provide any other information.`
              }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.3
          }
        })
      });

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || getReply(text);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to local keyword engine if API fails
      const reply = getReply(text);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    }
  };

  return (
    <div className="h-full flex flex-col rounded-3xl border border-[#E5E5E5] bg-white p-6 text-black">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-[#FF3B30]" />
        <h2 className="text-base font-semibold text-black">AI Crisis Assistant</h2>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-[#34C759] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0" style={{ maxHeight: "320px" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="h-6 w-6 rounded-full bg-[#FF3B30]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-[#FF3B30]" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${msg.role === "user"
                ? "bg-[#161618] text-white rounded-tr-sm"
                : "bg-[#F7F7F8] text-black rounded-tl-sm"
              }`}>
              {renderMessageText(msg.text)}
            </div>
            {msg.role === "user" && (
              <div className="h-6 w-6 rounded-full bg-[#161618] flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 mt-4 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask anything — first aid, what to do..."
          className="flex-1 bg-transparent text-sm text-black placeholder-gray-400 outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={sendMessage}
          disabled={!input.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] disabled:opacity-40 transition-opacity hover:opacity-80"
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
