import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const STATES = {
  Johor: "MY-01", Kedah: "MY-02", Kelantan: "MY-03", Melaka: "MY-04",
  "Negeri Sembilan": "MY-05", Pahang: "MY-06", "Pulau Pinang": "MY-07",
  Perak: "MY-08", Perlis: "MY-09", Selangor: "MY-10", Terengganu: "MY-11",
  Sabah: "MY-12", Sarawak: "MY-13", "Kuala Lumpur": "MY-14", Labuan: "MY-15",
  Putrajaya: "MY-16",
};
const APP_CODES = {
  Johor:"JHR", Kedah:"KDH", Kelantan:"KTN", Melaka:"MLK", "Negeri Sembilan":"NSN",
  Pahang:"PHG", "Pulau Pinang":"PNG", Perak:"PRK", Perlis:"PLS", Selangor:"SLG",
  Terengganu:"TRG", Sabah:"SBH", Sarawak:"SWK", "Kuala Lumpur":"KL", Labuan:"LBN", Putrajaya:"PTJ",
};

const CATEGORIES = {
  park: ['["leisure"="park"]'],
  peak: ['["natural"="peak"]'],
  waterfall: ['["natural"="waterfall"]', '["waterway"="waterfall"]'],
  beach: ['["natural"="beach"]'],
  cave: ['["natural"="cave_entrance"]'],
  climbing_site: ['["sport"="climbing"]'],
  camp_site: ['["tourism"="camp_site"]'],
  dive_site: ['["sport"="scuba_diving"]', '["scuba_diving:divespot"="yes"]'],
  viewpoint: ['["tourism"="viewpoint"]'],
  nature_reserve: ['["leisure"="nature_reserve"]'],
  hiking_route: ['["route"="hiking"]'],
  cycling_route: ['["route"~"^(bicycle|mtb)$"]'],
  running_route: ['["route"="running"]'],
  water_sports: ['["sport"~"^(canoe|kayak|surfing|kitesurfing|paddleboard|wakeboarding|water_ski|rowing|sailing|water_sports)$"]'],
};

const SERVERS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const OVERPASS_ATTEMPTS = 2;

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA_ENTITY_API = "https://www.wikidata.org/wiki/Special:EntityData";
const MAPILLARY_GRAPH_API = "https://graph.mapillary.com";
const PHOTO_RADIUS_METERS = 3000;
const USER_AGENT = "SeekMY-student-outdoor-importer/1.1 (educational outdoor-data project)";
const WIKIMEDIA_DELAY_MS = 1200;

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function sleep(ms) { return new Promise((resolveSleep) => setTimeout(resolveSleep, ms)); }

function activity(category) {
  if (["peak", "waterfall", "viewpoint", "hiking_route"].includes(category)) return "Hiking";
  if (category === "park") return "Jogging";
  if (category === "camp_site") return "Camping";
  if (category === "beach") return "Swimming";
  if (["cave", "climbing_site"].includes(category)) return "Rock Climbing";
  if (category === "dive_site") return "Diving";
  if (category === "cycling_route") return "Cycling";
  if (category === "running_route") return "Trail Running";
  if (category === "water_sports") return "Water Sports";
  return "Hiking";
}

function categoryFromTags(tags = {}) {
  if (tags.leisure === "park") return "park";
  if (tags.natural === "peak") return "peak";
  if (tags.natural === "waterfall" || tags.waterway === "waterfall") return "waterfall";
  if (tags.natural === "beach") return "beach";
  if (tags.natural === "cave_entrance") return "cave";
  if (tags.sport === "climbing") return "climbing_site";
  if (tags.tourism === "camp_site") return "camp_site";
  if (tags.sport === "scuba_diving" || tags["scuba_diving:divespot"] === "yes") return "dive_site";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.leisure === "nature_reserve") return "nature_reserve";
  if (tags.route === "hiking") return "hiking_route";
  if (tags.route === "bicycle" || tags.route === "mtb") return "cycling_route";
  if (tags.route === "running") return "running_route";
  if (["canoe", "kayak", "surfing", "kitesurfing", "paddleboard", "wakeboarding", "water_ski", "rowing", "sailing", "water_sports"].includes(tags.sport)) return "water_sports";
  return null;
}

function query(isoCode, filters) {
  const selections = filters.map((filter) => `nwr${filter}(area.searchArea);`).join("\n");
  return `[out:json][timeout:90][maxsize:67108864];\nrelation["ISO3166-2"="${isoCode}"]["boundary"="administrative"];\nmap_to_area->.searchArea;\n(\n${selections}\n);\nout tags center;`;
}

async function requestOverpass(body) {
  let lastError;
  for (let attempt = 1; attempt <= OVERPASS_ATTEMPTS; attempt += 1) {
    for (const server of SERVERS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 110000);
      try {
        process.stdout.write(`  Overpass attempt ${attempt}/${OVERPASS_ATTEMPTS}: ${new URL(server).hostname}\n`);
        const response = await fetch(server, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json",
            "User-Agent": USER_AGENT,
          },
          body: new URLSearchParams({ data: body }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`${server} returned ${response.status}`);
        return await response.json();
      } catch (error) {
        lastError = error;
        const reason = error?.name === "AbortError" ? "request exceeded 110 seconds" : error.message;
        process.stderr.write(`  ${reason}; trying another server...\n`);
        await sleep(2000 * attempt);
      } finally {
        clearTimeout(timeout);
      }
    }
    if (attempt < OVERPASS_ATTEMPTS) {
      process.stdout.write(`  All servers were busy; waiting before retry ${attempt + 1}...\n`);
      await sleep(10000 * attempt);
    }
  }
  throw new Error(`All public Overpass servers failed after ${OVERPASS_ATTEMPTS} attempts. Last error: ${lastError?.message || "unknown error"}`);
}

function cleanHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(file|category):/i, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GENERIC_LOCATION_WORDS = new Set([
  "air", "terjun", "waterfall", "waterfalls", "fall", "falls", "cascade", "cascades",
  "lower", "upper", "middle", "mid", "tier", "level", "mini", "big", "small",
  "the", "and", "sungai", "river", "pool", "jeram", "lata",
]);

const CATEGORY_PHOTO_WORDS = {
  park: ["park", "taman", "garden"],
  peak: ["peak", "summit", "mount", "mountain", "gunung", "bukit"],
  waterfall: ["waterfall", "waterfalls", "fall", "falls", "cascade", "cascades", "terjun", "jeram", "lata"],
  beach: ["beach", "pantai", "coast", "shore"],
  cave: ["cave", "gua", "cavern"],
  climbing_site: ["climbing", "climb", "crag", "rock"],
  camp_site: ["camp", "camping", "campsite"],
  dive_site: ["dive", "diving", "scuba", "reef", "wreck"],
  viewpoint: ["viewpoint", "view", "lookout", "panorama"],
  nature_reserve: ["reserve", "forest", "park", "taman"],
  hiking_route: ["trail", "hiking", "route", "trek"],
  cycling_route: ["cycling", "bicycle", "bike", "route", "trail"],
  running_route: ["running", "run", "trail", "route"],
  water_sports: ["canoe", "kayak", "surfing", "sailing", "rowing", "watersport"],
};

function nameSimilarity(locationName, imageTitle) {
  const wanted = new Set(normalizeName(locationName).split(" ").filter((word) => word.length > 2 && !GENERIC_LOCATION_WORDS.has(word)));
  const title = new Set(normalizeName(imageTitle).split(" ").filter((word) => word.length > 2));
  if (!wanted.size || !title.size) return 0;
  const overlap = [...wanted].filter((word) => title.has(word)).length;
  return overlap / wanted.size;
}

function isLikelyLocationPhoto(locationName, imageTitle, category) {
  const normalizedTitle = normalizeName(imageTitle);
  const titleWords = new Set(normalizedTitle.split(" "));
  const subjectMatches = (CATEGORY_PHOTO_WORDS[category] ?? [])
    .some((word) => titleWords.has(word));
  return subjectMatches && nameSimilarity(locationName, imageTitle) >= 0.75;
}

async function requestJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (response.ok) return response.json();

    lastError = new Error(`${new URL(url).hostname} returned ${response.status}`);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 4) break;
    const retryAfterSeconds = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : 3000 * attempt;
    process.stderr.write(`  ${new URL(url).hostname} busy (${response.status}); retrying in ${Math.ceil(delay / 1000)}s...\n`);
    await sleep(delay);
  }
  throw lastError;
}

async function commonsFilePage(filename) {
  if (!filename) return null;
  const title = filename.startsWith("File:") ? filename : `File:${filename}`;
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({
    action: "query", format: "json", origin: "*", titles: title,
    prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1200",
  });
  const json = await requestJson(url);
  return Object.values(json.query?.pages ?? {}).find((page) => !page.missing) ?? null;
}

async function commonsCategoryPage(category, locationName, activityCategory) {
  const title = category.startsWith("Category:") ? category : `Category:${category}`;
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({
    action: "query", format: "json", origin: "*", list: "categorymembers",
    cmtitle: title, cmnamespace: "6", cmtype: "file", cmlimit: "10",
  });
  const json = await requestJson(url);
  const members = json.query?.categorymembers ?? [];
  const best = members
    .filter((member) => isLikelyLocationPhoto(locationName, member.title, activityCategory))
    .sort((a, b) => nameSimilarity(locationName, b.title) - nameSimilarity(locationName, a.title))[0];
  return best?.title ? commonsFilePage(best.title) : null;
}

async function commonsFromWikidata(wikidataId) {
  if (!/^Q\d+$/.test(wikidataId ?? "")) return null;
  const json = await requestJson(`${WIKIDATA_ENTITY_API}/${wikidataId}.json`);
  const filename = json.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return filename ? commonsFilePage(filename) : null;
}

async function nearbyCommonsPages(lat, lng) {
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "geosearch",
    ggsprimary: "all", ggsnamespace: "6", ggsradius: String(PHOTO_RADIUS_METERS),
    ggslimit: "10", ggscoord: `${lat}|${lng}`, prop: "coordinates|imageinfo",
    iiprop: "url|extmetadata", iiurlwidth: "1200",
  });
  const json = await requestJson(url);
  return Object.values(json.query?.pages ?? {});
}

function toPhoto(page, matchMethod, confidence) {
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;
  const metadata = info.extmetadata ?? {};
  return {
    imageUrl: info.thumburl || info.url,
    originalUrl: info.url,
    sourcePageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    source: "Wikimedia Commons",
    title: page.title?.replace(/^File:/, "") || "",
    author: cleanHtml(metadata.Artist?.value || metadata.Credit?.value || "Unknown contributor"),
    license: cleanHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "See source page"),
    licenseUrl: metadata.LicenseUrl?.value || "",
    matchMethod,
    matchConfidence: confidence,
  };
}

function mapillaryImageId(value = "") {
  const raw = String(value).trim().split(";")[0].trim();
  if (/^\d+$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get("pKey") || url.searchParams.get("image_key");
    if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;
    const pathId = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    return pathId || null;
  } catch {
    return null;
  }
}

async function mapillaryPhoto(value, accessToken) {
  const imageId = mapillaryImageId(value);
  if (!imageId || !accessToken) return null;
  const url = new URL(`${MAPILLARY_GRAPH_API}/${imageId}`);
  url.search = new URLSearchParams({
    fields: "id,thumb_2048_url,captured_at,computed_geometry,creator",
    access_token: accessToken,
  });
  const image = await requestJson(url);
  if (!image?.id || !image?.thumb_2048_url) return null;
  return {
    imageUrl: image.thumb_2048_url,
    originalUrl: image.thumb_2048_url,
    sourcePageUrl: `https://www.mapillary.com/app/?pKey=${encodeURIComponent(image.id)}`,
    source: "Mapillary",
    title: "OSM-linked Mapillary image",
    author: image.creator?.username || "Mapillary contributor",
    license: "Mapillary Terms",
    licenseUrl: "https://www.mapillary.com/terms",
    capturedAt: image.captured_at || null,
    matchMethod: "osm_mapillary",
    matchConfidence: 1,
  };
}

async function findPhoto(element, name, lat, lng, category, mapillaryToken) {
  // OSM Mapillary references can point to deleted images or legacy image keys.
  // A failed Mapillary lookup must not prevent the Wikimedia fallbacks below.
  if (element.tags?.mapillary && mapillaryToken) {
    try {
      const exactMapillaryPhoto = await mapillaryPhoto(element.tags.mapillary, mapillaryToken);
      if (exactMapillaryPhoto) return exactMapillaryPhoto;
    } catch (error) {
      process.stderr.write(`  Mapillary image unavailable for ${name} (${error.message}); trying Wikimedia...\n`);
    }
  }

  const commonsTag = element.tags?.wikimedia_commons;
  if (commonsTag) {
    const page = commonsTag.startsWith("Category:")
      ? await commonsCategoryPage(commonsTag, name, category)
      : await commonsFilePage(commonsTag);
    const photo = toPhoto(page, "osm_wikimedia_commons", 1);
    if (photo) return photo;
  }

  const wikidataPage = await commonsFromWikidata(element.tags?.wikidata);
  const wikidataPhoto = toPhoto(wikidataPage, "osm_wikidata", 0.98);
  if (wikidataPhoto) return wikidataPhoto;

  const nearby = await nearbyCommonsPages(lat, lng);
  const ranked = nearby
    .filter((page) => isLikelyLocationPhoto(name, page.title, category))
    .map((page) => ({ page, similarity: nameSimilarity(name, page.title) }))
    .sort((a, b) => b.similarity - a.similarity);
  if (!ranked.length) return null;
  return toPhoto(ranked[0].page, "nearby_search", 0.85);
}

async function main() {
  const stateArg = option("state", "all");
  const categoryArg = option("category", "all");
  const includePhotos = option("photos", "true").toLowerCase() !== "false";
  const mapillaryToken = process.env.MAPILLARY_TOKEN?.trim() || "";
  const states = stateArg.toLowerCase() === "all" ? Object.keys(STATES) : [stateArg];
  const categories = categoryArg.toLowerCase() === "all" ? Object.keys(CATEGORIES) : [categoryArg];
  const categoryRuns = categoryArg.toLowerCase() === "all"
    ? [{ label: "all", filters: Object.values(CATEGORIES).flat() }]
    : [{ label: categoryArg, filters: CATEGORIES[categoryArg] }];

  for (const state of states) if (!STATES[state]) throw new Error(`Unknown state: ${state}`);
  for (const category of categories) if (!CATEGORIES[category]) throw new Error(`Unknown category: ${category}`);

  const importedAt = new Date().toISOString();
  const output = [];
  const seen = new Set();

  for (const state of states) {
    for (const run of categoryRuns) {
      process.stdout.write(`Fetching ${state}: ${run.label}...\n`);
      const json = await requestOverpass(query(STATES[state], run.filters));
      for (const element of json.elements ?? []) {
        const category = categoryArg.toLowerCase() === "all"
          ? categoryFromTags(element.tags)
          : categoryArg;
        if (!category) continue;
        const name = element.tags?.name || element.tags?.["name:en"] || element.tags?.["name:ms"];
        const lat = Number(element.lat ?? element.center?.lat);
        const lng = Number(element.lon ?? element.center?.lon);
        const sourceId = `${element.type}/${element.id}`;
        if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || seen.has(sourceId)) continue;
        seen.add(sourceId);
        let photo = null;
        if (includePhotos) {
          try {
            photo = await findPhoto(element, name, lat, lng, category, mapillaryToken);
          } catch (error) {
            process.stderr.write(`  Photo lookup failed for ${name}: ${error.message}\n`);
          }
        }
        output.push({
          name, state, stateCode: APP_CODES[state],
          address: `${name}, ${state}, Malaysia`, lat, lng,
          activity: activity(category), category,
          source: "OpenStreetMap", sourceId,
          sourceUrl: `https://www.openstreetmap.org/${sourceId}`,
          image_url: photo?.imageUrl || "",
          photo,
          photoStatus: photo
            ? (photo.matchConfidence >= 0.8 ? "suggested" : "needs_review")
            : "not_found",
          status: "pending", importedAt, lastVerifiedAt: importedAt,
        });
        if (includePhotos) await sleep(WIKIMEDIA_DELAY_MS);
      }
      await sleep(2000);
    }
  }

  await mkdir(resolve("imports"), { recursive: true });
  const slug = stateArg.toLowerCase() === "all" ? "malaysia" : stateArg.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = resolve("imports", `outdoor-${slug}.json`);
  await writeFile(filename, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  process.stdout.write(`Saved ${output.length} candidates to ${filename}\n`);
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
