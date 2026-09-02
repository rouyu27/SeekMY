//==================== FongXinTong Part - Community Leaderboard & Ranking Module ====================
import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { C, F } from "../lib/tokens";
import { firebaseClient } from "../api/firebaseClient";
import type { Language } from "../lib/i18n";
import { t } from "../lib/i18n";

type LeaderboardPeriod = "weekly" | "monthly";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatRangeDate(date: string) {
  return new Date(`${date}T12:00:00+08:00`).toLocaleDateString("en-GB");
}

function weekRange(weeksAgo: number) {
  const today = new Date();
  const monday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12));
  const day = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - day + 1 - weeksAgo * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { startDate: isoDate(monday), endDate: isoDate(sunday) };
}

function monthRange(monthsAgo: number) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth() - monthsAgo, 1, 12));
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0, 12));
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function rangeLabel(period: LeaderboardPeriod, offset: number, startDate: string, endDate: string) {
  const prefix =
    offset === 0
      ? period === "weekly" ? "This week" : "This month"
      : offset === 1
        ? period === "weekly" ? "Last week" : "Last month"
        : period === "weekly" ? `${offset} weeks ago` : `${offset} months ago`;
  return `${prefix} (${formatRangeDate(startDate)} to ${formatRangeDate(endDate)})`;
}

function badgeCopy(language: Language, name: string, desc: string) {
  const names: Record<string, Record<Language, string>> = {
    "First Footstep": { en: "First Footstep", ms: "Langkah Pertama", zh: "第一步" },
    "State Explorer": { en: "State Explorer", ms: "Penjelajah Negeri", zh: "州属探索者" },
    "Malaysia Wanderer": { en: "Malaysia Wanderer", ms: "Pengembara Malaysia", zh: "马来西亚漫游者" },
    "Hidden Gem Hunter": { en: "Hidden Gem Hunter", ms: "Pemburu Permata Tersembunyi", zh: "隐藏宝藏猎人" },
    "First Contribution": { en: "First Contribution", ms: "Sumbangan Pertama", zh: "首次贡献" },
    "Local Storyteller": { en: "Local Storyteller", ms: "Pencerita Tempatan", zh: "本地故事分享者" },
    "Trusted Contributor": { en: "Trusted Contributor", ms: "Penyumbang Dipercayai", zh: "可信贡献者" },
    "Community Favourite": { en: "Community Favourite", ms: "Kegemaran Komuniti", zh: "社区最爱" },
    "Malaysia Insider": { en: "Malaysia Insider", ms: "Orang Dalam Malaysia", zh: "马来西亚达人" },
  };
  const descs: Record<string, Record<Language, string>> = {
    "Log your first outdoor activity": { en: desc, ms: "Rekod aktiviti luar pertama anda", zh: "记录你的第一次户外活动" },
    "Visit 3 different Malaysian states": { en: desc, ms: "Lawati 3 negeri Malaysia berbeza", zh: "到访 3 个不同的马来西亚州属" },
    "Visit 5 different Malaysian states": { en: desc, ms: "Lawati 5 negeri Malaysia berbeza", zh: "到访 5 个不同的马来西亚州属" },
    "Visit 3 hidden-gem locations": { en: desc, ms: "Lawati 3 lokasi permata tersembunyi", zh: "到访 3 个隐藏宝藏地点" },
    "Write your first community review": { en: desc, ms: "Tulis ulasan komuniti pertama anda", zh: "写下你的第一条社区评价" },
    "Write 3 community reviews": { en: desc, ms: "Tulis 3 ulasan komuniti", zh: "写下 3 条社区评价" },
    "Write 5 community reviews": { en: desc, ms: "Tulis 5 ulasan komuniti", zh: "写下 5 条社区评价" },
    "Write 10 community reviews": { en: desc, ms: "Tulis 10 ulasan komuniti", zh: "写下 10 条社区评价" },
    "Log 100 km of outdoor activities": { en: desc, ms: "Rekod 100 km aktiviti luar", zh: "记录 100 公里户外活动" },
  };
  return { name: names[name]?.[language] || name, desc: descs[desc]?.[language] || desc };
}

export function LeaderboardPage({ currentUserId, language = "en" }: { currentUserId?: string; language?: Language }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [sortBy, setSortBy] = useState<"km" | "checkins" | "states" | "locations">("km");
  const [entries, setEntries] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const rangeOptions = useMemo(() => {
    const count = period === "weekly" ? 27 : 7;
    return Array.from({ length: count }, (_, offset) => {
      const range = period === "weekly" ? weekRange(offset) : monthRange(offset);
      return { offset, ...range, label: rangeLabel(period, offset, range.startDate, range.endDate) };
    });
  }, [period]);
  const selectedRange = rangeOptions.find((option) => option.offset === rangeOffset) || rangeOptions[0];

  useEffect(() => {
    setRangeOffset(0);
  }, [period]);

  useEffect(() => {
    if (!selectedRange) return;
    setLoading(true);
    setError("");
    firebaseClient.backend.getLeaderboard(period, selectedRange.startDate, selectedRange.endDate)
      .then((result) => { setEntries(result.entries); setBadges(result.badges || []); })
      .catch((err: any) => { setEntries([]); setBadges([]); setError(err?.message || "Unable to load leaderboard."); })
      .finally(() => setLoading(false));
  }, [period, selectedRange]);

  const sorted = useMemo(() => entries
    .map((entry) => ({ ...entry, locations: entry.locations || entry.uniqueLocations || entry.locationCount || 0 }))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    .map((entry, index) => ({ ...entry, rank: index + 1, medal: index === 0 ? "1" : index === 1 ? "2" : index === 2 ? "3" : "" })), [entries, sortBy]);
  const currentEntry = sorted.find((entry) => currentUserId && String(entry.id) === String(currentUserId));
  const percentile = currentEntry && sorted.length > 1
    ? Math.round(((sorted.length - currentEntry.rank) / (sorted.length - 1)) * 100)
    : currentEntry ? 100 : null;

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={24} style={{ color: C.amber }} />
          <h1 className="text-3xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>{t(language, "leaderboardTitle")}</h1>
        </div>

        <div className="flex rounded-full overflow-hidden mb-5 w-fit p-0.5" style={{ backgroundColor: C.muted }}>
          {(["weekly", "monthly"] as const).map((item) => (
            <button key={item} onClick={() => setPeriod(item)} className="px-5 h-9 text-sm font-bold capitalize transition-all rounded-full" style={{ backgroundColor: period === item ? C.jungle : "transparent", color: period === item ? "#fff" : C.textMuted, fontFamily: F.body }}>
              {t(language, item)}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold block mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
            View fixed range
          </label>
          <select
            value={rangeOffset}
            onChange={(event) => setRangeOffset(Number(event.target.value))}
            className="w-full rounded-xl border bg-white px-4 py-3 text-sm font-bold outline-none"
            style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}
          >
            {rangeOptions.map((option) => (
              <option key={option.offset} value={option.offset}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: "km" as const, label: t(language, "distance") },
            { key: "checkins" as const, label: t(language, "checkins") },
            { key: "states" as const, label: t(language, "states") },
            { key: "locations" as const, label: t(language, "locations") },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} className="px-3 h-8 rounded-full text-[12px] font-bold" style={{ backgroundColor: sortBy === key ? C.jungle : "#fff", color: sortBy === key ? "#fff" : C.textSub, border: sortBy === key ? "none" : `1px solid ${C.border}`, fontFamily: F.body }}>
              {label}
            </button>
          ))}
        </div>

        {currentEntry && (
          <div className="mb-5 rounded-[18px] bg-white p-4" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10)` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.textMuted, fontFamily: F.body }}>{t(language, "yourRanking")}</p>
            <p className="mt-1 text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>
              {t(language, "rank")} #{currentEntry.rank} · {t(language, "personalPercentile")} {percentile}%
            </p>
          </div>
        )}

        <div className="bg-white rounded-[18px] overflow-hidden mb-8" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
          {error && <p className="text-sm text-center py-10 px-5 font-semibold" style={{ color: C.error, fontFamily: F.body }}>{error}</p>}
          {!error && sorted.length === 0 && <p className="text-sm text-center py-10" style={{ color: C.textMuted, fontFamily: F.body }}>{loading ? "Loading leaderboard..." : `No approved activity logged in this ${period === "weekly" ? "week" : "month"} yet.`}</p>}
          {sorted.map((entry, index) => (
            <div key={`${entry.name}-${index}`} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: index < sorted.length - 1 ? `1px solid ${C.border}` : "none", backgroundColor: index === 0 ? "#fffbef" : "transparent" }}>
              <span className="text-xl w-7 text-center">{entry.medal || <span className="text-sm font-bold" style={{ color: C.textMuted }}>{entry.rank}</span>}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: index === 0 ? C.amber : index === 1 ? "#9ca3af" : index === 2 ? "#a16207" : C.muted, color: index < 3 ? C.jungle : C.forest }}>{String(entry.name || "U").split(" ").map((name: string) => name[0]).join("").slice(0, 2)}</div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{entry.name}</p>
                <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{entry.states} {t(language, "states")} · {entry.checkins} {t(language, "checkins")} · {entry.locations} {t(language, "locations")}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: C.jungle, fontFamily: F.body }}>{entry[sortBy] || 0}{sortBy === "km" ? " km" : ""}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-normal mb-5" style={{ color: C.jungle, fontFamily: F.display }}>{t(language, "achievements")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.length === 0 && <p className="col-span-2 text-sm text-center py-8" style={{ color: C.textMuted, fontFamily: F.body }}>{language === "zh" ? "暂无徽章资料。" : language === "ms" ? "Tiada data lencana lagi." : "No badge data yet."}</p>}
          {badges.map((badge: any) => {
            const translated = badgeCopy(language, badge.name || "Badge", badge.desc || badge.description || "Achievement");
            return (
              <div key={badge.id} className="bg-white rounded-[18px] p-4 flex gap-3 items-start" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)` }}>
                <span className="text-2xl">{badge.icon || "🏅"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>{translated.name}</p>
                  <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>{translated.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
//==================== FongXinTong END - Community Leaderboard & Ranking Module ====================
