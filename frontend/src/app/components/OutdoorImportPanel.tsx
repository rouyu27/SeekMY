import { useEffect, useState } from "react";
import { CheckCircle, FileUp, RefreshCw, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { firebaseClient } from "../api/firebaseClient";
import { C, F } from "../lib/tokens";
import { Pill } from "./Atoms";

type Candidate = {
  id?: string; name: string; state: string; stateCode?: string; address: string;
  lat: number; lng: number; activity: string; category?: string;
  source: string; sourceId: string; sourceUrl: string; status: string;
  importedAt?: string; lastVerifiedAt?: string;
  image_url?: string;
  photo?: {
    imageUrl: string; originalUrl?: string; sourcePageUrl: string; source: string;
    title?: string; author: string; license: string; licenseUrl?: string;
    matchMethod: "osm_mapillary" | "osm_wikimedia_commons" | "osm_wikidata" | "nearby_search";
    matchConfidence: number;
  } | null;
  photoStatus?: "suggested" | "needs_review" | "not_found";
};

function validCandidate(value: any): value is Candidate {
  return value && typeof value.name === "string" && typeof value.state === "string" &&
    typeof value.sourceId === "string" && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));
}

function candidateSearchUrl(candidate: Candidate, suffix: string) {
  const query = encodeURIComponent([candidate.name, candidate.state, "Malaysia", suffix].filter(Boolean).join(" "));
  return `https://www.google.com/search?q=${query}`;
}

function candidateMapsUrl(candidate: Candidate) {
  const query = encodeURIComponent(`${candidate.lat},${candidate.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function commonsSearchUrl(candidate: Candidate) {
  const query = encodeURIComponent([candidate.name, candidate.state, "Malaysia"].filter(Boolean).join(" "));
  return `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`;
}

function photoNeedsReview(candidate: Candidate) {
  return Boolean(candidate.photo && (candidate.photoStatus === "needs_review" || candidate.photoStatus === "suggested"));
}

function htmlText(value: unknown) {
  const div = document.createElement("div");
  div.innerHTML = String(value || "");
  return div.textContent || div.innerText || "";
}

async function findCommonsPhoto(candidate: Candidate) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${candidate.name} ${candidate.state} Malaysia`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    format: "json",
    origin: "*",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error("Wikimedia Commons search failed.");
  const pages = (await response.json()).query?.pages;
  const page = pages ? Object.values(pages)[0] as any : null;
  const info = page?.imageinfo?.[0];
  if (!page || !info?.url) return null;
  const meta = info.extmetadata || {};
  const title = String(page.title || candidate.name).replace(/^File:/, "");
  return {
    imageUrl: info.url,
    originalUrl: info.url,
    sourcePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title)).replace(/%20/g, "_")}`,
    source: "Wikimedia Commons",
    title,
    author: htmlText(meta.Artist?.value) || "Wikimedia Commons contributor",
    license: htmlText(meta.LicenseShortName?.value || meta.UsageTerms?.value) || "Free licence, verify on source page",
    licenseUrl: meta.LicenseUrl?.value || "",
    matchMethod: "osm_wikimedia_commons" as const,
    matchConfidence: 0.72,
  };
}

export function OutdoorImportPanel({ onPublished }: { onPublished: (location: any) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [preview, setPreview] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadCandidates() {
    setBusy(true);
    try {
      const rows = await firebaseClient.entities.LocationImportCandidate.list(undefined, 1000);
      setCandidates(rows as Candidate[]);
    } catch (error: any) { setMessage(error?.message || "Unable to load candidates."); }
    finally { setBusy(false); }
  }

  useEffect(() => { loadCandidates(); }, []);

  async function chooseFile(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("The import file must contain a JSON array.");
      const valid = parsed.filter(validCandidate).map((row) => ({ ...row, lat: Number(row.lat), lng: Number(row.lng), status: "pending" }));
      const unique = Array.from(new Map(valid.map((row) => [row.sourceId, row])).values());
      setPreview(unique);
      setMessage(`${unique.length} valid candidates ready. ${parsed.length - valid.length} invalid rows skipped.`);
    } catch (error: any) { setPreview([]); setMessage(error?.message || "Unable to read JSON file."); }
  }

  async function uploadPreview() {
    setBusy(true);
    try {
      const existing = new Set(candidates.map((row) => row.sourceId));
      const published = await firebaseClient.entities.Location.list();
      published.forEach((row: any) => row.sourceId && existing.add(row.sourceId));
      const fresh = preview.filter((row) => !existing.has(row.sourceId));
      for (let start = 0; start < fresh.length; start += 5) {
        await Promise.all(fresh.slice(start, start + 5).map((row) => firebaseClient.entities.LocationImportCandidate.create(row)));
      }
      setPreview([]);
      setMessage(`Uploaded ${fresh.length} candidates; skipped ${preview.length - fresh.length} duplicates.`);
      await loadCandidates();
    } catch (error: any) { setMessage(error?.message || "Bulk upload failed."); }
    finally { setBusy(false); }
  }

  async function approve(candidate: Candidate) {
    if (!candidate.id) return;
    setBusy(true);
    try {
      const created = await firebaseClient.entities.Location.create({
        name: candidate.name, address: candidate.address, state: candidate.state,
        stateCode: candidate.stateCode || "", lat: candidate.lat, lng: candidate.lng,
        activity: candidate.activity || "Hiking", difficulty: "Easy", distance: "N/A", duration: "N/A",
        openingHours: "Hours not verified yet",
        rating: 0, reviews: 0, badge: "OSM verified", color: C.forest, emoji: "📍",
        description: `${candidate.name} is an outdoor location sourced from OpenStreetMap and approved by a SeekMY administrator.`,
        facilities: [], bestMonths: "Year-round", accessibility: "Details not yet verified",
        tags: [candidate.activity || "Outdoor", "OpenStreetMap"], budget: "Free", status: "active",
        source: candidate.source, sourceId: candidate.sourceId, sourceUrl: candidate.sourceUrl,
        image_url: candidate.image_url || "", photo: candidate.photo || null,
        photoAttribution: candidate.photo ? `${candidate.photo.author} — ${candidate.photo.license}` : "",
        importedAt: candidate.importedAt || new Date().toISOString(), lastVerifiedAt: new Date().toISOString(),
      });
      await firebaseClient.entities.LocationImportCandidate.update(candidate.id, { status: "approved", publishedLocationId: created.id });
      setCandidates((rows) => rows.filter((row) => row.id !== candidate.id));
      onPublished(created);
      setMessage(`${candidate.name} published to Location.`);
    } catch (error: any) { setMessage(error?.message || "Approval failed."); }
    finally { setBusy(false); }
  }

  async function reject(candidate: Candidate) {
    if (!candidate.id) return;
    try {
      await firebaseClient.entities.LocationImportCandidate.update(candidate.id, { status: "rejected", reviewedAt: new Date().toISOString() });
      setCandidates((rows) => rows.filter((row) => row.id !== candidate.id));
      setMessage(`${candidate.name} rejected.`);
    } catch (error: any) { setMessage(error?.message || "Rejection failed."); }
  }

  async function suggestFreePhoto(candidate: Candidate) {
    if (!candidate.id) return;
    setBusy(true);
    try {
      const photo = await findCommonsPhoto(candidate);
      if (!photo) {
        await firebaseClient.entities.LocationImportCandidate.update(candidate.id, { photoStatus: "not_found" });
        setCandidates((rows) => rows.map((row) => row.id === candidate.id ? { ...row, photoStatus: "not_found" } : row));
        setMessage(`No reusable Wikimedia Commons photo found for ${candidate.name}.`);
        return;
      }
      const updated = { image_url: photo.imageUrl, photo, photoStatus: "needs_review" as const };
      await firebaseClient.entities.LocationImportCandidate.update(candidate.id, updated);
      setCandidates((rows) => rows.map((row) => row.id === candidate.id ? { ...row, ...updated } : row));
      setMessage(`Suggested a free photo for ${candidate.name}. Please verify before approving.`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to find a free photo.");
    } finally {
      setBusy(false);
    }
  }

  const pending = candidates.filter((row) => row.status === "pending");
  return <div>
    <div className="flex items-start justify-between gap-4 mb-5">
      <div><h1 className="text-2xl" style={{fontFamily:F.display,color:C.jungle}}>Outdoor Data Import</h1>
      <p className="text-sm" style={{color:C.textMuted}}>Bulk upload generated OpenStreetMap JSON, then verify before publishing.</p></div>
      <Pill variant="outline" small onClick={loadCandidates}><RefreshCw size={13}/> Refresh</Pill>
    </div>
    <div className="bg-white rounded-[18px] p-5 mb-5">
      <label className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center cursor-pointer" style={{borderColor:C.border}}>
        <FileUp size={24} style={{color:C.forest}}/><span className="font-bold text-sm mt-2">Choose generated outdoor JSON</span>
        <span className="text-xs mt-1" style={{color:C.textMuted}}>No service-account key required</span>
        <input type="file" accept="application/json,.json" className="hidden" onChange={(event)=>chooseFile(event.target.files?.[0])}/>
      </label>
      {preview.length>0&&<div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm font-bold">{preview.length} candidates ready</p><Pill variant="filled" small onClick={uploadPreview}>{busy?"Uploading...":"Bulk upload candidates"}</Pill></div>}
      {message&&<p className="text-sm mt-3" style={{color:C.textSub}}>{message}</p>}
    </div>
    <p className="text-sm font-bold mb-3">Pending review ({pending.length})</p>
    <div className="space-y-3">{pending.map((candidate)=><div key={candidate.id} className="bg-white rounded-[18px] p-4 flex gap-3 items-start">
      {candidate.image_url&&<a href={candidate.photo?.sourcePageUrl||candidate.image_url} target="_blank" rel="noreferrer" className="relative shrink-0"><img src={candidate.image_url} alt={`Suggested view of ${candidate.name}`} className="w-28 h-20 object-cover rounded-xl"/>{photoNeedsReview(candidate)&&<span className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm" style={{backgroundColor:C.errorBg,color:C.error}}>Review photo</span>}</a>}
      <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-sm">{candidate.name}</p>{photoNeedsReview(candidate)&&<span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{backgroundColor:C.errorBg,color:C.error}}>Photo needs review</span>}</div><p className="text-xs" style={{color:C.textMuted}}>{candidate.state} · {candidate.activity} · {candidate.category||"outdoor"}</p><p className="text-xs mt-1">{candidate.lat.toFixed(5)}, {candidate.lng.toFixed(5)}</p>
      {candidate.photo?<div className="mt-2"><p className="text-xs font-bold" style={{color:photoNeedsReview(candidate)?C.error:C.success}}>{photoNeedsReview(candidate)?"Verify Commons image before approve":"Suggested photo verified"} · {Math.round(candidate.photo.matchConfidence*100)}% confidence</p><p className="text-[11px] truncate" title={`${candidate.photo.author} — ${candidate.photo.license}`} style={{color:C.textMuted}}>{candidate.photo.author} — {candidate.photo.license}</p></div>:<p className="text-xs mt-2" style={{color:C.textMuted}}>No reusable photo found</p>}
      <div className="flex flex-wrap gap-3">
        <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Verify OSM location <ExternalLink size={11}/></a>
        <a href={candidateSearchUrl(candidate,"official website")} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Find official website <ExternalLink size={11}/></a>
        <a href={candidateSearchUrl(candidate,"opening hours official")} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Find official hours <ExternalLink size={11}/></a>
        <button type="button" disabled={busy} onClick={()=>suggestFreePhoto(candidate)} className="text-xs font-bold inline-flex items-center gap-1 mt-2 disabled:opacity-50" style={{color:C.forest}}>Find free photo <ImageIcon size={11}/></button>
        <a href={commonsSearchUrl(candidate)} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Search Commons <ExternalLink size={11}/></a>
        <a href={candidateMapsUrl(candidate)} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Check map <ExternalLink size={11}/></a>
        {candidate.photo?.sourcePageUrl&&<a href={candidate.photo.sourcePageUrl} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Verify photo &amp; licence <ExternalLink size={11}/></a>}
      </div>
      <p className="text-[11px] mt-2" style={{color:C.textMuted}}>Official hours are not filled automatically. After publishing, edit the location and paste the confirmed official source.</p></div>
      <button disabled={busy} onClick={()=>approve(candidate)} className="p-2 rounded-lg" style={{backgroundColor:C.successBg,color:C.success}} title="Approve"><CheckCircle size={16}/></button>
      <button disabled={busy} onClick={()=>reject(candidate)} className="p-2 rounded-lg" style={{backgroundColor:C.errorBg,color:C.error}} title="Reject"><Trash2 size={16}/></button>
    </div>)}{!pending.length&&<p className="text-sm" style={{color:C.textMuted}}>No pending imported candidates.</p>}</div>
  </div>;
}
