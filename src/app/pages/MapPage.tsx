//==================== LimRouYu Part - Map Module ====================
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
import type { ActivityLog, Location, Page } from "../lib/types";
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
  available: boolean;
  message?: string;
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
const WEATHER_CANVAS_STEP = 6;

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
    hidePlaces: "隐藏地点",
    showPlaces: "显示地点",
  },
};

const weatherPalette: Record<Exclude<WeatherKind, "all">, { bg: string; text: string; border: string }> = {
  sunny: { bg: "#b45309", text: "#ffffff", border: "#b45309" },
  cloudy: { bg: "#475569", text: "#ffffff", border: "#475569" },
  rain: { bg: "#1d4ed8", text: "#ffffff", border: "#1d4ed8" },
};

function wt(language: Language, key: string) {
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
  const sameDayForecasts = bundle.hourly.filter((item) => item.date === selectedDate);
  if (!sameDayForecasts.length) return undefined;
  const target = new Date(`${selectedDate}T${selectedTime}:00+08:00`).getTime();
  return sameDayForecasts.reduce((best, item) =>
    Math.abs(item.timestamp - target) < Math.abs(best.timestamp - target) ? item : best
  );
}

function formatWeatherDate(date: string) {
  return new Date(`${date}T12:00:00+08:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function forecastRangeMessage(bundle: WeatherBundle, language: Language) {
  const dates = Array.from(new Set((bundle.hourly ?? []).map((item) => item.date))).sort();
  if (!dates.length) {
    return language === "zh" ? "没有找到记录。请稍后再试。" : language === "ms" ? "Tiada rekod dijumpai. Sila cuba lagi kemudian." : "No record found. Please try again later.";
  }
  if (dates.length === 1) {
    return language === "zh"
      ? `没有找到记录。天气资料只适用于 ${formatWeatherDate(dates[0])}。`
      : language === "ms"
        ? `Tiada rekod dijumpai. Data cuaca hanya tersedia pada ${formatWeatherDate(dates[0])}.`
        : `No record found. Weather data is only available on ${formatWeatherDate(dates[0])}.`;
  }
  return language === "zh"
    ? `没有找到记录。请选择 ${formatWeatherDate(dates[0])} 至 ${formatWeatherDate(dates[dates.length - 1])} 之间的日期。`
    : language === "ms"
      ? `Tiada rekod dijumpai. Sila pilih tarikh dari ${formatWeatherDate(dates[0])} hingga ${formatWeatherDate(dates[dates.length - 1])}.`
      : `No record found. Please select a date from ${formatWeatherDate(dates[0])} to ${formatWeatherDate(dates[dates.length - 1])}.`;
}

function weatherSnapshot(
  bundle: WeatherBundle,
  selectedDate: string,
  selectedTime: string,
  language: Language
): WeatherSnapshot {
  const forecast = nearestForecastHour(bundle, selectedDate, selectedTime);
  const todayMalaysia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const nowMalaysia = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const canUseCurrentWeather = selectedDate === todayMalaysia && selectedTime <= nowMalaysia;

  if (!forecast && !canUseCurrentWeather) {
    return {
      kind: "cloudy",
      condition: language === "zh" ? "暂无预报资料" : language === "ms" ? "Tiada data ramalan" : "No forecast data",
      icon: "",
      available: false,
      message: forecastRangeMessage(bundle, language),
    };
  }

  const condition = forecast?.condition || bundle.current.condition;

  return {
    kind: classifyWeather(condition),
    condition,
    temp: forecast?.temp ?? bundle.current.temp,
    icon: forecast?.icon || bundle.current.icon,
    available: true,
  };
}

function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function markerIcon(logged: boolean) {
  const color = logged ? "#b45309" : "#2f80c0";
  const border = logged ? "#78350f" : "#1b5f92";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:3px solid ${border};box-shadow:0 8px 18px rgba(15,23,42,.3);transform:rotate(-45deg);"><span style="display:block;width:9px;height:9px;margin:5.5px;border-radius:50%;background:#fff;transform:rotate(45deg);"></span></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  });
}

function currentMalaysiaWeatherTime() {
  const currentHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return `${currentHour}:00`;
}

function visibleFacilities(location: Location) {
  return Array.isArray(location.facilities) ? location.facilities.slice(0, 3) : [];
}

function distanceSquared(latA: number, lngA: number, latB: number, lngB: number) {
  const latDelta = latA - latB;
  const lngDelta = (lngA - lngB) * Math.cos(((latA + latB) / 2) * Math.PI / 180);
  return latDelta * latDelta + lngDelta * lngDelta;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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

function keepOpenedPopupVisible(event: L.PopupEvent) {
  const adjust = () => {
    const popupElement = event.popup.getElement();
    const filterElement = document.querySelector("[data-map-filter-bar]");
    if (!popupElement || !filterElement) return;

    const popupRect = popupElement.getBoundingClientRect();
    const filterRect = filterElement.getBoundingClientRect();
    const overlap = filterRect.bottom - popupRect.top + 10;
    if (overlap > 0) {
      const currentShift = Number.parseFloat(popupElement.style.translate.split(" ")[1] || "0") || 0;
      popupElement.style.translate = `0 ${currentShift + overlap}px`;
    }
  };

  event.popup.getElement()?.style.setProperty("translate", "");
  window.setTimeout(() => {
    adjust();
    window.requestAnimationFrame(adjust);
  }, 0);
}

function WeatherCanvasLayer({
  boundary,
  points,
  weatherByPlace,
  weatherFilter,
}: {
  boundary: MalaysiaStateGeoJson | null;
  points: MapPoint[];
  weatherByPlace: Record<string, WeatherSnapshot>;
  weatherFilter: WeatherKind;
}) {
  const map = useMap();

  useEffect(() => {
    if (!boundary) return;
    const canvas = L.DomUtil.create("canvas", "seekmy-weather-canvas") as HTMLCanvasElement;
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);

    let animationFrame = 0;

    function drawPolygonMask(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      for (const feature of boundary.features) {
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates as number[][][]]
            : (feature.geometry.coordinates as number[][][][]);

        for (const polygon of polygons) {
          for (const ring of polygon) {
            ring.forEach(([lng, lat], index) => {
              const point = map.latLngToContainerPoint([lat, lng]);
              if (index === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.closePath();
          }
        }
      }
      ctx.fill("evenodd");
    }

    function draw() {
      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      const pixelRatio = window.devicePixelRatio || 1;
      const weatherPoints = points
        .map((point) => ({
          ...point,
          weather: weatherByPlace[String(point.location.id)],
        }))
        .filter((point): point is MapPoint & { weather: WeatherSnapshot } => Boolean(point.weather?.available));

      L.DomUtil.setPosition(canvas, topLeft);
      canvas.width = Math.max(1, Math.round(size.x * pixelRatio));
      canvas.height = Math.max(1, Math.round(size.y * pixelRatio));
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);
      if (!weatherPoints.length) return;

      const sampleWidth = Math.max(1, Math.ceil(size.x / WEATHER_CANVAS_STEP));
      const sampleHeight = Math.max(1, Math.ceil(size.y / WEATHER_CANVAS_STEP));
      const weatherCanvas = document.createElement("canvas");
      weatherCanvas.width = sampleWidth;
      weatherCanvas.height = sampleHeight;
      const weatherCtx = weatherCanvas.getContext("2d");
      if (!weatherCtx) return;

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const mapX = x * WEATHER_CANVAS_STEP + WEATHER_CANVAS_STEP / 2;
          const mapY = y * WEATHER_CANVAS_STEP + WEATHER_CANVAS_STEP / 2;
          const latLng = map.containerPointToLatLng([mapX, mapY]);
          let nearest = weatherPoints[0];
          let nearestDistance = distanceSquared(latLng.lat, latLng.lng, nearest.lat, nearest.lng);

          for (let index = 1; index < weatherPoints.length; index += 1) {
            const candidate = weatherPoints[index];
            const candidateDistance = distanceSquared(latLng.lat, latLng.lng, candidate.lat, candidate.lng);
            if (candidateDistance < nearestDistance) {
              nearest = candidate;
              nearestDistance = candidateDistance;
            }
          }

          if (weatherFilter !== "all" && nearest.weather.kind !== weatherFilter) continue;
          weatherCtx.fillStyle = hexToRgba(weatherPalette[nearest.weather.kind].bg, 0.4);
          weatherCtx.fillRect(x, y, 1, 1);
        }
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(weatherCanvas, 0, 0, size.x, size.y);

      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "#000";
      drawPolygonMask(ctx);
      ctx.globalCompositeOperation = "source-over";
    }

    function scheduleDraw() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }

    scheduleDraw();
    map.on("moveend zoomend resize viewreset", scheduleDraw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      map.off("moveend zoomend resize viewreset", scheduleDraw);
      canvas.remove();
    };
  }, [boundary, map, points, weatherByPlace, weatherFilter]);

  return null;
}

export function MapPage({
  setPage,
  setSelectedLocation,
  locations,
  activityLogs = [],
  language = "en",
  openWeather = false,
  onWeatherOpened,
}: {
  setPage: (p: Page) => void;
  setSelectedLocation: (l: Location) => void;
  locations: Location[];
  activityLogs?: ActivityLog[];
  language?: Language;
  openWeather?: boolean;
  onWeatherOpened?: () => void;
}) {
  const [activity, setActivity] = useState("all");
  const [difficulty, setDifficulty] = useState("All");
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherDate, setWeatherDate] = useState(todayInputValue);
  const [weatherTime, setWeatherTime] = useState("12:00");
  const [weatherFilter, setWeatherFilter] = useState<WeatherKind>("all");
  const [weatherBundlesByPlace, setWeatherBundlesByPlace] = useState<Record<string, WeatherBundle>>({});
  const [weatherByPlace, setWeatherByPlace] = useState<Record<string, WeatherSnapshot>>({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [malaysiaBoundary, setMalaysiaBoundary] = useState<MalaysiaStateGeoJson | null>(null);
  const [showPlacePins, setShowPlacePins] = useState(true);

  const loggedByLocation = useMemo(() => {
    const map = new Map<string, ActivityLog>();
    for (const log of activityLogs) {
      const keys = [
        log.locationId != null ? String(log.locationId) : "",
        `${log.location}|${log.state}`.toLowerCase(),
      ].filter(Boolean);
      for (const key of keys) {
        const existing = map.get(key);
        if (!existing || log.date > existing.date) map.set(key, log);
      }
    }
    return map;
  }, [activityLogs]);

  function loggedActivityFor(location: Location) {
    return loggedByLocation.get(String(location.id))
      || loggedByLocation.get(`${location.name}|${location.state}`.toLowerCase())
      || null;
  }

  useEffect(() => {
    if (!openWeather) return;
    setWeatherDate(todayInputValue());
    setWeatherTime(currentMalaysiaWeatherTime());
    setShowWeather(true);
    onWeatherOpened?.();
  }, [openWeather, onWeatherOpened]);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/malaysia.state.geojson")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.type === "FeatureCollection") {
          setMalaysiaBoundary(data as MalaysiaStateGeoJson);
        }
      })
      .catch(() => {
        if (!cancelled) setMalaysiaBoundary(null);
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

      for (let start = 0; start < locations.length; start += concurrency) {
        const batch = locations.slice(start, start + concurrency);
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
  }, [locations]);

  const weatherPlaceKey = useMemo(
    () => points.map((point) => `${point.location.id}:${point.lat.toFixed(4)},${point.lng.toFixed(4)}`).sort().join("|"),
    [points]
  );

  useEffect(() => {
    if (!showWeather || loadingMap || points.length === 0) return;
    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherBundlesByPlace({});
      const next: Record<string, WeatherBundle> = {};
      const concurrency = 4;

      for (let start = 0; start < points.length; start += concurrency) {
        const batch = points.slice(start, start + concurrency);
        const resolved = await Promise.all(
          batch.map(async (point) => {
            const placeId = String(point.location.id);
            try {
              const bundle = await fetchWeather(point.location.name, point.location.state, {
                lat: point.lat,
                lng: point.lng,
              });
              return [placeId, bundle] as const;
            } catch {
              return null;
            }
          })
        );

        for (const result of resolved) {
          if (result) next[result[0]] = result[1];
        }
        if (!cancelled) setWeatherBundlesByPlace((current) => ({ ...current, ...next }));
      }

      if (!cancelled) setWeatherLoading(false);
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [showWeather, loadingMap, weatherPlaceKey, points]);

  useEffect(() => {
    if (!showWeather) {
      setWeatherByPlace({});
      return;
    }
    const next: Record<string, WeatherSnapshot> = {};
    for (const point of points) {
      const placeId = String(point.location.id);
      const bundle = weatherBundlesByPlace[placeId];
      next[placeId] = bundle
          ? weatherSnapshot(bundle, weatherDate, weatherTime, language)
        : {
            kind: "cloudy",
            condition: language === "zh" ? "暂无预报资料" : language === "ms" ? "Tiada data ramalan" : "No forecast data",
            icon: "",
            available: false,
            message: language === "zh" ? "没有找到记录。请稍后再试。" : language === "ms" ? "Tiada rekod dijumpai. Sila cuba lagi kemudian." : "No record found. Please try again later.",
          };
    }
    setWeatherByPlace(next);
  }, [showWeather, points, weatherBundlesByPlace, weatherDate, weatherTime, language]);

  const visiblePoints = useMemo(
    () => {
      const filteredPoints = points.filter((point) => {
        if (activity !== "all" && point.location.activity !== activity) return false;
        if (difficulty !== "All" && point.location.difficulty !== difficulty) return false;
        return true;
      });
      return showWeather && weatherFilter !== "all"
        ? filteredPoints.filter((point) => weatherByPlace[String(point.location.id)]?.kind === weatherFilter)
        : filteredPoints;
    },
    [activity, difficulty, points, showWeather, weatherFilter, weatherByPlace]
  );

  const availableWeatherFilters = useMemo(() => {
    const loadedKinds = new Set(
      Object.values(weatherByPlace)
        .filter((weather) => weather.available)
        .map((weather) => weather.kind)
    );
    return (["all", "sunny", "cloudy", "rain"] as const).filter(
      (kind) => kind === "all" || loadedKinds.has(kind)
    );
  }, [weatherByPlace]);

  const weatherNoDataMessage = useMemo(() => {
    if (!showWeather || weatherLoading) return "";
    const snapshots = Object.values(weatherByPlace);
    if (!snapshots.length || snapshots.some((weather) => weather.available)) return "";
    return snapshots.find((weather) => weather.message)?.message || "No record found. Please try another date.";
  }, [showWeather, weatherLoading, weatherByPlace]);

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
              {visiblePoints.length} {t(language, "markers")}
              {loadingMap ? ` · ${t(language, "locating")}...` : ""}
            </p>
          </div>
        </div>
      </div>

      <div data-map-filter-bar className="bg-white border-b sticky top-14 z-[1100]" style={{ borderColor: C.border }}>
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
              onClick={() => {
                if (showWeather) {
                  setShowWeather(false);
                  return;
                }
                setWeatherDate(todayInputValue());
                setWeatherTime(currentMalaysiaWeatherTime());
                setShowWeather(true);
              }}
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
            {showWeather && (
              <WeatherCanvasLayer
                boundary={malaysiaBoundary}
                points={points}
                weatherByPlace={weatherByPlace}
                weatherFilter={weatherFilter}
              />
            )}

            {showPlacePins && visiblePoints.map(({ location, lat, lng, approximate }) => {
              const weather = weatherByPlace[String(location.id)];
              const facilities = visibleFacilities(location);
              const loggedActivity = loggedActivityFor(location);
              return (
                <Marker
                  key={String(location.id)}
                  position={[lat, lng]}
                  icon={markerIcon(Boolean(loggedActivity))}
                  eventHandlers={{ popupopen: keepOpenedPopupVisible }}
                >
                  <Popup maxHeight={360}>
                    <div style={{ minWidth: 190, fontFamily: F.body }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{location.name}</p>
                      {loggedActivity && (
                        <p style={{ fontSize: 11, color: "#92400e", marginBottom: 6, fontWeight: 700 }}>
                          Logged on {loggedActivity.date}
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        Location - {location.state} - {activityLabel(language, location.activity)}
                      </p>
                      {loggedActivity?.comment && (
                        <p style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>
                          {loggedActivity.comment}
                        </p>
                      )}
                      {showWeather && (
                        <p
                          style={{
                            fontSize: 11,
                            color: weather?.available ? weatherPalette[weather.kind].text : C.textMuted,
                            marginBottom: 8,
                            fontWeight: 700,
                          }}
                        >
                          {weather?.available
                            ? `${weather.icon} ${weather.condition}${weather.temp ? ` · ${weather.temp}°C` : ""}`
                            : weather?.message || weather?.condition || `${wt(language, "loading")}...`}
                        </p>
                      )}
                      {approximate && (
                        <p style={{ fontSize: 10, color: "#8a6d1d", marginBottom: 8 }}>
                          {language === "zh" ? "地图位置为估算" : language === "ms" ? "Kedudukan peta adalah anggaran" : "Approximate map position"}
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
                        {`${t(language, "viewDetails")} ->`}
                      </button>
                      <a
                        href={directionsUrl(location)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, fontWeight: 700, color: C.jungle }}
                      >
                        {`${t(language, "getDirections")} ->`}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          {weatherNoDataMessage && (
            <div
              className="absolute left-1/2 top-4 z-[500] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border bg-white/95 px-4 py-3 text-sm font-bold shadow-xl"
              style={{ borderColor: C.border, color: C.textSub, fontFamily: F.body }}
            >
              {weatherNoDataMessage}
            </div>
          )}
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
              <div className="mt-2 border-t pt-2" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2 py-1">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: "#b45309" }} />
                  <span className="text-[11px] font-bold" style={{ color: C.textSub }}>
                    Logged place
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
//==================== LimRouYu END - Map Module ====================

