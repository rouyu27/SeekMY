//==================== LimTzeXin Part - Bookmark Module ====================
import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, FolderPlus, Trash2, Edit3, Check, X, Share2, Copy, MessageCircle, Link2, MoreHorizontal, Eye, FolderInput, Plus, Users, LogOut, UserMinus } from "lucide-react";
import type { Location, Page, AppUser } from "../lib/types";
import type { BookmarkEntry, SharedBookmarkFolder, SharedBookmarkLocation, SharedBookmarkMember } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import type { Language } from "../lib/i18n";
import { activityLabel, t } from "../lib/i18n";
import { firebaseClient } from "../api/firebaseClient";

const DEFAULT_FOLDERS = ["All", "Hiking Trails", "Beach Spots", "Family Friendly", "Uncategorized"];

export function BookmarksPage({
  bookmarks,
  setBookmarks,
  setPage,
  setSelectedLocation,
  onToast,
  locations,
  user,
  onSignIn,
  language = "en",
}: {
  bookmarks: BookmarkEntry[];
  setBookmarks: (b: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) => void;
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
  const [editFolder, setEditFolder] = useState("Uncategorized");
  const [editMode, setEditMode] = useState<"move" | "note" | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteSharedLocationFolderId, setDeleteSharedLocationFolderId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | number | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [shareFolder, setShareFolder] = useState<string | null>(null);
  const [shareFolderId, setShareFolderId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareActive, setShareActive] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [sharedFolders, setSharedFolders] = useState<SharedBookmarkFolder[]>([]);
  const [sharedFoldersLoading, setSharedFoldersLoading] = useState(Boolean(user));
  const [membersFolder, setMembersFolder] = useState<SharedBookmarkFolder | null>(null);
  const [members, setMembers] = useState<SharedBookmarkMember[]>([]);
  const [membersBusy, setMembersBusy] = useState(false);
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    const fromData = Array.from(new Set(bookmarks.map((b) => b.folder).filter(Boolean)));
    return fromData.filter((f) => !DEFAULT_FOLDERS.includes(f));
  });

  const folders = useMemo(() => {
    const set = new Set([...DEFAULT_FOLDERS.filter((f) => f !== "All"), ...customFolders]);
    bookmarks.forEach((b) => b.folder && set.add(b.folder));
    const sharedNames = new Set(sharedFolders.map((folder) => folder.name.toLowerCase()));
    for (const folder of [...set]) if (sharedNames.has(folder.toLowerCase())) set.delete(folder);
    return ["All", ...Array.from(set)];
  }, [bookmarks, customFolders, sharedFolders]);

  const selectedSharedFolder = useMemo(() => {
    if (!folderFilter.startsWith("shared:")) return null;
    return sharedFolders.find((folder) => folder.id === folderFilter.slice(7)) || null;
  }, [folderFilter, sharedFolders]);

  const filtered = useMemo(() => {
    if (selectedSharedFolder) return [];
    return bookmarks.filter((b) => folderFilter === "All" || b.folder === folderFilter);
  }, [bookmarks, folderFilter, selectedSharedFolder]);

  const personalSavedLocs = filtered.map((b) => {
      const loc = locations.find((l) => String(l.id) === String(b.locationId));
      return loc ? { loc, entry: b } : null;
    })
    .filter(Boolean) as { loc: Location; entry: BookmarkEntry }[];

  const savedLocs = selectedSharedFolder
    ? selectedSharedFolder.locations.map((sharedLocation) => ({
        loc: locations.find((item) => String(item.id) === String(sharedLocation.id)) || { ...sharedLocation, image_url: sharedLocation.imageUrl } as Location,
        entry: { locationId: sharedLocation.id, notes: "", folder: selectedSharedFolder.name, savedAt: "" } as BookmarkEntry,
        sharedLocation,
      }))
    : personalSavedLocs.map((item) => ({ ...item, sharedLocation: undefined as SharedBookmarkLocation | undefined }));

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
    setSharedFolders(result.folders as SharedBookmarkFolder[]);
    if (preferredFolderId) setFolderFilter(`shared:${preferredFolderId}`);
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

  function createFolder() {
    const name = newFolder.trim();
    if (!name) return;
    if (folders.some((f) => f.toLowerCase() === name.toLowerCase())) {
      onToast("A folder with this name already exists. Please choose a different name.", "err");
      return;
    }
    setCustomFolders((p) => [...p, name]);
    setNewFolder("");
    setShowCreateFolderModal(false);
    onToast("Bookmarks organized successfully!");
  }

  async function saveEdit() {
    if (editId == null) return;
    if (editMode === "move" && editFolder.startsWith("shared:")) {
      await moveBookmark(editId, editFolder);
      setEditId(null);
      setEditMode(null);
      return;
    }
    setBookmarks((prev) =>
      prev.map((b) =>
        String(b.locationId) === String(editId) ? { ...b, notes: editNotes, folder: editFolder || "Uncategorized" } : b
      )
    );
    setEditId(null);
    setEditMode(null);
    onToast("Bookmark updated successfully.");
  }

  async function moveBookmark(locationId: string | number, folder: string) {
    if (folder.startsWith("shared:")) {
      const sharedFolderId = folder.slice(7);
      const loc = locations.find((item) => String(item.id) === String(locationId));
      try {
        await firebaseClient.backend.addSharedBookmarkLocation(sharedFolderId, locationId, loc as unknown as Record<string, any>);
        await refreshSharedFolders(sharedFolderId);
        onToast("Location added to the shared folder.");
      } catch (error: any) {
        onToast(error?.message || "Unable to add this location to the shared folder.", "err");
      }
      return;
    }
    setBookmarks((prev) => prev.map((bookmark) => (
      String(bookmark.locationId) === String(locationId) ? { ...bookmark, folder } : bookmark
    )));
    onToast(`Moved to ${folder}.`);
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

  function deleteFolder(name: string) {
    if (!customFolders.includes(name)) return;
    const hasItems = bookmarks.some((b) => b.folder === name);
    if (hasItems) {
      onToast("This folder contains bookmarks. Move them to another folder first.", "err");
      return;
    }
    setCustomFolders((p) => p.filter((f) => f !== name));
    void firebaseClient.backend.disableBookmarkFolderShare(name).catch(() => undefined);
    onToast("Folder removed.");
  }

  function startRenameFolder(name: string) {
    setRenamingFolder(name);
    setRenameFolderValue(name);
  }

  function renameFolder() {
    if (!renamingFolder || !customFolders.includes(renamingFolder)) return;
    const nextName = renameFolderValue.trim();
    if (!nextName) {
      onToast("Folder name cannot be empty.", "err");
      return;
    }
    if (folders.some((folder) => folder !== renamingFolder && folder.toLowerCase() === nextName.toLowerCase())) {
      onToast("A folder with this name already exists. Please choose a different name.", "err");
      return;
    }

    const previousName = renamingFolder;
    setBookmarks((prev) => prev.map((bookmark) => (
      bookmark.folder === previousName ? { ...bookmark, folder: nextName } : bookmark
    )));
    setCustomFolders((prev) => prev.map((folder) => folder === previousName ? nextName : folder));
    if (folderFilter === previousName) setFolderFilter(nextName);
    setRenamingFolder(null);
    setRenameFolderValue("");
    void firebaseClient.backend.disableBookmarkFolderShare(previousName).catch(() => undefined);
    onToast("Folder renamed successfully.");
  }

  async function openShareFolder(name: string, folderId?: string) {
    setFolderFilter(folderId ? `shared:${folderId}` : name);
    setShareFolder(name);
    setShareFolderId(folderId || null);
    setShareLink("");
    setShareActive(false);
    setShareBusy(true);
    try {
      if (folderId) {
        const sharedFolder = sharedFolders.find((folder) => folder.id === folderId);
        setShareActive(sharedFolder?.sharingEnabled === true);
      } else {
        const status = await firebaseClient.backend.getBookmarkFolderShareStatus(name);
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
    const locationIds = shareFolderId
      ? sharedFolders.find((folder) => folder.id === shareFolderId)?.locations.map((item) => item.id) || []
      : bookmarks.filter((bookmark) => bookmark.folder === shareFolder).map((bookmark) => bookmark.locationId);
    setShareBusy(true);
    try {
      const result = await firebaseClient.backend.createBookmarkFolderShare(shareFolder, locationIds);
      const link = `${window.location.origin}/shared/bookmarks/${encodeURIComponent(result.token)}`;
      setShareLink(link);
      setShareFolderId(result.folderId);
      setShareActive(true);
      await refreshSharedFolders(result.folderId);
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
      await firebaseClient.backend.disableBookmarkFolderShare(shareFolder, shareFolderId || undefined);
      setShareActive(false);
      setShareLink("");
      if (shareFolderId) await refreshSharedFolders(shareFolderId);
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
      await refreshSharedFolders(membersFolder.id);
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
    try {
      await firebaseClient.backend.renameSharedBookmarkFolder(folder.id, nextName);
      setBookmarks((previous) => previous.map((bookmark) => bookmark.folder === folder.name ? { ...bookmark, folder: nextName } : bookmark));
      await refreshSharedFolders(folder.id);
      setRenamingFolder(null);
      setRenameFolderValue("");
      onToast("Shared folder renamed.");
    } catch (error: any) {
      onToast(error?.message || "Unable to rename this shared folder.", "err");
    }
  }

  async function deleteSharedFolder(folder: SharedBookmarkFolder) {
    try {
      await firebaseClient.backend.deleteSharedBookmarkFolder(folder.id);
      setBookmarks((previous) => previous.map((bookmark) => bookmark.folder === folder.name ? { ...bookmark, folder: "Uncategorized" } : bookmark));
      setSharedFolders((current) => current.filter((item) => item.id !== folder.id));
      setFolderFilter("All");
      onToast("Shared folder deleted.");
    } catch (error: any) {
      onToast(error?.message || "Unable to delete this shared folder.", "err");
    }
  }

  if (bookmarks.length === 0 && sharedFolders.length === 0 && !sharedFoldersLoading) {
    return (
      <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-6">
            <BookmarkCheck size={22} style={{ color: C.jungle }} />
            <h1 className="text-3xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>
              {t(language, "myBookmarks")}
            </h1>
          </div>
          <div className="text-center py-20">
            <Bookmark size={44} className="mx-auto mb-4" style={{ color: C.border }} />
            <p className="font-bold mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
              {t(language, "noBookmarks")}
            </p>
            <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>
              Start exploring to save your favourites!
            </p>
            <Pill variant="filled" onClick={() => setPage("explore")}>
              Explore locations
            </Pill>
          </div>
        </div>
      </div>
    );
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
          {folders.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFolderFilter(f)}
              className="h-8 flex-shrink-0 rounded-full px-3 text-[11px] font-bold whitespace-nowrap"
              style={{
                backgroundColor: folderFilter === f ? C.jungle : C.muted,
                color: folderFilter === f ? "#fff" : C.textSub,
                fontFamily: F.body,
              }}
            >
              {activityLabel(language, f)}
            </button>
          ))}
          {sharedFolders.map((folder) => (
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
              <Users size={11}/> {folder.name}
            </button>
          ))}
        </div>

        {showOrganize && (
          <div className="mb-6 overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: C.border, boxShadow: `0 8px 24px rgba(27,67,50,0.07)` }}>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5" style={{ backgroundColor: C.muted }}>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: F.display, color: C.jungle }}>Organize Bookmarks</h2>
                <p className="mt-1 text-sm" style={{ color: C.textSub, fontFamily: F.body }}>Create folders and move your saved locations into them.</p>
              </div>
              <Pill variant="filled" small onClick={() => setShowCreateFolderModal(true)}>
                <Plus size={14}/> Create New Folder
              </Pill>
            </div>
            <div className="border-t p-4" style={{ borderColor: C.border }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted, fontFamily: F.body }}>Custom folders</p>
              <div className="space-y-2">
              {customFolders.filter((name) => !sharedFolders.some((folder) => folder.name.toLowerCase() === name.toLowerCase())).map((f) => (
                <div key={f} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: C.cream }}>
                  {renamingFolder === f ? (
                    <input
                      value={renameFolderValue}
                      onChange={(event) => setRenameFolderValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") renameFolder();
                        if (event.key === "Escape") setRenamingFolder(null);
                      }}
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      style={{ color: C.text, fontFamily: F.body }}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>{f}</span>
                  )}
                  <div className="flex items-center gap-1">
                    {renamingFolder === f ? (
                      <>
                        <button type="button" onClick={renameFolder} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Save ${f} folder name`}><Check size={14}/></button>
                        <button type="button" onClick={() => setRenamingFolder(null)} className="rounded-full p-2" style={{ color: C.textMuted }} aria-label="Cancel folder rename"><X size={14}/></button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startRenameFolder(f)} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Rename ${f}`}><Edit3 size={14}/></button>
                    )}
                    <button type="button" onClick={() => deleteFolder(f)} className="rounded-full p-2" style={{ color: C.error, backgroundColor: C.errorBg }} aria-label={`Delete ${f}`}><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {customFolders.length === 0 && (
                <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>No custom folders yet.</p>
              )}
              </div>
              {sharedFolders.length > 0 && (
                <div className="mt-5 border-t pt-4" style={{ borderColor: C.border }}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.textMuted, fontFamily: F.body }}>Shared folders</p>
                  <div className="space-y-2">
                    {sharedFolders.map((folder) => {
                      const renameKey = `shared:${folder.id}`;
                      return (
                        <div key={folder.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: C.cream }}>
                          <div className="min-w-0 flex-1">
                            {renamingFolder === renameKey ? (
                              <input value={renameFolderValue} onChange={(event) => setRenameFolderValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") renameSharedFolder(folder); if (event.key === "Escape") setRenamingFolder(null); }} autoFocus className="w-full bg-transparent text-sm outline-none" style={{ color: C.text, fontFamily: F.body }}/>
                            ) : (
                              <><p className="truncate text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}><Users size={12} className="mr-1.5 inline"/>{folder.name}</p><p className="text-[10px]" style={{ color: C.textMuted }}>{folder.viewerRole === "owner" ? "Owned by you" : "Member"} · {folder.memberCount} members</p></>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {folder.viewerRole === "owner" ? renamingFolder === renameKey ? (
                              <><button type="button" onClick={() => renameSharedFolder(folder)} className="rounded-full p-2" style={{ color: C.jungle }} aria-label="Save shared folder name"><Check size={14}/></button><button type="button" onClick={() => setRenamingFolder(null)} className="rounded-full p-2" style={{ color: C.textMuted }}><X size={14}/></button></>
                            ) : (
                              <><button type="button" onClick={() => { setRenamingFolder(renameKey); setRenameFolderValue(folder.name); }} className="rounded-full p-2" style={{ color: C.jungle }} aria-label={`Rename ${folder.name}`}><Edit3 size={14}/></button><button type="button" onClick={() => deleteSharedFolder(folder)} className="rounded-full p-2" style={{ color: C.error, backgroundColor: C.errorBg }} aria-label={`Delete ${folder.name}`}><Trash2 size={14}/></button></>
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
              {showOrganize ? "Locations to organize" : selectedSharedFolder?.name || (folderFilter === "All" ? "All Bookmarks" : activityLabel(language, folderFilter))}
            </h2>
            <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>
              {selectedSharedFolder && !showOrganize ? <>Shared · {selectedSharedFolder.memberCount} member{selectedSharedFolder.memberCount === 1 ? "" : "s"} · </> : null}{savedLocs.length} saved {savedLocs.length === 1 ? "location" : "locations"}
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
              ) : folderFilter !== "All" && folderFilter !== "Uncategorized" ? (
                <Pill variant="outline" small onClick={() => openShareFolder(folderFilter)}><Share2 size={13}/> Share</Pill>
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
              return (
                <div
                  key={`${selectedSharedFolder ? `shared:${selectedSharedFolder.id}` : "personal"}:${String(loc.id)}`}
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

                      {showOrganize && selectedSharedFolder ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold" style={{ color: C.textSub, fontFamily: F.body }}>
                          <span>Folder: <span className="rounded-full px-2 py-1" style={{ backgroundColor: C.muted, color: C.forest }}><Users size={10} className="mr-1 inline"/>{selectedSharedFolder.name}</span></span>
                          {sharedLocation?.canRemove && <button type="button" onClick={() => { setDeleteId(loc.id); setDeleteSharedLocationFolderId(selectedSharedFolder.id); }} className="rounded-full px-2 py-1 text-[10px]" style={{ backgroundColor: C.errorBg, color: C.error }}>Remove from folder</button>}
                        </div>
                      ) : showOrganize ? (
                        <label className="mt-2 flex max-w-xs items-center gap-2 text-xs font-bold" style={{ color: C.textSub, fontFamily: F.body }}>
                          Folder:
                          <select
                            value={entry.folder || "Uncategorized"}
                            onChange={(event) => moveBookmark(loc.id, event.target.value)}
                            className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1.5 text-xs outline-none"
                            style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}
                          >
                            {folders.filter((folder) => folder !== "All").map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                            {sharedFolders.map((folder) => <option key={folder.id} value={`shared:${folder.id}`}>👥 {folder.name}</option>)}
                          </select>
                        </label>
                      ) : (
                        <div className="mt-1.5 flex min-w-0 items-center gap-2">
                          <span className="max-w-[180px] truncate rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: C.muted, color: C.forest, fontFamily: F.body }}>
                            {selectedSharedFolder ? `Shared · ${selectedSharedFolder.name}` : entry.folder || "Uncategorized"}
                          </span>
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
                      {!selectedSharedFolder && <button type="button" onClick={() => { setEditId(loc.id); setEditMode("move"); setEditFolder(entry.folder || "Uncategorized"); setEditNotes(entry.notes || ""); setActionMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ color: C.text, fontFamily: F.body }}><FolderInput size={14}/> Move to folder</button>}
                      {!selectedSharedFolder && <button type="button" onClick={() => { setEditId(loc.id); setEditMode("note"); setEditFolder(entry.folder || "Uncategorized"); setEditNotes(entry.notes || ""); setActionMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ color: C.text, fontFamily: F.body }}><Edit3 size={14}/> Edit note</button>}
                      {(!selectedSharedFolder || sharedLocation?.canRemove) && <button type="button" onClick={() => { setDeleteId(loc.id); setDeleteSharedLocationFolderId(selectedSharedFolder?.id || null); setActionMenuId(null); }} className="flex w-full items-center gap-2.5 border-t px-3 py-2 text-left text-xs hover:bg-black/[0.03]" style={{ borderColor: C.border, color: C.error, fontFamily: F.body }}><Trash2 size={14}/> {selectedSharedFolder ? "Remove from shared folder" : "Remove bookmark"}</button>}
                    </div>
                    </>
                  )}

                  {editorOpen && !showOrganize && !selectedSharedFolder && (
                    <div className="mt-3 border-t pt-3" style={{ borderColor: C.border }}>
                      {editMode === "note" ? (
                        <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} rows={2} placeholder="Add a personal note…" className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}/>
                      ) : (
                        <select value={editFolder} onChange={(event) => setEditFolder(event.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border, color: C.text, fontFamily: F.body }}>
                          {folders.filter((folder) => folder !== "All").map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                          {sharedFolders.map((folder) => <option key={folder.id} value={`shared:${folder.id}`}>👥 {folder.name}</option>)}
                        </select>
                      )}
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

      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
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
