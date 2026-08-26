import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Bookmark, ChevronDown, HelpCircle, Map, MessageCircle, Trophy } from "lucide-react";

const FAQS = [
  { q: "How do I find outdoor activities?", a: "From Home, pick a Malaysian state by its flag, or use Discover to search by activity type. You can filter by difficulty, family-friendly access, free entry, and more." },
  { q: "How do I log an activity?", a: "Go to My Activities, select Add Activity, choose a location and type, enter the distance and duration, then save. Badges may unlock when you reach milestones." },
  { q: "What are badges?", a: "Badges reward milestones such as a first hike, total distance, or states explored. View them under My Activities." },
  { q: "How does the AI Assistant work?", a: "The AI Assistant is reserved for a secure server-backed integration. It remains unavailable until a Firebase Cloud Function is configured; AI API keys must never be placed in browser code." },
  { q: "How do I become a local contributor?", a: "Open Contributors and submit your profile. Administrators review applications, and verified contributors appear on location pages." },
  { q: "Is weather data real-time?", a: "Location pages request current conditions and a short forecast from OpenWeatherMap. An OpenWeatherMap key must be configured in .env.local." },
  { q: "How do I create an account?", a: "Register with your own email and password, then open the verification link sent by Firebase. There are no built-in demo accounts or fixed OTP codes." },
];

export default function Help() {
  const [open, setOpen] = useState(0);
  const links = [
    { to: "/map", icon: Map, label: "Map" },
    { to: "/activity-log", icon: Activity, label: "Log" },
    { to: "/bookmarks", icon: Bookmark, label: "Saved" },
    { to: "/leaderboard", icon: Trophy, label: "Ranks" },
    { to: "/chatbot", icon: MessageCircle, label: "AI Help" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8" />
            <div><h1 className="text-2xl font-black">Help & FAQ</h1><p className="text-white/70 text-sm">SeekMY — Malaysia Outdoor Discovery</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 mb-10 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-1 text-sm font-medium text-gray-700 hover:border-green-300 hover:text-green-700">
              <link.icon className="w-5 h-5" />{link.label}
            </Link>
          ))}
        </div>

        {FAQS.map((faq, index) => (
          <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-900">
              {faq.q}<ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === index ? "rotate-180" : ""}`} />
            </button>
            {open === index && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
