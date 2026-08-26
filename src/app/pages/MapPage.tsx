//==================== LimRouYu Part - Map Module ====================
import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Cloud,
  CloudRain,
  CloudSun,
  Filter,
  Loader2,
  Map as MapIcon,
  MapPin,
  Sun,
  X,
} from "lucide-react";
import type { Location, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { ACTIVITY_FILTERS } from "../lib/constants";
import { geocodeMapLocation } from "../lib/mapGeocoding";
import type { Language } from "../lib/i18n";
import { activityLabel, difficultyLabel, t } from "../lib/i18n";
import { fetchWeather, type ForecastHour, type WeatherBundle } from "../lib/weather";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapPoint = {
  location: Location;
  lat: number;
  lng: number;
  approximate: boolean;
};

type WeatherKind = "all" | "sunny" | "cloudy" | "rain";
type WeatherSnapshot = {
  kind: Exclude<WeatherKind, "all">;
  condition: string;
  temp?: number;
  icon: string;
};

type MalaysiaStateGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon | GeoJSON.Polygon,
  { name?: string; state?: string }
>;

const MALAYSIA_CENTER: [number, number] = [4.2, 108.9];
const MALAYSIA_BOUNDS: [[number, number], [number, number]] = [
  [0.6, 99.2],
  [7.6, 119.5],
];

const weatherCopy: Record<Language, Record<string, string>> = {
  en: {
    show: "Show weather",
    hide: "Hide weather",
    loading: "Loading weather",
    date: "Date",
    time: "Time",
    all: "All weather",
    sunny: "Sunny",
    cloudy: "Cloudy",
    rain: "Rain",
    unavailable: "Weather unavailable",
    hidePlaces: "Hide places",
    showPlaces: "Show places",
  },
  ms: {
    show: "Tunjuk cuaca",
    hide: "Sembunyi cuaca",
    loading: "Memuat cuaca",
    date: "Tarikh",
    time: "Masa",
    all: "Semua cuaca",
    sunny: "Cerah",
    cloudy: "Berawan",
    rain: "Hujan",
    unavailable: "Cuaca tidak tersedia",
    hidePlaces: "Sembunyi tempat",
    showPlaces: "Tunjuk tempat",
  },
  zh: {
    show: "显示天气",
    hide: "隐藏天气",
    loading: "正在加载天气",
    date: "日期",
    time: "时间",
    all: "全部天气",
    sunny: "晴天",
    cloudy: "多云",
    rain: "下雨",
    unavailable: "天气暂时不可用",
  },
};

const weatherPalette: Record<Exclude<WeatherKind, "all">, { bg: string; text: string; border: string }> = {
  rain: { bg: "#6b7280", text: "#1f2937", border: "#4b5563" },
  cloudy: { bg: "#1d4ed8", text: "#1e3a8a", border: "#1e40af" },
  sunny: { bg: "#f59e0b", text: "#78350f", border: "#d97706" },
};

function wt(language: Language, key: string) {
  if (language === "zh" && key === "hidePlaces") return "\u9690\u85cf\u5730\u70b9";
  if (language === "zh" && key === "showPlaces") return "\u663e\u793a\u5730\u70b9";
  return weatherCopy[language]?.[key] ?? weatherCopy.en[key] ?? key;
}

function storedCoordinates(location: Location) {
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function classifyWeather(condition: string): Exclude<WeatherKind, "all"> {
  const normalized = condition.toLowerCase();
  if (/rain|drizzle|shower|storm|thunder/.test(normalized)) return "rain";
  if (/clear|sun/.test(normalized)) return "sunny";
  if (/cloud|overcast|mist|haze|fog/.test(normalized)) return "cloudy";
  return "sunny";
}

function nearestForecastHour(
  bundle: WeatherBundle,
  selectedDate: string,
  selectedTime: string
): ForecastHour | undefined {
  if (!bundle.hourly?.length) return undefined;
  const target = new Date(`${selectedDate}T${selectedTime}:00+08:00`).getTime();
  return bundle.hourly.reduce((best, item) =>
    Math.abs(item.timestamp - target) < Math.abs(best.timestamp - target) ? item : best
  );
}

function weatherSnapshot(
  bundle: WeatherBundle,
  selectedDate: string,
  selectedTime: string
): WeatherSnapshot {
  const forecast = nearestForecastHour(bundle, selectedDate, selectedTime);
  const condition = forecast?.condition || bundle.current.condition;

  return {
    kind: classifyWeather(condition),
    condition,
    temp: forecast?.temp ?? bundle.current.temp,
    icon: forecast?.icon || bundle.current.icon,
  };
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function visibleFacilities(location: Location) {
  return Array.isArray(location.facilities) ? location.facilities.slice(0, 3) : [];
}

function FitVisibleMarkers({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number])),
      { padding: [32, 32], maxZoom: 13 }
    );
  }, [map, points]);

  return null;
}

export function MapPage({
  setPage,
  setSelectedLocation,
  locations,
  language = "en",
}: {
  setPage: (p: Page) => void;
  setSelectedLocation: (l: Location) => void;
  locations: Location[];
  language?: Language;
}) {
  const [activity, setActivity] = useState("all");
  const [difficulty, setDifficulty] = useState("All");
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherDate, setWeatherDate] = useState(todayInputValue);
  const [weatherTime, setWeatherTime] = useState("12:00");
  const [weatherFilter, setWeatherFilter] = useState<WeatherKind>("all");
  const [weatherByState, setWeatherByState] = useState<Record<string, WeatherSnapshot>>({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [stateBoundaries, setStateBoundaries] = useState<MalaysiaStateGeoJson | null>(null);
  const [showPlacePins, setShowPlacePins] = useState(true);

  const filteredLocations = useMemo(
    () =>
      locations.filter((location) => {
        if (activity !== "all" && location.activity !== activity) return false;
        if (difficulty !== "All" && location.difficulty !== difficulty) return false;
        return true;
      }),
    [locations, activity, difficulty]
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/data/malaysia.state.geojson")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.type === "FeatureCollection") {
          setStateBoundaries(data as MalaysiaStateGeoJson);
        }
      })
      .catch(() => {
        if (!cancelled) setStateBoundaries(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPoints() {
      setLoadingMap(true);
      const next: MapPoint[] = [];
      const concurrency = 5;

      for (let start = 0; start < filteredLocations.length; start += concurrency) {
        const batch = filteredLocations.slice(start, start + concurrency);
        const resolved = await Promise.all(
          batch.map(async (location) => {
            const stored = storedCoordinates(location);
            if (stored) return { location, ...stored, approximate: false };

            const point = await geocodeMapLocation(location);
            return point
              ? { location, lat: point.lat, lng: point.lng, approximate: false }
              : null;
          })
        );

        next.push(...resolved.filter((point): point is MapPoint => point !== null));
        if (!cancelled) setPoints([...next]);
      }

      if (!cancelled) {
        setPoints(next);
        setLoadingMap(false);
      }
    }

    loadPoints();
    return () => {
      cancelled = true;
    };
  }, [filteredLocations]);

  const weatherStatePoints = useMemo(
    () =>
      Array.from(
        points
          .reduce((map, point) => {
            if (point.location.state && !map.has(point.location.state)) {
              map.set(point.location.state, point);
            }
            return map;
          }, new Map<string, MapPoint>())
          .values()
      ),
    [points]
  );

  const weatherStateKey = useMemo(
    () => weatherStatePoints.map((point) => point.location.state).sort().join("|"),
    [weatherStatePoints]
  );

  useEffect(() => {
    if (!showWeather || weatherStatePoints.length === 0) return;
    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      const next: Record<string, WeatherSnapshot> = {};
      const concurrency = 4;

      for (let start = 0; start < weatherStatePoints.length; start += concurrency) {
        const batch = weatherStatePoints.slice(start, start + concurrency);
        const resolved = await Promise.all(
          batch.map(async (point) => {
            const state = point.location.state;
            try {
              const bundle = await fetchWeather(point.location.name, point.location.state, {
                lat: point.lat,
                lng: point.lng,
              });
              return [state, weatherSnapshot(bundle, weatherDate, weatherTime)] as const;
            } catch {
              return [
                state,
                {
                  kind: "cloudy",
                  condition: wt(language, "unavailable"),
                  icon: "☁️",
                },
              ] as const;
            }
          })
        );

        for (const [id, weather] of resolved) next[id] = weather;
        if (!cancelled) setWeatherByState((current) => ({ ...current, ...next }));
      }

      if (!cancelled) setWeatherLoading(false);
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [showWeather, weatherDate, weatherTime, weatherStateKey, language, weatherStatePoints]);

  const visiblePoints = useMemo(
    () =>
      showWeather && weatherFilter !== "all"
        ? points.filter((point) => weatherByState[point.location.state]?.kind === weatherFilter)
        : points,
    [points, showWeather, weatherFilter, weatherByState]
  );

  const visibleStateBoundaries = useMemo<MalaysiaStateGeoJson | null>(() => {
    if (!stateBoundaries) return null;
    return {
      ...stateBoundaries,
      features: stateBoundaries.features.filter((feature) => {
        const state = feature.properties?.name ?? feature.properties?.state ?? "";
        const weather = weatherByState[state];
        if (!weather) return false;
        return weatherFilter === "all" || weather.kind === weatherFilter;
      }),
    };
  }, [stateBoundaries, weatherByState, weatherFilter]);

  const availableWeatherFilters = useMemo(() => {
    const loadedKinds = new Set(Object.values(weatherByState).map((weather) => weather.kind));
    return (["all", "sunny", "cloudy", "rain"] as const).filter(
      (kind) => kind === "all" || loadedKinds.has(kind)
    );
  }, [weatherByState]);

  useEffect(() => {
    if (weatherFilter !== "all" && !availableWeatherFilters.includes(weatherFilter)) {
      setWeatherFilter("all");
    }
  }, [availableWeatherFilters, weatherFilter]);

  const directionsUrl = (location: Location) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      location.address?.trim() || `${location.name}, ${location.state}, Malaysia`
    )}`;

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div
        className="px-5 py-5"
        style={{ background: `linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)` }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <MapIcon size={22} className="text-white" />
          <div>
            <h1 className="text-2xl font-normal text-white" style={{ fontFamily: F.display }}>
              {t(language, "exploreMap")}
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>
              {points.length} {t(language, "markers")}
              {loadingMap ? ` · ${t(language, "locating")}...` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-14 z-20" style={{ borderColor: C.border }}>
        <div className="max-w-5xl mx-auto px-5 py-3 space-y-2">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {ACTIVITY_FILTERS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActivity(id)}
                className="px-3.5 h-9 rounded-full text-[12px] font-bold whitespace-nowrap"
                style={{
                  backgroundColor: activity === id ? C.jungle : C.muted,
                  color: activity === id ? "#fff" : C.textSub,
                  fontFamily: F.body,
                }}
              >
                {icon} {activityLabel(language, label)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} style={{ color: C.textMuted }} />
            {(["All", "Easy", "Moderate", "Hard"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className="px-3 h-8 rounded-full text-[11px] font-bold"
                style={{
                  backgroundColor: difficulty === level ? C.forest : C.muted,
                  color: difficulty === level ? "#fff" : C.textSub,
                  fontFamily: F.body,
                }}
              >
                {difficultyLabel(language, level)}
              </button>
            ))}

            {(activity !== "all" || difficulty !== "All") && (
              <button
                onClick={() => {
                  setActivity("all");
                  setDifficulty("All");
                }}
                className="flex items-center gap-1 text-[11px] font-bold ml-auto"
                style={{ color: C.error, fontFamily: F.body }}
              >
                <X size={12} /> {t(language, "clear")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-2" style={{ borderColor: C.border }}>
            <button
              type="button"
              onClick={() => setShowWeather((value) => !value)}
              className="h-9 px-3.5 rounded-full text-[12px] font-bold inline-flex items-center gap-2"
              style={{
                backgroundColor: showWeather ? C.forest : C.muted,
                color: showWeather ? "#fff" : C.textSub,
                fontFamily: F.body,
              }}
            >
              {weatherLoading ? <Loader2 size={14} className="animate-spin" /> : <CloudSun size={14} />}
              {showWeather ? wt(language, "hide") : wt(language, "show")}
            </button>

            {showWeather && (
              <>
                <label className="text-[11px] font-bold flex items-center gap-1" style={{ color: C.textSub, fontFamily: F.body }}>
                  {wt(language, "date")}
                  <input
                    type="date"
                    value={weatherDate}
                    onChange={(event) => setWeatherDate(event.target.value)}
                    className="h-9 rounded-full border px-3 text-[12px]"
                    style={{ borderColor: C.border, color: C.text }}
                  />
                </label>
                <label className="text-[11px] font-bold flex items-center gap-1" style={{ color: C.textSub, fontFamily: F.body }}>
                  {wt(language, "time")}
                  <select
                    value={weatherTime}
                    onChange={(event) => setWeatherTime(event.target.value)}
                    className="h-9 rounded-full border px-3 text-[12px]"
                    style={{ borderColor: C.border, color: C.text }}
                  >
                    {Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`).map((time) => (
                      <option key={time} value={time}>
                        {time.slice(0, 2)}:00
                      </option>
                    ))}
                  </select>
                </label>
                {availableWeatherFilters.map((kind) => {
                  const active = weatherFilter === kind;
                  const colors = kind === "all" ? null : weatherPalette[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setWeatherFilter(kind)}
                      className="h-8 px-3 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: active ? colors?.bg ?? C.forest : "#fff",
                        color: active ? colors?.text ?? "#fff" : C.textSub,
                        border: `1px solid ${active ? colors?.border ?? C.forest : C.border}`,
                        fontFamily: F.body,
                      }}
                    >
                      {kind === "sunny" && <Sun size={12} />}
                      {kind === "cloudy" && <Cloud size={12} />}
                      {kind === "rain" && <CloudRain size={12} />}
                      {wt(language, kind)}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {visiblePoints.length === 0 ? (
        <div className="h-[420px] flex flex-col items-center justify-center">
          <MapPin size={36} style={{ color: C.textMuted, opacity: 0.4 }} />
          <p className="mt-3 font-bold" style={{ color: C.textSub, fontFamily: F.body }}>
            {t(language, "noMapLocations")}
          </p>
        </div>
      ) : (
        <div className="relative z-0" style={{ height: "calc(100vh - 240px)" }}>
          <MapContainer
            center={MALAYSIA_CENTER}
            zoom={6}
            minZoom={6}
            maxBounds={MALAYSIA_BOUNDS}
            maxBoundsViscosity={1}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <FitVisibleMarkers points={visiblePoints} />

            {showWeather && visibleStateBoundaries && (
              <GeoJSON
                key={`${weatherDate}-${weatherTime}-${weatherFilter}-${Object.keys(weatherByState).join("-")}`}
                data={visibleStateBoundaries}
                style={(feature) => {
                  const state = feature?.properties?.name ?? feature?.properties?.state ?? "";
                  const weather = weatherByState[state];
                  const colors = weather ? weatherPalette[weather.kind] : weatherPalette.cloudy;
                  return {
                    color: colors.border,
                    fillColor: colors.bg,
                    fillOpacity: 0.72,
                    opacity: 0.9,
                    weight: 1.4,
                  };
                }}
              />
            )}

            {showPlacePins && visiblePoints.map(({ location, lat, lng, approximate }) => {
              const weather = weatherByState[location.state];
              const facilities = visibleFacilities(location);
              return (
                <Marker
                  key={String(location.id)}
                  position={[lat, lng]}
                >
                  <Popup>
                    <div style={{ minWidth: 190, fontFamily: F.body }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{location.name}</p>
                      <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        📍 {location.state} · {activityLabel(language, location.activity)}
                      </p>
                      {showWeather && (
                        <p
                          style={{
                            fontSize: 11,
                            color: weather ? weatherPalette[weather.kind].text : C.textMuted,
                            marginBottom: 8,
                            fontWeight: 700,
                          }}
                        >
                          {weather
                            ? `${weather.icon} ${weather.condition}${weather.temp ? ` · ${weather.temp}°C` : ""}`
                            : `${wt(language, "loading")}...`}
                        </p>
                      )}
                      {approximate && (
                        <p style={{ fontSize: 10, color: "#8a6d1d", marginBottom: 8 }}>
                          Approximate map position
                        </p>
                      )}
                      {facilities.length > 0 && (
                        <p style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>
                          {t(language, "facilities")}: {facilities.join(", ")}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocation(location);
                          setPage("location");
                        }}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.forest,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          marginRight: 12,
                        }}
                      >
                        {t(language, "viewDetails")} →
                      </button>
                      <a
                        href={directionsUrl(location)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, fontWeight: 700, color: C.jungle }}
                      >
                        {t(language, "getDirections")} →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          {showWeather && (
            <div
              className="absolute bottom-4 right-4 z-[500] rounded-lg border bg-white/95 p-3 shadow-xl"
              style={{ borderColor: C.border, fontFamily: F.body }}
            >
              <button
                type="button"
                onClick={() => setShowPlacePins((value) => !value)}
                className="mb-2 h-10 w-full rounded-lg px-4 text-[12px] font-extrabold shadow-sm"
                style={{
                  backgroundColor: showPlacePins ? C.forest : C.gold,
                  color: showPlacePins ? "#fff" : C.text,
                  border: `2px solid ${showPlacePins ? C.forest : C.goldDark}`,
                }}
              >
                {showPlacePins ? wt(language, "hidePlaces") : wt(language, "showPlaces")}
              </button>
              {(["sunny", "cloudy", "rain"] as const).map((kind) => (
                <div key={kind} className="flex items-center gap-2 py-1">
                  <span
                    className="h-3.5 w-3.5 rounded-sm border"
                    style={{
                      backgroundColor: weatherPalette[kind].bg,
                      borderColor: weatherPalette[kind].border,
                    }}
                  />
                  <span className="text-[11px] font-bold" style={{ color: C.textSub }}>
                    {wt(language, kind)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
//==================== LimRouYu END - Map Module ====================
