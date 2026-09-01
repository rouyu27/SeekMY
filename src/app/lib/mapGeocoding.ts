//==================== LimRouYu Part ====================
// Map Module - Address geocoding
// Converts a human-readable address / place name into temporary coordinates.
// Coordinates are NOT stored in Firebase.

export interface MapGeocodedPlace {
  lat: number;
  lng: number;
  label: string;
}

const memoryCache = new Map<string, MapGeocodedPlace | null>();
const STORAGE_KEY = "seekmy-map-geocode-cache-v1";

function readStoredCache(): Record<string, MapGeocodedPlace> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredResult(key: string, place: MapGeocodedPlace) {
  try {
    const stored = readStoredCache();
    stored[key] = place;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Browser storage may be unavailable; memory cache still works.
  }
}

async function searchAddress(query: string): Promise<MapGeocodedPlace | null> {
  const cacheKey = query.trim().toLowerCase();
  if (!cacheKey) return null;

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) ?? null;
  }

  const stored = readStoredCache()[cacheKey];
  if (stored) {
    memoryCache.set(cacheKey, stored);
    return stored;
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "my",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Map geocoding failed (${response.status}).`);
  }

  const rows = await response.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    memoryCache.set(cacheKey, null);
    return null;
  }

  const first = rows[0];
  const place: MapGeocodedPlace = {
    lat: Number(first.lat),
    lng: Number(first.lon),
    label: String(first.display_name || query),
  };

  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) {
    memoryCache.set(cacheKey, null);
    return null;
  }

  memoryCache.set(cacheKey, place);
  saveStoredResult(cacheKey, place);
  return place;
}

export async function geocodeMapLocation(location: {
  name: string;
  address?: string;
  state?: string;
}): Promise<MapGeocodedPlace | null> {
  // The geocoder understands normal words. The address does not have to be
  // latitude/longitude. A recognisable landmark, road, town, postcode or state
  // can be searched as free text.
  const address = location.address?.trim();
  const name = location.name?.trim();
  const state = location.state?.trim();

  const queries = [
    [name, address, state, "Malaysia"].filter(Boolean).join(", "),
    [address, state, "Malaysia"].filter(Boolean).join(", "),
    address,
    [name, state, "Malaysia"].filter(Boolean).join(", "),
    [name, address].filter(Boolean).join(", "),
  ].filter((value): value is string => Boolean(value));

  for (const query of [...new Set(queries)]) {
    try {
      const result = await searchAddress(query);
      if (result) return result;
    } catch (error) {
      console.warn(`SeekMY map geocoding failed for "${query}"`, error);
    }
  }

  return null;
}

/** Convert confirmed coordinates into the readable address saved with a suggestion. */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "jsonv2",
      addressdetails: "1",
      zoom: "18",
    });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed (${response.status}).`);
    }
    const result = await response.json();
    return typeof result.display_name === "string" ? result.display_name : null;
  } catch (error) {
    console.warn("SeekMY reverse geocoding failed", error);
    return null;
  }
}
//==================== LimRouYu END ====================
