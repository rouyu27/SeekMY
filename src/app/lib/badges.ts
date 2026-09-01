//==================== LowJunFeng Part - Badge Achievement System ====================
import type { ActivityLog, BadgeDef, BadgeStatus } from "./types";

const firstFootstep = new URL("../../assets/badges/first-footstep.png", import.meta.url).toString();
const stateExplorer = new URL("../../assets/badges/state-explorer.png", import.meta.url).toString();
const malaysiaWanderer = new URL("../../assets/badges/malaysia-wanderer.png", import.meta.url).toString();
const hiddenGemHunter = new URL("../../assets/badges/hidden-gem-hunter.png", import.meta.url).toString();
const firstContribution = new URL("../../assets/badges/first-contribution.png", import.meta.url).toString();
const localStoryteller = new URL("../../assets/badges/local-storyteller.png", import.meta.url).toString();
const trustedContributor = new URL("../../assets/badges/trusted-contributor.png", import.meta.url).toString();
const communityFavourite = new URL("../../assets/badges/community-favourite.png", import.meta.url).toString();
const malaysiaInsider = new URL("../../assets/badges/malaysia-insider.png", import.meta.url).toString();
const SEEKMY_APP_URL = "https://seekmy-integration.web.app/";

export const BADGE_DEFS: BadgeDef[] = [
  { id: "first-footstep", icon: "🥾", image: firstFootstep, name: "First Footstep", desc: "Log your first outdoor activity", requirement: 1, metric: "activities" },
  { id: "state-explorer", icon: "🧭", image: stateExplorer, name: "State Explorer", desc: "Visit 3 different Malaysian states", requirement: 3, metric: "states" },
  { id: "malaysia-wanderer", icon: "🗺️", image: malaysiaWanderer, name: "Malaysia Wanderer", desc: "Visit 5 different Malaysian states", requirement: 5, metric: "states" },
  { id: "hidden-gem-hunter", icon: "💎", image: hiddenGemHunter, name: "Hidden Gem Hunter", desc: "Visit 3 hidden-gem locations", requirement: 3, metric: "gems" },
  { id: "first-contribution", icon: "✍️", image: firstContribution, name: "First Contribution", desc: "Write your first community review", requirement: 1, metric: "reviews" },
  { id: "local-storyteller", icon: "📖", image: localStoryteller, name: "Local Storyteller", desc: "Write 3 community reviews", requirement: 3, metric: "reviews" },
  { id: "trusted-contributor", icon: "✅", image: trustedContributor, name: "Trusted Contributor", desc: "Write 5 community reviews", requirement: 5, metric: "reviews" },
  { id: "community-favourite", icon: "⭐", image: communityFavourite, name: "Community Favourite", desc: "Write 10 community reviews", requirement: 10, metric: "reviews" },
  { id: "malaysia-insider", icon: "🏆", image: malaysiaInsider, name: "Malaysia Insider", desc: "Log 100 km of outdoor activities", requirement: 100, metric: "km" },
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
  const activities = logs.length;
  const hikes = logs.filter((l) => /hike/i.test(l.activity)).length;
  const dives = logs.filter((l) => /div/i.test(l.activity)).length;
  const camps = logs.filter((l) => /camp/i.test(l.activity)).length;
  const cycleKm = logs
    .filter((l) => /cycl/i.test(l.activity))
    .reduce((s, l) => s + (l.distance || 0), 0);
  const gems = logs.filter((l) => l.is_hidden_gem === true || l.isHiddenGem === true || GEM_NAMES.has(l.location)).length;

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

  return BADGE_DEFS.map((b) => {
    const calculatedProgress = Math.min(metrics[b.metric], b.requirement);
    const storedEarned = previouslyEarned.includes(b.id);
    const progress = storedEarned ? b.requirement : calculatedProgress;
    const earned = progress >= b.requirement;
    const justEarned = earned && !previouslyEarned.includes(b.id);
    return { ...b, progress, earned, justEarned };
  });
}

export function getSeekMyAppUrl() {
  return SEEKMY_APP_URL;
}

export function badgeAchievementMessage(badge: Pick<BadgeDef, "name" | "desc" | "icon">) {
  return `I earned the "${badge.name}" badge on SeekMY! ${badge.icon || ""}\n${badge.desc}\n\nOpen SeekMY and earn your own badges:\n${getSeekMyAppUrl()}`;
}

export async function shareBadge(badge: BadgeStatus) {
  const text = badgeAchievementMessage(badge);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      if (badge.image && navigator.canShare) {
        const response = await fetch(badge.image);
        const blob = await response.blob();
        const file = new File([blob], `${badge.id}.png`, { type: blob.type || "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `${badge.name} on SeekMY`, text, files: [file] });
          return;
        }
      }
      await navigator.share({ title: `${badge.name} on SeekMY`, text });
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
