/** Bookmark persistence (localStorage demo stand-in for Firestore) */

export interface BookmarkEntry {
  locationId: number;
  notes: string;
  folder: string;
  savedAt: string;
}

const KEY = "seekmy_bookmarks";

export function loadBookmarks(): BookmarkEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BookmarkEntry[];
  } catch {
    return [];
  }
}

export function saveBookmarks(list: BookmarkEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
