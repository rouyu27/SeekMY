// MAIN / TEAM SHARED FOUNDATION
// GitHub target: main
// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
export type Page = "home"|"explore"|"location"|"ai"|"leaderboard"|"log"|"bookmarks"|"account"|"admin"|"map"|"contributor"|"suggest"|"insights"|"help";

//==================== WilsonChoongWeiShan Part - Account/User Types ====================
export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password: string;
  bio: string;
  joinDate: string;
  totalKm: number;
  states: number;
  checkins: number;
  role: "user"|"admin";
  status?: "active"|"suspended"|"review_restricted";
}

//==================== WilsonChoongWeiShan END - Account/User Types ====================
//==================== LimRouYu Part - Location Detail Types ====================
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
  state: string;
  stateCode: string;
  activity: string;
  difficulty: "Easy"|"Moderate"|"Hard";
  distance: string;
  duration: string;
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
}

//==================== LimRouYu END - Location Detail Types ====================
//==================== FongXinTong Part - Activity Log Types ====================
export interface ActivityLog {
  id: number | string;
  locationId?: number | string;
  location: string;
  activity: string;
  distance: number;
  duration: string;
  date: string;
  notes: string;
  comment?: string;
  photoUrl?: string;
  state: string;
  // Admin-review workflow: a log doesn't count toward stats/leaderboard until approved.
  status?: "pending" | "approved" | "rejected";
  verifiedDistanceKm?: number;
  verifiedAccuracyM?: number | null;
  rejectionReason?: string;
  created_by?: string;
  created_by_id?: string;
}

//==================== FongXinTong END - Activity Log Types ====================
//==================== LowJunFeng Part - Badge Types ====================
export interface BadgeDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  requirement: number;
  metric: "hikes" | "dives" | "states" | "km" | "gems" | "reviews" | "cycleKm" | "camps";
}

export interface BadgeStatus extends BadgeDef {
  progress: number;
  earned: boolean;
  justEarned?: boolean;
}

//==================== LowJunFeng END - Badge Types ====================
//==================== LimTzeXin Part - Bookmark Types ====================
export interface BookmarkEntry {
  firestoreId?: string;
  locationId: number | string;
  notes: string;
  folder: string;
  savedAt: string;
}
//==================== LimTzeXin END - Bookmark Types ====================
