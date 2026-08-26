import { useState, useEffect } from "react";
import { firebaseClient } from "@/api/firebaseClient";
import { MALAYSIA_STATES } from "@/lib/malaysia-data";
import { Users, Plus, X, CheckCircle, Clock, MapPin, Mail, Phone } from "lucide-react";

const CONTRIBUTOR_TYPES = ["Hiking Guide", "Cycling Coach", "Diving Instructor", "Camping Guide", "Equipment Rental", "Other"];

export default function ContributorPortal() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "Hiking Guide", description: "", operating_states: [], services: "", operating_areas: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    firebaseClient.entities.Contributor.filter({ status: "verified" }).then(c => { setContributors(c); setLoading(false); });
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.type) return;
    setSubmitting(true);
    await firebaseClient.entities.Contributor.create({ ...form, status: "pending" });
    setSubmitting(false);
    setShowForm(false);
    setSubmitted(true);
  };

  const toggleState = (s) => {
    setForm(f => ({ ...f, operating_states: f.operating_states.includes(s) ? f.operating_states.filter(x => x !== s) : [...f.operating_states, s] }));
  };

  const filtered = contributors.filter(c => !filterType || c.type === filterType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7" />
            <h1 className="text-3xl font-black">Local Contributors</h1>
          </div>
          <p className="text-white/70 mb-6">Verified outdoor guides, coaches & service providers</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Register as Contributor
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-10">
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Application Submitted!</p>
              <p className="text-sm text-green-600">Your registration is under review. You'll be notified once verified.</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterType("")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!filterType ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"}`}>All Types</button>
            {CONTRIBUTOR_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterType === t ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No verified contributors yet.</p>
            <p className="text-sm mt-1">Be the first to register!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  {c.profile_image ? (
                    <img src={c.profile_image} alt={c.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {c.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c.type}</span>
                  </div>
                </div>
                {c.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>}
                {c.services && <p className="text-xs text-gray-500 mb-3 line-clamp-1">📋 {c.services}</p>}
                <div className="space-y-1 text-xs text-gray-500">
                  {c.operating_areas && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.operating_areas}</p>}
                  {c.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                  {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                </div>
                {(c.operating_states || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.operating_states.slice(0, 4).map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
                    {c.operating_states.length > 4 && <span className="text-xs text-gray-400">+{c.operating_states.length - 4}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Register as Contributor</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Your name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    placeholder="email@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    placeholder="+60 12-345 6789" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Contributor Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {CONTRIBUTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">About You</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Describe your experience and expertise..." rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Services Offered</label>
                <input value={form.services} onChange={e => setForm(f => ({...f, services: e.target.value}))}
                  placeholder="e.g. Day hikes, equipment rental, guided tours" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Operating States</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {MALAYSIA_STATES.map(s => (
                    <button key={s.name} onClick={() => toggleState(s.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.operating_states.includes(s.name) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Operating Areas (details)</label>
                <input value={form.operating_areas} onChange={e => setForm(f => ({...f, operating_areas: e.target.value}))}
                  placeholder="e.g. Cameron Highlands, Sabah coast" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-700">Your application will be reviewed by our admin team. Approved contributors will be displayed on relevant location pages.</p>
              </div>
              <button onClick={handleSubmit} disabled={submitting || !form.name || !form.email}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}