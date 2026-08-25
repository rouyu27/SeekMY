//==================== LowJunFeng Part - Badge Achievement System ====================
import type { ActivityLog, BadgeDef, BadgeStatus } from "./types";

/** Asset helper to resolve badge image URLs cleanly */
const getBadgeImage = (filename: string) =>
  new URL(`../../assets/badges/${filename}`, import.meta.url).toString();

export const BADGE_DEFS: BadgeDef[] = [
  { id: "first-footstep", icon: "🥾", image: getBadgeImage("first-footstep.png"), name: "First Footstep", desc: "Log your first outdoor activity", requirement: 1, metric: "activities" },
  { id: "state-explorer", icon: "🧭", image: getBadgeImage("state-explorer.png"), name: "State Explorer", desc: "Visit 3 different Malaysian states", requirement: 3, metric: "states" },
  { id: "malaysia-wanderer", icon: "🗺️", image: getBadgeImage("malaysia-wanderer.png"), name: "Malaysia Wanderer", desc: "Visit 5 different Malaysian states", requirement: 5, metric: "states" },
  { id: "hidden-gem-hunter", icon: "💎", image: getBadgeImage("hidden-gem-hunter.png"), name: "Hidden Gem Hunter", desc: "Visit 3 hidden-gem locations", requirement: 3, metric: "gems" },
  { id: "first-contribution", icon: "✍️", image: getBadgeImage("first-contribution.png"), name: "First Contribution", desc: "Write your first community review", requirement: 1, metric: "reviews" },
  { id: "local-storyteller", icon: "📖", image: getBadgeImage("local-storyteller.png"), name: "Local Storyteller", desc: "Write 3 community reviews", requirement: 3, metric: "reviews" },
  { id: "trusted-contributor", icon: "✅", image: getBadgeImage("trusted-contributor.png"), name: "Trusted Contributor", desc: "Write 5 community reviews", requirement: 5, metric: "reviews" },
  { id: "community-favourite", icon: "⭐", image: getBadgeImage("community-favourite.png"), name: "Community Favourite", desc: "Write 10 community reviews", requirement: 10, metric: "reviews" },
  { id: "malaysia-insider", icon: "🏆", image: getBadgeImage("malaysia-insider.png"), name: "Malaysia Insider", desc: "Log 100 km of outdoor activities", requirement: 100, metric: "km" },
];

const GEM_NAMES = new Set([
  "Fairy Cave & Wind Cave",
  "Tasik Cermin",
  "Gunung Stong Waterfall",
  "Gunung Stong Waterfall Camp",
  "Mulu Caves Trekking",
]);

/** Evaluates user activity logs against badge definitions to calculate progress and unlock status */
export function evaluateBadges(
  logs: ActivityLog[],
  reviewCount = 0,
  previouslyEarned: string[] = []
): BadgeStatus[] {
  // Aggregate user statistics
  const totalKm = logs.reduce((sum, log) => sum + (log.distance || 0), 0);
  const states = new Set(logs.map((log) => log.state).filter(Boolean)).size;
  const activities = logs.length;

  // Filter activity categories
  const hikes = logs.filter((log) => /hike/i.test(log.activity)).length;
  const dives = logs.filter((log) => /div/i.test(log.activity)).length;
  const camps = logs.filter((log) => /camp/i.test(log.activity)).length;
  const cycleKm = logs
    .filter((log) => /cycl/i.test(log.activity))
    .reduce((sum, log) => sum + (log.distance || 0), 0);
  const gems = logs.filter((log) => GEM_NAMES.has(log.location)).length;

  const metrics: Record<BadgeDef["metric"], number> = {
    activities,
    hikes,
    dives,
    states,
    km: totalKm,
    gems,
    reviews: reviewCount,
    cycleKm,
    camps,
  };

  return BADGE_DEFS.map((badge) => {
    const calculatedProgress = Math.min(metrics[badge.metric], badge.requirement);
    const storedEarned = previouslyEarned.includes(badge.id);
    const progress = storedEarned ? badge.requirement : calculatedProgress;
    const earned = progress >= badge.requirement;
    const justEarned = earned && !storedEarned;

    return { ...badge, progress, earned, justEarned };
  });
}

/** Handles native Web Share API sharing with image attachments, falling back to clipboard copying */
export async function shareBadge(badge: BadgeStatus): Promise<void> {
  const text = `I earned the "${badge.name}" badge on SeekMY! ${badge.icon}\n${badge.desc}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      if (badge.image && navigator.canShare) {
        const response = await fetch(badge.image);
        const blob = await response.blob();
        const file = new File([blob], `${badge.id}.png`, { type: blob.type || "image/png" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: "SeekMY Badge", text, files: [file] });
          return;
        }
      }

      await navigator.share({ title: "SeekMY Badge", text });
      return;
    } catch {
      /* User cancelled or share failed silently */
    }
  }

  // Fallback for browsers without Web Share support
  try {
    await navigator.clipboard.writeText(text);
    alert("Badge text copied — paste it anywhere to share!");
  } catch {
    alert(text);
  }
}
//==================== LowJunFeng END - Badge Achievement System ====================