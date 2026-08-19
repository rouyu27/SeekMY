//==================== LimRouYu Part - Map Module ====================
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, MapPin, Filter, X } from "lucide-react";
import type { Location, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { ACTIVITY_FILTERS } from "../lib/constants";
import { geocodeMapLocation } from "../lib/mapGeocoding";

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

function storedCoordinates(location: Location) {
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function MapPage({
  setPage,
  setSelectedLocation,
  locations,
}: {
  setPage: (p: Page) => void;
  setSelectedLocation: (l: Location) => void;
  locations: Location[];
}) {
  const [activity, setActivity] = useState("all");
  const [difficulty, setDifficulty] = useState("All");
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);

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

    async function loadPoints() {
      setLoadingMap(true);

      // Use the stored address to geocode each location.
      // Do not place a marker at a fake state-centre position if geocoding fails.
      const next: MapPoint[] = [];
      const concurrency = 5;

      for (let start = 0; start < filteredLocations.length; start += concurrency) {
        const batch = filteredLocations.slice(start, start + concurrency);
        const resolved = await Promise.all(
          batch.map(async (location) => {
            const stored = storedCoordinates(location);
            if (stored) {
              return { location, ...stored, approximate: false };
            }

            // Migration fallback for legacy records only. New and imported
            // locations must store coordinates in Firestore.
            const point = await geocodeMapLocation(location);
            return point
              ? {
                  location,
                  lat: point.lat,
                  lng: point.lng,
                  approximate: false,
                }
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
              Explore Map
            </h1>
            <p
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.65)", fontFamily: F.body }}
            >
              {points.length} markers{loadingMap ? " · locating…" : ""}
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
                {icon} {label}
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
                {level}
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
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="h-[420px] flex flex-col items-center justify-center">
          <MapPin size={36} style={{ color: C.textMuted, opacity: 0.4 }} />
          <p className="mt-3 font-bold" style={{ color: C.textSub, fontFamily: F.body }}>
            No outdoor activity locations found for this filter.
          </p>
        </div>
      ) : (
        <div className="relative z-0" style={{ height: "calc(100vh - 200px)" }}>
          <MapContainer center={[4.21, 108.98]} zoom={6} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            <FitVisibleMarkers points={points} />

            {points.map(({ location, lat, lng, approximate }) => (
              <Marker key={String(location.id)} position={[lat, lng]}>
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: F.body }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>{location.name}</p>
                    <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                      📍 {location.state} · {location.activity}
                    </p>
                    {approximate && (
                      <p style={{ fontSize: 10, color: "#8a6d1d", marginBottom: 8 }}>
                        Approximate map position
                      </p>
                    )}
                    {location.facilities?.length > 0 && (
                      <p style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>
                        Facilities: {location.facilities.slice(0, 3).join(", ")}
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
                      View details →
                    </button>
                    <a
                      href={directionsUrl(location)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, color: C.jungle }}
                    >
                      Get Directions →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
//==================== LimRouYu END - Map Module ====================
