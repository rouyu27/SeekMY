// Shared integration file for all SeekMY modules.
// Module-specific route comments below identify the responsible member.
import { useEffect, useRef, useState } from "react";
import { UserCircle, LogOut } from "lucide-react";
import { ImageWithFallback } from "./components/ui/ImageWithFallback";
const seekMyLogo = new URL("../imports/logo.png", import.meta.url).toString();
import type { Page, AppUser, Location, ActivityLog } from "./lib/types";
import type { BookmarkEntry, PersonalBookmarkFolder } from "./lib/types";
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
import { SharedBookmarksPage } from "./pages/SharedBookmarksPage";
import { firebaseClient } from "./api/firebaseClient";
import { BADGE_DEFS, badgeAchievementMessage } from "./lib/badges";
import type { BadgeDef } from "./lib/types";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingTour } from "./components/OnboardingTour";
import { STARTER_LOCATIONS, mergeLocations } from "./lib/seedLocations";
import type { Language } from "./lib/i18n";
import { t } from "./lib/i18n";

function routeSegment(prefix: string): string {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname;
  if (!path.startsWith(prefix)) return "";
  try { return decodeURIComponent(path.slice(prefix.length).split("/")[0] || ""); }
  catch { return ""; }
}

type SeekMyHistoryState = {
  seekmy: true;
  page: Page;
  prevPage: Page;
  locationId?: string;
};

function isPage(value: unknown): value is Page {
  return [
    "home", "explore", "location", "ai", "leaderboard", "log", "bookmarks",
    "account", "admin", "map", "contributor", "suggest", "insights", "help",
  ].includes(String(value));
}

function appUrlFor(page: Page, locationId?: string) {
  if (page === "home") return "/";
  if (page === "location" && locationId) return `/location/${encodeURIComponent(locationId)}`;
  return "/";
}

function dedupeBookmarkEntries(entries: BookmarkEntry[]): BookmarkEntry[] {
  const byLocation = new Map<string, BookmarkEntry>();
  for (const entry of entries) {
    const key = String(entry.locationId);
    const current = byLocation.get(key);
    if (!current) {
      byLocation.set(key, { ...entry, duplicateFirestoreIds: [...new Set(entry.duplicateFirestoreIds || [])] });
      continue;
    }
    const duplicateIds = [
      ...(current.duplicateFirestoreIds || []),
      ...(entry.firestoreId && entry.firestoreId !== current.firestoreId ? [entry.firestoreId] : []),
      ...(entry.duplicateFirestoreIds || []),
    ];
    byLocation.set(key, {
      ...current,
      notes: current.notes || entry.notes,
      folderIds: [...new Set([...(current.folderIds || []), ...(entry.folderIds || [])])],
      folders: [...new Set([...(current.folders || []), ...(entry.folders || [])])],
      folder: [...new Set([...(current.folders || []), ...(entry.folders || [])])][0] || "Uncategorized",
      sharedFolderId: null,
      duplicateFirestoreIds: [...new Set(duplicateIds.filter((id) => id !== current.firestoreId))],
    });
  }
  return [...byLocation.values()];
}

function normalizedFolderName(value: unknown): string {
  return String(value || "").trim().toLocaleLowerCase();
}

function isReservedPersonalFolderName(value: unknown): boolean {
  const name = normalizedFolderName(value);
  return name === "all" || name === "uncategorized";
}

function legacyPersonalFolderId(uid: string, name: string): string {
  return `bookmark_folder_${encodeURIComponent(uid)}_${encodeURIComponent(normalizedFolderName(name))}`;
}

function normalizePersonalFolder(row: any): PersonalBookmarkFolder {
  return {
    id: String(row.id),
    ownerUid: String(row.ownerUid || row.created_by_id || ""),
    name: String(row.name || "").trim(),
    isDefault: row.isDefault === true,
    createdAt: row.createdAt || row.created_date || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_date || row.createdAt || row.created_date || new Date().toISOString(),
  };
}

function normalizeBookmarkRows(rows: any[], personalFolders: PersonalBookmarkFolder[]): BookmarkEntry[] {
  const foldersById = new Map(personalFolders.map((folder) => [folder.id, folder]));
  const foldersByName = new Map(personalFolders.map((folder) => [normalizedFolderName(folder.name), folder]));
  return dedupeBookmarkEntries(rows.map((bookmark: any) => {
    const legacyFolder = String(bookmark.folder || "Uncategorized");
    const legacySharedFolderId = bookmark.sharedFolderId || bookmark.shared_folder_id || null;
    const legacyNames = Array.isArray(bookmark.folders)
      ? [...new Set(bookmark.folders.map(String).map((name: string) => name.trim()).filter(Boolean))]
      : (!legacySharedFolderId && legacyFolder !== "Uncategorized" ? [legacyFolder] : []);
    const folderIds = [...new Set([
      ...(Array.isArray(bookmark.folderIds) ? bookmark.folderIds.map(String) : []),
      ...legacyNames.map((name) => foldersByName.get(normalizedFolderName(name))?.id).filter(Boolean),
    ])].filter((id) => foldersById.has(id as string)) as string[];
    const folders = folderIds.map((id) => foldersById.get(id)?.name).filter(Boolean) as string[];
    return {
      firestoreId: String(bookmark.id),
      locationId: bookmark.locationId ?? bookmark.location_id,
      notes: bookmark.notes || "",
      folderIds,
      folders,
      folder: folders[0] || "Uncategorized",
      sharedFolderId: null,
      savedAt: bookmark.savedAt || bookmark.created_date || new Date().toISOString(),
    };
  }));
}

export default function App() {
  const [page, setPage]               = useState<Page>(() => {
    if (typeof window === "undefined") return "home";
    const requestedPage = new URLSearchParams(window.location.search).get("page");
    return isPage(requestedPage) && requestedPage !== "location" ? requestedPage : "home";
  });
  const [prevPage, setPrevPage]       = useState<Page>("home");
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location|null>(null);
  const [locationInitialTab, setLocationInitialTab] = useState<"overview" | "weather" | "reviews">("overview");
  const [logLocation, setLogLocation] = useState<Location|null>(null);
  const [selectedState, setSelectedState]       = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [personalFolders, setPersonalFolders] = useState<PersonalBookmarkFolder[]>([]);
  const bookmarkRequests = useRef(new Set<string>());
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers]       = useState<AppUser[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [user, setUser]         = useState<AppUser|null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [badgeToast, setBadgeToast] = useState<BadgeDef | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [openMapWeather, setOpenMapWeather] = useState(false);
  const [language, setLanguageState] = useState<Language>("en");
  const [sharedFolderToken] = useState(() => routeSegment("/shared/bookmarks/"));
  const [initialPublicLocationId] = useState(() => routeSegment("/location/"));
  const pendingHistoryLocationId = useRef<string | null>(initialPublicLocationId || null);
  const applyingBrowserHistory = useRef(false);
  const hasWrittenInitialHistory = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("seekmy-onboarding-complete") !== "true";
  });

  function isVisibleLocation(location: Location) {
    const status = String((location as any).status || "active").toLowerCase();
    return status !== "unavailable" && status !== "deleted" && status !== "disabled";
  }

  async function prepareLocations(rows: Location[]) {
    const visibleRows = rows.filter(isVisibleLocation);
    const unavailableNames = new Set(
      rows
        .filter((location) => !isVisibleLocation(location))
        .map((location) => `${location.name}|${location.state}`.toLowerCase())
    );
    const visibleStarters = STARTER_LOCATIONS.filter(
      (location) => !unavailableNames.has(`${location.name}|${location.state}`.toLowerCase())
    );
    const sourceRows = visibleRows.length ? visibleRows : visibleStarters;
    return attachReviewSummaries(mergeLocations(sourceRows, visibleStarters));
  }

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    void firebaseClient.backend.cleanupAdminCollaborativeMemberships().catch(() => undefined);
  }, [isAdmin, user?.id]);

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
      .then(async (rows:any[]) => {
        const prepared = await prepareLocations(rows as Location[]);
        setAllLocations(prepared);
        if (initialPublicLocationId) {
          const publicLocation = prepared.find((location) => String(location.id) === initialPublicLocationId);
          if (publicLocation) {
            setSelectedLocation(publicLocation);
            setLocationInitialTab("overview");
            setPage("location");
          }
        }
      })
      .catch((error:any) => {
        const fallbackLocations = STARTER_LOCATIONS;
        setAllLocations(fallbackLocations);
        if (initialPublicLocationId) {
          const publicLocation = fallbackLocations.find((location) => String(location.id) === initialPublicLocationId);
          if (publicLocation) {
            setSelectedLocation(publicLocation);
            setLocationInitialTab("overview");
            setPage("location");
          }
        }
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
        status: profile?.status,
      };
      setUser(current);

      const userRows = await firebaseClient.entities.User.list("full_name", 500);
      await loadUserFirebaseData(current);
      setUsers(userRows.map((u:any)=>({
        id:String(u.id), username:u.username||u.email?.split("@")[0]||"explorer",
        displayName:u.full_name||u.displayName||u.email||"Explorer", email:u.email||"", password:"", photoUrl:u.photo_url||u.photoUrl||"", bio:u.bio||"",
        joinDate:u.created_date?.slice?.(0,10)||new Date().toISOString().split("T")[0],
        totalKm:Number(u.total_km||u.totalKm||0), states:Number(u.states||0), checkins:Number(u.checkins||0),
        role:u.role==="admin"?"admin":"user", status:u.status,
      })));
      refreshUnreadAnnouncements(current);
    }).catch(() => { /* guest mode: public Firebase locations still load */ });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || hasWrittenInitialHistory.current) return;
    if (initialPublicLocationId && page !== "location") return;
    const locationId = page === "location"
      ? String(selectedLocation?.id || initialPublicLocationId || "")
      : undefined;
    const state: SeekMyHistoryState = {
      seekmy: true,
      page,
      prevPage,
      ...(locationId ? { locationId } : {}),
    };
    window.history.replaceState(state, "", appUrlFor(page, locationId));
    hasWrittenInitialHistory.current = true;
  }, [initialPublicLocationId, page, prevPage, selectedLocation?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as Partial<SeekMyHistoryState> | null;
      if (!state?.seekmy || !isPage(state.page)) return;
      applyingBrowserHistory.current = true;
      setPrevPage(isPage(state.prevPage) ? state.prevPage : "home");
      if (state.page === "location") {
        const location = allLocations.find((item) => String(item.id) === String(state.locationId))
          || selectedLocation;
        setSelectedLocation(location || null);
        setLocationInitialTab("overview");
      }
      setPage(state.page);
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => { applyingBrowserHistory.current = false; }, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [allLocations, selectedLocation]);

  function navigate(p: Page) {
    // Opening Discover normally should always start with ALL locations.
    // A state-card click can set the state immediately after this call.
    if (p === "explore") {
      setSelectedState("");
      refreshLocationReviewSummaries();
    }

    const nextPrevPage = page;
    const locationId = p === "location"
      ? pendingHistoryLocationId.current || (selectedLocation ? String(selectedLocation.id) : undefined)
      : undefined;
    setPrevPage(nextPrevPage);
    setPage(p);
    setMobileOpen(false);
    if (!applyingBrowserHistory.current && typeof window !== "undefined") {
      const state: SeekMyHistoryState = {
        seekmy: true,
        page: p,
        prevPage: nextPrevPage,
        ...(locationId ? { locationId } : {}),
      };
      window.history.pushState(state, "", appUrlFor(p, locationId));
    }
    pendingHistoryLocationId.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openWeatherMap() {
    setOpenMapWeather(true);
    navigate("map");
  }
  function selectLocation(l: Location) {
    setSelectedLocation(l);
    setLocationInitialTab("overview");
    pendingHistoryLocationId.current = String(l.id);
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
    pendingHistoryLocationId.current = String(location.id);
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
  async function refreshUnreadAnnouncements(currentUser = user) {
    if (!currentUser) {
      setUnreadAnnouncements(0);
      return;
    }
    try {
      const [ownRows, globalRows] = await Promise.all([
        firebaseClient.entities.Announcement.filter({ userId: currentUser.id }, undefined, 500),
        firebaseClient.entities.Announcement.filter({ userId: "all" }, undefined, 500).catch(()=>[]),
      ]);
      const seen = new Set<string>();
      const rows = [...ownRows, ...globalRows].filter((announcement:any)=>!announcement.dismissed && !seen.has(String(announcement.id)) && seen.add(String(announcement.id)));
      setUnreadAnnouncements(rows.filter((announcement:any)=>!announcement.read).length);
    } catch {
      setUnreadAnnouncements(0);
    }
  }
  async function toggleBookmark(id: number | string) {
    if (!user) { setShowAuth(true); return; }
    const requestKey = String(id);
    if (bookmarkRequests.current.has(requestKey)) return;
    bookmarkRequests.current.add(requestKey);
    const existing = bookmarks.find((b) => String(b.locationId) === String(id));
    try {
      if (existing) {
        const documentIds = [existing.firestoreId, ...(existing.duplicateFirestoreIds || [])].filter(Boolean) as string[];
        await Promise.all(documentIds.map((documentId) => firebaseClient.entities.Bookmark.delete(documentId)));
        setBookmarks((p)=>p.filter((b)=>String(b.locationId)!==String(id)));
      } else {
        const documentId = `bookmark_${encodeURIComponent(user.id)}_${encodeURIComponent(String(id))}`;
        const created:any = await firebaseClient.entities.Bookmark.createWithId(documentId, {
          locationId:id, notes:"", folderIds:[], folders:[], folder:"Uncategorized", sharedFolderId:null, savedAt:new Date().toISOString(),
        });
        setBookmarks((p)=>dedupeBookmarkEntries([{firestoreId:String(created.id),locationId:id,notes:"",folderIds:[],folders:[],folder:"Uncategorized",sharedFolderId:null,savedAt:created.savedAt||created.created_date||new Date().toISOString()},...p]));
      }
    } catch (error:any) { showToast(error?.message || "Unable to update bookmark in Firebase.", "err"); }
    finally { bookmarkRequests.current.delete(requestKey); }
  }
  function refreshLocations(extra?: Location) {
    if (extra) {
      if (!isVisibleLocation(extra)) {
        setAllLocations((current)=>current.filter((l)=>String(l.id)!==String(extra.id) && `${l.name}|${l.state}`.toLowerCase()!==`${extra.name}|${extra.state}`.toLowerCase()));
        return;
      }
      setAllLocations((current)=>current.some((l)=>String(l.id)===String(extra.id))?current.map((l)=>String(l.id)===String(extra.id)?extra:l):[extra,...current]);
    }
    else firebaseClient.entities.Location.list("name").then(async (rows:any[])=>setAllLocations(await prepareLocations(rows as Location[]))).catch(()=>setAllLocations(STARTER_LOCATIONS));
  }
  if (typeof window !== "undefined") (window as any).__seekmyRefreshLocations = (loc: Location) => refreshLocations(loc);
  function setBookmarksPersist(updater: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) {
    setBookmarks((previous) => {
      const next = dedupeBookmarkEntries(typeof updater === "function" ? updater(previous) : updater);
      const nextIds = new Set(next.map((b)=>String(b.locationId)));
      previous.filter((b)=>!nextIds.has(String(b.locationId)))
        .forEach((b)=>[b.firestoreId, ...(b.duplicateFirestoreIds || [])].filter(Boolean).forEach((documentId)=>firebaseClient.entities.Bookmark.delete(documentId!).catch(()=>{})));
      next.forEach((b)=>{
        const old = previous.find((x)=>String(x.locationId)===String(b.locationId));
        if (old?.firestoreId && (old.notes!==b.notes || JSON.stringify(old.folderIds||[])!==JSON.stringify(b.folderIds||[]))) {
          const folderIds = [...new Set(b.folderIds || [])];
          const folders = folderIds.map((id) => personalFolders.find((folder) => folder.id === id)?.name).filter(Boolean) as string[];
          [old.firestoreId, ...(old.duplicateFirestoreIds || [])].forEach((documentId)=>firebaseClient.entities.Bookmark.update(documentId,{notes:b.notes,folderIds,folders,folder:folders[0]||"Uncategorized",sharedFolderId:null}).catch(()=>{}));
        }
      });
      return next;
    });
  }

  async function updateBookmarkFolders(locationId: string | number, requestedFolderIds: string[]) {
    const bookmark = bookmarks.find((entry) => String(entry.locationId) === String(locationId));
    if (!bookmark) throw new Error("Bookmark not found. Refresh the page and try again.");
    const documentIds = [bookmark.firestoreId, ...(bookmark.duplicateFirestoreIds || [])].filter(Boolean) as string[];
    if (!documentIds.length) throw new Error("Bookmark database record not found. Refresh the page and try again.");

    const folderIds = [...new Set(requestedFolderIds)].filter((id) => personalFolders.some((folder) => folder.id === id));
    const folders = folderIds.map((id) => personalFolders.find((folder) => folder.id === id)?.name).filter(Boolean) as string[];
    await Promise.all(documentIds.map((documentId) => firebaseClient.entities.Bookmark.update(documentId, { folderIds, folders, folder: folders[0] || "Uncategorized", sharedFolderId: null })));
    setBookmarks((previous) => dedupeBookmarkEntries(previous.map((entry) => (
      String(entry.locationId) === String(locationId) ? { ...entry, folderIds, folders, folder: folders[0] || "Uncategorized", sharedFolderId: null } : entry
    ))));
  }

  async function createPersonalFolder(name: string): Promise<PersonalBookmarkFolder> {
    if (!user) throw new Error("Please sign in first.");
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Folder name cannot be empty.");
    if (isReservedPersonalFolderName(cleanName)) throw new Error("This folder name is reserved. Please choose another name.");
    if (personalFolders.some((folder) => normalizedFolderName(folder.name) === normalizedFolderName(cleanName))) throw new Error("A folder with this name already exists. Please choose another name.");
    const now = new Date().toISOString();
    const id = `bookmark_folder_${encodeURIComponent(user.id)}_${crypto.randomUUID()}`;
    const created = await firebaseClient.entities.BookmarkFolder.createWithId(id, { ownerUid: user.id, name: cleanName, isDefault: false, createdAt: now, updatedAt: now });
    const folder = normalizePersonalFolder(created);
    setPersonalFolders((current) => [...current, folder]);
    return folder;
  }

  async function renamePersonalFolder(folderId: string, name: string): Promise<void> {
    const folder = personalFolders.find((item) => item.id === folderId);
    if (!folder) throw new Error("Folder not found.");
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Folder name cannot be empty.");
    if (isReservedPersonalFolderName(cleanName)) throw new Error("This folder name is reserved. Please choose another name.");
    if (personalFolders.some((item) => item.id !== folderId && normalizedFolderName(item.name) === normalizedFolderName(cleanName))) throw new Error("A folder with this name already exists. Please choose another name.");
    const affected = bookmarks.filter((bookmark) => (bookmark.folderIds || []).includes(folderId));
    const now = new Date().toISOString();
    await firebaseClient.entities.BookmarkFolder.update(folderId, { name: cleanName, updatedAt: now });
    await Promise.all(affected.flatMap((bookmark) => [bookmark.firestoreId, ...(bookmark.duplicateFirestoreIds || [])].filter(Boolean).map((documentId) => {
      const folderIds = [...new Set(bookmark.folderIds || [])];
      const folders = folderIds.map((id) => id === folderId ? cleanName : personalFolders.find((item) => item.id === id)?.name).filter(Boolean) as string[];
      return firebaseClient.entities.Bookmark.update(documentId!, { folderIds, folders, folder: folders[0] || "Uncategorized" });
    })));
    setPersonalFolders((current) => current.map((item) => item.id === folderId ? { ...item, name: cleanName, updatedAt: now } : item));
    setBookmarks((current) => current.map((bookmark) => (bookmark.folderIds || []).includes(folderId) ? { ...bookmark, folders: (bookmark.folderIds || []).map((id) => id === folderId ? cleanName : personalFolders.find((item) => item.id === id)?.name).filter(Boolean) as string[] } : bookmark));
  }

  async function deletePersonalFolder(folderId: string, beforeFolderDelete?: () => Promise<void>): Promise<void> {
    const folder = personalFolders.find((item) => item.id === folderId);
    if (!folder) throw new Error("Folder not found.");
    const affected = bookmarks.filter((bookmark) => (bookmark.folderIds || []).includes(folderId));
    const bookmarkUpdates = affected.flatMap((bookmark) => {
      const documentIds = [bookmark.firestoreId, ...(bookmark.duplicateFirestoreIds || [])].filter(Boolean) as string[];
      if (!documentIds.length) throw new Error("A bookmark database record is missing. Refresh the page and try again.");
      const folderIds = [...new Set(bookmark.folderIds || [])].filter((id) => id !== folderId);
      const folders = folderIds.map((id) => personalFolders.find((item) => item.id === id)?.name).filter(Boolean) as string[];
      return documentIds.map((documentId) => firebaseClient.entities.Bookmark.update(documentId, {
        folderIds,
        folders,
        folder: folders[0] || "Uncategorized",
        sharedFolderId: null,
      }));
    });
    await Promise.all(bookmarkUpdates);
    setBookmarks((current) => dedupeBookmarkEntries(current.map((bookmark) => {
      if (!(bookmark.folderIds || []).includes(folderId)) return bookmark;
      const folderIds = [...new Set(bookmark.folderIds || [])].filter((id) => id !== folderId);
      const folders = folderIds.map((id) => personalFolders.find((item) => item.id === id)?.name).filter(Boolean) as string[];
      return { ...bookmark, folderIds, folders, folder: folders[0] || "Uncategorized", sharedFolderId: null };
    })));
    if (beforeFolderDelete) await beforeFolderDelete();
    await firebaseClient.entities.BookmarkFolder.delete(folderId);
    setPersonalFolders((current) => current.filter((item) => item.id !== folderId));
  }

  async function ensurePersonalFolders(current: AppUser, bookmarkRows: any[], folderRows: any[]): Promise<PersonalBookmarkFolder[]> {
    const normalizedRows = folderRows.map(normalizePersonalFolder).filter((folder) => folder.name);
    const reservedFolders = normalizedRows.filter((folder) => isReservedPersonalFolderName(folder.name));
    await Promise.all(reservedFolders.map((folder) => firebaseClient.entities.BookmarkFolder.delete(folder.id)));
    const loaded = normalizedRows.filter((folder) => !isReservedPersonalFolderName(folder.name));
    const usedFolderIds = new Set(bookmarkRows.flatMap((row: any) => Array.isArray(row.folderIds) ? row.folderIds.map(String) : []));
    const usedFolderNames = new Set(bookmarkRows.flatMap((row: any) => [
      ...(Array.isArray(row.folders) ? row.folders.map(String) : []),
      String(row.folder || ""),
    ]).map(normalizedFolderName).filter((name: string) => name && name !== "all" && name !== "uncategorized"));
    const existing: PersonalBookmarkFolder[] = [];
    for (const folder of loaded) {
      if (!folder.isDefault) {
        existing.push(folder);
        continue;
      }
      const isUsed = usedFolderIds.has(folder.id) || usedFolderNames.has(normalizedFolderName(folder.name));
      if (!isUsed) {
        await firebaseClient.entities.BookmarkFolder.delete(folder.id);
        continue;
      }
      const now = new Date().toISOString();
      await firebaseClient.entities.BookmarkFolder.update(folder.id, { isDefault: false, updatedAt: now });
      existing.push({ ...folder, isDefault: false, updatedAt: now });
    }
    const byName = new Map(existing.map((folder) => [normalizedFolderName(folder.name), folder]));
    const legacyNames = [...new Set([
      ...bookmarkRows.flatMap((row: any) => Array.isArray(row.folders) ? row.folders.map(String) : []),
      ...bookmarkRows.map((row: any) => String(row.folder || "")),
    ].map((name) => String(name).trim()).filter((name) => name && !isReservedPersonalFolderName(name)))];
    for (const name of legacyNames) {
      const key = normalizedFolderName(name);
      if (byName.has(key)) continue;
      const now = new Date().toISOString();
      const id = legacyPersonalFolderId(current.id, name);
      const created = await firebaseClient.entities.BookmarkFolder.createWithId(id, { ownerUid: current.id, name, isDefault: false, createdAt: now, updatedAt: now });
      const folder = normalizePersonalFolder(created);
      existing.push(folder);
      byName.set(key, folder);
    }
    return existing
      .map((folder) => ({ ...folder, isDefault: false }))
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  async function loadUserFirebaseData(current: AppUser) {
      const [bookmarkRows, folderRows, backendData] = await Promise.all([
        firebaseClient.entities.Bookmark.filter({ created_by_id: current.id }, "-created_date", 500),
        firebaseClient.entities.BookmarkFolder.filter({ created_by_id: current.id }, undefined, 500),
        firebaseClient.backend.getMyData(),
      ]);
      const logRows = backendData.activities;
      const badgeRows = backendData.badges;

    const ensuredFolders = await ensurePersonalFolders(current, bookmarkRows, folderRows);
    setPersonalFolders(ensuredFolders);
    const normalizedBookmarks = normalizeBookmarkRows(bookmarkRows, ensuredFolders);
    setBookmarks(normalizedBookmarks);
    void Promise.all(bookmarkRows.map((row:any)=>{
      const normalized = normalizedBookmarks.find((entry)=>String(entry.firestoreId)===String(row.id));
      const folderIds = normalized?.folderIds || [];
      const folders = normalized?.folders || [];
      const unchanged = JSON.stringify(row.folderIds || []) === JSON.stringify(folderIds) && JSON.stringify(row.folders || []) === JSON.stringify(folders) && !row.sharedFolderId && !row.shared_folder_id;
      return normalized && !unchanged ? firebaseClient.entities.Bookmark.update(String(row.id), { folderIds, folders, folder: folders[0] || "Uncategorized", sharedFolderId: null }) : Promise.resolve();
    })).catch(()=>{});

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
      is_hidden_gem:l.is_hidden_gem===true || l.isHiddenGem===true,
      isHiddenGem:l.is_hidden_gem===true || l.isHiddenGem===true,
      locationId:l.locationId ?? l.location_id,
      state:l.state || "",
      })));
      setEarnedBadgeIds(badgeRows.map((badge:any)=>String(badge.key || badge.id).replace(`${current.id}_`, "")));
      refreshUnreadAnnouncements(current);
  }

  async function addLog(l: Omit<ActivityLog, "id">) {
    if (!user) { setShowAuth(true); return; }
    try {
      const result = await firebaseClient.backend.createActivity(l);
      setActivityLogs(prev => [result.activity as ActivityLog, ...prev]);
      if (result.newBadges.length) {
        setEarnedBadgeIds(ids => [...new Set([...ids, ...result.newBadges.map((badge:any) => badge.key)])]);
        await Promise.all(result.newBadges.map((badge:any)=>firebaseClient.entities.Announcement.create({
          userId:user.id,
          title:`Achievement unlocked: ${badge.name}`,
          message:badgeAchievementMessage({ name: badge.name, desc: badge.desc || "Keep exploring Malaysia's outdoor places with SeekMY.", icon: badge.icon || "" }),
          type:"achievement",
          relatedPage:"badges",
          submissionId:badge.key,
          read:false,
          dismissed:false,
          createdAt:new Date().toISOString(),
        }).catch(()=>{})));
        refreshUnreadAnnouncements(user);
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
  async function updateLog(id: string | number, changes: Partial<Omit<ActivityLog, "id">>) {
    try {
      const updated:any = await firebaseClient.backend.updateActivity(String(id), changes);
      setActivityLogs(previous => previous.map(log => String(log.id) === String(id) ? { ...log, ...(updated.activity as ActivityLog) } : log));
      showToast("Activity updated and statistics recalculated.");
    } catch (error:any) {
      try {
        const updated:any = await firebaseClient.entities.ActivityLog.update(String(id), changes);
        setActivityLogs(previous => previous.map(log => String(log.id) === String(id) ? { ...log, ...updated } : log));
        showToast("Activity updated.");
      } catch {
        showToast(error?.message || "Unable to update activity.", "err");
        throw error;
      }
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
    setPersonalFolders([]);
    setActivityLogs([]);
    setUnreadAnnouncements(0);
    navigate("home");
  }
  function setLanguage(next: Language) {
    setLanguageState(next);
    window.localStorage.setItem("seekmy-language", next);
  }
  function finishOnboarding() {
    window.localStorage.setItem("seekmy-onboarding-complete", "true");
    setShowOnboarding(false);
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

  if (sharedFolderToken) {
    return (
      <>
        <SharedBookmarksPage
          token={sharedFolderToken}
          user={user}
          personalFolderNames={personalFolders.map((folder) => folder.name)}
          onSignIn={() => setShowAuth(true)}
          onOpenBookmarks={() => navigate("bookmarks")}
        />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} language={language}/>}
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-[120] max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-3 text-center text-sm font-bold text-white shadow-lg" style={{ backgroundColor: toast.type === "err" ? C.error : C.jungle, fontFamily: F.body }}>
            {toast.msg}
          </div>
        )}
      </>
    );
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
        unreadAnnouncements={unreadAnnouncements}
        language={language}
        setLanguage={setLanguage}
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
          language={language}
        />
      )}
      {/* ==================== LowJunFeng END - Home Module ==================== */}

      {/* ==================== LimRouYu Part - Map Module ==================== */}
      {page === "map" && (
        <MapPage
          setPage={navigate}
          setSelectedLocation={selectLocation}
          locations={allLocations}
          activityLogs={activityLogs}
          language={language}
          openWeather={openMapWeather}
          onWeatherOpened={() => setOpenMapWeather(false)}
        />
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
          language={language}
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
          language={language}
        />
      )}
      {/* ==================== WilsonChoongWeiShan Part - AI Outdoor Assistant Chatbot ==================== */}
      {page === "ai" && <AIPage locations={allLocations} language={language}/>}
      {/* ==================== WilsonChoongWeiShan END - AI Outdoor Assistant Chatbot ==================== */}
      {/* ==================== FongXinTong Part - Community Leaderboard & Ranking Module ==================== */}
      {page === "leaderboard" && <LeaderboardPage currentUserId={user?.id} language={language}/>}
      {/* ==================== FongXinTong END - Community Leaderboard & Ranking Module ==================== */}
      {/* ==================== FongXinTong Part - Activity Log Module ==================== */}
      {page === "log" && (
        <LogPage user={user} logs={activityLogs} locations={allLocations} initialLocation={logLocation} onInitialLocationUsed={() => setLogLocation(null)} onAddLog={addLog} onUpdateLog={updateLog} onDeleteLog={deleteLog} onOpenLocation={openLocationFromLog} onSignIn={() => setShowAuth(true)} language={language}/>
      )}
      {/* ==================== FongXinTong END - Activity Log Module ==================== */}

      {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
      {page === "bookmarks" && (
        <BookmarksPage
          bookmarks={bookmarks}
          personalFolders={personalFolders}
          setBookmarks={setBookmarksPersist}
          updateBookmarkFolders={updateBookmarkFolders}
          createPersonalFolder={createPersonalFolder}
          renamePersonalFolder={renamePersonalFolder}
          deletePersonalFolder={deletePersonalFolder}
          setPage={navigate}
          setSelectedLocation={selectLocation}
          onToast={showToast}
          locations={allLocations}
          user={user}
          onSignIn={() => setShowAuth(true)}
          language={language}
        />
      )}
      {/* ==================== LimTzeXin END - Bookmark Module ==================== */}

      {/* ==================== WongYueShan Part - Local Contributor Portal ==================== */}
      {page === "contributor" && (
        <ContributorPage user={user} setPage={navigate} onSignIn={() => setShowAuth(true)} language={language} />
      )}
      {/* ==================== WongYueShan END - Local Contributor Portal ==================== */}

      {/* ==================== FongXinTong Part - Personal Stats Dashboard ==================== */}
      {page === "insights" && (
        <InsightsPage user={user} locations={allLocations} logs={activityLogs} bookmarks={bookmarks} onSignIn={() => setShowAuth(true)} language={language} />
      )}
      {/* ==================== FongXinTong END - Personal Stats Dashboard ==================== */}

      {page === "help" && <HelpPage setPage={navigate} onOpenWeatherMap={openWeatherMap} onStartTour={() => setShowOnboarding(true)} language={language} />}
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
          onAnnouncementsChanged={setUnreadAnnouncements}
          language={language}
        />
      )}

      {/* ==================== WilsonChoongWeiShan END - Account Module ==================== */}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} language={language}/>
      )}

      {page === "account" && !user && (
        <div className="pt-14 min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
          <div className="text-center max-w-xs px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.muted }}>
              <UserCircle size={32} style={{ color: C.jungle }}/>
            </div>
            <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>{t(language, "signInAccountTitle")}</h2>
            <p className="text-sm mb-6" style={{ color: C.textMuted, fontFamily: F.body }}>{t(language, "signInAccountText")}</p>
            <Pill variant="filled" onClick={() => setShowAuth(true)}>{t(language, "signInRegister")}</Pill>
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
      {showOnboarding && <OnboardingTour language={language} onFinish={finishOnboarding} />}

      <FrapButton page={page} setPage={navigate}/>
    </div>
  );
}
