// FILE PRIMARY OWNER: LIM ROU YU | Location Detail Module - Primary Shared File Owner
// GitHub target: feature/lim-rou-yu -> Pull Request -> main
// SHARED FILE SECTION OWNERSHIP:
// LIM ROU YU: Location Detail structure/content and primary file integration
// WONG YUE SHAN: Weather section
// LIM TZE XIN: Bookmark + User Review & Rating sections
// FONG XIN TONG: Activity Log integration section
// Shared module file
// LimRouYu: Location Detail Module
// WongYueShan: Weather Module
// LimTzeXin: Bookmark Module + User Review & Rating Module
import { useState, useEffect } from "react";
import {
  ChevronLeft, Star, Bookmark, BookmarkCheck, MapPin, Clock,
  Navigation, Sun, Droplets, Wind, AlertTriangle, Check, Activity, Flag,
  Users, ExternalLink,
} from "lucide-react";
import type { Location, ActivityLog } from "../lib/types";
import { C, F } from "../lib/tokens";
import { diffStyle } from "../lib/helpers";
import { Pill } from "../components/Atoms";
import { fetchWeather, type WeatherBundle } from "../lib/weather";
import { firebaseClient } from "../api/firebaseClient";
import type { StoredReview } from "../lib/communityTypes";

export function LocationPage({
  loc,
  onBack,
  bookmarked,
  onBookmark,
  onLogActivity,
  onSuggest,
  user,
  activityLogs,
  onToast,
}: {
  loc: Location | null;
  onBack: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
  onLogActivity: (l: Omit<ActivityLog, "id">) => void;
  onSuggest?: () => void;
  user?: { id: string; displayName: string } | null;
  activityLogs?: ActivityLog[];
  onToast?: (msg: string, type?: "ok" | "err") => void;
}) {
  const [tab, setTab] = useState<"overview" | "weather" | "reviews">("overview");
  //==================== LimTzeXin Part - User Review & Rating Module ====================
  const [rt, setRt] = useState("");
  const [rating, setRating] = useState(0);
  const [logged, setLogged] = useState(false);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [flagId, setFlagId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("Offensive language");
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loc) return;
    let cancelled=false;
    firebaseClient.entities.Review.filter({locationId:loc.id}).then((rows:any[])=>{
      if(cancelled) return;
      setReviews(rows.filter(r=>r.status==="approved"||r.status==="active").sort((a,b)=>String(b.created_date||b.date||"").localeCompare(String(a.created_date||a.date||""))) as StoredReview[]);
    }).catch((error:any)=>{ if(!cancelled) setReviewMsg(error?.message||"Unable to load reviews from Firebase."); });
    return()=>{cancelled=true;};
  },[loc?.id]);
  //==================== LimTzeXin END - User Review & Rating Module ====================
  //==================== WongYueShan Part - Weather Module ====================
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showRecs, setShowRecs] = useState(false);

  // 2.2.1.1 — load weather when location changes
  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);
    setShowForecast(false);
    setShowRecs(false);
    fetchWeather(loc.name, loc.state)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
          setWeatherLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherError("Weather data temporarily unavailable. Please try again later.");
          setWeatherLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loc?.id, loc?.name, loc?.state]);
  //==================== WongYueShan END - Weather Module ====================

  // 4.2.1.1 A2 — location not found
  if (!loc) {
    return (
      <div className="pt-14 min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <MapPin size={40} style={{ color: C.textMuted, opacity: 0.4 }} />
        <h2 className="text-2xl mt-4 font-normal" style={{ fontFamily: F.display, color: C.text }}>Location not found</h2>
        <p className="text-sm mt-2 mb-6 text-center" style={{ color: C.textMuted, fontFamily: F.body }}>
          This location may have been removed or the link is invalid.
        </p>
        <Pill variant="filled" onClick={onBack}>Go back</Pill>
      </div>
    );
  }

  const d = diffStyle(loc.difficulty);
  const hasTrail =
    loc.distance &&
    loc.distance !== "N/A" &&
    !["Diving", "Swimming", "Water Sports"].includes(loc.activity);

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="px-5 py-8" style={{ backgroundColor: loc.color }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>
            <ChevronLeft size={15} /> Back
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", fontFamily: F.body }}>{loc.activity}</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: d.bg, color: d.color, fontFamily: F.body }}>{loc.difficulty}</span>
                {loc.badge && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: C.amber, color: C.jungle, fontFamily: F.body }}>{loc.badge}</span>
                )}
              </div>
              <h1 className="text-3xl font-normal text-white mb-1.5" style={{ fontFamily: F.display }}>{loc.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin size={12} style={{ color: "rgba(255,255,255,0.65)" }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>{loc.state}, Malaysia</span>
                <Star size={11} fill={C.amber} stroke={C.amber} />
                <span className="text-sm font-bold text-white">{loc.rating}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.50)", fontFamily: F.body }}>({loc.reviews})</span>
              </div>
            </div>
            {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
            <button onClick={() => {
              onBookmark();
              onToast?.(bookmarked ? "Bookmark removed successfully." : "Location bookmarked successfully.");
            }} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: bookmarked ? C.amber : "rgba(255,255,255,0.15)" }}>
              {bookmarked ? <BookmarkCheck size={17} style={{ color: C.jungle }} /> : <Bookmark size={17} className="text-white" />}
            </button>
            {/* ==================== LimTzeXin END - Bookmark Module ==================== */}
          </div>

          <div className="flex flex-wrap gap-5 mt-5">
            {hasTrail && (
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
                <Navigation size={12} />{loc.distance}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
              <Clock size={12} />{loc.duration}
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.72)", fontFamily: F.body }}>
              <Sun size={12} />{loc.bestMonths}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-5" style={{ borderColor: C.border }}>
        <div className="max-w-3xl mx-auto flex gap-6">
          {(["overview", "weather", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="py-4 text-sm font-bold capitalize transition-all"
              style={{
                color: tab === t ? C.jungle : C.textMuted,
                borderBottom: tab === t ? `2px solid ${C.amber}` : "2px solid transparent",
                fontFamily: F.body,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* ==================== LimRouYu Part - Location Detail Module ==================== */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>About this location</h2>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub, fontFamily: F.body }}>
                {loc.description || "Additional details not available for this activity type."}
              </p>
            </div>

            {loc.activitySpecific && (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>{loc.activity} details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {loc.activitySpecific.certification && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Certification</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.certification}</p>
                    </div>
                  )}
                  {loc.activitySpecific.visibility && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Visibility</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.visibility}</p>
                    </div>
                  )}
                  {loc.activitySpecific.entryType && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Entry type</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.entryType}</p>
                    </div>
                  )}
                  {loc.activitySpecific.maxDepth && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Max depth</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.maxDepth}</p>
                    </div>
                  )}
                  {loc.activitySpecific.marineLife && (
                    <div className="p-3 rounded-xl sm:col-span-2" style={{ backgroundColor: C.muted }}>
                      <p className="text-[11px] font-bold uppercase" style={{ color: C.textMuted, fontFamily: F.body }}>Marine life highlights</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: C.text, fontFamily: F.body }}>{loc.activitySpecific.marineLife}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base" style={{ fontFamily: F.body, color: C.text }}>Facilities</h2>
              {loc.facilities?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {loc.facilities.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                      <Check size={12} style={{ color: C.forest, flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>No facility information provided.</p>
              )}
            </div>

            <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-2 text-base" style={{ fontFamily: F.body, color: C.text }}>Accessibility</h2>
              <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                {loc.accessibility || "No accessibility information provided."}
              </p>
            </div>

            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-3 text-base flex items-center gap-2" style={{ fontFamily: F.body, color: C.text }}>
                <Users size={16} style={{ color: C.forest }} /> Verified local contributors
              </h2>
              {loc.contributors && loc.contributors.length > 0 ? (
                <div className="space-y-3">
                  {loc.contributors.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: C.forest }}>
                        {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{c.name}</p>
                        <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{c.role} · {c.area}</p>
                      </div>
                      {c.verified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: C.successBg, color: C.success, fontFamily: F.body }}>
                          Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>No verified contributor for this location.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {/* ==================== FongXinTong Part - Activity Log Module ==================== */}
              {logged ? (
                <div className="flex items-center gap-2 px-5 h-[50px] rounded-full text-sm font-bold" style={{ backgroundColor: C.muted, color: C.forest, fontFamily: F.body }}>
                  <Check size={14} /> Activity logged!
                </div>
              ) : (
                <Pill
                  variant="filled"
                  onClick={() => {
                    onLogActivity({
                      location: loc.name,
                      activity: loc.activity,
                      distance: parseFloat(loc.distance) || 5,
                      duration: loc.duration,
                      date: new Date().toISOString().split("T")[0],
                      notes: "",
                      state: loc.state,
                    });
                    setLogged(true);
                  }}
                >
                  <Activity size={14} /> Log this activity
                </Pill>
              )}
              {/* ==================== FongXinTong END - Activity Log Module ==================== */}

              {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
              <Pill variant="outline" onClick={onBookmark}>
                {bookmarked ? (<><BookmarkCheck size={13} /> Saved</>) : (<><Bookmark size={13} /> Save</>)}
              </Pill>
              {/* ==================== LimTzeXin END - Bookmark Module ==================== */}              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${loc.name}, ${loc.state}, Malaysia`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-[50px] px-6 rounded-full text-sm font-bold"
                style={{ backgroundColor: C.jungle, color: "#fff", fontFamily: F.body }}
              >
                <Navigation size={14} /> Get Directions <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
        {/* ==================== LimRouYu END - Location Detail Module ==================== */}

        {/* ==================== WongYueShan Part - Weather Module ==================== */}
                {tab === "weather" && (
          <div className="space-y-4">
            {weatherLoading && (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>Loading weather…</p>
              </div>
            )}
            {weatherError && !weatherLoading && (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                <p className="text-sm font-semibold" style={{ color: C.error, fontFamily: F.body }}>{weatherError}</p>
                {loc && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-bold"
                    style={{ color: C.forest, fontFamily: F.body }}
                    onClick={() => {
                      setWeatherLoading(true);
                      setWeatherError(null);
                      fetchWeather(loc.name, loc.state)
                        .then((d) => { setWeather(d); setWeatherLoading(false); })
                        .catch(() => {
                          setWeatherError("Weather data temporarily unavailable. Please try again later.");
                          setWeatherLoading(false);
                        });
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {weather && !weatherLoading && (
              <>
                <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                  <h2 className="font-bold mb-5 text-base" style={{ fontFamily: F.body, color: C.text }}>Current conditions</h2>
                  <div className="flex items-center gap-5 mb-6">
                    <span className="text-5xl">{weather.current.icon}</span>
                    <div>
                      <p className="text-4xl font-bold" style={{ color: C.jungle, fontFamily: F.display }}>{weather.current.temp}°C</p>
                      <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>{weather.current.condition}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: C.textMuted, fontFamily: F.body }}>Feels like {weather.current.feelsLike}°C</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: <Droplets size={16} style={{ color: C.forest }} />, label: "Humidity", val: `${weather.current.humidity}%` },
                      { icon: <Wind size={16} style={{ color: C.forest }} />, label: "Wind", val: `${weather.current.wind} km/h` },
                      { icon: <Sun size={16} style={{ color: C.forest }} />, label: "UV index", val: String(weather.current.uv) },
                      { icon: <AlertTriangle size={16} style={{ color: weather.current.advisory === "Good to Go" ? C.forest : "#92400e" }} />, label: "Advisory", val: weather.current.advisory },
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="text-center p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                        <div className="flex justify-center mb-1">{icon}</div>
                        <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ fontFamily: F.body, color: C.text }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill variant="outline" small onClick={() => setShowForecast((v) => !v)}>
                      {showForecast ? "Hide forecast" : "View Forecast"}
                    </Pill>
                    <Pill variant="outline" small onClick={() => setShowRecs((v) => !v)}>
                      {showRecs ? "Hide recommendations" : "Get Recommendations"}
                    </Pill>
                  </div>
                </div>

                {/* Alerts 2.2.1.3 */}
                <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                  <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>Weather alerts</h3>
                  {weather.alerts.length === 0 ? (
                    <p className="text-sm" style={{ color: C.success, fontFamily: F.body }}>
                      No severe weather alerts for this location. Enjoy your outdoor activity!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {weather.alerts.map((a) => (
                        <div key={a.id} className="p-3 rounded-xl border" style={{ borderColor: a.severity === "warning" ? "rgba(192,57,43,0.3)" : C.border, backgroundColor: a.severity === "warning" ? C.errorBg : C.muted }}>
                          <p className="text-sm font-bold" style={{ color: a.severity === "warning" ? C.error : C.text, fontFamily: F.body }}>{a.title}</p>
                          <p className="text-[12px] mt-1" style={{ color: C.textSub, fontFamily: F.body }}>{a.message}</p>
                          <p className="text-[12px] mt-1 font-semibold" style={{ color: C.forest, fontFamily: F.body }}>→ {a.action}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showForecast && (
                  <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>3-day forecast</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {weather.forecast.map((f) => (
                        <div key={f.date} className="text-center p-3 rounded-xl" style={{ backgroundColor: C.muted }}>
                          <p className="text-[11px] font-bold" style={{ color: C.textMuted, fontFamily: F.body }}>{f.date}</p>
                          <p className="text-2xl my-1">{f.icon}</p>
                          <p className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{f.high}° / {f.low}°</p>
                          <p className="text-[11px]" style={{ color: C.textSub, fontFamily: F.body }}>{f.condition}</p>
                          <p className="text-[10px] mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>Rain {f.precipChance}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showRecs && (
                  <div className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
                    <h3 className="font-bold text-sm mb-3" style={{ fontFamily: F.body, color: C.text }}>Weather-based recommendations</h3>
                    <ul className="space-y-2">
                      {weather.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                          <span>{r.icon}</span>
                          <span>{r.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* ==================== WongYueShan END - Weather Module ==================== */}

        {/* ==================== LimTzeXin Part - User Review & Rating Module ==================== */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
              <h2 className="font-bold mb-4 text-base" style={{ fontFamily: F.body, color: C.text }}>Write a review</h2>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star size={22} fill={s <= rating ? C.amber : "none"} stroke={s <= rating ? C.amber : C.border} />
                  </button>
                ))}
              </div>
              <textarea
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                placeholder="Share your experience…"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none mb-3"
                style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
              />
              <Pill
                variant="filled"
                small
                onClick={async () => {
                  setReviewMsg(null);
                  if (!user) { setReviewMsg("Please sign in to submit a review."); return; }
                  const visited=(activityLogs||[]).some(l=>l.location.toLowerCase()===(loc?.name||"").toLowerCase());
                  if(!visited){setReviewMsg("You can only review locations you have visited. Please log your activity first and try again.");return;}
                  if(rating===0){setReviewMsg("Please select a rating before submitting.");return;}
                  if(!rt.trim()){setReviewMsg("Please write a review comment.");return;}
                  try{
                    const mine=await firebaseClient.entities.Review.filter({created_by_id:user.id});
                    if(mine.some((r:any)=>String(r.locationId)===String(loc!.id)&&r.status!=="rejected"&&r.status!=="removed")){setReviewMsg("You have already reviewed this location.");return;}
                    const created:any=await firebaseClient.entities.Review.create({locationId:loc!.id,locationName:loc!.name,userId:user.id,userName:user.displayName,rating,comment:rt.trim(),date:new Date().toLocaleDateString("en-MY",{month:"short",year:"numeric"}),status:"approved",flaggedBy:[]});
                    setReviews(p=>[created as StoredReview,...p]); setRt(""); setRating(0); onToast?.("Your review has been submitted successfully!");
                  }catch(error:any){setReviewMsg(error?.message||"Unable to submit review to Firebase.");}
                }}
              >
                Submit review
              </Pill>
              {reviewMsg && (
                <p className="text-sm mt-3 font-semibold" style={{ color: C.error, fontFamily: F.body }}>{reviewMsg}</p>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                Be the first to review this location!
              </p>
            ) : (
              reviews.map((r, i) => (
                <div key={i} className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.forest }}>
                        {(r.userName || (r as any).user || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{r.userName || (r as any).user}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{r.date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={11} fill={s <= r.rating ? C.amber : "none"} stroke={s <= r.rating ? C.amber : C.border} />
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>{r.comment || (r as any).text}</p>
                  {user && (
                    <button type="button" onClick={() => setFlagId(r.id)}
                      className="mt-2 text-[11px] font-bold inline-flex items-center gap-1"
                      style={{ color: C.error, fontFamily: F.body }}>
                      <Flag size={11} /> Report
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {/* ==================== LimTzeXin END - User Review & Rating Module ==================== */}
      </div>

      {/* ==================== LimTzeXin Part - User Review & Rating Module: Flag Review ==================== */}
      {flagId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-[18px] p-6 max-w-sm w-full">
            <p className="font-bold mb-3" style={{ fontFamily: F.body, color: C.text }}>Report review</p>
            <select
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none mb-4"
              style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
            >
              <option>Offensive language</option>
              <option>Spam</option>
              <option>Inappropriate content</option>
              <option>Misleading information</option>
            </select>
            <div className="flex gap-2">
              <Pill variant="outline" small onClick={() => setFlagId(null)}>Cancel</Pill>
              <Pill
                variant="danger"
                small
                onClick={async () => {
                  if(!user||!flagId)return;
                  const target=reviews.find(r=>String(r.id)===String(flagId));
                  if(target?.flaggedBy?.includes(user.id)){onToast?.("You have already reported this review.","err");setFlagId(null);return;}
                  try{
                    await firebaseClient.entities.Review.update(flagId,{status:"flagged",flagReason,flaggedBy:[...(target?.flaggedBy||[]),user.id]});
                    setReviews(p=>p.filter(r=>String(r.id)!==String(flagId))); setFlagId(null);
                    onToast?.("Review has been reported. Thank you for helping keep our community safe!");
                  }catch(error:any){onToast?.(error?.message||"Unable to report this review.","err");}
                }}
              >
                Submit Flag
              </Pill>
            </div>
          </div>
        </div>
      )}
      {/* ==================== LimTzeXin END - User Review & Rating Module: Flag Review ==================== */}
    </div>
  );
}