export type Page = "home"|"explore"|"location"|"ai"|"leaderboard"|"log"|"bookmarks"|"account"|"admin"|"map"|"contributor"|"suggest";

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
  id: number;
  name: string;
  state: string;
  stateCode: string;
  activity: string;
  difficulty: "Easy"|"Moderate"|"Hard";
  distance: string;
  duration: string;
  rating: number;
  reviews: number;
  badge: string;
  weather: string;
  temp: number;
  humidity: number;
  wind: number;
  color: string;
  emoji: string;
  description: string;
  facilities: string[];
  bestMonths: string;
  accessibility: string;
  tags: string[];
  budget: "Free"|"Low"|"Medium"|"High";
  lat?: number;
  lng?: number;
  activitySpecific?: ActivitySpecific;
  contributors?: Contributor[];
}

export interface ActivityLog {
  id: number;
  location: string;
  activity: string;
  distance: number;
  duration: string;
  date: string;
  notes: string;
  state: string;
}

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
