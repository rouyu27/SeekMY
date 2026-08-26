//==================== LimTzeXin Part - Bookmark Module ====================
import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, FolderPlus, Trash2, Edit3, Check, X, Share2, Copy, MessageCircle, Link2 } from "lucide-react";
import type { Location, Page, AppUser } from "../lib/types";
import type { BookmarkEntry } from "../lib/types";
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
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [shareFolder, setShareFolder] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareActive, setShareActive] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    const fromData = Array.from(new Set(bookmarks.map((b) => b.folder).filter(Boolean)));
    return fromData.filter((f) => !DEFAULT_FOLDERS.includes(f));
  });

  const folders = useMemo(() => {
    const set = new Set([...DEFAULT_FOLDERS.filter((f) => f !== "All"), ...customFolders]);
    bookmarks.forEach((b) => b.folder && set.add(b.folder));
    return ["All", ...Array.from(set)];
  }, [bookmarks, customFolders]);

  const filtered = useMemo(() => {
    return bookmarks.filter((b) => folderFilter === "All" || b.folder === folderFilter);
  }, [bookmarks, folderFilter]);

  const savedLocs = filtered
    .map((b) => {
      const loc = locations.find((l) => String(l.id) === String(b.locationId));
      return loc ? { loc, entry: b } : null;
    })
    .filter(Boolean) as { loc: Location; entry: BookmarkEntry }[];

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
    onToast("Bookmarks organized successfully!");
  }

  function saveEdit() {
    if (editId == null) return;
    setBookmarks((prev) =>
      prev.map((b) =>
        b.locationId === editId ? { ...b, notes: editNotes, folder: editFolder || "Uncategorized" } : b
      )
    );
    setEditId(null);
    onToast("Bookmark updated successfully.");
  }

  function confirmDelete() {
    if (deleteId == null) return;
    setBookmarks((prev) => prev.filter((b) => b.locationId !== deleteId));
    setDeleteId(null);
    onToast("Bookmark removed successfully.");
  }

  function deleteFolder(name: string) {
    if (name === "All" || name === "Uncategorized") return;
    const hasItems = bookmarks.some((b) => b.folder === name);
    if (hasItems) {
      onToast("This folder contains bookmarks. Move them to another folder first.", "err");
      return;
    }
    setCustomFolders((p) => p.filter((f) => f !== name));
    onToast("Folder removed.");
  }

  async function openShareFolder(name: string) {
    setFolderFilter(name);
    setShareFolder(name);
    setShareLink("");
    setShareActive(false);
    setShareBusy(true);
    try {
      const status = await firebaseClient.backend.getBookmarkFolderShareStatus(name);
      setShareActive(status.active);
    } catch (error: any) {
      onToast(error?.message || "Unable to check folder sharing status.", "err");
    } finally {
      setShareBusy(false);
    }
  }

  async function generateShareLink() {
    if (!shareFolder) return;
    const locationIds = bookmarks.filter((bookmark) => bookmark.folder === shareFolder).map((bookmark) => bookmark.locationId);
    setShareBusy(true);
    try {
      const result = await firebaseClient.backend.createBookmarkFolderShare(shareFolder, locationIds);
      const link = `${window.location.origin}/shared/bookmarks/${encodeURIComponent(result.token)}`;
      setShareLink(link);
      setShareActive(true);
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
      await firebaseClient.backend.disableBookmarkFolderShare(shareFolder);
      setShareActive(false);
      setShareLink("");
      onToast("Folder sharing disabled. The previous link no longer works.");
    } catch (error: any) {
      onToast(error?.message || "Unable to disable sharing.", "err");
    } finally {
      setShareBusy(false);
    }
  }

  if (bookmarks.length === 0) {
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
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <BookmarkCheck size={22} style={{ color: C.jungle }} />
            <h1 className="text-3xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>
              {t(language, "myBookmarks")}
            </h1>
          </div>
          <Pill variant="outline" small onClick={() => setShowOrganize((v) => !v)}>
            <FolderPlus size={13} /> {showOrganize ? t(language, "closeOrganize") : t(language, "organize")}
          </Pill>
        </div>

        {/* Folder chips */}
        <div className="flex gap-2 overflow-x-auto mb-5" style={{ scrollbarWidth: "none" }}>
          {folders.map((f) => (
            <div
              key={f}
              className="flex h-8 flex-shrink-0 items-center overflow-hidden rounded-full"
              style={{
                backgroundColor: folderFilter === f ? C.jungle : C.muted,
                color: folderFilter === f ? "#fff" : C.textSub,
                fontFamily: F.body,
              }}
            >
              <button
                type="button"
                onClick={() => setFolderFilter(f)}
                className="h-full px-3 text-[11px] font-bold whitespace-nowrap"
              >
                {activityLabel(language, f)}
              </button>
              {f !== "All" && (
                <button
                  type="button"
                  onClick={() => openShareFolder(f)}
                  className="flex h-full items-center px-2"
                  style={{ borderLeft: `1px solid ${folderFilter === f ? "rgba(255,255,255,0.25)" : C.border}` }}
                  aria-label={`Share ${f} bookmark folder`}
                  title={`Share ${f}`}
                >
                  <Share2 size={12}/>
                </button>
              )}
            </div>
          ))}
        </div>

        {showOrganize && (
          <div className="bg-white rounded-[18px] p-5 mb-5 space-y-3" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
            <p className="text-sm font-bold" style={{ fontFamily: F.body, color: C.text }}>
              Manage folders
            </p>
            <div className="flex gap-2">
              <input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="New folder name (e.g. Hiking Trails)"
                className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
              />
              <Pill variant="filled" small onClick={createFolder}>
                Create
              </Pill>
            </div>
            <div className="flex flex-wrap gap-2">
              {customFolders.map((f) => (
                <button
                  key={f}
                  onClick={() => deleteFolder(f)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: C.errorBg, color: C.error, fontFamily: F.body }}
                >
                  Delete “{f}”
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {savedLocs.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
              No bookmarks in this folder.
            </p>
          ) : (
            savedLocs.map(({ loc, entry }) => (
              <div
                key={loc.id}
                className="bg-white rounded-[18px] p-4"
                style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-3xl"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setPage("location");
                    }}
                  >
                    {loc.emoji}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      className="text-left w-full"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setPage("location");
                      }}
                    >
                      <p className="text-sm font-bold truncate" style={{ color: C.text, fontFamily: F.body }}>
                        {loc.name}
                      </p>
                      <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>
                        {loc.state} · {loc.activity} · {entry.folder || "Uncategorized"}
                      </p>
                    </button>
                    {entry.notes && editId !== loc.id && (
                      <p className="text-[12px] mt-1" style={{ color: C.textSub, fontFamily: F.body }}>
                        📝 {entry.notes}
                      </p>
                    )}

                    {editId === loc.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          placeholder="Personal notes…"
                          className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
                          style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                        />
                        <select
                          value={editFolder}
                          onChange={(e) => setEditFolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                          style={{ borderColor: C.border, fontFamily: F.body, color: C.text }}
                        >
                          {folders.filter((f) => f !== "All").map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Pill variant="filled" small onClick={saveEdit}>
                            <Check size={12} /> Save Changes
                          </Pill>
                          <Pill variant="outline" small onClick={() => setEditId(null)}>
                            <X size={12} /> Cancel
                          </Pill>
                        </div>
                      </div>
                    )}
                  </div>
                  {editId !== loc.id && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditId(loc.id);
                          setEditNotes(entry.notes || "");
                          setEditFolder(entry.folder || "Uncategorized");
                        }}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: C.muted, color: C.forest }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(loc.id)}
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: C.errorBg, color: C.error }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId != null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-[18px] p-6 max-w-sm w-full">
            <p className="font-bold mb-2" style={{ fontFamily: F.body, color: C.text }}>
              Remove this bookmark?
            </p>
            <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>
              You can save it again later from the location page.
            </p>
            <div className="flex gap-3">
              <Pill variant="outline" small onClick={() => setDeleteId(null)}>
                Cancel
              </Pill>
              <Pill variant="danger" small onClick={confirmDelete}>
                Remove
              </Pill>
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
              Anyone with the link can view this folder without signing in. They cannot see your account, notes, or bookmark controls.
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
                    href={`https://wa.me/?text=${encodeURIComponent(`Explore my ${shareFolder} bookmark folder on SeekMY: ${shareLink}`)}`}
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
