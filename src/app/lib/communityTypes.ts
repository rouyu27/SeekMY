// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
export type ReviewStatus = "approved" | "pending" | "flagged" | "rejected" | "removed" | "active";
export interface StoredReview {
  id: string; locationId: number|string; locationName: string; userId: string; userName: string;
  rating: number; comment: string; date: string; status: ReviewStatus; flagReason?: string; photoUrl?: string;
  flaggedBy?: string[]; created_by_id?: string; created_date?: string; updated_date?: string;
}
export type ContributorStatus = "pending" | "approved" | "verified" | "rejected";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export interface ContributorApplication {
  id: string; userId: string; userEmail: string; fullName: string; phone: string; area: string;
  contributionArea?: string; localKnowledgeExperience?: string;
  serviceDescription?: string; availability?: string; languages?: string; publicContact?: string; websiteUrl?: string;
  /** Legacy fields retained while older Firebase records are migrated. */
  services?: string; experience?: string; docName: string; docUrl?: string; status: ContributorStatus;
  rejectReason?: string; createdAt: string; created_by_id?: string; created_date?: string;
}
export interface LocationSubmission {
  id: string; contributorId: string; contributorName: string; name: string; address?: string; state: string; activity: string;
  difficulty: string; description: string; facilities: string; accessibility: string;
  lat?: number; lng?: number; locationConfirmed?: boolean; estimatedPrice?: number; estimatedPriceRange?: string; budget?: "Free"|"Low"|"Medium"|"High";
  safetyNotes?: string; bestTime?: string; contributorTip?: string; sourceUrl?: string;
  photoUrl?: string; photoUrls?: string[]; photoName?: string; status: SubmissionStatus; rejectReason?: string; createdAt: string;
  updatedAt?: string; publishedLocationId?: string|number; created_by_id?: string; created_date?: string;
}
export interface UserAnnouncement {
  id: string; userId: string; title: string; message: string; type: "approved"|"rejected"|"info"|"achievement"|"notice";
  photoUrl?: string; submissionId?: string; relatedPage?: string; read: boolean; dismissed?: boolean; createdAt: string; created_by_id?: string; created_date?: string;
}
