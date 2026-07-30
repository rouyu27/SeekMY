import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/firebaseClient";
import { ACTIVITY_TYPES, DIFFICULTY_COLORS } from "@/lib/malaysia-data";
import { ArrowLeft, MapPin, Star, Clock, Route, Filter, Search } from "lucide-react";
import StateFlag from "@/components/StateFlag";

const STATE_BG = {
  "Johor": "from-emerald-500 to-teal-600",
  "Kedah": "from-red-500 to-orange-600",
  "Kelantan": "from-red-600 to-red-800",
  "Melaka": "from-rose-500 to-red-600",
  "Negeri Sembilan": "from-yellow-500 to-amber-600",
  "Pahang": "from-slate-600 to-slate-800",
  "Perak": "from-amber-500 to-yellow-600",
  "Perlis": "from-amber-400 to-yellow-500",
  "Sabah": "from-blue-600 to-blue-800",
  "Sarawak": "from-red-700 to-rose-800",
  "Selangor": "from-orange-500 to-red-600",
  "Terengganu": "from-gray-700 to-gray-900",
  "Pulau Pinang": "from-indigo-500 to-blue-700",
  "Kuala Lumpur": "from-blue-700 to-indigo-800",
  "Labuan": "from-sky-500 to-blue-600",
  "Putrajaya": "from-teal-500 to-teal-700"
};

export default function StatePage() {
  const { state } = useParams();
  const decodedState = decodeURIComponent(state || "");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [presetFilter, setPresetFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    base44.entities.Location.filter({ state: decodedState, status: "active" })
      .then(r => { setLocations(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [decodedState]);

  const filtered = locations.filter(loc => {
    const matchActivity = !selectedActivity || (loc.activity_types || []).includes(selectedActivity);
    const matchDifficulty = !selectedDifficulty || loc.difficulty === selectedDifficulty;
    const matchSearch = !search || loc.name.toLowerCase().includes(search.toLowerCase());
    const matchPreset =
      presetFilter === "family" ? loc.is_family_friendly :
      presetFilter === "pet" ? loc.is_pet_friendly :
      presetFilter === "beginner" ? loc.difficulty === "Beginner" :
      presetFilter === "advanced" ? loc.difficulty === "Advanced" :
      presetFilter === "free" ? loc.is_free :
      true;
    return matchActivity && matchDifficulty && matchSearch && matchPreset;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-br ${STATE_BG[decodedState] || "from-green-600 to-teal-700"} text-white`}>
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to States
          </Link>
          <div className="w-45 h-30 rounded-lg overflow-hidden shadow-lg ring-2 ring-white/30 mb-3">
            <StateFlag state={decodedState} className="w-full h-full block" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">{decodedState}</h1>
          <p className="text-white/70">{locations.length} outdoor destinations</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filter Locations</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={() => setSelectedActivity("")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!selectedActivity ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>All Activities</button>
            {ACTIVITY_TYPES.map(a => (
              <button key={a.name} onClick={() => setSelectedActivity(selectedActivity === a.name ? "" : a.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedActivity === a.name ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                {a.icon} {a.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {["", "Beginner", "Intermediate", "Advanced"].map(d => (
              <button key={d} onClick={() => setSelectedDifficulty(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedDifficulty === d ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                {d || "All Levels"}
              </button>
            ))}
            <span className="w-px bg-gray-200 mx-1" />
            {[
              { key: "family", label: "👨‍👩‍👧 Family" },
              { key: "pet", label: "🐾 Pet Friendly" },
              { key: "beginner", label: "🟢 Beginner" },
              { key: "free", label: "🆓 Free Entry" }
            ].map(p => (
              <button key={p.key} onClick={() => setPresetFilter(presetFilter === p.key ? "" : p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${presetFilter === p.key ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 text-gray-600 hover:border-amber-300"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No locations found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {filtered.map(loc => (
              <Link key={loc.id} to={`/location/${loc.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group overflow-hidden">
                  {loc.image_url && (
                    <div className="h-40 overflow-hidden">
                      <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  {!loc.image_url && (
                    <div className={`h-28 bg-gradient-to-br ${STATE_BG[decodedState] || "from-green-400 to-teal-500"} flex items-center justify-center text-4xl`}>
                      {ACTIVITY_TYPES.find(a => (loc.activity_types || []).includes(a.name))?.icon || "🏞️"}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{loc.name}</h3>
                      {loc.is_hidden_gem && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">💎 Gem</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(loc.activity_types || []).slice(0, 3).map(a => {
                        const act = ACTIVITY_TYPES.find(t => t.name === a);
                        return <span key={a} className={`text-xs px-2 py-0.5 rounded-full border ${act?.color || "bg-gray-100 text-gray-600"}`}>{act?.icon} {a}</span>;
                      })}
                      {loc.difficulty && <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[loc.difficulty]}`}>{loc.difficulty}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {loc.avg_rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{loc.avg_rating.toFixed(1)}</span>}
                      {loc.distance_km && <span className="flex items-center gap-1"><Route className="w-3 h-3" />{loc.distance_km} km</span>}
                      {loc.duration_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{loc.duration_hours}h</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}