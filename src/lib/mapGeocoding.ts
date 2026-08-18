export interface MapGeocodedPlace {
  lat: number;
  lng: number;
  label: string;
}

const MALAYSIA_VIEWBOX =
  "98.5,7.8,120.5,0.5";

const cache =
  new Map<string, MapGeocodedPlace | null>();

function clean(value?: string) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

export async function geocodeMapLocation(location: {
  name: string;
  state?: string;
  address?: string;
}): Promise<MapGeocodedPlace | null> {
  const name = clean(location.name);
  const state = clean(location.state);
  const address = clean(location.address);

  const queries = [
    address,
    [name, state, "Malaysia"]
      .filter(Boolean)
      .join(", "),
    [name, "Malaysia"]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);

  for (const query of [...new Set(queries)]) {
    const cacheKey = query.toLowerCase();

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);

      if (cached) return cached;

      continue;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
        countrycodes: "my",
        addressdetails: "1",
        viewbox: MALAYSIA_VIEWBOX,
        bounded: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Geocoding failed (${response.status})`
        );
      }

      const rows = await response.json();

      if (!Array.isArray(rows) || rows.length === 0) {
        cache.set(cacheKey, null);
        continue;
      }

      /*
       * Prefer result containing the requested state.
       */
      const expectedState =
        state.toLowerCase();

      const best =
        rows.find((row: any) =>
          expectedState
            ? String(row.display_name || "")
                .toLowerCase()
                .includes(expectedState)
            : true
        ) || rows[0];

      const place: MapGeocodedPlace = {
        lat: Number(best.lat),
        lng: Number(best.lon),
        label:
          String(best.display_name || query),
      };

      if (
        Number.isFinite(place.lat) &&
        Number.isFinite(place.lng)
      ) {
        cache.set(cacheKey, place);
        return place;
      }
    } catch (error) {
      console.warn(
        `SeekMY geocoding failed for ${query}`,
        error
      );
    }
  }

  return null;
}


// =====================================================
// REVERSE GEOCODING
// lat/lng → readable address
// =====================================================

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
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Reverse geocoding failed (${response.status})`
      );
    }

    const data = await response.json();

    return data.display_name || null;
  } catch (error) {
    console.warn(
      "SeekMY reverse geocoding failed",
      error
    );

    return null;
  }
}
