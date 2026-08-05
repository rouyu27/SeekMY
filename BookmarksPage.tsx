/** Reviews + flags (localStorage demo stand-in for Firestore) */

export type ReviewStatus = "approved" | "pending" | "flagged" | "rejected";

export interface StoredReview {
  id: string;
  locationId: number;
  locationName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  status: ReviewStatus;
  flagReason?: string;
  flaggedBy?: string[];
}

const KEY = "seekmy_reviews";

export function loadReviews(): StoredReview[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredReview[];
  } catch {
    return [];
  }
}

export function saveReviews(list: StoredReview[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
