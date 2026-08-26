//==================== WongYueShan Part - Weather Module ====================
import { firebaseClient } from "../api/firebaseClient";
export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  uv: number | null;
  condition: string;
  icon: string;
  advisory: "Good to Go" | "Check Before You Go";
}

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipChance: number;
  icon: string;
}

export interface ForecastHour {
  date: string;
  time: string;
  timestamp: number;
  temp: number;
  condition: string;
  precipChance: number;
  icon: string;
}

export interface WeatherAlert {
  id: string;
  severity: "warning" | "watch" | "info";
  title: string;
  message: string;
  action: string;
}

export interface WeatherBundle {
  current: WeatherCurrent;
  forecast: ForecastDay[];
  hourly?: ForecastHour[];
  alerts: WeatherAlert[];
  recommendations: {
    icon: string;
    text: string;
  }[];
  source?: "OpenWeatherMap";
}

export interface GeocodedPlace {
  lat: number;
  lng: number;
  label: string;
}

const cache = new Map<string, GeocodedPlace | null>();
const weatherCache = new Map<string, { expires: number; data: WeatherBundle }>();
const WEATHER_CACHE_MS = 10 * 60 * 1000;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function retry<T>(work: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) await wait(350 * (index + 1));
    }
  }
  throw lastError;
}

function emoji(condition: string) {
  if (/thunder|storm/i.test(condition)) return "⛈️";
  if (/rain|drizzle/i.test(condition)) return "🌧️";
  if (/cloud/i.test(condition)) return "☁️";
  if (/clear|sun/i.test(condition)) return "☀️";
  return "⛅";
}

function buildAdvice(
  temp: number,
  humidity: number,
  wind: number,
  condition: string,
  forecast: ForecastDay[],
  uv: number | null = null
) {
  const alerts: WeatherAlert[] = [];

  if (temp >= 34) {
    alerts.push({
      id: "heat",
      severity: "warning",
      title: "Extreme heat",
      message: "High temperature may cause heat stress on trails.",
      action: "Carry extra water, rest in shade, avoid midday hikes.",
    });
  }

  if (wind >= 25) {
    alerts.push({
      id: "wind",
      severity: "watch",
      title: "Strong winds",
      message: "Elevated ridgelines and open coasts may be hazardous.",
      action: "Avoid exposed peaks and open water activities.",
    });
  }

  if (
    forecast.some((f) => /thunder|storm/i.test(f.condition)) ||
    /thunder|storm/i.test(condition)
  ) {
    alerts.push({
      id: "storm",
      severity: "warning",
      title: "Thunderstorm risk",
      message: "Storms may affect outdoor activities.",
      action: "Postpone exposed activities and seek shelter if thunder is heard.",
    });
  }

  const recommendations: { icon: string; text: string }[] = [];

  recommendations.push(
    alerts.length
      ? {
          icon: "⚠️",
          text: "Prioritise safety: review weather alerts before departing.",
        }
      : {
          icon: "✅",
          text: "Conditions look suitable for most outdoor activities.",
        }
  );

  if (temp >= 30) {
    recommendations.push({
      icon: "💧",
      text: "Bring at least 2L of water per person.",
    });
  }

  if (typeof uv === "number" && uv >= 7) {
    recommendations.push({
      icon: "🧴",
      text: "Use SPF 50+ and sun protection — UV is high.",
    });
  }

  if (humidity >= 85) {
    recommendations.push({
      icon: "🐢",
      text: "Pace yourself; high humidity slows recovery.",
    });
  }

  if (/rain/i.test(condition)) {
    recommendations.push({
      icon: "🧥",
      text: "Pack a light rain jacket and protect electronics.",
    });
  }

  return { alerts, recommendations };
}

function buildGeocodingQueries(
  name: string,
  state?: string,
  allowStateFallback = true
): string[] {
  const simplifiedName = name
    .replace(
      /\b(national park|state park|recreational park|eco forest park|forest park|nature park|botanical garden|botanical gardens|conservation area|geoforest park|park)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  const queries = [
    [name, state, "Malaysia"]
      .filter(Boolean)
      .join(", "),

    simplifiedName &&
    simplifiedName.toLowerCase() !== name.toLowerCase()
      ? [simplifiedName, state, "Malaysia"]
          .filter(Boolean)
          .join(", ")
      : "",

    allowStateFallback && state
      ? [state, "Malaysia"]
          .filter(Boolean)
          .join(", ")
      : "",
  ].filter(Boolean);

  return [...new Set(queries)];
}

async function geocodeQuery(
  queryText: string,
  apiKey: string
): Promise<GeocodedPlace | null> {
  const cacheKey = queryText.toLowerCase();

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const params = new URLSearchParams({
    q: queryText,
    limit: "1",
    appid: apiKey,
  });

  const response = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?${params}`
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    console.error(
      "OpenWeather geocoding request failed:",
      response.status,
      body
    );

    if (response.status === 401) {
      throw new Error(
        "OpenWeather API key is invalid or not active."
      );
    }

    if (response.status === 429) {
      throw new Error(
        "OpenWeather API request limit reached. Please try again later."
      );
    }

    throw new Error(
      `OpenWeather geocoding failed with status ${response.status}.`
    );
  }

  const rows = await response.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    cache.set(cacheKey, null);
    return null;
  }

  const row = rows[0];

  const place: GeocodedPlace = {
    lat: Number(row.lat),
    lng: Number(row.lon),
    label:
      [row.name, row.state, row.country]
        .filter(Boolean)
        .join(", ") || queryText,
  };

  cache.set(cacheKey, place);

  return place;
}

export async function geocodeLocation(
  name: string,
  state?: string,
  allowStateFallback = true
): Promise<GeocodedPlace | null> {
  const apiKey =
    import.meta.env.VITE_OPENWEATHER_API_KEY as
      | string
      | undefined;

  if (!apiKey) {
    throw new Error(
      "OpenWeather API key is not configured."
    );
  }

  const queries = buildGeocodingQueries(
    name,
    state,
    allowStateFallback
  );

  console.log(
    "SeekMY weather geocoding queries:",
    queries
  );

  for (const queryText of queries) {
    const place = await geocodeQuery(
      queryText,
      apiKey
    );

    if (place) {
      console.log(
        `SeekMY weather geocoded "${queryText}" as`,
        place
      );
      return place;
    }

    console.warn(
      `SeekMY weather: no geocoding result for "${queryText}"`
    );
  }

  return null;
}

async function fetchLive(
  name: string,
  state?: string,
  coordinates?: { lat: number; lng: number }
): Promise<WeatherBundle> {
  const response: any = await firebaseClient.backend.getWeather({
    locationName: name,
    state,
    ...(coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)
      ? { lat: coordinates.lat, lng: coordinates.lng }
      : {}),
  });
  const currentJson = response.current;
  const forecastJson = response.forecast;

  const grouped =
    new Map<string, any[]>();

  for (const item of forecastJson.list ?? []) {
    const date =
      new Date(item.dt * 1000)
        .toISOString()
        .slice(0, 10);

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }

    grouped.get(date)!.push(item);
  }

  const todayMalaysia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const forecast: ForecastDay[] =
    Array.from(grouped.entries())
      .filter(([date]) => date > todayMalaysia)
      .slice(0, 3)
      .map(([date, items]) => {
        const temps =
          items.map(
            (item) =>
              Number(item.main?.temp ?? 0)
          );

        const sample =
          items[
            Math.floor(items.length / 2)
          ];

        const condition =
          sample?.weather?.[0]?.description ??
          sample?.weather?.[0]?.main ??
          "Clouds";

        return {
          date:
            new Date(
              `${date}T12:00:00`
            ).toLocaleDateString(
              "en-MY",
              {
                weekday: "short",
                day: "numeric",
                month: "numeric",
              }
            ),

          high:
            Math.round(
              Math.max(...temps)
            ),

          low:
            Math.round(
              Math.min(...temps)
            ),

          condition,

          precipChance:
            Math.round(
              Math.max(
                ...items.map(
                  (item) =>
                    Number(
                      item.pop ?? 0
                    ) * 100
                )
              )
            ),

          icon: emoji(condition),
        };
      });

  const hourly: ForecastHour[] =
    (forecastJson.list ?? [])
      .slice(0, 40)
      .map((item: any) => {
        const timestamp =
          Number(item.dt ?? 0) * 1000;
        const date =
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kuala_Lumpur",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(timestamp));
        const time =
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kuala_Lumpur",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(timestamp));
        const condition =
          item.weather?.[0]?.description ??
          item.weather?.[0]?.main ??
          "Clouds";

        return {
          date,
          time,
          timestamp,
          temp:
            Math.round(
              Number(item.main?.temp ?? 0)
            ),
          condition,
          precipChance:
            Math.round(
              Number(item.pop ?? 0) * 100
            ),
          icon: emoji(condition),
        };
      });

  const temp =
    Math.round(
      Number(
        currentJson.main?.temp ?? 0
      )
    );

  const feelsLike =
    Math.round(
      Number(
        currentJson.main?.feels_like ??
        temp
      )
    );

  const humidity =
    Number(
      currentJson.main?.humidity ?? 0
    );

  const wind =
    Math.round(
      Number(
        currentJson.wind?.speed ?? 0
      ) * 3.6
    );

  const condition =
    currentJson.weather?.[0]?.description ??
    currentJson.weather?.[0]?.main ??
    "Clouds";
  const rawUv =
    response.uv?.value ??
    response.uv?.uvi ??
    response.uvi ??
    currentJson.uvi ??
    currentJson.uv;
  const uv = Number.isFinite(Number(rawUv)) ? Number(rawUv) : null;

  const {
    alerts,
    recommendations,
  } = buildAdvice(
    temp,
    humidity,
    wind,
    condition,
    forecast,
    uv
  );

  return {
    current: {
      temp,
      feelsLike,
      humidity,
      wind,
      uv,
      condition,
      icon: emoji(condition),
      advisory:
        alerts.length
          ? "Check Before You Go"
          : "Good to Go",
    },

    forecast,
    hourly,
    alerts,
    recommendations,
    source: "OpenWeatherMap",
  };
}

export async function fetchWeather(
  locationName: string,
  state?: string,
  coordinates?: { lat: number; lng: number }
): Promise<WeatherBundle> {
  if (!locationName.trim()) {
    throw new Error(
      "Location name is required."
    );
  }

  const cacheKey = JSON.stringify({
    locationName: locationName.trim().toLowerCase(),
    state,
    coordinates,
  });
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  const data = await retry(
    () => fetchLive(locationName, state, coordinates),
    3
  );
  weatherCache.set(cacheKey, {
    expires: Date.now() + WEATHER_CACHE_MS,
    data,
  });
  return data;
}

// Backward-compatible alias for any older page that still calls fetchWeatherDemo.
export async function fetchWeatherDemo(
  opts: {
    locationName?: string;
    state?: string;
    forceFail?: boolean;
  }
): Promise<WeatherBundle> {
  if (opts.forceFail) {
    throw new Error(
      "Weather request forced to fail."
    );
  }

  if (!opts.locationName?.trim()) {
    throw new Error(
      "Location name is required."
    );
  }

  return fetchWeather(
    opts.locationName,
    opts.state
  );
}
//==================== WongYueShan END - Weather Module ====================
