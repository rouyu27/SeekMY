import { C } from "./tokens";
import type { Location } from "./types";

type SeedLocation = Pick<Location, "name" | "state" | "stateCode" | "lat" | "lng" | "activity" | "difficulty" | "tags" | "budget"> & {
  category: string;
  facilities?: string[];
  openingHours?: string;
  sourceUrl?: string;
  officialUrl?: string;
};

const freePhotos: Record<string, NonNullable<Location["photo"]>> = {
  "Kinabalu Park Trail": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Mount%20Kinabalu%20from%20Kinabalu%20Park.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Mount_Kinabalu_from_Kinabalu_Park.jpg",
    source: "Wikimedia Commons",
    title: "Mount Kinabalu from Kinabalu Park",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.92,
  },
  "Bako National Park Trail": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Bako%20National%20Park%2C%20Sarawak%2C%20Malaysia.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Bako_National_Park,_Sarawak,_Malaysia.jpg",
    source: "Wikimedia Commons",
    title: "Bako National Park, Sarawak, Malaysia",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.9,
  },
  "KLCC Park": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/KLCC%20Park%20Kuala%20Lumpur.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:KLCC_Park_Kuala_Lumpur.jpg",
    source: "Wikimedia Commons",
    title: "KLCC Park Kuala Lumpur",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.9,
  },
  "Taman Negara Kuala Tahan": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Taman%20Negara%20Kuala%20Tahan.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Taman_Negara_Kuala_Tahan.jpg",
    source: "Wikimedia Commons",
    title: "Taman Negara Kuala Tahan",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.86,
  },
  "Gua Tempurung": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Gua%20Tempurung.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Gua_Tempurung.jpg",
    source: "Wikimedia Commons",
    title: "Gua Tempurung",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.86,
  },
  "Penang Hill Heritage Trail": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Penang%20Hill%20view.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Penang_Hill_view.jpg",
    source: "Wikimedia Commons",
    title: "Penang Hill view",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.82,
  },
  "Batu Caves Climbing Area": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Batu%20Caves%20outside%202008.jpg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Batu_Caves_outside_2008.jpg",
    source: "Wikimedia Commons",
    title: "Batu Caves outside",
    author: "Wikimedia Commons contributor",
    license: "Free licence, verify on source page",
    matchMethod: "wikimedia_commons",
    matchConfidence: 0.8,
  },
};

const seeds: SeedLocation[] = [
  { name: "Gunung Pulai", state: "Johor", stateCode: "JHR", lat: 1.6016216, lng: 103.5462487, activity: "Hiking", difficulty: "Moderate", category: "Peak", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "Kota Tinggi Waterfalls", state: "Johor", stateCode: "JHR", lat: 1.830415, lng: 103.8322397, activity: "Hiking", difficulty: "Easy", category: "Waterfall", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "Pantai Desaru", state: "Johor", stateCode: "JHR", lat: 1.5505566, lng: 104.2655533, activity: "Swimming", difficulty: "Easy", category: "Beach", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "Tanjung Balau", state: "Johor", stateCode: "JHR", lat: 1.6166443, lng: 104.2571398, activity: "Camping", difficulty: "Easy", category: "Campsite", budget: "Medium", tags: ["Family Friendly"] },
  { name: "Scuba Club Langkawi", state: "Kedah", stateCode: "KDH", lat: 6.2777477, lng: 99.7341414, activity: "Diving", difficulty: "Moderate", category: "Dive site", budget: "High", tags: ["Advanced"] },
  { name: "Kompleks Sukan Perahu Layar Kebangsaan", state: "Kedah", stateCode: "KDH", lat: 6.302792, lng: 99.8512958, activity: "Water Sports", difficulty: "Easy", category: "Water sports centre", budget: "Medium", tags: ["Beginner", "Family Friendly"] },
  { name: "Gua Kerbang", state: "Kedah", stateCode: "KDH", lat: 6.389637, lng: 100.3152631, activity: "Rock Climbing", difficulty: "Moderate", category: "Cave", budget: "Low", tags: ["Advanced"] },
  { name: "Gunung Stong Waterfall", state: "Kelantan", stateCode: "KTN", lat: 5.342, lng: 101.9808, activity: "Hiking", difficulty: "Hard", category: "Waterfall", budget: "Medium", tags: ["Advanced"] },
  { name: "PAMPA Rock Climbing", state: "Melaka", stateCode: "MLK", lat: 2.2317, lng: 102.2463, activity: "Rock Climbing", difficulty: "Easy", category: "Climbing gym", budget: "Medium", tags: ["Beginner", "Family Friendly"] },
  { name: "Taman Rekreasi Ayer Keroh", state: "Melaka", stateCode: "MLK", lat: 2.2762, lng: 102.2988, activity: "Jogging", difficulty: "Easy", category: "Park", budget: "Low", tags: ["Beginner", "Family Friendly", "Pet Friendly"] },
  { name: "Gunung Datuk", state: "Negeri Sembilan", stateCode: "NSN", lat: 2.5435, lng: 102.1699, activity: "Hiking", difficulty: "Hard", category: "Peak", budget: "Low", tags: ["Advanced"] },
  { name: "Jeram Toi", state: "Negeri Sembilan", stateCode: "NSN", lat: 2.8904, lng: 102.0763, activity: "Swimming", difficulty: "Easy", category: "Waterfall", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "B&J Diving Centre", state: "Pahang", stateCode: "PHG", lat: 2.8445464, lng: 104.1593501, activity: "Diving", difficulty: "Moderate", category: "Dive centre", budget: "High", tags: ["Advanced"] },
  { name: "Dive Tioman", state: "Pahang", stateCode: "PHG", lat: 2.8381284, lng: 104.1601302, activity: "Diving", difficulty: "Moderate", category: "Dive centre", budget: "High", tags: ["Advanced"] },
  { name: "Gunung Brinchang", state: "Pahang", stateCode: "PHG", lat: 4.516, lng: 101.381, activity: "Hiking", difficulty: "Moderate", category: "Peak", budget: "Low", tags: ["Beginner"] },
  { name: "Taman Negara Kuala Tahan", state: "Pahang", stateCode: "PHG", lat: 4.3823, lng: 102.4013, activity: "Camping", difficulty: "Moderate", category: "National park", budget: "Medium", tags: ["Family Friendly"] },
  { name: "Eastern Coastal Route", state: "Pulau Pinang", stateCode: "PNG", lat: 5.3536296, lng: 100.3131013, activity: "Cycling", difficulty: "Easy", category: "Cycling route", budget: "Free", tags: ["Beginner", "Family Friendly"] },
  { name: "Northern Coastal Route", state: "Pulau Pinang", stateCode: "PNG", lat: 5.4373072, lng: 100.3169743, activity: "Cycling", difficulty: "Easy", category: "Cycling route", budget: "Free", tags: ["Beginner"] },
  { name: "Penang Hill Heritage Trail", state: "Pulau Pinang", stateCode: "PNG", lat: 5.4246, lng: 100.2696, activity: "Hiking", difficulty: "Moderate", category: "Trail", budget: "Low", tags: ["Family Friendly"] },
  { name: "Gua Tempurung", state: "Perak", stateCode: "PRK", lat: 4.4166, lng: 101.1875, activity: "Rock Climbing", difficulty: "Moderate", category: "Cave", budget: "Medium", tags: ["Beginner", "Family Friendly"] },
  { name: "Bukit Ulu Sepetang", state: "Perak", stateCode: "PRK", lat: 4.9007, lng: 100.687, activity: "Hiking", difficulty: "Moderate", category: "Hill", budget: "Low", tags: ["Beginner"] },
  { name: "Kuala Sepetang Mangrove Trail", state: "Perak", stateCode: "PRK", lat: 4.8379, lng: 100.6327, activity: "Jogging", difficulty: "Easy", category: "Mangrove trail", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "Gua Kelam", state: "Perlis", stateCode: "PLS", lat: 6.644, lng: 100.204, activity: "Rock Climbing", difficulty: "Easy", category: "Cave", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "Bukit Keteri", state: "Perlis", stateCode: "PLS", lat: 6.486, lng: 100.211, activity: "Rock Climbing", difficulty: "Hard", category: "Limestone crag", budget: "Low", tags: ["Advanced"] },
  { name: "FlowRider 1 Utama", state: "Selangor", stateCode: "SLG", lat: 3.1493049, lng: 101.617016, activity: "Water Sports", difficulty: "Easy", category: "Surf simulator", budget: "High", tags: ["Beginner", "Family Friendly"] },
  { name: "Kanching Eco Forest Park", state: "Selangor", stateCode: "SLG", lat: 3.2992, lng: 101.6256, activity: "Hiking", difficulty: "Easy", category: "Waterfall park", budget: "Low", tags: ["Beginner", "Family Friendly"], openingHours: "Daily, 8:00 AM - 5:00 PM", officialUrl: "https://selangor.travel/listing/kanching-eco-forest-park/" },
  { name: "Batu Caves Climbing Area", state: "Selangor", stateCode: "SLG", lat: 3.2379, lng: 101.684, activity: "Rock Climbing", difficulty: "Hard", category: "Limestone crag", budget: "Low", tags: ["Advanced"] },
  { name: "Turtle Bay Divers", state: "Terengganu", stateCode: "TRG", lat: 5.9188107, lng: 102.7218206, activity: "Diving", difficulty: "Moderate", category: "Dive centre", budget: "High", tags: ["Advanced"] },
  { name: "Pantai Batu Buruk", state: "Terengganu", stateCode: "TRG", lat: 5.3262, lng: 103.1485, activity: "Swimming", difficulty: "Easy", category: "Beach", budget: "Free", tags: ["Beginner", "Family Friendly", "Pet Friendly"] },
  { name: "Kinabalu Park Trail", state: "Sabah", stateCode: "SBH", lat: 6.0753, lng: 116.5588, activity: "Hiking", difficulty: "Hard", category: "Mountain trail", budget: "High", tags: ["Advanced"], openingHours: "Daily, 8:00 AM - 5:00 PM", officialUrl: "https://sabahparks.org.my/index.php/kinabalu-park" },
  { name: "Tunku Abdul Rahman Marine Park", state: "Sabah", stateCode: "SBH", lat: 5.995, lng: 116.018, activity: "Diving", difficulty: "Easy", category: "Marine park", budget: "Medium", tags: ["Beginner", "Family Friendly"], officialUrl: "https://sabahparks.org.my/" },
  { name: "Bako National Park Trail", state: "Sarawak", stateCode: "SWK", lat: 1.7167, lng: 110.4667, activity: "Hiking", difficulty: "Moderate", category: "National park", budget: "Medium", tags: ["Family Friendly"], openingHours: "Daily, 8:00 AM - 5:00 PM", officialUrl: "https://www.sarawaktourism.com/web/things-to-do/thing-view/nature/national-parks-wildlife-reserves/bako-national-park" },
  { name: "Fairy Cave", state: "Sarawak", stateCode: "SWK", lat: 1.3819, lng: 110.1187, activity: "Rock Climbing", difficulty: "Moderate", category: "Cave", budget: "Low", tags: ["Beginner", "Family Friendly"] },
  { name: "KLCC Park", state: "Kuala Lumpur", stateCode: "KL", lat: 3.1556, lng: 101.7138, activity: "Jogging", difficulty: "Easy", category: "Park", budget: "Free", tags: ["Beginner", "Family Friendly"], openingHours: "Daily, 10:00 AM - 10:00 PM", officialUrl: "https://www.suriaklcc.com.my/attractions/klcc-park/" },
  { name: "Mid Valley - Dataran Merdeka Bike Lane", state: "Kuala Lumpur", stateCode: "KL", lat: 3.1329237, lng: 101.6865853, activity: "Cycling", difficulty: "Easy", category: "Bike lane", budget: "Free", tags: ["Beginner"] },
  { name: "Labuan Botanical Garden", state: "Labuan", stateCode: "LBN", lat: 5.2814, lng: 115.2417, activity: "Jogging", difficulty: "Easy", category: "Park", budget: "Free", tags: ["Beginner", "Family Friendly", "Pet Friendly"] },
  { name: "Pancur Hitam Beach", state: "Labuan", stateCode: "LBN", lat: 5.336, lng: 115.201, activity: "Swimming", difficulty: "Easy", category: "Beach", budget: "Free", tags: ["Beginner", "Family Friendly"] },
  { name: "Kompleks Sukan Air Putrajaya Presint 6", state: "Putrajaya", stateCode: "PTJ", lat: 2.9036312, lng: 101.6683635, activity: "Water Sports", difficulty: "Easy", category: "Water sports centre", budget: "Medium", tags: ["Beginner", "Family Friendly"] },
  { name: "Putrajaya Lake Loop", state: "Putrajaya", stateCode: "PTJ", lat: 2.9304, lng: 101.6901, activity: "Cycling", difficulty: "Easy", category: "Lake loop", budget: "Free", tags: ["Beginner", "Family Friendly", "Pet Friendly"] },
];

const activityFacilities: Record<string, string[]> = {
  Hiking: ["Trail access", "Rest area", "Parking nearby", "Basic toilets"],
  Swimming: ["Beach access", "Public toilets", "Parking nearby", "Food stalls nearby"],
  Diving: ["Dive operator nearby", "Equipment rental", "Boat access", "Safety briefing"],
  Cycling: ["Cycling path", "Parking nearby", "Rest stops", "Scenic route"],
  Jogging: ["Walking/jogging path", "Benches", "Public toilets", "Parking nearby"],
  Camping: ["Camping area", "Public toilets", "Parking nearby", "Picnic area"],
  "Water Sports": ["Water activity operator", "Equipment rental", "Changing area", "Parking nearby"],
  "Rock Climbing": ["Climbing area", "Guide/operator nearby", "Parking nearby", "Safety briefing recommended"],
};

const categoryFacilities: Record<string, string[]> = {
  Beach: ["Beachfront", "Shower/changing area"],
  Cave: ["Cave entrance", "Guided access recommended"],
  "Climbing gym": ["Indoor climbing walls", "Rental gear", "Staff supervision"],
  "Dive centre": ["Certified instructors", "Rental gear"],
  "National park": ["Visitor centre", "Permit counter", "Marked trails"],
  Park: ["Open green space", "Family area"],
  "Waterfall park": ["Waterfall access", "Picnic area"],
  "Water sports centre": ["Activity counter", "Life jacket rental"],
};

const placeFacilities: Record<string, string[]> = {
  "KLCC Park": ["Children's playground", "Public toilets", "Water fountain area", "Suria KLCC access"],
  "Putrajaya Lake Loop": ["Lake promenade", "Cycling path", "Parking nearby", "Public toilets"],
  "Kompleks Sukan Air Putrajaya Presint 6": ["Water sports centre", "Equipment rental", "Changing rooms", "Parking"],
  "FlowRider 1 Utama": ["Indoor surf facility", "Rental board", "Instructor session", "Mall facilities"],
  "Kanching Eco Forest Park": ["Waterfall access", "Picnic area", "Public toilets", "Parking"],
  "Kota Tinggi Waterfalls": ["Waterfall access", "Changing area", "Food stalls nearby", "Parking"],
  "Taman Negara Kuala Tahan": ["Visitor centre", "Permit counter", "Boat access", "Guided tours"],
  "Kinabalu Park Trail": ["Park headquarters", "Permit counter", "Guide service", "Public toilets"],
  "Bako National Park Trail": ["Park office", "Boat access", "Marked trails", "Public toilets"],
  "Tunku Abdul Rahman Marine Park": ["Jetty access", "Boat transfer", "Snorkeling/diving operator", "Public toilets"],
  "Pantai Desaru": ["Beachfront", "Public toilets", "Food stalls nearby", "Parking"],
  "Pantai Batu Buruk": ["Beachfront", "Food stalls nearby", "Public toilets", "Parking"],
  "Pancur Hitam Beach": ["Beachfront", "Picnic area", "Parking nearby", "Public toilets"],
  "Labuan Botanical Garden": ["Walking paths", "Benches", "Garden area", "Parking nearby"],
};

const categoryOpeningHours: Record<string, string> = {
  "Climbing gym": "Check operator opening hours before visiting.",
  "Dive centre": "Advance booking required. Check operator schedule before visiting.",
  "Surf simulator": "Check venue opening hours before visiting.",
  "Water sports centre": "Check activity counter operating hours before visiting.",
  "National park": "Permit or park office hours may apply. Check official hours before visiting.",
  Cave: "Guided entry or park hours may apply. Check official hours before visiting.",
  "Limestone crag": "Daylight visit recommended. Check local access rules before visiting.",
  Beach: "Daylight visit recommended. Check local safety conditions before visiting.",
};

function openingHoursFor(seed: SeedLocation) {
  return seed.openingHours || categoryOpeningHours[seed.category] || "Daylight visit recommended. Check local opening hours before visiting.";
}

function uniqueFacilities(seed: SeedLocation) {
  return [
    ...(seed.facilities || []),
    ...(placeFacilities[seed.name] || []),
    ...(categoryFacilities[seed.category] || []),
    ...(activityFacilities[seed.activity] || []),
  ].filter((facility, index, all) => all.indexOf(facility) === index);
}

export const STARTER_LOCATIONS: Location[] = seeds.map((seed, index) => ({
  id: `starter-${index + 1}`,
  name: seed.name,
  address: `${seed.name}, ${seed.state}, Malaysia`,
  lat: seed.lat,
  lng: seed.lng,
  source: "OpenStreetMap",
  sourceId: `starter-${index + 1}`,
  sourceUrl: seed.sourceUrl || seed.officialUrl || "",
  officialUrl: seed.officialUrl,
  image_url: freePhotos[seed.name]?.imageUrl || "",
  image_urls: freePhotos[seed.name]?.imageUrl ? [freePhotos[seed.name]!.imageUrl] : [],
  photo: freePhotos[seed.name] || null,
  photoAttribution: freePhotos[seed.name] ? `${freePhotos[seed.name]!.source} — ${freePhotos[seed.name]!.license}` : "",
  state: seed.state,
  stateCode: seed.stateCode,
  activity: seed.activity,
  difficulty: seed.difficulty,
  distance: "N/A",
  duration: "N/A",
  openingHours: openingHoursFor(seed),
  rating: 0,
  reviews: 0,
  badge: seed.category,
  color: C.forest,
  emoji: seed.activity === "Diving" ? "🤿" : seed.activity === "Cycling" ? "🚴" : seed.activity === "Swimming" ? "🏊" : seed.activity === "Rock Climbing" ? "🧗" : seed.activity === "Water Sports" ? "🚣" : seed.activity === "Camping" ? "⛺" : "📍",
  description: `${seed.name} is a real Malaysia outdoor location for ${seed.activity.toLowerCase()} in ${seed.state}.`,
  facilities: uniqueFacilities(seed),
  bestMonths: "Year-round",
  accessibility: "Check local conditions before visiting.",
  tags: seed.tags,
  budget: seed.budget,
}));

export function mergeLocations(primary: Location[], extras: Location[]) {
  const extraByPlace = new Map(extras.map((location) => [`${location.name}|${location.state}`.toLowerCase(), location]));
  const enrichedPrimary = primary.map((location) => {
    const extra = extraByPlace.get(`${location.name}|${location.state}`.toLowerCase());
    if (!extra || location.image_url) return location;
    return {
      ...location,
      image_url: extra.image_url || location.image_url,
      image_urls: extra.image_urls?.length ? extra.image_urls : location.image_urls,
      photo: extra.photo || location.photo,
      photoAttribution: extra.photoAttribution || location.photoAttribution,
    };
  });
  const seen = new Set(enrichedPrimary.map((location) => `${location.name}|${location.state}`.toLowerCase()));
  return [
    ...enrichedPrimary,
    ...extras.filter((location) => !seen.has(`${location.name}|${location.state}`.toLowerCase())),
  ];
}
