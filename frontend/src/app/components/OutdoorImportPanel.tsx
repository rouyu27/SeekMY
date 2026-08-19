import { useEffect, useState } from "react";
import { CheckCircle, FileUp, RefreshCw, Trash2, ExternalLink } from "lucide-react";
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
      {candidate.image_url&&<a href={candidate.photo?.sourcePageUrl||candidate.image_url} target="_blank" rel="noreferrer" className="shrink-0"><img src={candidate.image_url} alt={`Suggested view of ${candidate.name}`} className="w-28 h-20 object-cover rounded-xl"/></a>}
      <div className="flex-1 min-w-0"><p className="font-bold text-sm">{candidate.name}</p><p className="text-xs" style={{color:C.textMuted}}>{candidate.state} · {candidate.activity} · {candidate.category||"outdoor"}</p><p className="text-xs mt-1">{candidate.lat.toFixed(5)}, {candidate.lng.toFixed(5)}</p>
      {candidate.photo?<div className="mt-2"><p className="text-xs font-bold" style={{color:candidate.photoStatus==="needs_review"?C.error:C.success}}>{candidate.photoStatus==="needs_review"?"Photo needs careful review":"Suggested photo"} · {Math.round(candidate.photo.matchConfidence*100)}% confidence</p><p className="text-[11px] truncate" title={`${candidate.photo.author} — ${candidate.photo.license}`} style={{color:C.textMuted}}>{candidate.photo.author} — {candidate.photo.license}</p></div>:<p className="text-xs mt-2" style={{color:C.textMuted}}>No reusable photo found</p>}
      <div className="flex flex-wrap gap-3"><a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Verify location <ExternalLink size={11}/></a>{candidate.photo?.sourcePageUrl&&<a href={candidate.photo.sourcePageUrl} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex items-center gap-1 mt-2" style={{color:C.forest}}>Verify photo &amp; licence <ExternalLink size={11}/></a>}</div></div>
      <button disabled={busy} onClick={()=>approve(candidate)} className="p-2 rounded-lg" style={{backgroundColor:C.successBg,color:C.success}} title="Approve"><CheckCircle size={16}/></button>
      <button disabled={busy} onClick={()=>reject(candidate)} className="p-2 rounded-lg" style={{backgroundColor:C.errorBg,color:C.error}} title="Reject"><Trash2 size={16}/></button>
    </div>)}{!pending.length&&<p className="text-sm" style={{color:C.textMuted}}>No pending imported candidates.</p>}</div>
  </div>;
}
