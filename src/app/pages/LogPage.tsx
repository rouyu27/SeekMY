// FILE PRIMARY OWNER: FONG XIN TONG | Activity Log Module
// GitHub target: feature/fong-xin-tong -> Pull Request -> main
//==================== FongXinTong Part - Activity Log Module ====================
import { useMemo, useState } from "react";
import { Plus, Activity, MapPin, TrendingUp, Upload, Image as ImageIcon, MessageSquare } from "lucide-react";
import type { ActivityLog, Location, MockUser } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES, ACTIVITY_FILTERS } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";
import { geocodeMapLocation } from "../lib/mapGeocoding";
import { distanceKm, getCurrentPosition } from "../lib/geo";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// How far (km) a device's GPS is allowed to be from a location and still
// count as "there." Loose on purpose — GPS drifts under forest canopy, some
// trails/parks genuinely span a couple of km, and the location's coordinates
// themselves come from live geocoding (not a surveyed point), which has its
// own margin of error. Tight enough to reject "logged from home."
const MAX_CHECKIN_DISTANCE_KM = 2;

export function LogPage({
  user,
  logs,
  locations,
  onAddLog,
  onSignIn,
}: {
  user: MockUser | null;
  logs: ActivityLog[];
  locations: Location[];
  onAddLog: (l: Omit<ActivityLog, "id">) => void;
  onSignIn: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    locationId: "",
    state: "All",
    activity: "All",
    distance: "",
    duration: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    comment: "",
  });

  const activityOptions = useMemo(() => {
    const fromLocations = Array.from(
      new Set(locations.map((location) => location.activity).filter(Boolean))
    ).sort();
    if (fromLocations.length) return fromLocations;
    return ACTIVITY_FILTERS.filter((a) => a.id !== "all").map((a) => a.label);
  }, [locations]);

  const filteredLocations = useMemo(
    () =>
      locations
        .filter((location) => {
          if (form.state !== "All" && location.state !== form.state) return false;
          if (form.activity !== "All" && location.activity !== form.activity) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, form.state, form.activity]
  );

  const selectedLocation = useMemo(
    () => locations.find((location) => String(location.id) === form.locationId),
    [locations, form.locationId]
  );

  function resetForm() {
    setPhotoFile(null);
    setFormError("");
    setForm({
      locationId: "",
      state: "All",
      activity: "All",
      distance: "",
      duration: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      comment: "",
    });
  }

  function changeState(state: string) {
    setForm((current) => ({ ...current, state, locationId: "" }));
  }

  function changeActivity(activity: string) {
    setForm((current) => ({ ...current, activity, locationId: "" }));
  }

  function chooseLocation(locationId: string) {
    const location = locations.find((item) => String(item.id) === locationId);
    setForm((current) => ({
      ...current,
      locationId,
      state: location ? location.state : current.state,
      activity: location ? location.activity : current.activity,
    }));
  }

  function choosePhoto(file?: File | null) {
    setFormError("");
    if (!file) {
      setPhotoFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFormError("Please upload an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFormError("Photo must be 5MB or smaller.");
      return;
    }
    setPhotoFile(file);
  }

  async function saveEntry() {
    setFormError("");
    if (!selectedLocation) {
      setFormError("Please choose a location from the list.");
      return;
    }
    if (!form.distance.trim()) {
      setFormError("Please enter the distance.");
      return;
    }
    if (!photoFile) {
      setFormError("Attach a photo from the location — an admin reviews this along with your GPS check-in before it counts.");
      return;
    }

    setVerifying(true);
    let position;
    try {
      position = await getCurrentPosition();
    } catch (error: any) {
      setFormError(error.message);
      setVerifying(false);
      return;
    }

    let place;
    try {
      place = await geocodeMapLocation({ name: selectedLocation.name, state: selectedLocation.state });
    } catch {
      place = null;
    }
    if (!place) {
      setFormError("Couldn't determine this location's coordinates to verify your check-in. Try again in a moment.");
      setVerifying(false);
      return;
    }

    const distance = distanceKm(position.latitude, position.longitude, place.lat, place.lng);
    if (distance > MAX_CHECKIN_DISTANCE_KM) {
      setFormError(
        `You're ${distance.toFixed(1)} km from ${selectedLocation.name} — too far to log this as a visit ` +
        `(allowed: within ${MAX_CHECKIN_DISTANCE_KM} km). If you're actually there, your device's location accuracy may be poor — try moving to open sky.`
      );
      setVerifying(false);
      return;
    }
    setVerifying(false);

    setSaving(true);
    try {
      const photoUrl = await firebaseClient.storage.uploadActivityPhoto(photoFile);

      onAddLog({
        locationId: selectedLocation.id,
        location: selectedLocation.name,
        state: selectedLocation.state,
        activity: selectedLocation.activity,
        distance: Number.parseFloat(form.distance) || 0,
        duration: form.duration.trim(),
        date: form.date,
        notes: form.notes.trim(),
        comment: form.comment.trim(),
        photoUrl,
        status: "pending",
        verifiedDistanceKm: Math.round(distance * 100) / 100,
        verifiedAccuracyM: position.accuracy != null ? Math.round(position.accuracy) : null,
      });

      setShowForm(false);
      resetForm();
    } catch (error: any) {
      setFormError(error?.message || "Unable to upload the activity photo.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.muted }}>
            <Activity size={30} style={{ color: C.jungle }} />
          </div>
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>
            Activity Log
          </h1>
          <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>
            Sign in to view and record your outdoor activities.
          </p>
          <Pill variant="filled" onClick={onSignIn}>Sign In</Pill>
        </div>
      </div>
    );
  }

  const approvedLogs = logs.filter((log) => (log.status ?? "approved") === "approved");
  const pendingCount = logs.filter((log) => log.status === "pending").length;
  const totalKm = approvedLogs.reduce((sum, log) => sum + log.distance, 0);
  const uniqueStates = new Set(approvedLogs.map((log) => log.state).filter(Boolean)).size;
  const maxKm = Math.max(...approvedLogs.map((log) => log.distance), 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>
            Activity Log
          </h1>
          <Pill variant="amber" small onClick={() => setShowForm((current) => !current)}>
            <Plus size={13}/> Log Activity
          </Pill>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <TrendingUp size={17}/>, label: "Total km", val: `${totalKm.toFixed(1)} km` },
            { icon: <MapPin size={17}/>, label: "States", val: uniqueStates },
            { icon: <Activity size={17}/>, label: "Activities", val: approvedLogs.length },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-white rounded-[18px] p-4 text-center" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <div className="flex justify-center mb-1" style={{ color: C.jungle }}>{icon}</div>
              <p className="text-lg font-bold" style={{ color: C.jungle, fontFamily: F.display }}>{val}</p>
              <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{label}</p>
            </div>
          ))}
        </div>

        {approvedLogs.length > 0 && (
          <div className="bg-white rounded-[18px] p-5 mb-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
            <h2 className="text-sm font-bold mb-4" style={{ fontFamily: F.body, color: C.text }}>Weekly Activity</h2>
            <div className="flex items-end gap-2 h-24">
              {days.map((day, index) => {
                const km = approvedLogs[index % approvedLogs.length]?.distance || 0;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${(km / maxKm) * 76}px`, backgroundColor: km > 0 ? C.jungle : C.muted, minHeight: km > 0 ? 4 : 0 }}/>
                    <span className="text-[10px]" style={{ color: C.textMuted, fontFamily: F.body }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-[18px] p-5 mb-6" style={{ boxShadow: `0 4px 20px rgba(27,67,50,0.12)` }}>
            <h2 className="text-base font-bold mb-1" style={{ fontFamily: F.body, color: C.text }}>New Activity</h2>
            <p className="text-xs mb-4" style={{ color: C.textMuted, fontFamily: F.body }}>
              Choose a state/activity to narrow the location list, or leave both as All to view every Firebase location.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub, fontFamily: F.body }}>State</label>
                  <select
                    value={form.state}
                    onChange={(event) => changeState(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                    style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                  >
                    <option value="All">All States</option>
                    {ALL_STATES.map((state) => <option key={state.code} value={state.name}>{state.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub, fontFamily: F.body }}>Activity Type</label>
                  <select
                    value={form.activity}
                    onChange={(event) => changeActivity(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                    style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                  >
                    <option value="All">All Activities</option>
                    {activityOptions.map((activity) => <option key={activity} value={activity}>{activity}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
                  Location *
                </label>
                <select
                  value={form.locationId}
                  onChange={(event) => chooseLocation(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                >
                  <option value="">Select a location ({filteredLocations.length} available)</option>
                  {filteredLocations.map((location) => (
                    <option key={String(location.id)} value={String(location.id)}>
                      {location.name} — {location.state} — {location.activity}
                    </option>
                  ))}
                </select>
                {filteredLocations.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: C.error, fontFamily: F.body }}>
                    No locations match this State and Activity Type.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.distance}
                  onChange={(event) => setForm((current) => ({ ...current, distance: event.target.value }))}
                  placeholder="Distance (km) *"
                  type="number"
                  min="0"
                  step="0.1"
                  className="px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                />
                <input
                  value={form.duration}
                  onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                  placeholder="Duration (e.g. 2h 15m)"
                  className="px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                />
              </div>

              <input
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
              />

              <div>
                <label className="text-xs font-bold flex items-center gap-1 mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
                  <MessageSquare size={13}/> Add Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Add private notes about your activity..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                />
              </div>

              <div>
                <label className="text-xs font-bold flex items-center gap-1 mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
                  <MessageSquare size={13}/> Comment about this place
                </label>
                <textarea
                  value={form.comment}
                  onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="What did you think about this location?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                />
              </div>

              <label
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                style={{ borderColor: C.border, fontFamily: F.body }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: C.muted, color: C.jungle }}>
                  <Upload size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: C.text }}>Upload Photo *</p>
                  <p className="text-xs truncate" style={{ color: C.textMuted }}>
                    {photoFile ? photoFile.name : "JPG / PNG / image up to 5MB"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => choosePhoto(event.target.files?.[0])}/>
              </label>

              {formError && (
                <p className="text-xs font-semibold" style={{ color: C.error, fontFamily: F.body }}>{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Pill variant="filled" small onClick={saveEntry}>
                  {verifying ? "Checking location..." : saving ? "Saving..." : "Save entry"}
                </Pill>
                <Pill variant="outline" small onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Pill>
              </div>
            </div>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🥾</p>
            <p className="font-bold mb-1" style={{ color: C.textSub, fontFamily: F.body }}>No activities logged yet</p>
            <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>Start exploring and log your first adventure!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const status = log.status ?? "approved";
              const statusStyle =
                status === "approved" ? { backgroundColor: C.successBg, color: C.success, label: "✓ Approved" } :
                status === "pending" ? { backgroundColor: "#fef3c7", color: "#b45309", label: "⏳ Awaiting admin review" } :
                { backgroundColor: C.errorBg, color: C.error, label: "✕ Rejected" };
              return (
              <div key={String(log.id)} className="bg-white rounded-[18px] p-4" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.muted }}>
                    <Activity size={17} style={{ color: C.jungle }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{log.location}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: F.body }}>
                      {log.activity} · {log.state} · {log.date}
                    </p>
                    {log.notes && <p className="text-[11px] mt-2" style={{ color: C.textSub, fontFamily: F.body }}><strong>Notes:</strong> {log.notes}</p>}
                    {log.comment && <p className="text-[11px] mt-1" style={{ color: C.textSub, fontFamily: F.body }}><strong>Place comment:</strong> {log.comment}</p>}
                    {status === "rejected" && log.rejectionReason && (
                      <p className="text-[11px] mt-1" style={{ color: C.error, fontFamily: F.body }}><strong>Reason:</strong> {log.rejectionReason}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: C.jungle, fontFamily: F.body }}>{log.distance} km</p>
                    <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{log.duration}</p>
                  </div>
                </div>

                {log.photoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: C.border }}>
                    <img src={log.photoUrl} alt={`${log.location} activity`} className="w-full max-h-64 object-cover" />
                  </div>
                )}
                {!log.photoUrl && log.comment && (
                  <div className="mt-2 flex items-center gap-1 text-[10px]" style={{ color: C.textMuted, fontFamily: F.body }}>
                    <ImageIcon size={11}/> No photo attached
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
        {pendingCount > 0 && (
          <p className="text-[11px] mt-3 text-center" style={{ color: C.textMuted, fontFamily: F.body }}>
            {pendingCount} {pendingCount === 1 ? "activity is" : "activities are"} still awaiting admin review and not yet counted in your stats or the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}
//==================== FongXinTong END - Activity Log Module ====================
