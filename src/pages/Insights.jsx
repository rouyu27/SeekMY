import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { firebaseClient } from "@/api/firebaseClient";
import { ACTIVITY_TYPES } from "@/lib/malaysia-data";
import { TrendingUp, TrendingDown, Minus, MapPin, Sparkles, Lightbulb, Activity, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const HEAT_LEVELS = ["bg-gray-50 text-gray-300", "bg-green-100 text-green-700", "bg-green-300 text-green-800", "bg-green-500 text-white", "bg-green-700 text-white"];

export default function Insights() {
  const [tab, setTab] = useState("heatmap");
  const [locations, setLocations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null);
  const [sugLoading, setSugLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      firebaseClient.entities.Location.filter({ status: "active" }),
      firebaseClient.entities.ActivityLog.list("-created_date", 500),
      firebaseClient.entities.Bookmark.list("-created_date", 500),
    ]).then(([locs, l, b]) => {
      setLocations(locs); setLogs(l); setBookmarks(b); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const heatmap = useMemo(() => {
    return ACTIVITY_TYPES.map(act => ({
      activity: act,
      data: MONTHS_FULL.map((month, mIdx) => {
        const locCount = locations.filter(loc =>
          (loc.activity_types || []).includes(act.name) &&
          (loc.best_months || []).includes(month)
        ).length;
        const logCount = logs.filter(log =>
          log.activity_type === act.name &&
          new Date(log.activity_date || log.created_date).getMonth() === mIdx
        ).length;
        return locCount + logCount * 2;
      }),
    }));
  }, [locations, logs]);

  const heatMax = useMemo(() => Math.max(1, ...heatmap.flatMap(r => r.data)), [heatmap]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const acts = logs.filter(l => { const ld = new Date(l.activity_date || l.created_date); return ld.getMonth() === m && ld.getFullYear() === y; }).length;
      const bks = bookmarks.filter(b => { const bd = new Date(b.created_date); return bd.getMonth() === m && bd.getFullYear() === y; }).length;
      months.push({ month: MONTHS_SHORT[m], activities: acts, bookmarks: bks, total: acts + bks });
    }
    return months;
  }, [logs, bookmarks]);

  const trendingLocations = useMemo(() => {
    const now = new Date();
    const thisM = now.getMonth(), thisY = now.getFullYear();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevM = prev.getMonth(), prevY = prev.getFullYear();
    const interest = {};
    const add = (key, name, date) => {
      if (!key) return;
      if (!interest[key]) interest[key] = { id: key, name: name || key, total: 0, thisMonth: 0, lastMonth: 0 };
      interest[key].total++;
      const d = new Date(date);
      if (d.getMonth() === thisM && d.getFullYear() === thisY) interest[key].thisMonth++;
      if (d.getMonth() === prevM && d.getFullYear() === prevY) interest[key].lastMonth++;
    };
    logs.forEach(l => add(l.location_id || l.location_name, l.location_name, l.activity_date || l.created_date));
    bookmarks.forEach(b => add(b.location_id, b.location_name, b.created_date));
    return Object.values(interest).sort((a, b) => b.thisMonth - a.thisMonth || b.total - a.total);
  }, [logs, bookmarks]);

  const activityTrends = useMemo(() => {
    const now = new Date();
    const thisM = now.getMonth(), thisY = now.getFullYear();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevM = prev.getMonth(), prevY = prev.getFullYear();
    return ACTIVITY_TYPES.map(act => {
      const thisCount = logs.filter(l => {
        if (l.activity_type !== act.name) return false;
        const d = new Date(l.activity_date || l.created_date);
        return d.getMonth() === thisM && d.getFullYear() === thisY;
      }).length;
      const lastCount = logs.filter(l => {
        if (l.activity_type !== act.name) return false;
        const d = new Date(l.activity_date || l.created_date);
        return d.getMonth() === prevM && d.getFullYear() === prevY;
      }).length;
      return { ...act, thisMonth: thisCount, lastMonth: lastCount, trend: thisCount - lastCount };
    }).sort((a, b) => b.thisMonth - a.thisMonth);
  }, [logs]);

  const myProfile = useMemo(() => {
    const activities = new Set();
    const states = new Set();
    logs.forEach(l => { activities.add(l.activity_type); if (l.state) states.add(l.state); });
    bookmarks.forEach(b => (b.activity_types || []).forEach(a => activities.add(a)));
    return { activities: [...activities], states: [...states] };
  }, [logs, bookmarks]);

  const handleGetSuggestions = async () => {
    setSugLoading(true);
    try {
      const visitedIds = new Set(logs.map(l => l.location_id).filter(Boolean));
      const bookmarkedIds = new Set(bookmarks.map(b => b.location_id).filter(Boolean));
      const candidates = locations.filter(l => !visitedIds.has(l.id) && !bookmarkedIds.has(l.id));
      const profile = myProfile.activities.length > 0 ? myProfile.activities : ACTIVITY_TYPES.map(a => a.name);
      const prompt = `You are an outdoor activity recommendation expert for Malaysia.
A user has logged these activity types: ${profile.join(", ")}.
They have visited these states: ${myProfile.states.length > 0 ? myProfile.states.join(", ") : "none yet"}.

From these available Malaysian outdoor locations, recommend the 3 best new spots for this user based on their activity preferences. Consider matching activity types, introducing variety, and exploring new states if possible.

Available locations:
${candidates.slice(0, 30).map(l => `- ${l.name} (${l.state}): activities=[${(l.activity_types || []).join(", ")}], difficulty=${l.difficulty || "N/A"}, hidden_gem=${l.is_hidden_gem}`).join("\n")}

Return the 3 best recommendations as JSON with location name, state, and a personalized reason explaining why it matches their interests.`;
      const response = await firebaseClient.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, state: { type: "string" }, reason: { type: "string" } },
              },
            },
          },
        },
      });
      setSuggestions(response?.recommendations || []);
    } catch (e) {
      setSuggestions({ error: true });
    }
    setSugLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7" />
            <h1 className="text-3xl font-black">Insights & Trends</h1>
          </div>
          <p className="text-white/70">Discover seasonal patterns, trending spots, and personalized AI picks</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-1 mb-6 flex gap-1">
          {[
            { key: "heatmap", label: "📅 Activity Heatmap" },
            { key: "trending", label: "📈 Trending Now" },
            { key: "ai", label: "✨ AI Picks" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {tab === "heatmap" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-bold text-gray-900 mb-1">Best Months by Activity</h2>
                <p className="text-sm text-gray-500 mb-4">Peak seasons for each outdoor activity across all listed locations — darker = more popular</p>
                <div className="overflow-x-auto">
                  <div className="min-w-[580px]">
                    <div className="flex gap-1 mb-1">
                      <div className="w-28 shrink-0" />
                      {MONTHS_SHORT.map(m => (
                        <div key={m} className="flex-1 text-center text-xs font-semibold text-gray-500 py-1">{m}</div>
                      ))}
                    </div>
                    {heatmap.map(row => (
                      <div key={row.activity.name} className="flex gap-1 mb-1 items-center">
                        <div className="w-28 shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-700 pr-2">
                          <span>{row.activity.icon}</span>
                          <span className="truncate">{row.activity.name}</span>
                        </div>
                        {row.data.map((val, mIdx) => {
                          const level = val === 0 ? 0 : Math.min(4, Math.ceil((val / heatMax) * 4));
                          return (
                            <div key={mIdx} className={`flex-1 aspect-square rounded-md flex items-center justify-center text-xs font-bold ${HEAT_LEVELS[level]}`}
                              title={`${row.activity.name} — ${MONTHS_FULL[mIdx]}: ${val} location(s) + activity logs`}>
                              {val > 0 && val}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                  <span>Less popular</span>
                  {HEAT_LEVELS.map((c, i) => <div key={i} className={`w-5 h-5 rounded ${c.split(" ")[0]}`} />)}
                  <span>More popular</span>
                </div>
              </div>
            )}

            {tab === "trending" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-1">Monthly User Interest</h2>
                  <p className="text-sm text-gray-500 mb-4">Activities logged and locations bookmarked per month</p>
                  {logs.length === 0 && bookmarks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No activity data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyTrend}>
                        <defs>
                          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="total" name="Total Interest" stroke="#8b5cf6" fill="url(#gradTotal)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Trending Locations</h2>
                  {trendingLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Not enough data yet. Start logging activities and bookmarking locations!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {trendingLocations.filter(l => l.total > 0).slice(0, 5).map((loc, i) => {
                        const locObj = locations.find(l => l.id === loc.id || l.name === loc.name);
                        const TrendIcon = loc.thisMonth > loc.lastMonth ? TrendingUp : loc.thisMonth < loc.lastMonth ? TrendingDown : Minus;
                        const trendColor = loc.thisMonth > loc.lastMonth ? "text-green-600" : loc.thisMonth < loc.lastMonth ? "text-red-400" : "text-gray-400";
                        const Card = ({ children }) => locObj
                          ? <Link to={`/location/${locObj.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">{children}</Link>
                          : <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">{children}</div>;
                        return (
                          <Card key={i}>
                            <div className="text-lg font-black text-violet-500 w-6 text-center">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900 truncate">{loc.name}</div>
                              <div className="text-xs text-gray-500">{loc.total} total interactions · {loc.thisMonth} this month</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                              <span className={`text-xs font-medium ${trendColor}`}>
                                {loc.thisMonth > loc.lastMonth ? "+" : ""}{loc.thisMonth - loc.lastMonth}
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Activity Type Trends</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {activityTrends.map(act => {
                      const TrendIcon = act.trend > 0 ? TrendingUp : act.trend < 0 ? TrendingDown : Minus;
                      const trendColor = act.trend > 0 ? "text-green-600" : act.trend < 0 ? "text-red-400" : "text-gray-400";
                      return (
                        <div key={act.name} className="p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{act.icon}</span>
                            <span className="text-sm font-medium text-gray-700 truncate">{act.name}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-gray-900">{act.thisMonth}</span>
                            <span className="text-xs text-gray-400">this month</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                            <span className={`text-xs ${trendColor}`}>
                              {act.trend > 0 ? "+" : ""}{act.trend} vs last month
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === "ai" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5" />
                    <h2 className="font-bold">AI-Powered Recommendations</h2>
                  </div>
                  <p className="text-white/80 text-sm mb-4">
                    Get personalized outdoor spot recommendations based on your activity history and bookmarks.
                  </p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
                    <p className="text-xs text-white/60 mb-1.5">Your activity profile:</p>
                    {myProfile.activities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {myProfile.activities.map(a => {
                          const act = ACTIVITY_TYPES.find(t => t.name === a);
                          return <span key={a} className="text-xs bg-white/20 px-2 py-1 rounded-full">{act?.icon} {a}</span>;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-white/60">No activities logged yet — we'll recommend popular spots to get you started!</p>
                    )}
                  </div>
                  <button onClick={handleGetSuggestions} disabled={sugLoading}
                    className="w-full bg-white text-violet-700 py-3 rounded-xl font-bold hover:bg-violet-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {sugLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding spots...</> : <><Sparkles className="w-4 h-4" /> Get My Recommendations</>}
                  </button>
                </div>

                {suggestions && !suggestions.error && Array.isArray(suggestions) && suggestions.length > 0 && (
                  <div className="space-y-3">
                    {suggestions.map((s, i) => {
                      const loc = locations.find(l => l.name === s.name || l.name?.toLowerCase() === s.name?.toLowerCase());
                      return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-black text-sm shrink-0">{i + 1}</div>
                            <div className="flex-1">
                              {loc ? (
                                <Link to={`/location/${loc.id}`} className="font-bold text-gray-900 hover:text-violet-700 transition-colors">{s.name}</Link>
                              ) : (
                                <span className="font-bold text-gray-900">{s.name}</span>
                              )}
                              {s.state && <span className="text-gray-400 text-sm ml-2">· {s.state}</span>}
                              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{s.reason}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {suggestions && suggestions.error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-600 text-sm">
                    Something went wrong. Please try again.
                  </div>
                )}
                {suggestions && !suggestions.error && Array.isArray(suggestions) && suggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No recommendations available. Try logging more activities!</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}