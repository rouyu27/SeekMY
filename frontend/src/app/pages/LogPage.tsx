//==================== FongXinTong Part - Activity Log Module ====================
import { useEffect, useMemo, useState } from "react";
import { Plus, Activity, MapPin, TrendingUp, Upload, Image as ImageIcon, MessageSquare, Trash2, Search } from "lucide-react";
import type { ActivityLog, Location, AppUser } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES, ACTIVITY_FILTERS } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

function parseDuration(value = "") {
  const hourMatch = value.match(/(\d+)\s*h/i);
  const minuteMatch = value.match(/(\d+)\s*m/i);
  return {
    hours: hourMatch ? hourMatch[1] : "",
    minutes: minuteMatch ? minuteMatch[1] : "",
  };
}

function formatDuration(hours: string, minutes: string) {
  const h = Number(hours || 0);
  const m = Number(minutes || 0);
  if (!h && !m) return "";
  return `${h ? `${h}h` : ""}${h && m ? " " : ""}${m ? `${m}m` : ""}`;
}

export function LogPage({
  user,
  logs,
  locations,
  initialLocation,
  onInitialLocationUsed,
  onAddLog,
  onDeleteLog,
  onSignIn,
}: {
  user: AppUser | null;
  logs: ActivityLog[];
  locations: Location[];
  initialLocation?: Location | null;
  onInitialLocationUsed?: () => void;
  onAddLog: (l: Omit<ActivityLog, "id">) => Promise<void>;
  onDeleteLog: (id: string | number) => Promise<void>;
  onSignIn: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [form, setForm] = useState({
    locationId: "",
    state: "All",
    activity: "All",
    distance: "",
    durationHours: "",
    durationMinutes: "",
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
          const term = locationSearch.trim().toLowerCase();
          if (term && !`${location.name} ${location.state} ${location.activity} ${location.address || ""}`.toLowerCase().includes(term)) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locations, form.state, form.activity, locationSearch]
  );
  const locationChoices = filteredLocations.slice(0, 50);

  const selectedLocation = useMemo(
    () => locations.find((location) => String(location.id) === form.locationId),
    [locations, form.locationId]
  );

  useEffect(() => {
    if (!initialLocation) return;
    setShowForm(true);
    const parsedDuration = parseDuration(initialLocation.duration && initialLocation.duration !== "N/A" ? initialLocation.duration : "");
    setForm((current) => ({
      ...current,
      locationId: String(initialLocation.id),
      state: initialLocation.state,
      activity: initialLocation.activity,
      durationHours: parsedDuration.hours || current.durationHours,
      durationMinutes: parsedDuration.minutes || current.durationMinutes,
    }));
    setFormError("");
    onInitialLocationUsed?.();
  }, [initialLocation?.id]);

  function resetForm() {
    setPhotoFile(null);
    setFormError("");
    setLocationSearch("");
    setForm({
      locationId: "",
      state: "All",
      activity: "All",
      distance: "",
      durationHours: "",
      durationMinutes: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      comment: "",
    });
  }

  function changeState(state: string) {
    setForm((current) => ({ ...current, state, locationId: "" }));
    setLocationSearch("");
  }

  function changeActivity(activity: string) {
    setForm((current) => ({ ...current, activity, locationId: "" }));
    setLocationSearch("");
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
      setFormError("Photo must be 2MB or smaller.");
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
    const distance = Number.parseFloat(form.distance);
    if (!Number.isFinite(distance) || distance <= 0 || distance > 1000) {
      setFormError("Distance must be between 0 and 1,000 km.");
      return;
    }
    if (!form.date || new Date(`${form.date}T00:00:00`) > new Date()) {
      setFormError("Enter a valid activity date that is not in the future.");
      return;
    }
    const duration = formatDuration(form.durationHours, form.durationMinutes);
    if (!duration) {
      setFormError("Please choose the activity duration.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await firebaseClient.storage.uploadActivityPhoto(photoFile);
      }

      await onAddLog({
        locationId: selectedLocation.id,
        location: selectedLocation.name,
        state: selectedLocation.state,
        activity: selectedLocation.activity,
        distance,
        duration,
        date: form.date,
        notes: form.notes.trim(),
        comment: form.comment.trim(),
        photoUrl,
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

  const totalKm = logs.reduce((sum, log) => sum + log.distance, 0);
  const uniqueStates = new Set(logs.map((log) => log.state).filter(Boolean)).size;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyKm = days.map((_, index) =>
    logs.reduce((sum, log) => {
      const date = new Date(`${log.date}T12:00:00`);
      if (!Number.isFinite(date.getTime())) return sum;
      const mondayFirstIndex = (date.getDay() + 6) % 7;
      return mondayFirstIndex === index ? sum + log.distance : sum;
    }, 0)
  );
  const maxKm = Math.max(...weeklyKm, 1);

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
            { icon: <Activity size={17}/>, label: "Activities", val: logs.length },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-white rounded-[18px] p-4 text-center" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <div className="flex justify-center mb-1" style={{ color: C.jungle }}>{icon}</div>
              <p className="text-lg font-bold" style={{ color: C.jungle, fontFamily: F.display }}>{val}</p>
              <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{label}</p>
            </div>
          ))}
        </div>

        {logs.length > 0 && (
          <div className="bg-white rounded-[18px] p-5 mb-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
            <h2 className="text-sm font-bold mb-4" style={{ fontFamily: F.body, color: C.text }}>Weekly Activity</h2>
            <div className="flex items-end gap-2 h-24">
              {days.map((day, index) => {
                const km = weeklyKm[index];
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
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                  <input
                    value={locationSearch}
                    onChange={(event) => {
                      setLocationSearch(event.target.value);
                      setForm((current) => ({ ...current, locationId: "" }));
                    }}
                    placeholder="Search location name, state, activity or address"
                    className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                  />
                </div>
                <select
                  value={form.locationId}
                  onChange={(event) => chooseLocation(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                  style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                >
                  <option value="">Select a location ({filteredLocations.length} matched)</option>
                  {locationChoices.map((location) => (
                    <option key={String(location.id)} value={String(location.id)}>
                      {location.name} — {location.state} — {location.activity}
                    </option>
                  ))}
                </select>
                {filteredLocations.length > locationChoices.length && (
                  <p className="text-xs mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>
                    Showing first {locationChoices.length} matches. Type more keywords to narrow the list.
                  </p>
                )}
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
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.durationHours}
                    onChange={(event) => setForm((current) => ({ ...current, durationHours: event.target.value }))}
                    className="px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                    style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                    aria-label="Duration hours"
                  >
                    <option value="">Hours</option>
                    {HOUR_OPTIONS.map((hour) => <option key={hour} value={String(hour)}>{hour}h</option>)}
                  </select>
                  <select
                    value={form.durationMinutes}
                    onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                    className="px-4 py-3 rounded-xl text-sm outline-none border bg-white"
                    style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                    aria-label="Duration minutes"
                  >
                    <option value="">Minutes</option>
                    {MINUTE_OPTIONS.map((minute) => <option key={minute} value={String(minute)}>{minute}m</option>)}
                  </select>
                </div>
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
                  <p className="text-sm font-bold" style={{ color: C.text }}>Upload Photo</p>
                  <p className="text-xs truncate" style={{ color: C.textMuted }}>
                    {photoFile ? photoFile.name : "JPG / PNG / WEBP up to 2MB"}
                  </p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => choosePhoto(event.target.files?.[0])}/>
              </label>

              {formError && (
                <p className="text-xs font-semibold" style={{ color: C.error, fontFamily: F.body }}>{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Pill variant="filled" small onClick={saveEntry} disabled={saving}>{saving ? "Saving..." : "Save entry"}</Pill>
                <Pill variant="outline" small onClick={() => { setShowForm(false); resetForm(); }} disabled={saving}>Cancel</Pill>
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
            {logs.map((log) => (
              <div key={String(log.id)} className="bg-white rounded-[18px] p-4" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.muted }}>
                    <Activity size={17} style={{ color: C.jungle }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{log.location}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: F.body }}>
                      {log.activity} · {log.state} · {log.date}
                    </p>
                    {log.notes && <p className="text-[11px] mt-2" style={{ color: C.textSub, fontFamily: F.body }}><strong>Notes:</strong> {log.notes}</p>}
                    {log.comment && <p className="text-[11px] mt-1" style={{ color: C.textSub, fontFamily: F.body }}><strong>Place comment:</strong> {log.comment}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: C.jungle, fontFamily: F.body }}>{log.distance} km</p>
                    <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{log.duration}</p>
                    <button type="button" title="Delete activity" aria-label={`Delete ${log.location} activity`} onClick={async()=>{if(confirm("Delete this activity? Statistics and badges will be recalculated."))await onDeleteLog(log.id);}} className="mt-2 p-1.5 rounded-lg" style={{color:C.error,backgroundColor:C.errorBg}}><Trash2 size={13}/></button>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
//==================== FongXinTong END - Activity Log Module ====================
