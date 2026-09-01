import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, Loader2, MapPin, ShieldCheck, Users, X } from "lucide-react";
import { firebaseClient } from "../api/firebaseClient";
import type { AppUser, SharedBookmarkFolder } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";

export function SharedBookmarksPage({ token, user, personalFolderNames, onSignIn, onOpenBookmarks }: { token: string; user: AppUser | null; personalFolderNames: string[]; onSignIn: () => void; onOpenBookmarks: () => void }) {
  const adminViewer = user?.role === "admin";
  const [folder, setFolder] = useState<SharedBookmarkFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinRequested, setJoinRequested] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    let cancelled = false;
    document.title = "Shared bookmarks | SeekMY";
    firebaseClient.backend.getSharedBookmarkFolder(token)
      .then((result) => {
        if (!cancelled) setFolder(result.folder as SharedBookmarkFolder);
      })
      .catch((reason: any) => {
        if (!cancelled) setError(reason?.message || "This shared folder is unavailable or sharing was disabled.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, user?.id]);

  useEffect(() => {
    if (joinRequested && user && !adminViewer && !folder?.viewerRole) setShowJoinConfirm(true);
  }, [joinRequested, user, adminViewer, folder?.viewerRole]);

  function requestJoin() {
    if (adminViewer) {
      setJoinError("Collaboration is available for user accounts only.");
      return;
    }
    if (folder?.viewerRole) {
      onOpenBookmarks();
      return;
    }
    setJoinError("");
    setJoinRequested(true);
    if (!user) onSignIn();
    else setShowJoinConfirm(true);
  }

  async function confirmJoin() {
    if (adminViewer) {
      setShowJoinConfirm(false);
      setJoinError("Collaboration is available for user accounts only.");
      return;
    }
    if (folder && personalFolderNames.some((name) => name.trim().toLocaleLowerCase() === folder.name.trim().toLocaleLowerCase())) {
      setShowJoinConfirm(false);
      setJoinError("A folder with this name already exists. Please choose another folder name first.");
      return;
    }
    setJoining(true);
    try {
      const result = await firebaseClient.backend.joinSharedBookmarkFolder(token);
      setFolder((current) => current ? { ...current, viewerRole: result.role, memberCount: current.memberCount + (result.alreadyJoined ? 0 : 1) } : current);
      setShowJoinConfirm(false);
      setJoinRequested(false);
    } catch (reason: any) {
      setJoinError(reason?.message || "Unable to join this shared folder.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.cream, color: C.text, fontFamily: F.body }}>
      <header className="border-b bg-white" style={{ borderColor: C.border }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-3" aria-label="Open SeekMY home">
            <img src="/logo.png" alt="SeekMY" className="h-11 w-11 rounded-full object-cover"/>
            <div>
              <p className="font-bold leading-tight" style={{ color: C.jungle, fontFamily: F.display }}>SeekMY</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>Outdoor Discovery</p>
            </div>
          </a>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ backgroundColor: C.muted, color: C.forest }}>
            <ShieldCheck size={13}/> View only
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {loading && (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
            <Loader2 size={30} className="mb-4 animate-spin" style={{ color: C.forest }}/>
            <p className="text-sm" style={{ color: C.textMuted }}>Opening shared bookmark folder...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-md rounded-[18px] bg-white p-8 text-center" style={{ boxShadow: "0 5px 24px rgba(27,67,50,0.10)" }}>
            <FolderOpen size={38} className="mx-auto mb-4" style={{ color: C.border }}/>
            <h1 className="mb-2 text-2xl" style={{ color: C.jungle, fontFamily: F.display }}>Folder unavailable</h1>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: C.textMuted }}>{error}</p>
            <a href="/" className="inline-flex rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: C.jungle }}>Explore SeekMY</a>
          </div>
        )}

        {!loading && folder && (
          <>
            <div className="mb-7">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: C.forest }}>
                <FolderOpen size={15}/> Shared via SeekMY
              </div>
              <h1 className="text-3xl font-normal sm:text-4xl" style={{ color: C.jungle, fontFamily: F.display }}>{folder.name}</h1>
              <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
                {folder.locations.length} saved location{folder.locations.length === 1 ? "" : "s"} · {folder.memberCount} member{folder.memberCount === 1 ? "" : "s"}
              </p>
              <div className="mt-5">
                {adminViewer ? (
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: C.muted, color: C.textMuted }}>
                    <ShieldCheck size={14}/> Collaboration is available for user accounts only.
                  </div>
                ) : (
                  <Pill variant="filled" small onClick={requestJoin}>
                    <Users size={14}/> {folder.viewerRole ? "Open in My Bookmarks" : "Join Shared Folder"}
                  </Pill>
                )}
                {joinError && !showJoinConfirm && <p className="mt-2 text-xs" style={{ color: C.error }}>{joinError}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {folder.locations.length === 0 ? (
                <div className="rounded-[18px] bg-white p-8 text-center text-sm" style={{ color: C.textMuted }}>This folder has no available locations.</div>
              ) : folder.locations.map((location) => (
                <article key={String(location.id)} className="rounded-[18px] bg-white p-4 sm:p-5" style={{ boxShadow: "0 1px 4px rgba(27,67,50,0.10)" }}>
                  <div className="flex items-center gap-4">
                    {location.imageUrl ? (
                      <img src={location.imageUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"/>
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-3xl" style={{ backgroundColor: C.muted }}>
                        {location.emoji || "📍"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold" style={{ color: C.text }}>{location.name}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.textMuted }}>
                        <MapPin size={11}/>{location.state || location.address || "Malaysia"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {location.activity && <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: C.muted, color: C.forest }}>{location.activity}</span>}
                        {location.difficulty && <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: "#fff7df", color: "#8a651b" }}>{location.difficulty}</span>}
                      </div>
                    </div>
                    <a
                      href={`/location/${encodeURIComponent(String(location.id))}`}
                      className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold sm:inline-flex"
                      style={{ borderColor: C.forest, color: C.forest }}
                    >
                      View details <ExternalLink size={11}/>
                    </a>
                  </div>
                  <a
                    href={`/location/${encodeURIComponent(String(location.id))}`}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold sm:hidden"
                    style={{ borderColor: C.forest, color: C.forest }}
                  >
                    View location details <ExternalLink size={11}/>
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-xl p-4 text-center text-xs leading-relaxed" style={{ backgroundColor: C.muted, color: C.textMuted }}>
              Viewing is public and does not require an account. Join only if you want this collaborative folder in My Bookmarks.
            </div>
          </>
        )}
      </main>

      {showJoinConfirm && folder && !adminViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full max-w-sm rounded-[20px] bg-white p-6" role="dialog" aria-modal="true" aria-labelledby="join-folder-title" style={{ boxShadow: "0 18px 50px rgba(27,67,50,0.22)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="join-folder-title" className="text-xl font-bold" style={{ color: C.text, fontFamily: F.display }}>Join “{folder.name}”?</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMuted }}>Save this shared folder to your SeekMY account and collaborate on places together.</p>
              </div>
              <button type="button" onClick={() => setShowJoinConfirm(false)} className="rounded-full p-2" style={{ backgroundColor: C.muted, color: C.textSub }} aria-label="Close join dialog"><X size={15}/></button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {joinError && <p className="mr-auto self-center text-xs" style={{ color: C.error }}>{joinError}</p>}
              <Pill variant="outline" small onClick={() => setShowJoinConfirm(false)}>Cancel</Pill>
              <Pill variant="filled" small onClick={confirmJoin} disabled={joining}>{joining ? "Joining..." : "Join Folder"}</Pill>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
