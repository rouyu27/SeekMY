// Official MET Malaysia data published through Malaysia's Open API.
// No API key is required: https://developer.data.gov.my/realtime-api/weather

export interface MetForecast {
  location: {
    location_id: string;
    location_name: string;
  };
  date: string;
  morning_forecast: string;
  afternoon_forecast: string;
  night_forecast: string;
  summary_forecast: string;
  summary_when: string;
  min_temp: number;
  max_temp: number;
}

export interface MetWarning {
  warning_issue?: {
    issued?: string;
    title_bm?: string;
    title_en?: string;
  };
  valid_from?: string;
  valid_to?: string;
  heading_en?: string;
  text_en?: string;
  instruction_en?: string;
  heading_bm?: string;
  text_bm?: string;
  instruction_bm?: string;
}

const MET_API = "https://api.data.gov.my/weather";

async function getJson(path: string) {
  const response = await fetch(`${MET_API}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`MET Malaysia request failed (${response.status}).`);
  }
  return response.json();
}

export async function fetchMetStateForecast(state: string): Promise<MetForecast[]> {
  const params = new URLSearchParams({
    contains: `${state}@location__location_name`,
    limit: "20",
  });
  const rows = await getJson(`/forecast?${params}`);
  if (!Array.isArray(rows)) throw new Error("Unexpected MET Malaysia forecast response.");

  return rows
    .filter((row): row is MetForecast =>
      row?.location?.location_name?.localeCompare(state, undefined, { sensitivity: "accent" }) === 0
    )
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 7);
}

export async function fetchMetWarnings(state: string): Promise<MetWarning[]> {
  const rows = await getJson("/warning?limit=50");
  if (!Array.isArray(rows)) throw new Error("Unexpected MET Malaysia warning response.");

  const now = Date.now();
  const stateName = state.toLowerCase();
  return rows.filter((warning: MetWarning) => {
    const expires = warning.valid_to ? new Date(warning.valid_to).getTime() : Number.POSITIVE_INFINITY;
    const text = [warning.heading_en, warning.text_en, warning.heading_bm, warning.text_bm]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return expires >= now && text.includes(stateName);
  });
}
