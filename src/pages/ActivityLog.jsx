import { useState, useEffect } from "react";
import { base44 } from "@/api/firebaseClient";
import { ACTIVITY_TYPES, BADGES_DEFINITION } from "@/lib/malaysia-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, X, Activity, Map, Route, Clock, Trophy, TrendingUp, Pencil, Trash2, Camera } from "lucide-react";
import { MALAYSIA_STATES } from "@/lib/malaysia-data";
import { useAuth } from "@/lib/AuthContext";

const ACT_ICONS = Object.fromEntries(ACTIVITY_TYPES.map(a => [a.name, a.icon]));

export default function ActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ activity_type: "Hiking", distance_km: "", duration_minutes: "", notes: "", state: "", location_name: "", activity_date: new Date().toISOString().split("T")[0] });
  const [editingId, setEditingId] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      base44.entities.ActivityLog.filter({ created_by_id: user.id }, "-created_date"),
      base44.entities.Badge.filter({ created_by_id: user.id })
    ]).then(([l, b]) => { setLogs(l); setBadges(b); setLoading(false); })
      .catch(() => { setFormError("We could not load your activity data. Please refresh and try again."); setLoading(false); });
  }, [user?.id]);

  const stats = {
    totalActivities: logs.length,
    totalKm: logs.reduce((s, l) => s + (l.distance_km || 0), 0),
    totalMinutes: logs.reduce((s, l) => s + (l.duration_minutes || 0), 0),
    statesExplored: new Set(logs.map(l => l.state).filter(Boolean)).size,
    byActivity: logs.reduce((acc, l) => { acc[l.activity_type] = (acc[l.activity_type] || 0) + 1; return acc; }, {})
  };

  // Weekly chart data
  const weeklyData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    const now = new Date();
    logs.forEach(l => {
      const d = new Date(l.activity_date || l.created_date);
      const diff = Math.floor((now - d) / 86400000);
      if (diff < 7) counts[(d.getDay())] += l.distance_km || 1;
    });
    return days.map((d, i) => ({ day: d, km: Math.round(counts[i] * 10) / 10 }));
  })();

  const resetForm = () => {
    setForm({ activity_type: "Hiking", distance_km: "", duration_minutes: "", notes: "", state: "", location_name: "", activity_date: new Date().toISOString().split("T")[0], photo_url: "" });
    setEditingId(null);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.activity_type || !form.state || !form.location_name || !form.activity_date || Number(form.distance_km) <= 0 || Number(form.duration_minutes) <= 0) {
      setFormError("Please complete all required fields with a distance and duration greater than zero.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const activityData = {
      ...form,
      distance_km: Number.parseFloat(form.distance_km),
      duration_minutes: Number.parseInt(form.duration_minutes, 10)
    };
    const log = editingId
      ? await base44.entities.ActivityLog.update(editingId, activityData)
      : await base44.entities.ActivityLog.create(activityData);
    const newLogs = editingId ? logs.map(item => item.id === editingId ? log : item) : [log, ...logs];
    setLogs(newLogs);

    // Check and award new badges
    const newStats = {
      totalActivities: newLogs.length,
      totalKm: newLogs.reduce((s, l) => s + (l.distance_km || 0), 0),
      statesExplored: new Set(newLogs.map(l => l.state).filter(Boolean)).size,
      byActivity: newLogs.reduce((acc, l) => { acc[l.activity_type] = (acc[l.activity_type] || 0) + 1; return acc; }, {})
    };
    const existingKeys = badges.map(b => b.badge_key);
    for (const def of BADGES_DEFINITION) {
      if (!existingKeys.includes(def.key) && def.condition(newStats)) {
        const nb = await base44.entities.Badge.create({ badge_key: def.key, name: def.name, description: def.description, icon: def.icon, color: def.color, earned_date: new Date().toISOString().split("T")[0] });
        setBadges(b => [nb, ...b]);
      }
    }

    setShowForm(false);
    resetForm();
    setSubmitting(false);
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setForm({ ...log, distance_km: String(log.distance_km ?? ""), duration_minutes: String(log.duration_minutes ?? "") });
    setFormError("");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;
    await base44.entities.ActivityLog.delete(id);
    setLogs(current => current.filter(log => log.id !== id));
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("Please choose an image file."); return; }
    if (file.size > 1_500_000) { setFormError("Please choose a photo smaller than 1.5 MB."); return; }
    try {
      setFormError("");
      const photoUrl = await base44.storage.uploadActivityPhoto(file);
      setForm(current => ({ ...current, photo_url: photoUrl }));
    } catch {
      setFormError("Photo upload failed. Please try again.");
    }
  };

  const visibleLogs = activityFilter === "all" ? logs : logs.filter(log => log.activity_type === activityFilter);
  const personalBests = Object.entries(logs.reduce((best, log) => {
    if (!best[log.activity_type] || log.distance_km > best[log.activity_type].distance_km) best[log.activity_type] = log;
    return best;
  }, {}));

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Activities</h1>
            <p className="text-gray-500 text-sm mt-1">Track your outdoor journey</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Log Activity
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Activities", value: stats.totalActivities, icon: Activity, color: "text-green-600" },
            { label: "Total KM", value: `${stats.totalKm.toFixed(1)}`, icon: Route, color: "text-blue-600" },
            { label: "Hours", value: `${(stats.totalMinutes / 60).toFixed(1)}`, icon: Clock, color: "text-purple-600" },
            { label: "States", value: stats.statesExplored, icon: Map, color: "text-orange-600" }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        {logs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h2 className="font-bold text-gray-900">This Week's Distance (km)</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="km" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 text-sm text-gray-500">No activity data available for this week.</div>}

        {personalBests.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Personal Bests</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {personalBests.map(([type, log]) => <div key={type} className="rounded-xl bg-gray-50 px-3 py-2 text-sm"><span className="font-semibold">{type}</span><span className="float-right text-green-700">{log.distance_km} km</span></div>)}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-gray-900">My Badges</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {badges.map(b => (
                <div key={b.id} className={`bg-gradient-to-br ${b.color || "from-gray-400 to-gray-500"} text-white rounded-xl px-3 py-2 text-center min-w-[80px]`}>
                  <div className="text-2xl mb-1">{b.icon || "🏅"}</div>
                  <div className="text-xs font-semibold leading-tight">{b.name}</div>
                </div>
              ))}
              {BADGES_DEFINITION.filter(d => !badges.find(b => b.badge_key === d.key)).map(d => (
                <div key={d.key} className="bg-gray-100 text-gray-400 rounded-xl px-3 py-2 text-center min-w-[80px] opacity-50">
                  <div className="text-2xl mb-1 grayscale">{d.icon}</div>
                  <div className="text-xs font-semibold leading-tight">{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex flex-wrap justify-between gap-3 mb-4"><h2 className="font-bold text-gray-900">Activity History</h2><select aria-label="Filter activity history" value={activityFilter} onChange={e => setActivityFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm"><option value="all">All activities</option>{ACTIVITY_TYPES.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}</select></div>
          {visibleLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{logs.length ? "No activities match the selected filter." : "No activities yet. Log your first adventure!"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLogs.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-2xl">{ACT_ICONS[log.activity_type] || "🏃"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{log.activity_type}</span>
                      {log.location_name && <span className="text-gray-500 text-xs">@ {log.location_name}</span>}
                      {log.state && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{log.state}</span>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {log.distance_km > 0 && <span>📏 {log.distance_km} km</span>}
                      {log.duration_minutes > 0 && <span>⏱ {log.duration_minutes} min</span>}
                      <span>{log.activity_date}</span>
                    </div>
                    {log.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{log.notes}</p>}
                    {log.photo_url && <img src={log.photo_url} alt="Activity" className="mt-2 h-16 w-16 rounded-lg object-cover" />}
                  </div>
                  <div className="flex gap-1"><button onClick={() => handleEdit(log)} aria-label={`Edit ${log.activity_type} activity`} className="p-2 text-gray-400 hover:text-green-600"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDelete(log.id)} aria-label={`Delete ${log.activity_type} activity`} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Activity</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {formError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Activity Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a.name} onClick={() => setForm(f => ({...f, activity_type: a.name}))}
                      className={`p-2 rounded-xl border text-center text-xs font-medium transition-all ${form.activity_type === a.name ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                      <div className="text-lg">{a.icon}</div>{a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Distance (km) *</label>
                  <input min="0.1" step="0.1" required type="number" value={form.distance_km} onChange={e => setForm(f => ({...f, distance_km: e.target.value}))}
                    placeholder="0.0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Duration (min) *</label>
                  <input min="1" required type="number" value={form.duration_minutes} onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))}
                    placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">State *</label>
                <select required value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="">Select state...</option>
                  {MALAYSIA_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Location Name *</label>
                <input required value={form.location_name} onChange={e => setForm(f => ({...f, location_name: e.target.value}))}
                  placeholder="e.g. Bukit Tabur" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Date</label>
                <input type="date" value={form.activity_date} onChange={e => setForm(f => ({...f, activity_date: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  placeholder="How was it?" rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Photo (optional)</label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-green-400"><Camera className="w-4 h-4" /> {form.photo_url ? "Replace photo" : "Upload photo"}<input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" /></label></div>
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
                {submitting ? "Saving..." : editingId ? "Save Changes" : "Save Activity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
