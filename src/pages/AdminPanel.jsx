import { useState, useEffect } from "react";
import { firebaseClient } from "@/api/firebaseClient";
import { SEED_LOCATIONS } from "@/api/seedData";
import { MALAYSIA_STATES, ACTIVITY_TYPES } from "@/lib/malaysia-data";
import { Shield, Plus, Check, X, MapPin, Users, Flag, Trash2, UserCog, Database } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const emptyLocation = {
  name: "", state: "Johor", activity_types: [], difficulty: "Beginner", description: "",
  distance_km: "", duration_hours: "", facilities: [], accessibility: "", best_months: [],
  latitude: "", longitude: "", image_url: "", is_hidden_gem: false,
  is_family_friendly: false, is_pet_friendly: false, is_free: true, entry_fee: "", status: "active"
};

export default function AdminPanel() {
  const [tab, setTab] = useState("locations");
  const [locations, setLocations] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [saving, setSaving] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    Promise.all([
      firebaseClient.entities.Location.list("-created_date"),
      firebaseClient.entities.Contributor.list("-created_date"),
      firebaseClient.entities.Review.list("-created_date"),
      firebaseClient.entities.User.list("full_name")
    ]).then(([l, c, r, u]) => { setLocations(l); setContributors(c); setReviews(r); setUsers(u); setLoading(false); });
  }, []);

  const handleVerifyContributor = async (id, status) => {
    await firebaseClient.entities.Contributor.update(id, { status });
    setContributors(cs => cs.map(c => c.id === id ? {...c, status} : c));
  };

  const handleReviewAction = async (id, status) => {
    await firebaseClient.entities.Review.update(id, { status });
    setReviews(rs => rs.map(r => r.id === id ? {...r, status} : r));
  };

  const handleDeleteLocation = async (id) => {
    if (!confirm("Delete this location?")) return;
    await firebaseClient.entities.Location.delete(id);
    setLocations(ls => ls.filter(l => l.id !== id));
  };

  const handleRoleChange = async (member, role) => {
    if (member.email.toLowerCase() === "shanyuew416@gmail.com" && role !== "admin") return;
    const updated = await firebaseClient.entities.User.update(member.id, { role });
    setUsers(current => current.map(item => item.id === member.id ? updated : item));
  };

  const toggleActivity = (a) => {
    setLocationForm(f => ({
      ...f, activity_types: f.activity_types.includes(a) ? f.activity_types.filter(x => x !== a) : [...f.activity_types, a]
    }));
  };

  const toggleFacility = (fac) => {
    const fs = locationForm.facilities || [];
    setLocationForm(f => ({...f, facilities: fs.includes(fac) ? fs.filter(x => x !== fac) : [...fs, fac]}));
  };

  const toggleMonth = (m) => {
    const ms = locationForm.best_months || [];
    setLocationForm(f => ({...f, best_months: ms.includes(m) ? ms.filter(x => x !== m) : [...ms, m]}));
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name || !locationForm.state) return;
    setSaving(true);
    const data = {
      ...locationForm,
      distance_km: parseFloat(locationForm.distance_km) || undefined,
      duration_hours: parseFloat(locationForm.duration_hours) || undefined,
      latitude: parseFloat(locationForm.latitude) || undefined,
      longitude: parseFloat(locationForm.longitude) || undefined,
      entry_fee: parseFloat(locationForm.entry_fee) || undefined,
    };
    const loc = await firebaseClient.entities.Location.create(data);
    setLocations(ls => [loc, ...ls]);
    setShowAddLocation(false);
    setLocationForm(emptyLocation);
    setSaving(false);
  };

  const handleImportLocations = async () => {
    setSaving(true);
    setImportMessage("");
    try {
      const existingNames = new Set(locations.map((location) => location.name.toLowerCase()));
      const missingLocations = SEED_LOCATIONS.filter((location) => !existingNames.has(location.name.toLowerCase()));
      const imported = [];
      for (const { id: _legacyId, ...location } of missingLocations) {
        imported.push(await firebaseClient.entities.Location.create(location));
      }
      setLocations((current) => [...imported, ...current]);
      setImportMessage(imported.length ? `Imported ${imported.length} locations into Firestore.` : "All starter locations are already in Firestore.");
    } catch (error) {
      setImportMessage(error.message || "Location import failed.");
    } finally {
      setSaving(false);
    }
  };

  const pending = contributors.filter(c => c.status === "pending");
  const flaggedReviews = reviews.filter(r => r.status === "flagged");

  const tabs = [
    { key: "locations", label: "Locations", count: locations.length },
    { key: "contributors", label: "Contributors", count: pending.length, badge: pending.length > 0 },
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "users", label: "Users", count: users.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7" />
            <h1 className="text-3xl font-black">Admin Panel</h1>
          </div>
          <p className="text-white/60">Manage content, contributors & moderation</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4 pb-10">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-1 mb-6 flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === t.key ? "bg-slate-800 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {t.label}
              {t.badge && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Locations */}
            {tab === "locations" && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <p className="text-sm text-gray-500">{locations.length} locations</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleImportLocations} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-50">
                      <Database className="w-4 h-4" /> Import Starter Locations
                    </button>
                    <button onClick={() => setShowAddLocation(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                      <Plus className="w-4 h-4" /> Add Location
                    </button>
                  </div>
                </div>
                {importMessage && <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{importMessage}</div>}
                <div className="space-y-2">
                  {locations.map(loc => (
                    <div key={loc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{loc.name}</span>
                          {loc.is_hidden_gem && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">💎 Gem</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${loc.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{loc.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{loc.state}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contributors */}
            {tab === "contributors" && (
              <div className="space-y-3">
                {contributors.length === 0 && <div className="text-center py-10 text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No applications yet</p></div>}
                {contributors.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "verified" ? "bg-green-100 text-green-700" : c.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{c.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{c.email} {c.phone && `· ${c.phone}`}</p>
                        {c.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</p>}
                      </div>
                      {c.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleVerifyContributor(c.id, "verified")} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleVerifyContributor(c.id, "rejected")} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            {tab === "reviews" && (
              <div className="space-y-3">
                {reviews.length === 0 && <div className="text-center py-10 text-gray-400"><Flag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No reviews yet</p></div>}
                {reviews.map(r => (
                  <div key={r.id} className={`bg-white rounded-xl border p-4 ${r.status === "flagged" ? "border-red-200" : "border-gray-100"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{r.user_name || "Anonymous"}</span>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={`text-sm ${n <= r.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>)}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-green-100 text-green-700" : r.status === "flagged" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">{r.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">📍 {r.location_name}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {r.status !== "removed" && <button onClick={() => handleReviewAction(r.id, "removed")} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                        {r.status === "flagged" && <button onClick={() => handleReviewAction(r.id, "active")} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"><Check className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "users" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Only administrators can change roles. Your account is protected as the primary administrator.</div>
                {users.map(member => {
                  const isPrimaryAdmin = member.email?.toLowerCase() === "shanyuew416@gmail.com";
                  return <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0"><p className="font-semibold text-gray-900 truncate">{member.full_name || "Unnamed user"}</p><p className="text-sm text-gray-500 truncate">{member.email}</p></div>
                    <div className="flex items-center gap-2 shrink-0"><span className={`text-xs px-2 py-1 rounded-full ${member.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}>{member.role === "admin" ? "Admin" : "User"}</span>
                      {isPrimaryAdmin ? <span className="text-xs text-gray-400">Primary admin</span> : <button onClick={() => handleRoleChange(member, member.role === "admin" ? "user" : "admin")} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><UserCog className="w-4 h-4" />{member.role === "admin" ? "Remove admin" : "Make admin"}</button>}
                    </div>
                  </div>;
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Location</h2>
              <button onClick={() => setShowAddLocation(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Name *</label>
                  <input value={locationForm.name} onChange={e => setLocationForm(f => ({...f, name: e.target.value}))}
                    placeholder="Location name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">State *</label>
                  <select value={locationForm.state} onChange={e => setLocationForm(f => ({...f, state: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {MALAYSIA_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Difficulty</label>
                  <select value={locationForm.difficulty} onChange={e => setLocationForm(f => ({...f, difficulty: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {["Beginner", "Intermediate", "Advanced"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Activity Types</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a.name} onClick={() => toggleActivity(a.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${locationForm.activity_types.includes(a.name) ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
                      {a.icon} {a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                <textarea value={locationForm.description} onChange={e => setLocationForm(f => ({...f, description: e.target.value}))}
                  rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Distance (km)</label>
                  <input type="number" value={locationForm.distance_km} onChange={e => setLocationForm(f => ({...f, distance_km: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Duration (hours)</label>
                  <input type="number" value={locationForm.duration_hours} onChange={e => setLocationForm(f => ({...f, duration_hours: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Entry Fee (RM)</label>
                  <input type="number" value={locationForm.entry_fee} onChange={e => setLocationForm(f => ({...f, entry_fee: e.target.value, is_free: !e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Image URL</label>
                <input value={locationForm.image_url} onChange={e => setLocationForm(f => ({...f, image_url: e.target.value}))}
                  placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Accessibility Info</label>
                <input value={locationForm.accessibility} onChange={e => setLocationForm(f => ({...f, accessibility: e.target.value}))}
                  placeholder="e.g. Wheelchair accessible, suitable for elderly" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Best Months</label>
                <div className="flex flex-wrap gap-1.5">
                  {MONTHS.map(m => (
                    <button key={m} onClick={() => toggleMonth(m)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${(locationForm.best_months || []).includes(m) ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Facilities</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Parking", "Toilets", "Changing Room", "Food Stalls", "Rest Area", "Lifeguard", "First Aid", "Equipment Rental"].map(fac => (
                    <button key={fac} onClick={() => toggleFacility(fac)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${(locationForm.facilities || []).includes(fac) ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600"}`}>
                      {fac}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { key: "is_hidden_gem", label: "💎 Hidden Gem" },
                  { key: "is_family_friendly", label: "👨‍👩‍👧 Family Friendly" },
                  { key: "is_pet_friendly", label: "🐾 Pet Friendly" },
                  { key: "is_free", label: "🆓 Free Entry" }
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={!!locationForm[opt.key]} onChange={e => setLocationForm(f => ({...f, [opt.key]: e.target.checked}))}
                      className="rounded" />
                    {opt.label}
                  </label>
                ))}
              </div>
              <button onClick={handleSaveLocation} disabled={saving || !locationForm.name}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Add Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
