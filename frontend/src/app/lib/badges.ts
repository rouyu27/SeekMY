//==================== LowJunFeng Part - Badge Achievement System ====================
import type { ActivityLog, BadgeDef, BadgeStatus } from "./types";

export const BADGE_DEFS: BadgeDef[] = [
  { id: "summit", icon: "🏔️", name: "Summit Seeker", desc: "Log 5 hiking activities", requirement: 5, metric: "hikes" },
  { id: "dive", icon: "🌊", name: "Deep Explorer", desc: "Log 3 diving activities", requirement: 3, metric: "dives" },
  { id: "states", icon: "🗺️", name: "State Hopper", desc: "Visit 5 different states", requirement: 5, metric: "states" },
  { id: "km", icon: "🔥", name: "Iron Trailblazer", desc: "Log 100 km total", requirement: 100, metric: "km" },
  { id: "gems", icon: "🌿", name: "Gem Hunter", desc: "Visit 3 hidden-gem locations", requirement: 3, metric: "gems" },
  { id: "reviews", icon: "⭐", name: "Community Star", desc: "Write 10 reviews", requirement: 10, metric: "reviews" },
  { id: "cycle", icon: "🚴", name: "Wheel Warrior", desc: "Cycle 50 km total", requirement: 50, metric: "cycleKm" },
  { id: "camp", icon: "🏕️", name: "Wild Camper", desc: "Camp at 2 sites", requirement: 2, metric: "camps" },
];

const GEM_NAMES = new Set([
  "Fairy Cave & Wind Cave",
  "Tasik Cermin",
  "Gunung Stong Waterfall",
  "Gunung Stong Waterfall Camp",
  "Mulu Caves Trekking",
]);

export function evaluateBadges(
  logs: ActivityLog[],
  reviewCount = 0,
  previouslyEarned: string[] = []
): BadgeStatus[] {
  const totalKm = logs.reduce((s, l) => s + (l.distance || 0), 0);
  const states = new Set(logs.map((l) => l.state).filter(Boolean)).size;
  const hikes = logs.filter((l) => /hike/i.test(l.activity)).length;
  const dives = logs.filter((l) => /div/i.test(l.activity)).length;
  const camps = logs.filter((l) => /camp/i.test(l.activity)).length;
  const cycleKm = logs
    .filter((l) => /cycl/i.test(l.activity))
    .reduce((s, l) => s + (l.distance || 0), 0);
  const gems = logs.filter((l) => GEM_NAMES.has(l.location)).length;

  const metrics: Record<BadgeDef["metric"], number> = {
    hikes,
    dives,
    states,
    km: totalKm,
    gems,
    reviews: reviewCount,
    cycleKm,
    camps,
  };

  return BADGE_DEFS.map((b) => {
    const progress = Math.min(metrics[b.metric], b.requirement);
    const earned = progress >= b.requirement;
    const justEarned = earned && !previouslyEarned.includes(b.id);
    return { ...b, progress, earned, justEarned };
  });
}

export async function shareBadge(badge: BadgeStatus) {
  const text = `I earned the "${badge.name}" badge on SeekMY! ${badge.icon}\n${badge.desc}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "SeekMY Badge", text });
      return;
    } catch {
      /* cancelled */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Badge text copied — paste it anywhere to share!");
  } catch {
    alert(text);
  }
}
//==================== LowJunFeng END - Badge Achievement System ====================
