import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { firebaseClient } from "../api/firebaseClient";
import type { SharedBookmarkFolder } from "../lib/types";
import { C, F } from "../lib/tokens";

export function SharedBookmarksPage({ token }: { token: string }) {
  const [folder, setFolder] = useState<SharedBookmarkFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [token]);

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
                <FolderOpen size={15}/> Shared bookmark folder
              </div>
              <h1 className="text-3xl font-normal sm:text-4xl" style={{ color: C.jungle, fontFamily: F.display }}>{folder.name}</h1>
              <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
                {folder.locations.length} saved location{folder.locations.length === 1 ? "" : "s"} · Shared as view-only
              </p>
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
              This public page is view-only. Personal notes and account information are never included.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
