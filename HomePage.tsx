/** Demo weather layer — simulates OpenWeatherMap using location mock + coords */

export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  uv: number;
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
  alerts: WeatherAlert[];
  recommendations: {
    comment?: any;
    icon: string;
    text: string;
  }[];
}

function seedFromCoords(lat?: number, lng?: number, baseTemp = 28) {
  const s = Math.abs(Math.floor(((lat || 3) * 1000 + (lng || 101) * 10) % 97));
  return s;
}

export async function fetchWeatherDemo(opts: {
  lat?: number;
  lng?: number;
  baseTemp?: number;
  baseHumidity?: number;
  baseWind?: number;
  baseCondition?: string;
  /** force failure for testing A1 */
  forceFail?: boolean;
}): Promise<WeatherBundle> {
  await new Promise((r) => setTimeout(r, 400));
  if (opts.forceFail) throw new Error("network");

  const seed = seedFromCoords(opts.lat, opts.lng, opts.baseTemp);
  const temp = opts.baseTemp ?? 28;
  const humidity = opts.baseHumidity ?? 75;
  const wind = opts.baseWind ?? 8;
  const condition = opts.baseCondition || "Partly Cloudy";
  const uv = 3 + (seed % 8);
  const advisory: WeatherCurrent["advisory"] =
    wind >= 30 || temp >= 35 || /thunder|storm|heavy rain/i.test(condition)
      ? "Check Before You Go"
      : "Good to Go";

  const current: WeatherCurrent = {
    temp,
    feelsLike: temp + (humidity > 80 ? 2 : 0),
    humidity,
    wind,
    uv,
    condition,
    icon: /rain/i.test(condition) ? "🌧️" : /cloud/i.test(condition) ? "☁️" : /sun/i.test(condition) ? "☀️" : "⛅",
    advisory,
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const forecast: ForecastDay[] = [0, 1, 2].map((i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const drift = ((seed + i * 3) % 5) - 2;
    const cond =
      i === 1 && seed % 3 === 0 ? "Light Rain" : i === 2 && seed % 5 === 0 ? "Thunderstorm" : condition;
    return {
      date: `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
      high: temp + drift + 1,
      low: temp + drift - 3,
      condition: cond,
      precipChance: /rain|storm/i.test(cond) ? 60 + (seed % 30) : 10 + (seed % 20),
      icon: /storm/i.test(cond) ? "⛈️" : /rain/i.test(cond) ? "🌧️" : /cloud/i.test(cond) ? "☁️" : "☀️",
    };
  });

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
  if (forecast.some((f) => /thunder|storm/i.test(f.condition))) {
    alerts.push({
      id: "storm",
      severity: "warning",
      title: "Thunderstorm risk",
      message: "Storms possible in the forecast period.",
      action: "Postpone summit attempts; seek shelter if thunder is heard.",
    });
  }
  if (/heavy rain|storm/i.test(condition)) {
    alerts.push({
      id: "rain",
      severity: "warning",
      title: "Heavy rain",
      message: "Trails may be slippery; flash flood risk in valleys.",
      action: "Wear proper footwear; avoid river crossings.",
    });
  }

  const recommendations: { icon: string; text: string }[] = [];
  if (alerts.length) {
    recommendations.push({ icon: "⚠️", text: "Prioritise safety: review alerts before departing." });
    recommendations.push({ icon: "📱", text: "Share your plan and expected return time with someone." });
  } else {
    recommendations.push({ icon: "✅", text: "Conditions look suitable for most outdoor activities." });
  }
  if (temp >= 30) recommendations.push({ icon: "💧", text: "Bring at least 2L of water per person." });
  if (uv >= 7) recommendations.push({ icon: "🧴", text: "Use SPF 50+ and a hat — UV is high." });
  if (humidity >= 85) recommendations.push({ icon: "🐢", text: "Pace yourself; high humidity slows recovery." });
  if (wind < 15 && temp < 32) recommendations.push({ icon: "🥾", text: "Good window for hiking or trail running." });
  if (/rain/i.test(condition)) recommendations.push({ icon: "🧥", text: "Pack a light rain jacket." });

  return { current, forecast, alerts, recommendations };
}
