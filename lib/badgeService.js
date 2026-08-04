import { db } from "./firebaseConfig"; // your existing Firebase init file
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { BADGES } from "./badgeConfig";

// 1. Calculate a user's current stats from their activity logs.
//    Assumes activity logs are stored at: users/{userId}/activityLogs/{logId}
//    Each log doc looks like: { activityType, distanceKm, state, date }
export async function getUserStats(userId) {
  const logsRef = collection(db, "users", userId, "activityLogs");
  const snapshot = await getDocs(logsRef);

  let activityCount = 0;
  let totalDistance = 0;
  const statesSet = new Set();
  const activityTypeCounts = {};

  snapshot.forEach((docSnap) => {
    const log = docSnap.data();
    activityCount += 1;
    totalDistance += log.distanceKm || 0;
    if (log.state) statesSet.add(log.state);
    if (log.activityType) {
      activityTypeCounts[log.activityType] =
        (activityTypeCounts[log.activityType] || 0) + 1;
    }
  });

  return {
    activityCount,
    totalDistance,
    statesExplored: statesSet.size,
    activityTypeCounts,
  };
}

// 2. Check which badges the user already has (stored at users/{userId}, field "badges")
async function getEarnedBadgeIds(userId) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists() && userDoc.data().badges) {
    return userDoc.data().badges; // array of badge ids
  }
  return [];
}

// 3. Compare stats against each badge's criteria
function meetsRequirement(badge, stats) {
  switch (badge.type) {
    case "activityCount":
      return stats.activityCount >= badge.target;
    case "totalDistance":
      return stats.totalDistance >= badge.target;
    case "statesExplored":
      return stats.statesExplored >= badge.target;
    case "activityTypeCount":
      return (stats.activityTypeCounts[badge.activityType] || 0) >= badge.target;
    default:
      return false;
  }
}

// 4. Main function: run this after any activity log is added.
//    Returns an array of newly earned badges (so you can show a popup/toast).
export async function checkAndAwardBadges(userId) {
  const stats = await getUserStats(userId);
  const earnedIds = await getEarnedBadgeIds(userId);

  const newlyEarned = [];

  for (const badge of BADGES) {
    const alreadyEarned = earnedIds.includes(badge.id);
    if (!alreadyEarned && meetsRequirement(badge, stats)) {
      newlyEarned.push(badge);
      earnedIds.push(badge.id);
    }
  }

  // Save updated badge list back to Firestore if anything new was earned
  if (newlyEarned.length > 0) {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { badges: earnedIds }, { merge: true });
  }

  return newlyEarned;
}