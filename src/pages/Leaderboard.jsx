import { useState, useEffect } from "react";
import { firebaseClient } from "@/api/firebaseClient";
import { Trophy, Map, Activity, Route } from "lucide-react";

export default function Leaderboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overall");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    firebaseClient.entities.ActivityLog.list("-created_date", 500).then(l => { setLogs(l); setLoading(false); });
  }, []);

  const filterByPeriod = (logs) => {
    if (period === "all") return logs;
    const now = new Date();
    const cutoff = period === "weekly" ? new Date(now - 7 * 86400000) : new Date(now.getFullYear(), now.getMonth(), 1);
    return logs.filter(l => new Date(l.activity_date || l.created_date) >= cutoff);
  };

  const filtered = filterByPeriod(logs);

  const buildRankings = () => {
    const users = {};
    filtered.forEach(l => {
      const uid = l.created_by_id || "anon";
      if (!users[uid]) users[uid] = { id: uid, km: 0, checkins: 0, states: new Set(), byActivity: {} };
      users[uid].km += l.distance_km || 0;
      users[uid].checkins += 1;
      if (l.state) users[uid].states.add(l.state);
      const act = l.activity_type;
      users[uid].byActivity[act] = (users[uid].byActivity[act] || 0) + 1;
    });
    return Object.values(users).map(u => ({ ...u, stateCount: u.states.size }));
  };

  const rankings = buildRankings();

  const sorted = [...rankings].sort((a, b) =>
    tab === "overall" ? b.km - a.km :
    tab === "checkins" ? b.checkins - a.checkins :
    tab === "states" ? b.stateCount - a.stateCount :
    b.km - a.km
  );

  const Medal_icons = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8" />
            <h1 className="text-3xl font-black">Leaderboard</h1>
          </div>
          <p className="text-white/70">See who's exploring Malaysia the most</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        {/* Period Toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex gap-2">
          {[
            { key: "all", label: "All Time" },
            { key: "weekly", label: "This Week" },
            { key: "monthly", label: "This Month" }
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${period === p.key ? "bg-amber-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Tab Toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1 mb-6 flex gap-1">
          {[
            { key: "overall", label: "🏆 Total KM", icon: Route },
            { key: "checkins", label: "📍 Check-ins", icon: Activity },
            { key: "states", label: "🗺️ States", icon: Map }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No activity data yet. Start exploring!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {sorted.map((user, i) => (
              <div key={user.id} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all ${i === 0 ? "border-amber-200 shadow-amber-100 shadow-md" : i === 1 ? "border-gray-200" : "border-gray-100"}`}>
                <div className="text-3xl w-10 text-center">{i < 3 ? Medal_icons[i] : <span className="text-gray-400 font-bold text-lg">#{i + 1}</span>}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Explorer #{user.id.slice(-4)}</div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>📏 {user.km.toFixed(1)} km</span>
                    <span>📍 {user.checkins} activities</span>
                    <span>🗺️ {user.stateCount} states</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black ${i === 0 ? "text-amber-500" : "text-gray-700"}`}>
                    {tab === "overall" ? `${user.km.toFixed(1)} km` :
                     tab === "checkins" ? `${user.checkins}` :
                     `${user.stateCount} states`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
