import { useEffect, useMemo, useState } from "react";
import { Archive, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import { firebaseClient } from "../../api/firebaseClient";
import { BADGE_DEFS } from "../../lib/badges";
import type { BadgeMetric, ManagedBadgeDefinition } from "../../lib/types";
import { C, F } from "../../lib/tokens";

const badgeImages = new Map(BADGE_DEFS.flatMap((badge) => [[badge.id, badge.image], [badge.name, badge.image]]));

const METRICS: Array<{ value: BadgeMetric; label: string }> = [
  { value: "activities", label: "Activities logged" },
  { value: "states", label: "Distinct states visited" },
  { value: "km", label: "Total kilometres" },
  { value: "gems", label: "Hidden-gem visits" },
  { value: "reviews", label: "Community reviews" },
  { value: "hikes", label: "Hiking activities" },
  { value: "dives", label: "Diving activities" },
  { value: "cycleKm", label: "Cycling kilometres" },
  { value: "camps", label: "Camping activities" },
];

type BadgeForm = {
  key: string; name: string; description: string; imageUrl: string;
  metric: BadgeMetric; requirement: string; displayOrder: string;
};

const EMPTY_FORM: BadgeForm = {
  key: "", name: "", description: "", imageUrl: "",
  metric: "activities", requirement: "1", displayOrder: "100",
};

function formFor(badge: ManagedBadgeDefinition): BadgeForm {
  return {
    key: badge.key, name: badge.name, description: badge.description || badge.desc,
    imageUrl: badge.imageUrl, metric: badge.metric,
    requirement: String(badge.requirement), displayOrder: String(badge.displayOrder),
  };
}

export function BadgeManagementPanel() {
  const [badges, setBadges] = useState<ManagedBadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [editing, setEditing] = useState<ManagedBadgeDefinition | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BadgeForm>(EMPTY_FORM);
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await firebaseClient.backend.getAdminBadgeDefinitions();
      setBadges(result.badges as unknown as ManagedBadgeDefinition[]);
    } catch (err: any) { setError(err?.message || "Unable to load badge definitions."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => badges.filter((badge) => {
    const matchesStatus = status === "all" || badge.status === status;
    const term = search.trim().toLowerCase();
    return matchesStatus && (!term || `${badge.name} ${badge.key} ${badge.description} ${badge.metric}`.toLowerCase().includes(term));
  }), [badges, search, status]);

  useEffect(() => () => {
    if (badgeImagePreview) URL.revokeObjectURL(badgeImagePreview);
  }, [badgeImagePreview]);

  function resetBadgeImage() {
    if (badgeImagePreview) URL.revokeObjectURL(badgeImagePreview);
    setBadgeImageFile(null);
    setBadgeImagePreview("");
    setUploadProgress(0);
  }

  function chooseBadgeImage(file?: File) {
    resetBadgeImage();
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Badge picture must be an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Badge picture must be 2 MB or smaller."); return; }
    setError("");
    setBadgeImageFile(file);
    setBadgeImagePreview(URL.createObjectURL(file));
  }

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); resetBadgeImage(); setShowForm(true); setError(""); }
  function openEdit(badge: ManagedBadgeDefinition) { setEditing(badge); setForm(formFor(badge)); resetBadgeImage(); setShowForm(true); setError(""); }
  function closeForm() { if (!saving) { setShowForm(false); setEditing(null); resetBadgeImage(); } }

  async function save() {
    setError(""); setNotice("");
    const requirement = Number(form.requirement);
    if (!form.name.trim() || !form.description.trim() || !form.key.trim()) { setError("Badge key, name, and description are required."); return; }
    if (!Number.isFinite(requirement) || requirement <= 0) { setError("Requirement must be greater than 0."); return; }
    if (!editing && !badgeImageFile) { setError("Badge picture is required."); return; }
    setSaving(true);
    try {
      const imageUrl = badgeImageFile ? await firebaseClient.storage.uploadBadgeImage(badgeImageFile, setUploadProgress) : form.imageUrl;
      const payload = { ...form, icon: "", imageUrl, requirement, displayOrder: Number(form.displayOrder) || 0 };
      if (editing) await firebaseClient.backend.updateBadgeDefinition(editing.id, payload);
      else await firebaseClient.backend.createBadgeDefinition(payload);
      setNotice(editing ? "Badge updated." : "Badge created. It will be evaluated during users' next badge sync.");
      setShowForm(false); setEditing(null); resetBadgeImage(); await load();
    } catch (err: any) { setError(err?.message || "Unable to save badge."); }
    finally { setSaving(false); }
  }

  async function setArchived(badge: ManagedBadgeDefinition, archived: boolean) {
    const message = archived
      ? `Archive “${badge.name}”? Existing earned badges will be kept, but it will not be awarded to new users.`
      : `Restore “${badge.name}” to the active badge catalogue?`;
    if (!confirm(message)) return;
    setError(""); setNotice("");
    try {
      if (archived) await firebaseClient.backend.archiveBadgeDefinition(badge.id);
      else await firebaseClient.backend.restoreBadgeDefinition(badge.id);
      setNotice(archived ? "Badge archived. Existing awards were preserved." : "Badge restored.");
      await load();
    } catch (err: any) { setError(err?.message || "Unable to change badge status."); }
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl" style={{fontFamily:F.display,color:C.jungle}}>Badge Management</h1><p className="text-sm" style={{color:C.textMuted}}>Create and maintain achievement rules. Archiving preserves users' earned badges.</p></div>
      <button type="button" onClick={openCreate} className="h-10 rounded-full px-4 text-sm font-bold text-white flex items-center gap-2" style={{backgroundColor:C.jungle}}><Plus size={15}/> Add Badge</button>
    </div>
    {error&&<p className="rounded-xl p-3 text-sm font-semibold" style={{backgroundColor:C.errorBg,color:C.error}}>{error}</p>}
    {notice&&<p className="rounded-xl p-3 text-sm font-semibold" style={{backgroundColor:C.successBg,color:C.success}}>{notice}</p>}
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1"><Search size={15} className="absolute left-3 top-3" style={{color:C.textMuted}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search badges" className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm" style={{borderColor:C.border}}/></label>
      <select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="h-10 rounded-xl border px-3 text-sm" style={{borderColor:C.border}}><option value="all">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></select>
    </div>
    {loading?<p className="text-sm" style={{color:C.textMuted}}>Loading badges...</p>:<div className="space-y-3">{visible.map(badge=>{const image=badge.imageUrl||badgeImages.get(badge.key)||badgeImages.get(badge.name);return <div key={badge.id} className="rounded-[18px] bg-white p-4 flex flex-col gap-4 sm:flex-row sm:items-center" style={{boxShadow:"0 1px 3px rgba(27,67,50,0.10)"}}>
      <div className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden text-2xl flex-shrink-0" style={{backgroundColor:C.muted}}>{image?<img src={image} alt={`${badge.name} badge`} className="h-full w-full object-contain"/>:<span className="text-xs font-bold" style={{color:C.forest}}>MY</span>}</div>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-sm">{badge.name}</p><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{backgroundColor:badge.status==="active"?C.successBg:"#fffbef",color:badge.status==="active"?C.success:C.amber}}>{badge.status}</span></div><p className="text-xs mt-1" style={{color:C.textSub}}>{badge.description||badge.desc}</p><p className="text-[11px] mt-2" style={{color:C.textMuted}}>{badge.requirement} {METRICS.find(item=>item.value===badge.metric)?.label||badge.metric} · {badge.earnedCount||0} earned · key: {badge.key}</p></div>
      <div className="flex gap-2"><button type="button" title="Edit badge" onClick={()=>openEdit(badge)} className="h-9 w-9 rounded-lg border flex items-center justify-center" style={{borderColor:C.border,color:C.forest}}><Pencil size={14}/></button>{badge.status==="active"?<button type="button" title="Archive badge" onClick={()=>setArchived(badge,true)} className="h-9 w-9 rounded-lg flex items-center justify-center" style={{backgroundColor:C.errorBg,color:C.error}}><Archive size={14}/></button>:<button type="button" title="Restore badge" onClick={()=>setArchived(badge,false)} className="h-9 w-9 rounded-lg flex items-center justify-center" style={{backgroundColor:C.successBg,color:C.success}}><RotateCcw size={14}/></button>}</div>
    </div>})}{!visible.length&&<p className="rounded-[18px] bg-white p-5 text-sm" style={{color:C.textMuted}}>No badges match this view.</p>}</div>}

    {showForm&&<div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4"><div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-6"><div className="flex items-start justify-between mb-5"><div><h2 className="text-xl" style={{fontFamily:F.display,color:C.jungle}}>{editing?"Edit Badge":"Add Badge"}</h2><p className="text-xs" style={{color:C.textMuted}}>{editing?"The badge key is locked to protect existing awards.":"New badges are evaluated on the next user badge sync."}</p></div><button onClick={closeForm}><X size={18}/></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold">Badge key<input value={form.key} disabled={Boolean(editing)} onChange={e=>setForm({...form,key:e.target.value})} placeholder="trail-regular" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm disabled:bg-gray-100"/></label>
        <label className="text-xs font-bold">Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/></label>
        <label className="text-xs font-bold sm:col-span-2">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm resize-none"/></label>
        <label className="text-xs font-bold">Metric<select value={form.metric} onChange={e=>setForm({...form,metric:e.target.value as BadgeMetric})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">{METRICS.map(metric=><option key={metric.value} value={metric.value}>{metric.label}</option>)}</select></label>
        <label className="text-xs font-bold">Requirement<input type="number" min="0.01" step="0.01" value={form.requirement} onChange={e=>setForm({...form,requirement:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/></label>
        <label className="text-xs font-bold">Display order<input type="number" value={form.displayOrder} onChange={e=>setForm({...form,displayOrder:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"/></label>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold block mb-1">Badge picture{editing ? " (optional)" : " *"}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>chooseBadgeImage(event.target.files?.[0])} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white"/>
          <p className="mt-1 text-[11px]" style={{color:C.textMuted}}>Upload PNG, JPG, or WEBP. The system will store it and save the generated image URL.</p>
          {(badgeImagePreview||form.imageUrl)&&<div className="mt-3 flex items-center gap-3 rounded-xl border p-3" style={{borderColor:C.border}}>
            <img src={badgeImagePreview||form.imageUrl} alt="Badge preview" className="h-20 w-20 rounded-xl object-contain"/>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold" style={{color:C.text}}>Badge image preview</p>
              <p className="text-[11px]" style={{color:C.textMuted}}>{badgeImageFile?badgeImageFile.name:"Current uploaded image"}</p>
              {badgeImagePreview&&<button type="button" onClick={resetBadgeImage} className="mt-2 text-xs font-bold" style={{color:C.error}}>Remove selected picture</button>}
            </div>
          </div>}
          {saving&&badgeImageFile&&uploadProgress>0&&<p className="mt-2 text-[11px] font-bold" style={{color:C.forest}}>Uploading picture... {uploadProgress}%</p>}
        </div>
      </div><div className="mt-6 flex justify-end gap-2"><button onClick={closeForm} disabled={saving} className="h-10 rounded-full border px-4 text-sm font-bold">Cancel</button><button onClick={save} disabled={saving} className="h-10 rounded-full px-5 text-sm font-bold text-white disabled:opacity-60" style={{backgroundColor:C.jungle}}>{saving?"Saving...":"Save Badge"}</button></div>
    </div></div>}
  </div>;
}
