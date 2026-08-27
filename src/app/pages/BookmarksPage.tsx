//==================== LimTzeXin Part - Bookmark Module ====================
import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, FolderPlus, Trash2, Edit3, Check, X, Share2, Copy, MessageCircle, Link2, MoreHorizontal, Eye, FolderInput, Plus, Users, LogOut, UserMinus } from "lucide-react";
import type { Location, Page, AppUser } from "../lib/types";
import type { BookmarkEntry, PersonalBookmarkFolder, SharedBookmarkFolder, SharedBookmarkLocation, SharedBookmarkMember } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import type { Language } from "../lib/i18n";
import { activityLabel, t } from "../lib/i18n";
import { firebaseClient } from "../api/firebaseClient";

export function BookmarksPage({
  bookmarks,
  personalFolders,
  setBookmarks,
  updateBookmarkFolders,
  createPersonalFolder,
  renamePersonalFolder,
  deletePersonalFolder,
  setPage,
  setSelectedLocation,
  onToast,
  locations,
  user,
  onSignIn,
  language = "en",
}: {
  bookmarks: BookmarkEntry[];
  personalFolders: PersonalBookmarkFolder[];
  setBookmarks: (b: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) => void;
  updateBookmarkFolders: (locationId: string | number, folderIds: string[]) => Promise<void>;
  createPersonalFolder: (name: string) => Promise<PersonalBookmarkFolder>;
  renamePersonalFolder: (folderId: string, name: string) => Promise<void>;
  deletePersonalFolder: (folderId: string, beforeFolderDelete?: () => Promise<void>) => Promise<void>;
  setPage: (p: Page) => void;
  setSelectedLocation: (l: Location) => void;
  onToast: (msg: string, type?: "ok" | "err") => void;
  locations: Location[];
  user: AppUser | null;
  onSignIn: () => void;
  language?: Language;
}) {
  const [folderFilter, setFolderFilter] = useState("All");
  const [newFolder, setNewFolder] = useState("");
  const [showOrganize, setShowOrganize] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editMode, setEditMode] = useState<"note" | null>(null);
  const [manageId, setManageId] = useState<string | number | null>(null);
  const [managePersonalFolders, setManagePersonalFolders] = useState<string[]>([]);
  const [manageSharedFolders, setManageSharedFolders] = useState<string[]>([]);
  const [manageBusy, setManageBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteSharedLocationFolderId, setDeleteSharedLocationFolderId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | number | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<PersonalBookmarkFolder | null>(null);
  const [deleteFolderBusy, setDeleteFolderBusy] = useState(false);
  const [shareFolder, setShareFolder] = useState<string | null>(null);
  const [shareFolderId, setShareFolderId] = useState<string | null>(null);
  const [sharePersonalFolderId, setSharePersonalFolderId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareActive, setShareActive] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [sharedFolders, setSharedFolders] = useState<SharedBookmarkFolder[]>([]);
  const [sharedFoldersLoading, setSharedFoldersLoading] = useState(Boolean(user));
  const [membersFolder, setMembersFolder] = useState<SharedBookmarkFolder | null>(null);
  const [members, setMembers] = useState<SharedBookmarkMember[]>([]);
  const [membersBusy, setMembersBusy] = useState(false);
  const orderedPersonalFolders = useMemo(() => [
    ...personalFolders.filter((folder) => folder.isDefault),
    ...personalFolders.filter((folder) => !folder.isDefault),
  ], [personalFolders]);

  const selectedPersonalFolder = useMemo(() => {
    if (!folderFilter.startsWith("personal:")) return null;
    return personalFolders.find((folder) => folder.id === folderFilter.slice(9)) || null;
  }, [folderFilter, personalFolders]);

  const selectedSharedFolder = useMemo(() => {
    if (!folderFilter.startsWith("shared:")) return null;
    return sharedFolders.find((folder) => folder.id === folderFilter.slice(7)) || null;
  }, [folderFilter, sharedFolders]);

  function ownerCollaborationForPersonalFolder(personalFolder: PersonalBookmarkFolder) {
    const exactMatch = sharedFolders.find((folder) => (
      folder.viewerRole === "owner" && folder.personalFolderId === personalFolder.id
    ));
    if (exactMatch) return exactMatch;

    const normalizedName = personalFolder.name.trim().toLocaleLowerCase();
    const personalNameIsUnique = personalFolders.filter((folder) => (
      folder.name.trim().toLocaleLowerCase() === normalizedName
    )).length === 1;
    if (!personalNameIsUnique) return null;

    const legacyMatches = sharedFolders.filter((folder) => (
      folder.viewerRole === "owner" &&
      !folder.personalFolderId &&
      folder.name.trim().toLocaleLowerCase() === normalizedName
    ));
    return legacyMatches.length === 1 ? legacyMatches[0] : null;
  }

  const selectedPersonalShare = useMemo(() => {
    if (!selectedPersonalFolder) return null;
    return ownerCollaborationForPersonalFolder(selectedPersonalFolder);
  }, [selectedPersonalFolder, sharedFolders, personalFolders]);

  const visibleSharedFolders = useMemo(() => sharedFolders.filter((folder) => (
    folder.viewerRole !== "owner" ||
    !personalFolders.some((personalFolder) => ownerCollaborationForPersonalFolder(personalFolder)?.id === folder.id)
  )), [sharedFolders, personalFolders]);

  const activeSharedFolder = selectedSharedFolder || selectedPersonalShare;
  const collaborationExists = Boolean(activeSharedFolder);
  const activeMemberCount = activeSharedFolder?.memberCount ?? 0;
  const linkSharingEnabled = activeSharedFolder?.sharingEnabled === true;

  function sharedFoldersContaining(locationId: string | number) {
    const byFolderId = new Map<string, SharedBookmarkFolder>();
    for (const folder of sharedFolders) {
      if (folder.locations.some((location) => String(location.id) === String(locationId))) byFolderId.set(folder.id, folder);
    }
    return [...byFolderId.values()];
  }

  function canonicalFolderMemberships(bookmark: BookmarkEntry) {
    const personalIds = new Set(bookmark.folderIds || []);
    const shared = sharedFoldersContaining(bookmark.locationId).filter((folder) => !(
      folder.viewerRole === "owner" && folder.personalFolderId && personalIds.has(folder.personalFolderId)
    ));
    const personal = personalFolders.filter((folder) => personalIds.has(folder.id));
    return { personal, shared };
  }

  const filtered = useMemo(() => {
    if (selectedSharedFolder) return [];
    return bookmarks.filter((bookmark) => {
      if (folderFilter === "All") return true;
      if (folderFilter === "Uncategorized") return canonicalFolderMemberships(bookmark).personal.length === 0;
      if (selectedPersonalFolder) return canonicalFolderMemberships(bookmark).personal.some((folder) => folder.id === selectedPersonalFolder.id);
      return false;
    });
  }, [bookmarks, folderFilter, selectedPersonalFolder, selectedSharedFolder, sharedFolders, personalFolders]);

  const personalSavedLocs = filtered.map((b) => {
      const loc = locations.find((l) => String(l.id) === String(b.locationId));
      return loc ? { loc, entry: b } : null;
    })
    .filter(Boolean) as { loc: Location; entry: BookmarkEntry }[];

  const savedLocs = activeSharedFolder
    ? activeSharedFolder.locations.map((sharedLocation) => ({
        loc: locations.find((item) => String(item.id) === String(sharedLocation.id)) || { ...sharedLocation, image_url: sharedLocation.imageUrl } as Location,
        entry: { locationId: sharedLocation.id, notes: "", folderIds: [], folders: [], folder: "Uncategorized", savedAt: "" } as BookmarkEntry,
        sharedLocation,
      }))
    : personalSavedLocs.map((item) => ({ ...item, sharedLocation: undefined as SharedBookmarkLocation | undefined }));
  const managedLocation = manageId == null ? null : locations.find((item) => String(item.id) === String(manageId)) || null;

  useEffect(() => {
    if (!user) {
      setSharedFolders([]);
      setSharedFoldersLoading(false);
      return;
    }
    let cancelled = false;
    setSharedFoldersLoading(true);
    firebaseClient.backend.getMyCollaborativeFolders()
      .then((result) => { if (!cancelled) setSharedFolders(result.folders as SharedBookmarkFolder[]); })
      .catch((error: any) => { if (!cancelled) onToast(error?.message || "Unable to load shared folders.", "err"); })
      .finally(() => { if (!cancelled) setSharedFoldersLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  async function refreshSharedFolders(preferredFolderId?: string) {
    const result = await firebaseClient.backend.getMyCollaborativeFolders();
    const refreshedFolders = result.folders as SharedBookmarkFolder[];
    setSharedFolders(refreshedFolders);
    if (preferredFolderId) setFolderFilter(`shared:${preferredFolderId}`);
    return refreshedFolders;
  }

  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.muted }}>
            <Bookmark size={30} style={{ color: C.jungle }} />
          </div>
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>{t(language, "myBookmarks")}</h1>
          <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>{t(language, "signInBookmarks")}</p>
          <Pill variant="filled" onClick={onSignIn}>{t(language, "signIn")}</Pill>
        </div>
      </div>
    );
  }

  async function createFolder() {
    const name = newFolder.trim();
    if (!name) return;
    const normalizedName = name.toLocaleLowerCase();
    if (normalizedName === "all" || normalizedName === "uncategorized") {
      onToast("This folder name is reserved. Please choose another name.", "err");
      return;
    }
    if ([...personalFolders, ...sharedFolders].some((folder) => folder.name.trim().toLocaleLowerCase() === normalizedName)) {
      onToast("A folder with this name already exists. Please choose another name.", "err");
      return;
    }
    try {
      const folder = await createPersonalFolder(name);
      if (manageId != null) setManagePersonalFolders((current) => [...new Set([...current, folder.id])]);
      setNewFolder("");
      setShowCreateFolderModal(false);
      onToast("Folder created successfully.");
    } catch (error: any) {
      onToast(error?.message || "Unable to create this folder.", "err");
    }
  }

  async function saveEdit() {
    if (editId == null) return;
    setBookmarks((prev) =>
      prev.map((b) =>
        String(b.locationId) === String(editId) ? { ...b, notes: editNotes } : b
      )
    );
    setEditId(null);
    setEditMode(null);
    onToast("Bookmark updated successfully.");
  }

  function openManageFolders(locationId: string | number) {
    const bookmark = bookmarks.find((item) => String(item.locationId) === String(locationId));
    if (!bookmark) return;
    const canonical = canonicalFolderMemberships(bookmark);
    setManageId(locationId);
    setManagePersonalFolders(canonical.personal.map((folder) => folder.id));
    setManageSharedFolders(canonical.shared.map((folder) => folder.id));
    setActionMenuId(null);
  }

  async function saveManagedFolders() {
    if (manageId == null) return;
    const location = locations.find((item) => String(item.id) === String(manageId));
    const bookmark = bookmarks.find((item) => String(item.locationId) === String(manageId));
    if (!bookmark) {
      onToast("Bookmark not found. Refresh the page and try again.", "err");
      return;
    }
    const originalPersonalFolders = canonicalFolderMemberships(bookmark).personal.map((folder) => folder.id);
    const currentShared = sharedFoldersContaining(manageId).filter((folder) => visibleSharedFolders.some((visible) => visible.id === folder.id));
    const currentSharedIds = new Set(currentShared.map((folder) => folder.id));
    const desiredSharedIds = new Set(manageSharedFolders);
    const canonicalPersonalFolders = [...new Set(managePersonalFolders)].filter((folderId) => personalFolders.some((folder) => folder.id === folderId));
    const additions = visibleSharedFolders.filter((folder) => desiredSharedIds.has(folder.id) && !currentSharedIds.has(folder.id));
    const removals = currentShared.filter((folder) => !desiredSharedIds.has(folder.id));
    const originalPersonalIds = new Set(originalPersonalFolders);
    const desiredPersonalIds = new Set(canonicalPersonalFolders);
    const linkedAdditions = sharedFolders.filter((folder) => folder.viewerRole === "owner" && folder.personalFolderId && desiredPersonalIds.has(folder.personalFolderId) && !originalPersonalIds.has(folder.personalFolderId));
    const linkedRemovals = sharedFolders.filter((folder) => folder.viewerRole === "owner" && folder.personalFolderId && originalPersonalIds.has(folder.personalFolderId) && !desiredPersonalIds.has(folder.personalFolderId));
    const blockedRemoval = [...removals, ...linkedRemovals].find((folder) => !folder.locations.find((item) => String(item.id) === String(manageId))?.canRemove);
    if (blockedRemoval) {
      onToast(`You do not have permission to remove this location from ${blockedRemoval.name}.`, "err");
      return;
    }
    setManageBusy(true);
    try {
      await updateBookmarkFolders(manageId, canonicalPersonalFolders);
      await Promise.all([
        ...[...additions, ...linkedAdditions].map((folder) => firebaseClient.backend.addSharedBookmarkLocation(folder.id, manageId, location as unknown as Record<string, any>)),
        ...[...removals, ...linkedRemovals].map((folder) => firebaseClient.backend.removeSharedBookmarkLocation(folder.id, manageId)),
      ]);
      await refreshSharedFolders();
      const membershipCount = canonicalPersonalFolders.length + desiredSharedIds.size;
      const locationName = location?.name || "Location";
      setManageId(null);
      onToast(membershipCount ? `${locationName} folders updated.` : `${locationName} is now Uncategorized.`);
    } catch (error: any) {
      await updateBookmarkFolders(manageId, originalPersonalFolders).catch(() => undefined);
      const refreshed = await refreshSharedFolders().catch(() => sharedFolders);
      setManagePersonalFolders(originalPersonalFolders);
      setManageSharedFolders(refreshed.filter((folder) => folder.locations.some((item) => String(item.id) === String(manageId))).map((folder) => folder.id));
      onToast(error?.message || "Unable to update folder memberships.", "err");
    } finally {
      setManageBusy(false);
    }
  }

  function viewLocation(loc: Location) {
    setActionMenuId(null);
    setSelectedLocation(loc);
    setPage("location");
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    if (deleteSharedLocationFolderId) {
      try {
        await firebaseClient.backend.removeSharedBookmarkLocation(deleteSharedLocationFolderId, deleteId);
        await refreshSharedFolders(deleteSharedLocationFolderId);
        onToast("Location removed from the shared folder.");
      } catch (error: any) {
        onToast(error?.message || "Unable to remove this shared location.", "err");
      } finally {
        setDeleteId(null);
        setDeleteSharedLocationFolderId(null);
      }
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.locationId !== deleteId));
    setDeleteId(null);
    onToast("Bookmark removed successfully.");
  }

  async function confirmDeleteFolder() {
    if (!deleteFolderTarget) return;
    const folder = deleteFolderTarget;
    const linkedCollaboration = ownerCollaborationForPersonalFolder(folder);
    let collaborationDeleted = false;
    setDeleteFolderBusy(true);
    try {
      await deletePersonalFolder(folder.id, linkedCollaboration ? async () => {
        await firebaseClient.backend.deleteSharedBookmarkFolder(linkedCollaboration.id);
        collaborationDeleted = true;
      } : undefined);
      if (linkedCollaboration) setSharedFolders((current) => current.filter((item) => item.id !== linkedCollaboration.id));
      if (folderFilter === `personal:${folder.id}`) setFolderFilter("All");
      setDeleteFolderTarget(null);
      onToast("Folder deleted. Your saved locations were kept.");
    } catch (error: any) {
      if (collaborationDeleted) await refreshSharedFolders().catch(() => undefined);
      onToast(error?.message || "Unable to remove this folder.", "err");
    } finally {
      setDeleteFolderBusy(false);
    }
  }

  function startRenameFolder(folder: PersonalBookmarkFolder) {
    setRenamingFolderId(folder.id);
    setRenameFolderValue(folder.name);
  }

  async function renameFolder(folder: PersonalBookmarkFolder) {
    if (renamingFolderId !== folder.id) return;
    const nextName = renameFolderValue.trim();
    if (!nextName) {
      onToast("Folder name cannot be empty.", "err");
      return;
    }
    const normalizedName = nextName.toLocaleLowerCase();
    if (normalizedName === "all" || normalizedName === "uncategorized") {
      onToast("This folder name is reserved. Please choose another name.", "err");
      return;
    }
    if (
      personalFolders.some((item) => item.id !== folder.id && item.name.trim().toLocaleLowerCase() === normalizedName) ||
      sharedFolders.some((item) => item.personalFolderId !== folder.id && item.name.trim().toLocaleLowerCase() === normalizedName)
    ) {
      onToast("A folder with this name already exists. Please choose another name.", "err");
      return;
    }
    try {
      const linkedShare = sharedFolders.find((item) => item.viewerRole === "owner" && item.personalFolderId === folder.id);
      await renamePersonalFolder(folder.id, nextName);
      if (linkedShare) {
        await firebaseClient.backend.renameSharedBookmarkFolder(linkedShare.id, nextName);
        await refreshSharedFolders();
      }
      setRenamingFolderId(null);
      setRenameFolderValue("");
      onToast("Folder renamed successfully.");
    } catch (error: any) {
      onToast(error?.message || "Unable to rename this folder.", "err");
    }
  }

  async function openShareFolder(name: string, folderId?: string, personalFolderId?: string) {
    if (personalFolderId && sharedFolders.some((folder) => folder.personalFolderId !== personalFolderId && folder.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) {
      onToast("A folder with this name already exists. Please choose another name.", "err");
      return;
    }
    setFolderFilter(folderId ? `shared:${folderId}` : personalFolderId ? `personal:${personalFolderId}` : folderFilter);
    setShareFolder(name);
    setShareFolderId(folderId || null);
    setSharePersonalFolderId(personalFolderId || null);
    setShareLink("");
    setShareActive(false);
    setShareBusy(true);
    try {
      if (folderId) {
        const sharedFolder = sharedFolders.find((folder) => folder.id === folderId);
        setShareActive(sharedFolder?.sharingEnabled === true);
      } else {
        const status = await firebaseClient.backend.getBookmarkFolderShareStatus(personalFolderId || "", name);
        setShareActive(status.active);
        setShareFolderId(status.folderId);
      }
    } catch (error: any) {
      onToast(error?.message || "Unable to check folder sharing status.", "err");
    } finally {
      setShareBusy(false);
    }
  }

  async function generateShareLink() {
    if (!shareFolder) return;
    const locationIds = sharePersonalFolderId
      ? bookmarks.filter((bookmark) => (bookmark.folderIds || []).includes(sharePersonalFolderId)).map((bookmark) => bookmark.locationId)
      : shareFolderId ? sharedFolders.find((folder) => folder.id === shareFolderId)?.locations.map((item) => item.id) || [] : [];
    setShareBusy(true);
    try {
      const result = await firebaseClient.backend.createBookmarkFolderShare(shareFolder, locationIds, sharePersonalFolderId || undefined, sharePersonalFolderId ? undefined : shareFolderId || undefined);
      const link = `${window.location.origin}/shared/bookmarks/${encodeURIComponent(result.token)}`;
      setShareLink(link);
      setShareFolderId(result.folderId);
      setShareActive(true);
      await refreshSharedFolders(sharePersonalFolderId ? undefined : result.folderId);
      onToast(`Public link created for ${result.locationCount} location${result.locationCount === 1 ? "" : "s"}.`);
    } catch (error: any) {
      onToast(error?.message || "Unable to create the share link.", "err");
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      onToast("Share link copied.");
    } catch {
      onToast("Unable to copy automatically. Select and copy the link manually.", "err");
    }
  }

  async function disableFolderSharing() {
    if (!shareFolder) return;
    setShareBusy(true);
    try {
      await firebaseClient.backend.disableBookmarkFolderShare(shareFolder, shareFolderId || undefined, sharePersonalFolderId || undefined);
      setShareActive(false);
      setShareLink("");
      if (shareFolderId) await refreshSharedFolders(sharePersonalFolderId ? undefined : shareFolderId);
      onToast("Folder sharing disabled. The previous link no longer works.");
    } catch (error: any) {
      onToast(error?.message || "Unable to disable sharing.", "err");
    } finally {
      setShareBusy(false);
    }
  }

  async function openMembers(folder: SharedBookmarkFolder) {
    setMembersFolder(folder);
    setMembersBusy(true);
    try {
      const result = await firebaseClient.backend.getSharedBookmarkFolderMembers(folder.id);
      setMembers(result.members as SharedBookmarkMember[]);
    } catch (error: any) {
      onToast(error?.message || "Unable to load folder members.", "err");
      setMembersFolder(null);
    } finally {
      setMembersBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    if (!membersFolder) return;
    setMembersBusy(true);
    try {
      await firebaseClient.backend.removeSharedBookmarkFolderMember(membersFolder.id, membershipId);
      setMembers((current) => current.filter((member) => member.id !== membershipId));
      await refreshSharedFolders();
      onToast("Member removed.");
    } catch (error: any) {
      onToast(error?.message || "Unable to remove this member.", "err");
    } finally {
      setMembersBusy(false);
    }
  }

  async function leaveSharedFolder(folder: SharedBookmarkFolder) {
    try {
      await firebaseClient.backend.leaveSharedBookmarkFolder(folder.id);
      setSharedFolders((current) => current.filter((item) => item.id !== folder.id));
      setFolderFilter("All");
      onToast(`You left ${folder.name}.`);
    } catch (error: any) {
      onToast(error?.message || "Unable to leave this shared folder.", "err");
    }
  }

  async function renameSharedFolder(folder: SharedBookmarkFolder) {
    const nextName = renameFolderValue.trim();
    if (!nextName) return;
    const normalizedName = nextName.toLocaleLowerCase();
    if (normalizedName === "all" || normalizedName === "uncategorized" || [
      ...personalFolders,
      ...sharedFolders.filter((item) => item.id !== folder.id),
    ].some((item) => item.name.trim().toLocaleLowerCase() === normalizedName)) {
      onToast("A folder with this name already exists. Please choose another name.", "err");
      return;
    }
    try {
      await firebaseClient.backend.renameSharedBookmarkFolder(folder.id, nextName);
      await refreshSharedFolders(folder.id);
      setRenamingFolderId(null);
      setRenameFolderValue("");
      onToast("Shared folder renamed.");
    } catch (error: any) {
      onToast(error?.message || "Unable to rename this shared folder.", "err");
    }
  }

  async function deleteSharedFolder(folder: SharedBookmarkFolder) {
    try {
      await firebaseClient.backend.deleteSharedBookmarkFolder(folder.id);
      setSharedFolders((current) => current.filter((item) => item.id !== folder.id));
      setFolderFilter("All");
      onToast("Shared folder deleted.");
    } catch (error: any) {
      onToast(error?.message || "Unable to delete this shared folder.", "err");
    }
  }

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: C.muted }}>
              <BookmarkCheck size={18} style={{ color: C.jungle }} />
            </div>
            <div>
              <h1 className="text-3xl font-normal leading-tight" style={{ color: C.jungle, fontFamily: F.display }}>
                {t(language, "myBookmarks")}
              </h1>
              <p className="mt-1 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                Your saved places, organized your way.
              </p>
            </div>
          </div>
          <Pill variant="outline" small onClick={() => setShowOrganize((v) => !v)}>
            {showOrganize ? <Check size={14}/> : <FolderPlus size={13}/>} {showOrganize ? "Done" : t(language, "organize")}
          </Pill>
        </div>

        {/* Folder chips */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-3" style={{ scrollbarWidth: "none", borderColor: C.border }}>
          <button
            type="button"
            onClick={() => setFolderFilter("All")}
            className="h-8 flex-shrink-0 rounded-full px-3 text-[11px] font-bold whitespace-nowrap"
            style={{ backgroundColor: folderFilter === "All" ? C.jungle : C.muted, color: folderFilter === "All" ? "#fff" : C.textSub, fontFamily: F.body }}
          >All</button>
          {orderedPersonalFolders.map((folder) => {
            const linkedCollaboration = ownerCollaborationForPersonalFolder(folder);
            const hasOtherMembers = (linkedCollaboration?.memberCount ?? 0) > 1;
            return (
              <button
                type="button"
                key={folder.id}
                onClick={() => setFolderFilter(`personal:${folder.id}`)}
                className="flex h-8 flex-shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold whitespace-nowrap"
                style={{
                  backgroundColor: folderFilter === `personal:${folder.id}` ? C.jungle : C.muted,
                  color: folderFilter === `personal:${folder.id}` ? "#fff" : C.textSub,
                  fontFamily: F.body,
                }}
              >
                {hasOtherMembers && <Users size={11}/>} {activityLabel(language, folder.name)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFolderFilter("Uncategorized")}
            className="h-8 flex-shrink-0 rounded-full px-3 text-[11px] font-bold whitespace-nowrap"
            style={{ backgroundColor: folderFilter === "Uncategorized" ? C.jungle : C.muted, color: folderFilter === "Uncategorized" ? "#fff" : C.textSub, fontFamily: F.body }}
          >{activityLabel(language, "Uncategorized")}</button>
          {visibleSharedFolders.map((folder) => (
            <button
              type="button"
              key={folder.id}
              onClick={() => setFolderFilter(`shared:${folder.id}`)}
              className="flex h-8 flex-shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold whitespace-nowrap"
              style={{
                backgroundColor: folderFilter === `shared:${folder.id}` ? C.jungle : "#e8f1ec",
                color: folderFilter === `shared:${folder.id}` ? "#fff" : C.forest,
                fontFamily: F.body,
              }}
            >
              {folder.memberCount > 1 && <Users size={11}/>} {folder.name}
            </button>
          ))}
        </div>

        {showOrganize && (
          <div className="mb-6 overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: C.border, boxShadow: `0 8px 24px rgba(27,67,50,0.07)` }}>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5" style={{ backgroundColor: C.muted }}>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: F.display, color: C.jungle }}>Organize Bookmarks</h2>
                <p className="mt-1 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>Create folders and manage where each saved location appears.</p>
              </div>
              <Pill variant="filled" small onClick={() => setShowCreateFolderModal(true)}>
                <Plus size={14}/> Create New Folder
              </Pill>
            </div>
            <div className="border-t p-4" style={{ borderColor: C.border }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted, fontFamily: F.body }}>Custom folders</p>
              <div className="space-y-2">
              {personalFolders.filter((folder) => !folder.isDefault).map((folder) => (
                <div key={folder.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: C.cream }}>
                  {renamingFolderId === folder.id ? (
                    <input
                      value={renameFolderValue}
                      onChange={(event) => setRenameFolderValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void renameFolder(folder);
                        if (event.key === "Escape") setRenamingFolderId(null);
                      }}
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      style={{ color: C.text, fontFamily: F.body }}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{folder.name}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {renamingFolderId === folder.id ? (
                      <>
                        <button type="button" onClick={() => void renameFolder(folder)} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Save ${folder.name} folder name`}><Check size={14}/></button>
                        <button type="button" onClick={() => setRenamingFolderId(null)} className="rounded-full p-2" style={{ color: C.textMuted }} aria-label="Cancel folder rename"><X size={14}/></button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startRenameFolder(folder)} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Rename ${folder.name}`}><Edit3 size={14}/></button>
                    )}
                    <button type="button" onClick={() => setDeleteFolderTarget(folder)} className="rounded-full p-2" style={{ color: C.error, backgroundColor: C.errorBg }} aria-label={`Delete ${folder.name}`}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {personalFolders.every((folder) => folder.isDefault) && (
                <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>No custom folders yet.</p>
              )}
              </div>
              {visibleSharedFolders.length > 0 && (
                <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted, fontFamily: F.body }}>Shared folders</p>
                  <div className="space-y-2">
                    {visibleSharedFolders.map((folder) => {
                      const renameKey = `shared:${folder.id}`;
                      return (
                        <div key={folder.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: C.cream }}>
                          <div className="min-w-0 flex-1">
                            {renamingFolderId === renameKey ? (
                              <input value={renameFolderValue} onChange={(event) => setRenameFolderValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void renameSharedFolder(folder); if (event.key === "Escape") setRenamingFolderId(null); }} autoFocus className="w-full bg-transparent text-sm outline-none" style={{ color: C.text, fontFamily: F.body }}/>
                            ) : (
                              <><p className="truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}><Users size={12} className="mr-1.5 inline"/>{folder.name}</p><p className="text-[10px]" style={{ color: C.textMuted }}>{folder.viewerRole === "owner" ? "Owned by you" : "Member"} · {folder.memberCount} members</p></>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {folder.viewerRole === "owner" ? renamingFolderId === renameKey ? (
                              <><button type="button" onClick={() => void renameSharedFolder(folder)} className="rounded-full p-2" style={{ color: C.jungle }} aria-label="Save shared folder name"><Check size={14}/></button><button type="button" onClick={() => setRenamingFolderId(null)} className="rounded-full p-2" style={{ color: C.textMuted }}><X size={14}/></button></>
                            ) : (
                              <><button type="button" onClick={() => { setRenamingFolderId(renameKey); setRenameFolderValue(folder.name); }} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Rename ${folder.name}`}><Edit3 size={14}/></button><button type="button" onClick={() => deleteSharedFolder(folder)} className="rounded-full p-2" style={{ color: C.error, backgroundColor: C.errorBg }} aria-label={`Delete ${folder.name}`}><Trash2 size={14}/></button></>
                            ) : (
                              <button type="button" onClick={() => leaveSharedFolder(folder)} className="rounded-full p-2" style={{ color: C.error, backgroundColor: C.errorBg }} aria-label={`Leave ${folder.name}`}><LogOut size={14}/></button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>
              {showOrganize ? "Locations to organize" : selectedSharedFolder?.name || selectedPersonalFolder?.name || (folderFilter === "All" ? "All Bookmarks" : activityLabel(language, folderFilter))}
            </h2>
            <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>
              {collaborationExists && !showOrganize ? <>{activeMemberCount} member{activeMemberCount === 1 ? "" : "s"} · Link sharing {linkSharingEnabled ? "on" : "off"} · </> : null}{savedLocs.length} saved {savedLocs.length === 1 ? "location" : "locations"}
            </p>
          </div>
          {!showOrganize && (
            <div className="flex flex-wrap justify-end gap-2">
              {selectedSharedFolder ? (
                <>
                  {selectedSharedFolder.viewerRole === "owner" && <Pill variant="outline" small onClick={() => openShareFolder(selectedSharedFolder.name, selectedSharedFolder.id)}><Share2 size={13}/> Share</Pill>}
                  <Pill variant="outline" small onClick={() => openMembers(selectedSharedFolder)}><Users size={13}/> Members</Pill>
                  {selectedSharedFolder.viewerRole === "member" && <Pill variant="danger" small onClick={() => leaveSharedFolder(selectedSharedFolder)}><LogOut size={13}/> Leave</Pill>}
                </>
              ) : selectedPersonalFolder ? (
                <>
                  <Pill variant="outline" small onClick={() => openShareFolder(selectedPersonalFolder.name, undefined, selectedPersonalFolder.id)}><Share2 size={13}/> Share</Pill>
                  {selectedPersonalShare && <Pill variant="outline" small onClick={() => openMembers(selectedPersonalShare)}><Users size={13}/> Members</Pill>}
                </>
              ) : null}
            </div>
          )}
        </div>

        <div key={folderFilter} className="space-y-3">
          {savedLocs.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
              No bookmarks in this folder.
            </p>
          ) : (
            savedLocs.map(({ loc, entry, sharedLocation }) => {
              const imageUrl = loc.image_url || loc.image_urls?.[0];
              const menuOpen = String(actionMenuId) === String(loc.id);
              const editorOpen = String(editId) === String(loc.id);
              const canonicalMemberships = canonicalFolderMemberships(entry);
              const membershipBadges = activeSharedFolder
                ? [{ key: `shared:${activeSharedFolder.id}`, label: activeSharedFolder.name, shared: true }]
                : [
                    ...canonicalMemberships.shared.map((folder) => ({ key: `shared:${folder.id}`, label: folder.name, shared: true })),
                    ...canonicalMemberships.personal.map((folder) => ({ key: `personal:${folder.id}`, label: folder.name, shared: false })),
                    ...(canonicalMemberships.personal.length === 0 ? [{ key: "uncategorized", label: "Uncategorized", shared: false }] : []),
                  ];
              return (
                <div
                  key={`${activeSharedFolder ? `shared:${activeSharedFolder.id}` : "personal"}:${String(loc.id)}`}
                  className="relative rounded-[16px] border bg-white px-3 py-3"
                  style={{ borderColor: C.border, boxShadow: `0 3px 12px rgba(27,67,50,0.055)` }}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => viewLocation(loc)} className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl" style={{ backgroundColor: C.muted }}>
                      {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover"/> : loc.emoji}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button type="button" className="block w-full text-left" onClick={() => viewLocation(loc)}>
                        <p className="truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{loc.name}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>
                          {loc.state} · {loc.activity}
                        </p>
                      </button>

                      {showOrganize && activeSharedFolder ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold" style={{ color: C.textSub, fontFamily: F.body }}>
                          <span>Folder: <span className="rounded-full px-2 py-1" style={{ backgroundColor: C.muted, color: C.forest }}><Users size={10} className="mr-1 inline"/>{activeSharedFolder.name}</span></span>
                          {sharedLocation?.canRemove && <button type="button" onClick={() => { setDeleteId(loc.id); setDeleteSharedLocationFolderId(activeSharedFolder.id); }} className="rounded-full px-2 py-1 text-[10px]" style={{ backgroundColor: C.errorBg, color: C.error }}>Remove from folder</button>}
                        </div>
                      ) : showOrganize ? (
                        <button type="button" onClick={() => openManageFolders(loc.id)} className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: C.border, color: C.forest, fontFamily: F.body }}><FolderInput size={13}/> Manage folders</button>
                      ) : (
                        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
                          {(membershipBadges.length ? membershipBadges.slice(0, 2) : [{ key: "uncategorized", label: "Uncategorized", shared: false }]).map((badge) => (
                            <span key={badge.key} className="max-w-[150px] truncate rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: badge.shared ? "#e8f1ec" : C.muted, color: C.forest, fontFamily: F.body }}>
                              {badge.shared && <Users size={9} className="mr-1 inline"/>}{badge.label}
                            </span>
                          ))}
                          {membershipBadges.length > 2 && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: C.muted, color: C.textSub }}>+{membershipBadges.length - 2}</span>}
                          {entry.notes && <span className="truncate text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>Note: {entry.notes}</span>}
                        </div>
                      )}
                    </div>

                    {!showOrganize && (
                      <button
                        type="button"
                        onClick={() => setActionMenuId(menuOpen ? null : loc.id)}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ color: C.textSub, backgroundColor: menuOpen ? C.muted : "transparent" }}
                        aria-label={`Actions for ${loc.name}`}
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal size={18}/>
                      </button>
                    )}
                  </div>

                  {menuOpen && !showOrganize && (
                    <>
                    <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setActionMenuId(null)} aria-label="Close bookmark actions"/>
                    <div className="absolute right-3 top-12 z-20 w-48 overflow-hidden rounded-xl border bg-white py-1" style={{ borderColor: C.border, boxShadow: "0 12px 30px rgba(27,67,50,0.16)" }}>
                      <button type="button" onClick={() => viewLocation(loc)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ color: C.text, fontFamily: F.body }}><Eye size={14}/> View details</button>
                      {bookmarks.some((bookmark) => String(bookmark.locationId) === String(loc.id)) && <button type="button" onClick={() => openManageFolders(loc.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ color: C.text, fontFamily: F.body }}><FolderInput size={14}/> Manage folders</button>}
                      {!activeSharedFolder && <button type="button" onClick={() => { setEditId(loc.id); setEditMode("note"); setEditNotes(entry.notes || ""); setActionMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ color: C.text, fontFamily: F.body }}><Edit3 size={14}/> Edit note</button>}
                      {(!activeSharedFolder || sharedLocation?.canRemove) && <button type="button" onClick={() => { setDeleteId(loc.id); setDeleteSharedLocationFolderId(activeSharedFolder?.id || null); setActionMenuId(null); }} className="flex w-full items-center gap-2.5 border-t px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ borderColor: C.border, color: C.error, fontFamily: F.body }}><Trash2 size={14}/> {activeSharedFolder ? "Remove from shared folder" : "Remove bookmark"}</button>}
                    </div>
                    </>
                  )}

                  {editorOpen && !showOrganize && !activeSharedFolder && (
                    <div className="mt-3 border-t pt-3" style={{ borderColor: C.border }}>
                      <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={2} placeholder="Add a personal note…" className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}/>
                      <div className="mt-2 flex gap-2">
                        <Pill variant="filled" small onClick={saveEdit}><Check size={12}/> Save</Pill>
                        <Pill variant="outline" small onClick={() => { setEditId(null); setEditMode(null); }}><X size={12}/> Cancel</Pill>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {manageId != null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md rounded-[20px] bg-white p-6" role="dialog" aria-modal="true" aria-labelledby="manage-folders-title" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="manage-folders-title" className="text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>Manage folders</h2>
                <p className="mt-1 text-sm font-bold" style={{ color: C.textSub, fontFamily: F.body }}>{managedLocation?.name || "Saved location"}</p>
              </div>
              <button type="button" disabled={manageBusy} onClick={() => setManageId(null)} className="rounded-full p-2" style={{ backgroundColor: C.muted, color: C.textSub }} aria-label="Close manage folders dialog"><X size={15}/></button>
            </div>

            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              <p className="pb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted }}>Personal folders</p>
              {orderedPersonalFolders.map((folder) => {
                const checked = managePersonalFolders.includes(folder.id);
                return (
                  <label key={folder.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: checked ? C.muted : C.cream }}>
                    <input type="checkbox" checked={checked} disabled={manageBusy} onChange={() => setManagePersonalFolders((current) => checked ? current.filter((id) => id !== folder.id) : [...current, folder.id])} className="h-4 w-4 accent-[#174f3a]"/>
                    <span className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{folder.name}</span>
                  </label>
                );
              })}

              {visibleSharedFolders.length > 0 && <p className="pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted }}>Shared folders</p>}
              {visibleSharedFolders.map((folder) => {
                const checked = manageSharedFolders.includes(folder.id);
                const existingLocation = folder.locations.find((item) => String(item.id) === String(manageId));
                const disabled = manageBusy || Boolean(checked && existingLocation && !existingLocation.canRemove);
                return (
                  <label key={folder.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`} style={{ backgroundColor: checked ? "#e8f1ec" : C.cream }}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => setManageSharedFolders((current) => checked ? current.filter((id) => id !== folder.id) : [...current, folder.id])} className="h-4 w-4 accent-[#174f3a]"/>
                    <Users size={14} style={{ color: C.forest }}/>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{folder.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: C.textMuted }}>Shared</span>
                  </label>
                );
              })}
            </div>

            <button type="button" disabled={manageBusy} onClick={() => setShowCreateFolderModal(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: C.jungle, fontFamily: F.body }}><Plus size={14}/> Create new folder</button>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={manageBusy} onClick={() => setManageId(null)} className="rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-50" style={{ borderColor: C.border, color: C.textSub, fontFamily: F.body }}>Cancel</button>
              <button type="button" disabled={manageBusy} onClick={saveManagedFolders} className="rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-50" style={{ backgroundColor: C.jungle, fontFamily: F.body }}>{manageBusy ? "Saving…" : "Done"}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm rounded-[20px] bg-white p-6" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }} role="dialog" aria-modal="true" aria-labelledby="create-folder-title">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="create-folder-title" className="text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>Create New Folder</h2>
                <p className="mt-1 text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>Give this collection a clear, memorable name.</p>
              </div>
              <button type="button" onClick={() => { setShowCreateFolderModal(false); setNewFolder(""); }} className="rounded-full p-2" style={{ backgroundColor: C.muted, color: C.textSub }} aria-label="Close create folder dialog"><X size={15}/></button>
            </div>
            <label className="block text-xs font-bold" style={{ color: C.text, fontFamily: F.body }}>
              Folder name
              <input
                value={newFolder}
                onChange={(event) => setNewFolder(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") createFolder(); }}
                autoFocus
                placeholder="e.g. Weekend Adventures"
                className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm font-normal outline-none"
                style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Pill variant="outline" small onClick={() => { setShowCreateFolderModal(false); setNewFolder(""); }}>Cancel</Pill>
              <Pill variant="filled" small onClick={createFolder}>Create</Pill>
            </div>
          </div>
        </div>
      )}

      {deleteFolderTarget && (() => {
        const affectedCount = bookmarks.filter((bookmark) => (bookmark.folderIds || []).includes(deleteFolderTarget.id)).length;
        const linkedCollaboration = ownerCollaborationForPersonalFolder(deleteFolderTarget);
        return (
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <div className="w-full max-w-sm rounded-[20px] bg-white p-6" role="dialog" aria-modal="true" aria-labelledby="delete-folder-title" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }}>
              <h2 id="delete-folder-title" className="text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>Delete “{deleteFolderTarget.name}”?</h2>
              {linkedCollaboration ? (
                <div className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: C.textSub, fontFamily: F.body }}>
                  <p>This is a collaborative folder with {linkedCollaboration.memberCount} member{linkedCollaboration.memberCount === 1 ? "" : "s"}.</p>
                  <p>Deleting it will end the collaboration and remove the folder from members’ accounts.</p>
                  <p>Your {affectedCount} saved location{affectedCount === 1 ? "" : "s"} will not be deleted.</p>
                </div>
              ) : affectedCount > 0 ? (
                <div className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: C.textSub, fontFamily: F.body }}>
                  <p>This folder contains {affectedCount} saved location{affectedCount === 1 ? "" : "s"}.</p>
                  <p>Deleting this folder will not delete your saved locations. Locations that do not belong to another folder will appear under Uncategorized.</p>
                </div>
              ) : (
                <p className="mt-3 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>Are you sure you want to delete this folder?</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <Pill variant="outline" small disabled={deleteFolderBusy} onClick={() => setDeleteFolderTarget(null)}>Cancel</Pill>
                <Pill variant="danger" small disabled={deleteFolderBusy} onClick={confirmDeleteFolder}>{deleteFolderBusy ? "Deleting..." : "Delete Folder"}</Pill>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirm */}
      {deleteId != null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-[18px] p-6 max-w-sm w-full">
            <p className="font-bold mb-2" style={{ fontFamily: F.body, color: C.text }}>
              {deleteSharedLocationFolderId ? "Remove this location from the shared folder?" : "Remove this bookmark?"}
            </p>
            <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>
              {deleteSharedLocationFolderId ? "This change will be visible to every folder member." : "You can save it again later from the location page."}
            </p>
            <div className="flex gap-3">
              <Pill variant="outline" small onClick={() => { setDeleteId(null); setDeleteSharedLocationFolderId(null); }}>
                Cancel
              </Pill>
              <Pill variant="danger" small onClick={confirmDelete}>
                Remove
              </Pill>
            </div>
          </div>
        </div>
      )}

      {membersFolder && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md rounded-[20px] bg-white p-6" role="dialog" aria-modal="true" aria-labelledby="members-title" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><h2 id="members-title" className="text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>Folder Members</h2><p className="mt-1 text-xs" style={{ color: C.textMuted }}>{membersFolder.name} · {members.length} member{members.length === 1 ? "" : "s"}</p></div>
              <button type="button" onClick={() => setMembersFolder(null)} className="rounded-full p-2" style={{ backgroundColor: C.muted, color: C.textSub }} aria-label="Close members dialog"><X size={15}/></button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {membersBusy && members.length === 0 ? <p className="py-6 text-center text-sm" style={{ color: C.textMuted }}>Loading members...</p> : members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: C.cream }}>
                  <div className="min-w-0"><p className="truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{member.display_name}</p><p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: member.role === "owner" ? C.forest : C.textMuted }}>{member.role}</p></div>
                  {membersFolder.viewerRole === "owner" && member.role === "member" && <button type="button" disabled={membersBusy} onClick={() => removeMember(member.id)} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold" style={{ color: C.error, backgroundColor: C.errorBg }}><UserMinus size={12}/> Remove</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareFolder && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-md rounded-[18px] bg-white p-6" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Share2 size={17} style={{ color: C.jungle }}/>
                  <h2 className="text-lg font-bold" style={{ color: C.text, fontFamily: F.display }}>Share folder</h2>
                </div>
                <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>{shareFolder}</p>
              </div>
              <button type="button" onClick={() => setShareFolder(null)} className="rounded-full p-2" style={{ backgroundColor: C.muted, color: C.textSub }} aria-label="Close share folder dialog">
                <X size={15}/>
              </button>
            </div>

            <div className="mb-4 rounded-xl p-3 text-xs leading-relaxed" style={{ backgroundColor: C.muted, color: C.textSub, fontFamily: F.body }}>
              Anyone with the link can view this folder without signing in. SeekMY users may choose to join and collaborate; your account details and personal notes stay private.
            </div>

            {shareActive && !shareLink && (
              <p className="mb-4 text-xs" style={{ color: C.forest, fontFamily: F.body }}>
                Sharing is active. Generate a new link to replace the previous link, or disable sharing below.
              </p>
            )}

            {shareLink && (
              <div className="mb-4 space-y-3">
                <label className="block text-xs font-bold" style={{ color: C.text, fontFamily: F.body }}>Public share link</label>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: C.border }}>
                  <Link2 size={14} style={{ color: C.forest }}/>
                  <input readOnly value={shareLink} className="min-w-0 flex-1 bg-transparent text-xs outline-none" style={{ color: C.textSub, fontFamily: F.body }}/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Pill variant="outline" small onClick={copyShareLink}><Copy size={12}/> Copy link</Pill>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out my ${shareFolder} collection on SeekMY! ${shareLink}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold"
                    style={{ backgroundColor: "#25D366", color: "#fff", fontFamily: F.body }}
                  >
                    <MessageCircle size={12}/> WhatsApp
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Pill variant="filled" small onClick={generateShareLink} disabled={shareBusy}>
                <Share2 size={12}/> {shareBusy ? "Please wait..." : shareActive ? "Generate new link" : "Generate share link"}
              </Pill>
              {shareActive && (
                <Pill variant="danger" small onClick={disableFolderSharing} disabled={shareBusy}>
                  Disable sharing
                </Pill>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//==================== LimTzeXin END - Bookmark Module ====================
