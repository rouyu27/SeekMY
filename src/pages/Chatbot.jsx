import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2 } from "lucide-react";

const QUICK_PROMPTS = [
  "First time hiking, what should I bring?",
  "Is Sipadan suitable for a beginner diver?",
  "Best cycling routes near KL under RM50",
  "Safety tips for rainforest trails",
  "Equipment checklist for camping",
  "Recommend a family-friendly spot in Selangor",
];

const SYSTEM_PROMPT = `You are the SeekMY AI Outdoor Assistant, an expert guide for outdoor activities across Malaysia. 
You help users with:
- Outdoor activity recommendations across Malaysia's 13 states and 3 federal territories
- Safety tips and gear checklists for hiking, cycling, diving, trail running, camping, swimming, rock climbing, and water sports
- Beginner guidance for first-time outdoor enthusiasts
- Location-specific advice (e.g., Sipadan diving, Cameron Highlands hiking, Putrajaya cycling)
- Best seasons to visit specific locations
- Budget-friendly outdoor activities in Malaysia
- VM2026 tourism alignment

Always be helpful, encouraging, safety-conscious, and Malaysia-specific. Keep responses concise and practical.`;

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your SeekMY AI Outdoor Assistant 🌿\n\nI can help you with outdoor activity advice, gear recommendations, safety tips, and location suggestions across all of Malaysia. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");
    const userMsg = { role: "user", content: q };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    const history = messages.slice(-10).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nConversation history:\n${history}\n\nUser: ${q}\n\nAssistant:`,
      model: "gemini_3_flash"
    });

    setMessages(m => [...m, { role: "assistant", content: typeof response === "string" ? response : JSON.stringify(response) }]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">AI Outdoor Assistant</h1>
            <p className="text-white/70 text-xs">Powered by AI · Malaysia Outdoor Expert</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="text-xs whitespace-nowrap px-3 py-2 border border-gray-200 rounded-full text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-green-600" : "bg-gradient-to-br from-green-500 to-teal-600"}`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-green-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about outdoor activities in Malaysia..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="px-4 py-3 bg-green-600 text-white rounded-xl disabled:opacity-50 hover:bg-green-700 transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}