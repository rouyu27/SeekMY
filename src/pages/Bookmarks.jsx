import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/firebaseClient";
import { ACTIVITY_TYPES } from "@/lib/malaysia-data";
import { BookmarkIcon, Trash2, MapPin, Filter, Calendar, X, Check, Loader2 } from "lucide-react";

const GCAL_CONNECTOR_ID = "6a61ada811f9d69ec9c903c9";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActivity, setFilterActivity] = useState("");
  const [filterState, setFilterState] = useState("");

  // Google Calendar state
  const [gcalConnected, setGcalConnected] = useState(false);
  const [calTarget, setCalTarget] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [addingToCal, setAddingToCal] = useState(false);
  const [calMsg, setCalMsg] = useState(null);

  const checkGcalConnection = async () => {
    try {
      const res = await base44.functions.invoke('addToGoogleCalendar', { checkOnly: true });
      setGcalConnected(res.data?.connected || false);
    } catch {
      setGcalConnected(false);
    }
  };

  useEffect(() => {
    base44.entities.Bookmark.list("-created_date").then(b => { setBookmarks(b); setLoading(false); });
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) await checkGcalConnection();
    });
  }, []);

  const handleConnectGcal = async () => {
    const url = await base44.connectors.connectAppUser(GCAL_CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkGcalConnection();
      }
    }, 500);
  };

  const handleAddToCalendar = async () => {
    if (!selectedDate || !calTarget) return;
    setAddingToCal(true);
    setCalMsg(null);
    try {
      await base44.functions.invoke('addToGoogleCalendar', {
        title: calTarget.location_name,
        description: `Outdoor activity at ${calTarget.location_name}${calTarget.location_state ? ', ' + calTarget.location_state : ''}`,
        date: selectedDate,
        location: calTarget.location_name,
      });
      setCalMsg({ type: 'success', text: 'Added to your Google Calendar!' });
      setTimeout(() => { setCalTarget(null); setSelectedDate(""); setCalMsg(null); }, 2000);
    } catch (e) {
      setCalMsg({ type: 'error', text: 'Failed to add. Try reconnecting Google Calendar.' });
    }
    setAddingToCal(false);
  };

  const handleRemove = async (id) => {
    await base44.entities.Bookmark.delete(id);
    setBookmarks(b => b.filter(bk => bk.id !== id));
  };

  const states = [...new Set(bookmarks.map(b => b.location_state).filter(Boolean))];
  const filtered = bookmarks.filter(b => {
    const matchActivity = !filterActivity || (b.activity_types || []).includes(filterActivity);
    const matchState = !filterState || b.location_state === filterState;
    return matchActivity && matchState;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <BookmarkIcon className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Bookmarks</h1>
            <p className="text-sm text-gray-500">{bookmarks.length} saved locations</p>
          </div>
        </div>

        {/* Filters */}
        {bookmarks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Filter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterActivity("")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filterActivity ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>All Activities</button>
              {ACTIVITY_TYPES.filter(a => bookmarks.some(b => (b.activity_types || []).includes(a.name))).map(a => (
                <button key={a.name} onClick={() => setFilterActivity(filterActivity === a.name ? "" : a.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterActivity === a.name ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
                  {a.icon} {a.name}
                </button>
              ))}
              {states.length > 0 && (
                <>
                  <span className="w-px bg-gray-200" />
                  <select value={filterState} onChange={e => setFilterState(e.target.value)}
                    className="border border-gray-200 rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none">
                    <option value="">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookmarkIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">{bookmarks.length === 0 ? "No bookmarks yet" : "No bookmarks match your filters"}</p>
            {bookmarks.length === 0 && (
              <Link to="/" className="mt-3 inline-block text-green-600 text-sm font-medium hover:underline">
                Explore locations →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(bk => (
              <div key={bk.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex group hover:shadow-sm transition-shadow">
                {bk.location_image ? (
                  <img src={bk.location_image} alt={bk.location_name} className="w-24 h-24 object-cover shrink-0" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 shrink-0 flex items-center justify-center text-3xl">
                    {ACTIVITY_TYPES.find(a => (bk.activity_types || []).includes(a.name))?.icon || "🏞️"}
                  </div>
                )}
                <div className="flex-1 p-4 min-w-0">
                  <Link to={`/location/${bk.location_id}`} className="font-bold text-gray-900 hover:text-green-700 transition-colors block mb-1">
                    {bk.location_name}
                  </Link>
                  {bk.location_state && <p className="text-gray-500 text-xs flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{bk.location_state}</p>}
                  <div className="flex flex-wrap gap-1">
                    {(bk.activity_types || []).slice(0, 3).map(a => {
                      const act = ACTIVITY_TYPES.find(t => t.name === a);
                      return <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{act?.icon} {a}</span>;
                    })}
                  </div>
                </div>
                <div className="flex flex-col self-start">
                  <button onClick={() => { setCalTarget(bk); setSelectedDate(""); setCalMsg(null); }}
                    className="p-4 text-gray-300 hover:text-blue-500 transition-colors"
                    title="Add to Google Calendar">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRemove(bk.id)}
                    className="p-4 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add to Calendar Modal */}
        {calTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCalTarget(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Add to Calendar</h3>
                <button onClick={() => setCalTarget(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">{calTarget.location_name}</p>
              {!gcalConnected ? (
                <button onClick={handleConnectGcal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Connect Google Calendar
                </button>
              ) : (
                <>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">When do you plan to go?</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3" />
                  {calMsg && (
                    <div className={`text-sm mb-3 p-2 rounded-lg flex items-center gap-1.5 ${calMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {calMsg.type === 'success' && <Check className="w-4 h-4" />}
                      {calMsg.text}
                    </div>
                  )}
                  <button onClick={handleAddToCalendar} disabled={!selectedDate || addingToCal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {addingToCal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {addingToCal ? "Adding..." : "Add to Calendar"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}