/** localStorage stand-in for Firestore: suggestions, announcements, published locations */

export type ContributorStatus = "pending" | "verified" | "rejected";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface ContributorApplication {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  phone: string;
  area: string;
  services: string;
  experience: string;
  docName: string;
  status: ContributorStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface LocationSubmission {
  id: string;
  contributorId: string;
  contributorName: string;
  name: string;
  state: string;
  activity: string;
  difficulty: string;
  description: string;
  facilities: string;
  accessibility: string;
  lat: string;
  lng: string;
  /** required photo as data URL */
  photoData?: string;
  photoName?: string;
  status: SubmissionStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt?: string;
  /** set when approved — matches Location.id in catalog */
  publishedLocationId?: number;
}

export interface UserAnnouncement {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "approved" | "rejected" | "info";
  submissionId?: string;
  read: boolean;
  createdAt: string;
}

const K_APP = "seekmy_contributor_apps";
const K_SUB = "seekmy_location_subs";
const K_ANN = "seekmy_announcements";
const K_PUB = "seekmy_published_locations";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function getApplications(): ContributorApplication[] {
  return read(K_APP, []);
}
export function saveApplications(list: ContributorApplication[]) {
  write(K_APP, list);
}
export function getSubmissions(): LocationSubmission[] {
  return read(K_SUB, []);
}
export function saveSubmissions(list: LocationSubmission[]) {
  write(K_SUB, list);
}

export function getAnnouncements(): UserAnnouncement[] {
  return read(K_ANN, []);
}
export function saveAnnouncements(list: UserAnnouncement[]) {
  write(K_ANN, list);
}
export function addAnnouncement(a: Omit<UserAnnouncement, "id" | "createdAt" | "read">) {
  const list = getAnnouncements();
  const item: UserAnnouncement = {
    ...a,
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  saveAnnouncements([item, ...list]);
  return item;
}
export function markAnnouncementRead(id: string) {
  const list = getAnnouncements().map((a) => (a.id === id ? { ...a, read: true } : a));
  saveAnnouncements(list);
}
export function markAllReadForUser(userId: string) {
  const list = getAnnouncements().map((a) =>
    a.userId === userId ? { ...a, read: true } : a
  );
  saveAnnouncements(list);
}

/** Approved locations persisted so Discover can show them */
export function getPublishedLocations(): any[] {
  return read(K_PUB, []);
}
export function savePublishedLocations(list: any[]) {
  write(K_PUB, list);
}
export function publishLocationFromSubmission(sub: LocationSubmission, nextId: number) {
  const published = getPublishedLocations();
  const stateCodeMap: Record<string, string> = {
    Selangor: "SLG", Sabah: "SBH", Sarawak: "SWK", Pahang: "PHG", Johor: "JHR",
    Perak: "PRK", Penang: "PNG", Kedah: "KDH", Kelantan: "KTN", Terengganu: "TRG",
    Melaka: "MLK", Negeri: "NSN", "Negeri Sembilan": "NSN", Perlis: "PLS",
    "Kuala Lumpur": "KL", Putrajaya: "PJY", Labuan: "LBN",
  };
  const loc = {
    id: nextId,
    name: sub.name,
    state: sub.state,
    stateCode: stateCodeMap[sub.state] || "SLG",
    activity: sub.activity,
    difficulty: (["Easy", "Moderate", "Hard"].includes(sub.difficulty)
      ? sub.difficulty
      : "Easy") as "Easy" | "Moderate" | "Hard",
    distance: "N/A",
    duration: "N/A",
    rating: 0,
    reviews: 0,
    badge: "Community",
    weather: "Partly Cloudy",
    temp: 28,
    humidity: 75,
    wind: 8,
    color: "#2d6a4f",
    emoji: "📍",
    description: sub.description,
    facilities: sub.facilities
      ? sub.facilities.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    bestMonths: "Year-round",
    accessibility: sub.accessibility || "See description",
    tags: [sub.activity, "Community suggested"],
    budget: "Free" as const,
    lat: parseFloat(sub.lat) || undefined,
    lng: parseFloat(sub.lng) || undefined,
    photoData: sub.photoData,
    suggestedBy: sub.contributorName,
  };
  savePublishedLocations([loc, ...published.filter((p) => p.id !== nextId)]);
  return loc;
}
