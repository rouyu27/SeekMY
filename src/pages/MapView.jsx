import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { ACTIVITY_TYPES } from "@/lib/malaysia-data";
import { Map, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function MapView() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActivity, setFilterActivity] = useState("");

  useEffect(() => {
    base44.entities.Location.filter({ status: "active" }).then(l => {
      setLocations(l.filter(loc => loc.latitude && loc.longitude));
      setLoading(false);
    });
  }, []);

  const filtered = locations.filter(l =>
    !filterActivity || (l.activity_types || []).includes(filterActivity)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-green-700 text-white px-4 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Map className="w-6 h-6" />
          <div>
            <h1 className="font-bold text-xl">Explore Map</h1>
            <p className="text-white/70 text-sm">Discover outdoor locations across Malaysia</p>
          </div>
        </div>
      </div>

      {/* Activity Filter */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto">
          <button onClick={() => setFilterActivity("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${!filterActivity ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
            All Activities
          </button>
          {ACTIVITY_TYPES.map(a => (
            <button key={a.name} onClick={() => setFilterActivity(filterActivity === a.name ? "" : a.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${filterActivity === a.name ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}>
              {a.icon} {a.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <Map className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
            <p>Loading map...</p>
          </div>
        </div>
      ) : (
        <div style={{ height: "calc(100vh - 160px)" }}>
          <MapContainer center={[4.2105, 108.9758]} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {filtered.map(loc => (
              <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="font-bold text-gray-900 mb-1">{loc.name}</p>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span>📍</span> {loc.state}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(loc.activity_types || []).slice(0, 2).map(a => {
                        const act = ACTIVITY_TYPES.find(t => t.name === a);
                        return <span key={a} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{act?.icon} {a}</span>;
                      })}
                    </div>
                    <a href={`/location/${loc.id}`} className="text-xs text-green-700 font-semibold hover:underline">View Details →</a>
                  </div>
                
            <div className="mt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-green-700 hover:underline"
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

      {filtered.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-xs">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No locations with coordinates yet</p>
            <p className="text-sm text-gray-400 mt-1">Add locations via the Admin Panel with lat/lng coordinates</p>
          </div>
        </div>
      )}
    </div>
  );
}