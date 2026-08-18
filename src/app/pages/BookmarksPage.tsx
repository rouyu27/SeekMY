// FILE PRIMARY OWNER: LIM TZE XIN | Bookmark Module
// GitHub target: feature/lim-tze-xin -> Pull Request -> main
//==================== LimTzeXin Part - Bookmark Module ====================
import { useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, FolderPlus, Trash2, Edit3, Check, X } from "lucide-react";
import type { Location, Page, MockUser } from "../lib/types";
import type { BookmarkEntry } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";

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
}: {
  bookmarks: BookmarkEntry[];
  setBookmarks: (b: BookmarkEntry[] | ((p: BookmarkEntry[]) => BookmarkEntry[])) => void;
  setPage: (p: Page) => void;
  setSelectedLocation: (l: Location) => void;
  onToast: (msg: string, type?: "ok" | "err") => void;
  locations: Location[];
  user: MockUser | null;
  onSignIn: () => void;
}) {
  const [folderFilter, setFolderFilter] = useState("All");
  const [newFolder, setNewFolder] = useState("");
  const [showOrganize, setShowOrganize] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editFolder, setEditFolder] = useState("Uncategorized");
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
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
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>My Bookmarks</h1>
          <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>Sign in to view your saved outdoor places.</p>
          <Pill variant="filled" onClick={onSignIn}>Sign In</Pill>
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

  if (bookmarks.length === 0) {
    return (
      <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-6">
            <BookmarkCheck size={22} style={{ color: C.jungle }} />
            <h1 className="text-3xl font-normal" style={{ color: C.jungle, fontFamily: F.display }}>
              My Bookmarks
            </h1>
          </div>
          <div className="text-center py-20">
            <Bookmark size={44} className="mx-auto mb-4" style={{ color: C.border }} />
            <p className="font-bold mb-1" style={{ color: C.textSub, fontFamily: F.body }}>
              No bookmarked locations available
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
              My Bookmarks
            </h1>
          </div>
          <Pill variant="outline" small onClick={() => setShowOrganize((v) => !v)}>
            <FolderPlus size={13} /> {showOrganize ? "Close organize" : "Organize"}
          </Pill>
        </div>

        {/* Folder chips */}
        <div className="flex gap-2 overflow-x-auto mb-5" style={{ scrollbarWidth: "none" }}>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setFolderFilter(f)}
              className="px-3 h-8 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{
                backgroundColor: folderFilter === f ? C.jungle : C.muted,
                color: folderFilter === f ? "#fff" : C.textSub,
                fontFamily: F.body,
              }}
            >
              {f}
            </button>
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
    </div>
  );
}
//==================== LimTzeXin END - Bookmark Module ====================
