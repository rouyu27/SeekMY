// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
export type Page = "home"|"explore"|"location"|"ai"|"leaderboard"|"log"|"bookmarks"|"account"|"admin"|"map"|"contributor"|"suggest"|"insights"|"help";

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password: string;
  photoUrl?: string;
  bio: string;
  joinDate: string;
  totalKm: number;
  states: number;
  checkins: number;
  role: "user"|"admin";
  status?: "active"|"suspended"|"review_restricted";
}

export interface ActivitySpecific {
  certification?: string;
  visibility?: string;
  entryType?: string;
  marineLife?: string;
  maxDepth?: string;
}

export interface Contributor {
  id: string;
  name: string;
  role: string;
  area: string;
  verified: boolean;
}

export interface Location {
  id: number | string;
  name: string;
  address?: string;
  /** WGS84 coordinates. Required for imported/published locations. */
  lat?: number;
  lng?: number;
  /** Accepted while older/imported datasets are migrated to lat/lng. */
  latitude?: number;
  longitude?: number;
  source?: "OpenStreetMap" | "Community" | "Admin" | string;
  sourceId?: string;
  sourceUrl?: string;
  officialUrl?: string;
  image_url?: string;
  image_urls?: string[];
  estimatedPrice?: number;
  estimatedPriceRange?: string;
  photoAttribution?: string;
  photo?: {
    imageUrl: string;
    originalUrl?: string;
    sourcePageUrl: string;
    source: string;
    title?: string;
    author: string;
    license: string;
    licenseUrl?: string;
    matchMethod: string;
    matchConfidence: number;
  } | null;
  state: string;
  stateCode: string;
  activity: string;
  difficulty: "Easy"|"Moderate"|"Hard";
  distance: string;
  duration: string;
  openingHours?: string;
  rating: number;
  reviews: number;
  badge: string;
  color: string;
  emoji: string;
  description: string;
  facilities: string[];
  bestMonths: string;
  accessibility: string;
  tags: string[];
  budget: "Free"|"Low"|"Medium"|"High";
  activitySpecific?: ActivitySpecific;
  contributors?: Contributor[];
  status?: "active" | "unavailable" | "deleted" | string;
}

export interface ActivityLog {
  id: number | string;
  locationId?: number | string;
  userId?: string;
  userName?: string;
  created_by_id?: string;
  created_by?: string;
  location: string;
  activity: string;
  is_hidden_gem?: boolean;
  isHiddenGem?: boolean;
  distance: number;
  duration: string;
  date: string;
  notes: string;
  comment?: string;
  photoUrl?: string;
  state: string;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedAt?: string;
}

export interface BadgeDef {
  id: string;
  icon: string;
  image: string;
  name: string;
  desc: string;
  requirement: number;
  metric: "activities" | "hikes" | "dives" | "states" | "km" | "gems" | "reviews" | "cycleKm" | "camps";
}

export interface BadgeStatus extends BadgeDef {
  progress: number;
  earned: boolean;
  justEarned?: boolean;
}

export interface BookmarkEntry {
  firestoreId?: string;
  duplicateFirestoreIds?: string[];
  locationId: number | string;
  notes: string;
  folderIds?: string[];
  folder: string;
  folders?: string[];
  sharedFolderId?: string | null;
  savedAt: string;
}

export interface PersonalBookmarkFolder {
  id: string;
  ownerUid: string;
  name: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedBookmarkLocation {
  id: number | string;
  name: string;
  address?: string;
  state: string;
  activity: string;
  difficulty?: string;
  emoji?: string;
  imageUrl?: string;
  addedByMe?: boolean;
  canRemove?: boolean;
}

export interface SharedBookmarkFolder {
  id: string;
  personalFolderId?: string | null;
  name: string;
  sharingEnabled: boolean;
  memberCount: number;
  viewerRole: "owner" | "member" | null;
  locations: SharedBookmarkLocation[];
}

export interface SharedBookmarkMember {
  id: string;
  display_name: string;
  role: "owner" | "member";
  joined_at: string;
}
