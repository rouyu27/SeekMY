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
