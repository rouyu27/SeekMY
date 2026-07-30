import { Link } from "react-router-dom";
import { HelpCircle, ChevronDown, ArrowLeft, MessageCircle, Map, Activity, Bookmark, Trophy } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How do I find outdoor activities?",
    a: "From Home, pick a Malaysian state by its flag, or use Discover to search by activity type. You can filter by difficulty, family-friendly, free entry, and more.",
  },
  {
    q: "How do I log an activity?",
    a: "Go to My Activities, tap Add Activity, choose location/type, enter distance (km) and duration, then save. Badges may unlock automatically when you hit milestones.",
  },
  {
    q: "What are badges?",
    a: "Badges reward milestones such as first hike, total distance, or states explored. View them under My Activities after logging enough outdoor sessions.",
  },
  {
    q: "How does the AI Assistant work?",
    a: "Open AI Assistant and ask in plain English (or Malay topics) about gear, safety, beginner tips, or where to go. In local mode replies are offline heuristics; connect a real AI API for production.",
  },
  {
    q: "How do I become a local contributor?",
    a: "Open Contributors, submit your profile (guide, coach, rental, etc.). Admins verify applications. Verified contributors appear on location pages.",
  },
  {
    q: "Is weather data real-time?",
    a: "Location pages show current conditions and a short forecast. In local demo mode this is simulated; production uses OpenWeatherMap API.",
  },
  {
    q: "Demo accounts",
    a: "Admin: admin@seekmy.local / admin123 — User: demo@seekmy.local / demo123 — Register OTP: 123456",
  },
];

export default function Help() {
  const [open, setOpen] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-black">Help & FAQ</h1>
              <p className="text-white/70 text-sm">SeekMY — Malaysia Outdoor Discovery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 mb-10 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { to: "/map", icon: Map, label: "Map" },
            { to: "/activity-log", icon: Activity, label: "Log" },
            { to: "/bookmarks", icon: Bookmark, label: "Saved" },
            { to: "/leaderboard", icon: Trophy, label: "Ranks" },
            { to: "/chatbot", icon: MessageCircle, label: "AI Help" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col items-center gap-1 text-sm font-medium text-gray-700 hover:border-green-300 hover:text-green-700">
              <l.icon className="w-5 h-5" />
              {l.label}
            </Link>
          ))}
        </div>

        {FAQS.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-900"
            >
              {f.q}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
