import { useState } from "react";
import { UserCircle, LogOut } from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
const seekMyLogo = new URL("../imports/logo.png", import.meta.url).toString();
import type { Page, MockUser, Location, ActivityLog } from "./lib/types";
import type { BookmarkEntry } from "./lib/bookmarkStore";
import { loadBookmarks, saveBookmarks } from "./lib/bookmarkStore";
import { C, F } from "./lib/tokens";
import { MOCK_USERS } from "./data/users";
import { LOCATIONS, LOCATIONS_ENRICHED } from "./data/catalog";
import { getPublishedLocations } from "./lib/contributorStore";
import { evaluateBadges } from "./lib/badges";
import { NavBar } from "./components/NavBar";
import { AuthModal } from "./components/AuthModal";
import { FrapButton } from "./components/FrapButton";
import { Pill } from "./components/Atoms";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { LocationPage } from "./pages/LocationPage";
import { SuggestLocationPage } from "./pages/SuggestLocationPage";
import { MapPage } from "./pages/MapPage";
import { AIPage } from "./pages/AIPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { LogPage } from "./pages/LogPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { AccountPage } from "./pages/AccountPage";
import { AdminPage } from "./pages/AdminPage";
import { ContributorPage } from "./pages/ContributorPage";

export default function App() {
  const [page, setPage]               = useState<Page>("home");
  const [prevPage, setPrevPage]       = useState<Page>("home");
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location|null>(null);
  const [selectedState, setSelectedState]       = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => loadBookmarks());
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {id:1,location:"Broga Hill",activity:"Hiking",distance:4.2,duration:"2h 15m",date:"2026-07-20",notes:"Great sunrise views!",state:"Selangor"},
    {id:2,location:"Putrajaya Lake",activity:"Cycling",distance:14,duration:"1h 10m",date:"2026-07-22",notes:"",state:"Putrajaya"},
  ]);
  const [users, setUsers]       = useState<MockUser[]>(MOCK_USERS);
  const [user, setUser]         = useState<MockUser|null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  function navigate(p: Page) {
    setPrevPage(page); setPage(p); setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function selectLocation(l: Location) {
    const enriched = LOCATIONS_ENRICHED.find(x => x.id === l.id) || l;
    setSelectedLocation(enriched);
  }
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }
  function toggleBookmark(id: number) {
    setBookmarks((p) => {
      const exists = p.some((b) => b.locationId === id);
      let next: BookmarkEntry[];
      if (exists) {
        next = p.filter((b) => b.locationId !== id);
      } else {
        next = [
          { locationId: id, notes: "", folder: "Uncategorized", savedAt: new Date().toISOString() },
          ...p,
        ];
      }
      saveBookmarks(next);
      return next;
    });
  }

  const [allLocations, setAllLocations] = useState<Location[]>(() => {
    const published = getPublishedLocations() as Location[];
    const base = LOCATIONS_ENRICHED.length ? LOCATIONS_ENRICHED : LOCATIONS;
    const ids = new Set(base.map((l) => l.id));
    return [...base, ...published.filter((p) => !ids.has(p.id))];
  });
  function refreshLocations(extra?: Location) {
    const published = getPublishedLocations() as Location[];
    const base = LOCATIONS_ENRICHED.length ? LOCATIONS_ENRICHED : LOCATIONS;
    const ids = new Set(base.map((l) => l.id));
    let merged = [...base, ...published.filter((p) => !ids.has(p.id))];
    if (extra && !merged.some((l) => l.id === extra.id)) merged = [extra, ...merged];
    setAllLocations(merged);
  }
  // allow AdminPage to push newly approved location
  if (typeof window !== "undefined") {
    (window as any).__seekmyRefreshLocations = (loc: Location) => refreshLocations(loc);
  }
  function setBookmarksPersist(updater: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) {
    setBookmarks((p) => {
      const next = typeof updater === "function" ? updater(p) : updater;
      saveBookmarks(next);
      return next;
    });
  }
  function addLog(l: Omit<ActivityLog, "id">) {
    setActivityLogs(prev => {
      const next = [{ ...l, id: Date.now() }, ...prev];
      const statuses = evaluateBadges(next, 0, earnedBadgeIds);
      const newly = statuses.filter(b => b.justEarned);
      if (newly.length) {
        setEarnedBadgeIds(ids => [...ids, ...newly.map(b => b.id)]);
        setBadgeToast(`Badge earned: ${newly.map(b => b.name).join(", ")}!`);
        setTimeout(() => setBadgeToast(null), 4000);
      }
      return next;
    });
  }
  function handleLogout() { setUser(null); navigate("home"); }
  function handleLogin(u: MockUser, adminFlag?: boolean) {
    setUser(u);
    setShowAuth(false);
    navigate(adminFlag ? "admin" : "home");
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen" style={{ fontFamily: F.body }}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b flex items-center justify-between px-5 h-14" style={{ borderColor: C.border, boxShadow: `0 1px 0 ${C.border}` }}>
          <button onClick={() => navigate("home")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: C.jungle }}>
              <ImageWithFallback src={seekMyLogo} alt="SeekMY" className="w-full h-full object-cover"/>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: C.text, fontFamily: F.display }}>SeekMY</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.textMuted, fontFamily: F.body }}>Admin Panel</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: C.muted }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: C.jungle }}>A</div>
              <span className="text-xs font-bold" style={{ color: C.text, fontFamily: F.body }}>admin@gmail.com</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.jungle, color: "#fff", fontFamily: F.body }}>ADMIN</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#fde8e6", color: C.error, fontFamily: F.body }}>
              <LogOut size={12}/> Sign out
            </button>
          </div>
        </nav>
        <AdminPage users={users} setUsers={setUsers} locations={allLocations} onLogout={handleLogout}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ fontFamily: F.body }}>
      <NavBar
        page={page}
        setPage={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        onAuthClick={() => !user ? setShowAuth(true) : navigate("account")}
      />

      {page === "home" && (
        <HomePage
          setPage={navigate}
          setSelectedLocation={selectLocation}
          setSelectedState={setSelectedState}
          bookmarks={bookmarks.map(b => b.locationId)}
          onBookmark={toggleBookmark}
        />
      )}
      {page === "map" && (
        <MapPage setPage={navigate} setSelectedLocation={selectLocation} />
      )}
      {page === "explore" && (
        <ExplorePage
          locations={allLocations}
          setPage={navigate}
          setSelectedLocation={selectLocation}
          selectedState={selectedState}
          bookmarks={bookmarks.map(b => b.locationId)}
          onBookmark={toggleBookmark}
        />
      )}
      {page === "suggest" && (
        <SuggestLocationPage user={user} setPage={navigate} onToast={showToast} />
      )}
      {page === "location" && (
        <LocationPage
          loc={selectedLocation}
          onBack={() => navigate(prevPage === "location" ? "explore" : prevPage)}
          bookmarked={selectedLocation ? bookmarks.some(b => b.locationId === selectedLocation.id) : false}
          onBookmark={() => selectedLocation && toggleBookmark(selectedLocation.id)}
          onSuggest={() => navigate("suggest")}
          onLogActivity={addLog}
          user={user}
          activityLogs={activityLogs}
          onToast={showToast}
        />
      )}
      {page === "ai" && <AIPage/>}
      {page === "leaderboard" && <LeaderboardPage/>}
      {page === "log" && (
        <LogPage logs={activityLogs} onAddLog={addLog}/>
      )}
      {page === "bookmarks" && (
        <BookmarksPage
          bookmarks={bookmarks}
          setBookmarks={setBookmarksPersist}
          setPage={navigate}
          setSelectedLocation={selectLocation}
          onToast={showToast}
        />
      )}
      {page === "contributor" && (
        <ContributorPage user={user} setPage={navigate} />
      )}
      {page === "account" && user && (
        <AccountPage
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          logs={activityLogs}
          bookmarks={bookmarks.map(b => b.locationId)}
          setPage={navigate}
          users={users}
          setUsers={setUsers}
        />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} users={users} setUsers={setUsers}/>
      )}

      {page === "account" && !user && (
        <div className="pt-14 min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
          <div className="text-center max-w-xs px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.muted }}>
              <UserCircle size={32} style={{ color: C.jungle }}/>
            </div>
            <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>Sign in to your account</h2>
            <p className="text-sm mb-6" style={{ color: C.textMuted, fontFamily: F.body }}>Access your profile, activity log, and bookmarks.</p>
            <Pill variant="filled" onClick={() => setShowAuth(true)}>Sign In or Register</Pill>
          </div>
        </div>
      )}

      {badgeToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm font-bold text-white shadow-lg"
          style={{ backgroundColor: C.jungle, fontFamily: F.body }}
        >
          🏅 {badgeToast}
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full text-sm font-bold text-white shadow-lg max-w-[90vw] text-center"
          style={{ backgroundColor: toast.type === "err" ? C.error : C.jungle, fontFamily: F.body }}
        >
          {toast.msg}
        </div>
      )}

      <FrapButton page={page} setPage={navigate}/>
    </div>
  );
}
