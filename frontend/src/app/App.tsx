// Shared integration file for all SeekMY modules.
// Module-specific route comments below identify the responsible member.
import { useEffect, useState } from "react";
import { UserCircle, LogOut } from "lucide-react";
import { ImageWithFallback } from "./components/ui/ImageWithFallback";
const seekMyLogo = new URL("../imports/logo.png", import.meta.url).toString();
import type { Page, AppUser, Location, ActivityLog } from "./lib/types";
import type { BookmarkEntry } from "./lib/types";
import { C, F } from "./lib/tokens";
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
import { InsightsPage } from "./pages/InsightsPage";
import { HelpPage } from "./pages/HelpPage";
import { firebaseClient } from "./api/firebaseClient";
import { BADGE_DEFS } from "./lib/badges";
import type { BadgeDef } from "./lib/types";
import { SplashScreen } from "./components/SplashScreen";
import { STARTER_LOCATIONS, mergeLocations } from "./lib/seedLocations";

export default function App() {
  const [page, setPage]               = useState<Page>("home");
  const [prevPage, setPrevPage]       = useState<Page>("home");
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location|null>(null);
  const [locationInitialTab, setLocationInitialTab] = useState<"overview" | "weather" | "reviews">("overview");
  const [logLocation, setLogLocation] = useState<Location|null>(null);
  const [selectedState, setSelectedState]       = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers]       = useState<AppUser[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [user, setUser]         = useState<AppUser|null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [badgeToast, setBadgeToast] = useState<BadgeDef | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const isAdmin = user?.role === "admin";
  async function attachReviewSummaries(locations: Location[]) {
    try {
      const result = await firebaseClient.backend.getLocationReviewSummaries();
      const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
      const reviewMap = new Map(result.summaries.map(summary=>[String(summary.locationId), summary]));
      const reviewNameMap = new Map(
        result.summaries
          .filter(summary => summary.locationName)
          .map(summary => [normalize(summary.locationName), summary])
      );
      return locations.map((location) => {
        const summary = reviewMap.get(String(location.id)) || reviewNameMap.get(normalize(location.name));
        if (!summary) return location;
        return { ...location, rating: summary.rating, reviews: summary.count };
      });
    } catch {
      return locations;
    }
  }
  async function refreshLocationReviewSummaries() {
    setAllLocations((currentLocations) => {
      attachReviewSummaries(currentLocations).then((updatedLocations) => {
        setAllLocations(updatedLocations);
        setSelectedLocation((currentSelected) => {
          if (!currentSelected) return currentSelected;
          return updatedLocations.find((location) => String(location.id) === String(currentSelected.id)) || currentSelected;
        });
      });
      return currentLocations;
    });
  }

  useEffect(() => {
    const configured = Boolean(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID
    );
    if (!configured) return;

    firebaseClient.entities.Location.list("name")
      .then(async (rows:any[]) => setAllLocations(mergeLocations(await attachReviewSummaries(rows as Location[]), STARTER_LOCATIONS)))
      .catch((error:any) => {
        setAllLocations(STARTER_LOCATIONS);
        showToast(error?.message || "Unable to load locations from Firebase.", "err");
      });

    firebaseClient.auth.me().then(async (profile: any) => {
      const email = profile?.email || "";
      const current: AppUser = {
        id: profile?.id || `firebase-${Date.now()}`,
        username: profile?.username || email.split("@")[0] || "explorer",
        displayName: profile?.full_name || email.split("@")[0] || "Explorer",
        email, password: "", photoUrl: profile?.photo_url || profile?.photoURL || "", bio: profile?.bio || "",
        joinDate: profile?.created_date?.slice?.(0,10) || new Date().toISOString().split("T")[0],
        totalKm: Number(profile?.totalKm || profile?.total_km || 0),
        states: Number(profile?.states || 0), checkins: Number(profile?.checkins || 0),
        role: profile?.role === "admin" ? "admin" : "user",
      };
      setUser(current);

      const [bookmarkRows, backendData, userRows] = await Promise.all([
        firebaseClient.entities.Bookmark.filter({ created_by_id: current.id }, "-created_date", 500),
        firebaseClient.backend.getMyData(),
        firebaseClient.entities.User.list("full_name", 500),
      ]);
      const logRows = backendData.activities;
      setBookmarks(bookmarkRows.map((b:any)=>({
        firestoreId:String(b.id), locationId:b.locationId ?? b.location_id,
        notes:b.notes||"", folder:b.folder||"Uncategorized", savedAt:b.savedAt||b.created_date||new Date().toISOString(),
      })));
      setActivityLogs(logRows.map((l:any)=>({
        id:l.id, location:l.location||l.locationName||"Unknown", activity:l.activity||"Hiking",
        distance:Number(l.distance||0), duration:l.duration||"", date:l.date||l.created_date?.slice?.(0,10)||"",
        notes:l.notes||"", comment:l.comment||"", photoUrl:l.photoUrl||l.photo_url||"",
        locationId:l.locationId??l.location_id, state:l.state||"",
      })));
      setEarnedBadgeIds(backendData.badges.map((badge:any)=>String(badge.key||badge.id).replace(`${current.id}_`,"")));
      setUsers(userRows.map((u:any)=>({
        id:String(u.id), username:u.username||u.email?.split("@")[0]||"explorer",
        displayName:u.full_name||u.displayName||u.email||"Explorer", email:u.email||"", password:"", photoUrl:u.photo_url||u.photoUrl||"", bio:u.bio||"",
        joinDate:u.created_date?.slice?.(0,10)||new Date().toISOString().split("T")[0],
        totalKm:Number(u.total_km||u.totalKm||0), states:Number(u.states||0), checkins:Number(u.checkins||0),
        role:u.role==="admin"?"admin":"user", status:u.status,
      })));
    }).catch(() => { /* guest mode: public Firebase locations still load */ });
  }, []);

  function navigate(p: Page) {
    // Opening Discover normally should always start with ALL locations.
    // A state-card click can set the state immediately after this call.
    if (p === "explore") {
      setSelectedState("");
      refreshLocationReviewSummaries();
    }

    setPrevPage(page);
    setPage(p);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function selectLocation(l: Location) {
    setSelectedLocation(l);
    setLocationInitialTab("overview");
  }
  function openLocationFromLog(log: ActivityLog, tab: "overview" | "reviews" = "overview") {
    const location = allLocations.find((item) => String(item.id) === String(log.locationId))
      || allLocations.find((item) => item.name.toLowerCase() === String(log.location || "").toLowerCase());
    if (!location) {
      showToast("This logged place is not available in Discover yet.", "err");
      return;
    }
    setSelectedLocation(location);
    setLocationInitialTab(tab);
    navigate("location");
  }
  function updateLocationReviewSummary(locationId: number | string, rating: number, reviews: number) {
    const applySummary = (location: Location) =>
      String(location.id) === String(locationId)
        ? { ...location, rating, reviews }
        : location;

    setAllLocations((locations) => locations.map(applySummary));
    setSelectedLocation((location) => location ? applySummary(location) : location);
  }
  function startLocationActivityLog(location: Location) {
    setLogLocation(location);
    navigate("log");
  }
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }
  async function toggleBookmark(id: number | string) {
    if (!user) { setShowAuth(true); return; }
    const existing = bookmarks.find((b) => String(b.locationId) === String(id));
    try {
      if (existing) {
        if (existing.firestoreId) await firebaseClient.entities.Bookmark.delete(existing.firestoreId);
        setBookmarks((p)=>p.filter((b)=>String(b.locationId)!==String(id)));
      } else {
        const created:any = await firebaseClient.entities.Bookmark.create({
          locationId:id, notes:"", folder:"Uncategorized", savedAt:new Date().toISOString(),
        });
        setBookmarks((p)=>[{firestoreId:String(created.id),locationId:id,notes:"",folder:"Uncategorized",savedAt:created.savedAt||created.created_date||new Date().toISOString()},...p]);
      }
    } catch (error:any) { showToast(error?.message || "Unable to update bookmark in Firebase.", "err"); }
  }
  function refreshLocations(extra?: Location) {
    if (extra) setAllLocations((current)=>current.some((l)=>String(l.id)===String(extra.id))?current:[extra,...current]);
    else firebaseClient.entities.Location.list("name").then(async (rows:any[])=>setAllLocations(mergeLocations(await attachReviewSummaries(rows as Location[]), STARTER_LOCATIONS))).catch(()=>setAllLocations(STARTER_LOCATIONS));
  }
  if (typeof window !== "undefined") (window as any).__seekmyRefreshLocations = (loc: Location) => refreshLocations(loc);
  function setBookmarksPersist(updater: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) {
    setBookmarks((previous) => {
      const next = typeof updater === "function" ? updater(previous) : updater;
      const nextIds = new Set(next.map((b)=>String(b.locationId)));
      previous.filter((b)=>!nextIds.has(String(b.locationId)) && b.firestoreId)
        .forEach((b)=>firebaseClient.entities.Bookmark.delete(b.firestoreId!).catch(()=>{}));
      next.forEach((b)=>{
        const old = previous.find((x)=>String(x.locationId)===String(b.locationId));
        if (old?.firestoreId && (old.notes!==b.notes || old.folder!==b.folder)) {
          firebaseClient.entities.Bookmark.update(old.firestoreId,{notes:b.notes,folder:b.folder}).catch(()=>{});
        }
      });
      return next;
    });
  }

  async function loadUserFirebaseData(current: AppUser) {
      const [bookmarkRows, backendData] = await Promise.all([
        firebaseClient.entities.Bookmark.filter({ created_by_id: current.id }, "-created_date", 500),
        firebaseClient.backend.getMyData(),
      ]);
      const logRows = backendData.activities;
      const badgeRows = backendData.badges;

    setBookmarks(bookmarkRows.map((b:any)=>({
      firestoreId:String(b.id),
      locationId:b.locationId ?? b.location_id,
      notes:b.notes || "",
      folder:b.folder || "Uncategorized",
      savedAt:b.savedAt || b.created_date || new Date().toISOString(),
    })));

      setActivityLogs(logRows.map((l:any)=>({
      id:l.id,
      location:l.location || l.locationName || "Unknown",
      activity:l.activity || "Hiking",
      distance:Number(l.distance || 0),
      duration:l.duration || "",
      date:l.date || l.created_date?.slice?.(0,10) || "",
      notes:l.notes || "",
      comment:l.comment || "",
      photoUrl:l.photoUrl || l.photo_url || "",
      locationId:l.locationId ?? l.location_id,
      state:l.state || "",
      })));
      setEarnedBadgeIds(badgeRows.map((badge:any)=>String(badge.key || badge.id).replace(`${current.id}_`, "")));
  }

  async function addLog(l: Omit<ActivityLog, "id">) {
    if (!user) { setShowAuth(true); return; }
    try {
      const result = await firebaseClient.backend.createActivity(l);
      setActivityLogs(prev => [result.activity as ActivityLog, ...prev]);
      if (result.newBadges.length) {
        setEarnedBadgeIds(ids => [...new Set([...ids, ...result.newBadges.map((badge:any) => badge.key)])]);
        const earnedBadge = BADGE_DEFS.find((badge) => badge.id === result.newBadges[0].key);
        if (earnedBadge) {
          setBadgeToast(earnedBadge);
          setTimeout(() => setBadgeToast(null), 5200);
        } else {
          showToast(`Badge earned: ${result.newBadges.map((badge:any) => badge.name).join(", ")}!`);
        }
      }
    } catch (error:any) {
      showToast(error?.message || "Unable to save activity to Firebase.","err");
      throw error;
    }
  }
  async function deleteLog(id: string | number) {
    try {
      const result = await firebaseClient.backend.deleteActivity(String(id));
      setActivityLogs(previous => previous.filter(log => String(log.id) !== String(id)));
      if (result.revokedBadges?.length) setEarnedBadgeIds(previous => previous.filter(key => !result.revokedBadges.includes(key)));
      showToast("Activity deleted and statistics recalculated.");
    } catch (error:any) { showToast(error?.message || "Unable to delete activity.", "err"); throw error; }
  }

  async function handleLogout() {
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY) await firebaseClient.auth.logout(undefined);
    } catch { /* keep logout usable in demo mode */ }
    setUser(null);
    setBookmarks([]);
    setActivityLogs([]);
    navigate("home");
  }

  async function handleLogin(u: AppUser, adminFlag?: boolean) {
    setUser(u);
    setShowAuth(false);

    if (adminFlag) {
      navigate("admin");
      return;
    }

    try {
      await loadUserFirebaseData(u);
    } catch (error:any) {
      showToast(error?.message || "Unable to load your Firebase data.", "err");
    }
    // Keep the current page after login so protected pages immediately show the user's data.
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen" style={{ fontFamily: F.body }}>
        {showSplash && <SplashScreen logoSrc={seekMyLogo} onFinish={() => setShowSplash(false)} minDuration={2000} />}
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
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.displayName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: C.jungle }}>A</div>
              )}
              <span className="text-xs font-bold" style={{ color: C.text, fontFamily: F.body }}>{user?.email}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.jungle, color: "#fff", fontFamily: F.body }}>ADMIN</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#fde8e6", color: C.error, fontFamily: F.body }}>
              <LogOut size={12}/> Sign out
            </button>
          </div>
        </nav>
        {/* ==================== WongYueShan Part - Admin Panel ==================== */}
        <AdminPage users={users} setUsers={setUsers} locations={allLocations} onLogout={handleLogout}/>
        {/* ==================== WongYueShan END - Admin Panel ==================== */}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ fontFamily: F.body }}>
      {showSplash && <SplashScreen logoSrc={seekMyLogo} onFinish={() => setShowSplash(false)} minDuration={2000} />}
      <NavBar
        page={page}
        setPage={navigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        onAuthClick={() => !user ? setShowAuth(true) : navigate("account")}
      />

      {/* ==================== LowJunFeng Part - Home Module ==================== */}
      {page === "home" && (
        <HomePage
          setPage={navigate}
          setSelectedLocation={selectLocation}
          setSelectedState={setSelectedState}
          bookmarks={bookmarks.map(b => b.locationId)}
          onBookmark={toggleBookmark}
          locations={allLocations}
        />
      )}
      {/* ==================== LowJunFeng END - Home Module ==================== */}

      {/* ==================== LimRouYu Part - Map Module ==================== */}
      {page === "map" && (
        <MapPage setPage={navigate} setSelectedLocation={selectLocation} locations={allLocations} />
      )}
      {/* ==================== LimRouYu END - Map Module ==================== */}

      {/* ==================== WilsonChoongWeiShan Part - Activity Filter Module ==================== */}
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
      {/* ==================== WilsonChoongWeiShan END - Activity Filter Module ==================== */}

      {/* ==================== WongYueShan Part - Local Contributor / Location Suggestion ==================== */}
      {page === "suggest" && (
        <SuggestLocationPage user={user} setPage={navigate} onToast={showToast} />
      )}
      {/* ==================== WongYueShan END - Local Contributor / Location Suggestion ==================== */}

      {/* Shared: LimRouYu Location Detail + WongYueShan Weather + LimTzeXin Bookmark/Review */}
      {page === "location" && (
        <LocationPage
          loc={selectedLocation}
          onBack={() => navigate(prevPage === "location" ? "explore" : prevPage)}
          bookmarked={selectedLocation ? bookmarks.some(b => String(b.locationId) === String(selectedLocation.id)) : false}
          onBookmark={() => selectedLocation && toggleBookmark(selectedLocation.id)}
          onSuggest={() => navigate("suggest")}
          onLogActivity={startLocationActivityLog}
          user={user}
          activityLogs={activityLogs}
          onToast={showToast}
          onReviewSummaryChange={updateLocationReviewSummary}
          initialTab={locationInitialTab}
        />
      )}
      {/* ==================== WilsonChoongWeiShan Part - AI Outdoor Assistant Chatbot ==================== */}
      {page === "ai" && <AIPage locations={allLocations}/>}
      {/* ==================== WilsonChoongWeiShan END - AI Outdoor Assistant Chatbot ==================== */}
      {/* ==================== FongXinTong Part - Community Leaderboard & Ranking Module ==================== */}
      {page === "leaderboard" && <LeaderboardPage/>}
      {/* ==================== FongXinTong END - Community Leaderboard & Ranking Module ==================== */}
      {/* ==================== FongXinTong Part - Activity Log Module ==================== */}
      {page === "log" && (
        <LogPage user={user} logs={activityLogs} locations={allLocations} initialLocation={logLocation} onInitialLocationUsed={() => setLogLocation(null)} onAddLog={addLog} onDeleteLog={deleteLog} onOpenLocation={openLocationFromLog} onSignIn={() => setShowAuth(true)}/>
      )}
      {/* ==================== FongXinTong END - Activity Log Module ==================== */}

      {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
      {page === "bookmarks" && (
        <BookmarksPage
          bookmarks={bookmarks}
          setBookmarks={setBookmarksPersist}
          setPage={navigate}
          setSelectedLocation={selectLocation}
          onToast={showToast}
          locations={allLocations}
          user={user}
          onSignIn={() => setShowAuth(true)}
        />
      )}
      {/* ==================== LimTzeXin END - Bookmark Module ==================== */}

      {/* ==================== WongYueShan Part - Local Contributor Portal ==================== */}
      {page === "contributor" && (
        <ContributorPage user={user} setPage={navigate} onSignIn={() => setShowAuth(true)} />
      )}
      {/* ==================== WongYueShan END - Local Contributor Portal ==================== */}

      {/* ==================== FongXinTong Part - Personal Stats Dashboard ==================== */}
      {page === "insights" && (
        <InsightsPage user={user} locations={allLocations} logs={activityLogs} bookmarks={bookmarks} onSignIn={() => setShowAuth(true)} />
      )}
      {/* ==================== FongXinTong END - Personal Stats Dashboard ==================== */}

      {page === "help" && <HelpPage setPage={navigate} />}
      {/* ==================== WilsonChoongWeiShan Part - Account Module ==================== */}
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
          earnedBadgeIds={earnedBadgeIds}
        />
      )}

      {/* ==================== WilsonChoongWeiShan END - Account Module ==================== */}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin}/>
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
          className="fixed inset-x-4 bottom-6 z-[100] mx-auto w-full max-w-sm overflow-hidden rounded-[18px] bg-white p-4 text-left shadow-2xl"
          style={{ border: `1px solid ${C.border}`, fontFamily: F.body }}
        >
          <div className="flex items-center gap-4">
            <img src={badgeToast.image} alt={`${badgeToast.name} badge`} className="h-20 w-20 flex-shrink-0 rounded-xl object-contain" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.forest }}>Achievement unlocked</p>
              <p className="text-base font-bold leading-tight" style={{ color: C.text, fontFamily: F.display }}>{badgeToast.name}</p>
              <p className="mt-1 text-xs leading-snug" style={{ color: C.textSub }}>{badgeToast.desc}</p>
            </div>
          </div>
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
