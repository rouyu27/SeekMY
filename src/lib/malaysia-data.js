export const MALAYSIA_STATES = [
  { name: "Johor", code: "JHR", flag: "🏳️", color: "#FFD700", region: "Peninsular", lat: 1.9344, lng: 103.3587 },
  { name: "Kedah", code: "KDH", flag: "🏳️", color: "#FF0000", region: "Peninsular", lat: 6.1184, lng: 100.3685 },
  { name: "Kelantan", code: "KTN", flag: "🏳️", color: "#FF0000", region: "Peninsular", lat: 6.1254, lng: 102.2381 },
  { name: "Melaka", code: "MLK", flag: "🏳️", color: "#FF0000", region: "Peninsular", lat: 2.1896, lng: 102.2501 },
  { name: "Negeri Sembilan", code: "NSN", flag: "🏳️", color: "#FFD700", region: "Peninsular", lat: 2.7258, lng: 101.9424 },
  { name: "Pahang", code: "PHG", flag: "🏳️", color: "#000000", region: "Peninsular", lat: 3.8126, lng: 103.3256 },
  { name: "Perak", code: "PRK", flag: "🏳️", color: "#FFD700", region: "Peninsular", lat: 4.5921, lng: 101.0901 },
  { name: "Perlis", code: "PLS", flag: "🏳️", color: "#FFD700", region: "Peninsular", lat: 6.4449, lng: 100.1984 },
  { name: "Sabah", code: "SBH", flag: "🏳️", color: "#003087", region: "East Malaysia", lat: 5.9788, lng: 116.0753 },
  { name: "Sarawak", code: "SWK", flag: "🏳️", color: "#CC0001", region: "East Malaysia", lat: 1.5533, lng: 110.3592 },
  { name: "Selangor", code: "SGR", flag: "🏳️", color: "#FF0000", region: "Peninsular", lat: 3.0738, lng: 101.5183 },
  { name: "Terengganu", code: "TRG", flag: "🏳️", color: "#000000", region: "Peninsular", lat: 5.3117, lng: 103.1324 },
  { name: "Pulau Pinang", code: "PNG", flag: "🏳️", color: "#003087", region: "Peninsular", lat: 5.4164, lng: 100.3327 },
  { name: "Kuala Lumpur", code: "KUL", flag: "🏳️", color: "#003087", region: "Federal Territory", lat: 3.1390, lng: 101.6869 },
  { name: "Labuan", code: "LBN", flag: "🏳️", color: "#003087", region: "Federal Territory", lat: 5.2831, lng: 115.2308 },
  { name: "Putrajaya", code: "PJY", flag: "🏳️", color: "#003087", region: "Federal Territory", lat: 2.9264, lng: 101.6964 }
];

export const STATE_COLORS = {
  "Johor": { bg: "from-emerald-600 to-emerald-800", accent: "#059669", light: "bg-emerald-50" },
  "Kedah": { bg: "from-red-600 to-red-800", accent: "#DC2626", light: "bg-red-50" },
  "Kelantan": { bg: "from-red-700 to-red-900", accent: "#B91C1C", light: "bg-red-50" },
  "Melaka": { bg: "from-red-500 to-rose-700", accent: "#E11D48", light: "bg-rose-50" },
  "Negeri Sembilan": { bg: "from-yellow-600 to-yellow-800", accent: "#D97706", light: "bg-yellow-50" },
  "Pahang": { bg: "from-slate-700 to-slate-900", accent: "#334155", light: "bg-slate-50" },
  "Perak": { bg: "from-amber-500 to-amber-700", accent: "#B45309", light: "bg-amber-50" },
  "Perlis": { bg: "from-amber-600 to-yellow-700", accent: "#D97706", light: "bg-amber-50" },
  "Sabah": { bg: "from-blue-700 to-blue-900", accent: "#1D4ED8", light: "bg-blue-50" },
  "Sarawak": { bg: "from-red-700 to-red-900", accent: "#B91C1C", light: "bg-red-50" },
  "Selangor": { bg: "from-red-600 to-orange-700", accent: "#EA580C", light: "bg-orange-50" },
  "Terengganu": { bg: "from-gray-800 to-gray-900", accent: "#1F2937", light: "bg-gray-50" },
  "Pulau Pinang": { bg: "from-blue-600 to-indigo-800", accent: "#4338CA", light: "bg-indigo-50" },
  "Kuala Lumpur": { bg: "from-blue-700 to-blue-900", accent: "#1E40AF", light: "bg-blue-50" },
  "Labuan": { bg: "from-blue-500 to-blue-700", accent: "#2563EB", light: "bg-blue-50" },
  "Putrajaya": { bg: "from-teal-600 to-teal-800", accent: "#0D9488", light: "bg-teal-50" }
};

export const ACTIVITY_TYPES = [
  { name: "Hiking", icon: "🥾", color: "bg-green-100 text-green-800 border-green-200" },
  { name: "Trail Running", icon: "🏃", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Jogging", icon: "👟", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { name: "Cycling", icon: "🚴", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Swimming", icon: "🏊", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { name: "Diving", icon: "🤿", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { name: "Rock Climbing", icon: "🧗", color: "bg-red-100 text-red-800 border-red-200" },
  { name: "Water Sports", icon: "🏄", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { name: "Camping", icon: "⛺", color: "bg-amber-100 text-amber-800 border-amber-200" }
];

export const DIFFICULTY_COLORS = {
  "Beginner": "bg-green-100 text-green-700 border-green-200",
  "Intermediate": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Advanced": "bg-red-100 text-red-700 border-red-200"
};

export const BADGES_DEFINITION = [
  { key: "first_step", name: "First Step", description: "Logged your first activity", icon: "👣", color: "from-green-400 to-green-600", condition: (stats) => stats.totalActivities >= 1 },
  { key: "trail_blazer", name: "Trail Blazer", description: "Logged 5 activities", icon: "🔥", color: "from-orange-400 to-red-500", condition: (stats) => stats.totalActivities >= 5 },
  { key: "explorer", name: "Explorer", description: "Logged 10 activities", icon: "🧭", color: "from-blue-400 to-blue-600", condition: (stats) => stats.totalActivities >= 10 },
  { key: "km_10", name: "10KM Club", description: "Covered 10km total", icon: "📏", color: "from-purple-400 to-purple-600", condition: (stats) => stats.totalKm >= 10 },
  { key: "km_50", name: "Half Century", description: "Covered 50km total", icon: "🌟", color: "from-yellow-400 to-amber-500", condition: (stats) => stats.totalKm >= 50 },
  { key: "km_100", name: "Century Rider", description: "Covered 100km total", icon: "💯", color: "from-red-500 to-rose-600", condition: (stats) => stats.totalKm >= 100 },
  { key: "state_explorer_3", name: "State Hopper", description: "Visited 3 different states", icon: "🗺️", color: "from-teal-400 to-teal-600", condition: (stats) => stats.statesExplored >= 3 },
  { key: "state_explorer_5", name: "Malaysia Explorer", description: "Visited 5 different states", icon: "🇲🇾", color: "from-blue-500 to-indigo-600", condition: (stats) => stats.statesExplored >= 5 },
  { key: "hiker", name: "Mountain Soul", description: "Logged 3 hiking activities", icon: "⛰️", color: "from-stone-400 to-stone-600", condition: (stats) => (stats.byActivity?.Hiking || 0) >= 3 },
  { key: "diver", name: "Deep Diver", description: "Logged a diving activity", icon: "🤿", color: "from-cyan-500 to-blue-600", condition: (stats) => (stats.byActivity?.Diving || 0) >= 1 }
];
