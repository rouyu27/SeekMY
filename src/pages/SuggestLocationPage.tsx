import { useState } from "react";
import { ChevronLeft, MapPin, Check, AlertTriangle, FileUp, ImageIcon } from "lucide-react";
import type { MockUser, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";
import type { LocationSubmission } from "../lib/communityTypes";

const ACTIVITIES =
  "Hiking,Diving,Cycling,Camping,Swimming,Trail Running,Jogging,Rock Climbing,Water Sports".split(",");

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SuggestLocationPage({
  user,
  setPage,
  onToast,
}: {
  user: MockUser | null;
  setPage: (p: Page) => void;
  onToast?: (msg: string, type?: "ok" | "err") => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Selangor");
  const [activity, setActivity] = useState("Hiking");
  const [difficulty, setDifficulty] = useState("Easy");
  const [description, setDescription] = useState("");
  const [facilities, setFacilities] = useState("");
  const [accessibility, setAccessibility] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const inputStyle = {
    borderColor: C.border,
    fontFamily: F.body,
    color: C.text,
  } as const;

  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <MapPin size={40} className="mx-auto mb-3" style={{ color: C.textMuted }} />
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>
            Suggest a location
          </h1>
          <p className="text-sm mb-4" style={{ color: C.textMuted, fontFamily: F.body }}>
            Sign in to suggest a new outdoor location for SeekMY.
          </p>
          <Pill variant="filled" onClick={() => setPage("account")}>
            Go to Account
          </Pill>
        </div>
      </div>
    );
  }

  async function onPhoto(file?: File | null) {
    setMsg(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg({ type: "err", text: "Please upload a JPG, PNG, or WEBP image." });
      setPhotoName("");
      setPhotoData("");
      setPhotoFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "err", text: "Photo must be under 5MB." });
      setPhotoName("");
      setPhotoData("");
      setPhotoFile(null);
      return;
    }
    try {
      const data = await fileToDataUrl(file);
      setPhotoData(data);
      setPhotoFile(file);
      setPhotoName(file.name);
    } catch {
      setMsg({ type: "err", text: "Could not read the image. Please try another file." });
    }
  }

  async function submit() {
    setMsg(null);
    if (!name.trim() || !address.trim() || !description.trim()) { setMsg({type:"err",text:"Please complete all required fields (name, address and description)."}); return; }
    if (!photoFile) { setMsg({type:"err",text:"A photo is required. Please upload a picture of the location."}); return; }
    setSaving(true);
    try {
      const [existingLocations, mySubmissions] = await Promise.all([
        firebaseClient.entities.Location.filter({ state }),
        firebaseClient.entities.LocationSubmission.filter({ created_by_id: user!.id }),
      ]);
      const duplicate = [...existingLocations, ...mySubmissions].some((x:any)=>
        String(x.name||"").toLowerCase()===name.trim().toLowerCase() && String(x.state||"")===state
      );
      if (duplicate) { setMsg({type:"err",text:"This location already exists in SeekMY or in your suggestion queue."}); return; }
      const photoUrl = await firebaseClient.storage.uploadLocationPhoto(photoFile);
      const payload: Omit<LocationSubmission,"id"> = {
        contributorId:user!.id, contributorName:user!.displayName, name:name.trim(), address:address.trim(), state, activity, difficulty,
        description:description.trim(), facilities:facilities.trim(), accessibility:accessibility.trim(),
        photoUrl, photoName:photoName||"photo.jpg", status:"pending", createdAt:new Date().toISOString(),
      };
      await firebaseClient.entities.LocationSubmission.create(payload);
      setMsg({type:"ok",text:"Location submitted successfully. You can track it under Profile → My Suggestions. You will be notified when an admin reviews it."});
      onToast?.("Location submitted successfully. Awaiting admin approval.");
      setName(""); setAddress(""); setDescription(""); setFacilities(""); setAccessibility(""); setPhotoName(""); setPhotoData(""); setPhotoFile(null);
    } catch (error:any) { setMsg({type:"err",text:error?.message||"Unable to submit this location to Firebase."}); }
    finally { setSaving(false); }
  }

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="px-5 py-6" style={{ background: `linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)` }}>
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setPage("explore")}
            className="flex items-center gap-1.5 text-sm mb-3"
            style={{ color: "rgba(255,255,255,0.7)", fontFamily: F.body }}
          >
            <ChevronLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-normal text-white" style={{ fontFamily: F.display }}>
            Suggest a location
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: F.body }}>
            Share a hidden outdoor spot with a photo. Admins will review before it appears on Discover.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {msg && (
          <div
            className="p-4 rounded-xl text-sm font-semibold flex gap-2 mb-4"
            style={{
              backgroundColor: msg.type === "ok" ? C.successBg : C.errorBg,
              color: msg.type === "ok" ? C.success : C.error,
              fontFamily: F.body,
            }}
          >
            {msg.type === "ok" ? <Check size={16} /> : <AlertTriangle size={16} />}
            {msg.text}
          </div>
        )}

        <div
          className="bg-white rounded-[18px] p-6 space-y-3"
          style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} style={{ color: C.jungle }} />
            <h2 className="font-bold text-sm" style={{ fontFamily: F.body, color: C.text }}>
              Location details
            </h2>
          </div>

          <input
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            placeholder="Location name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
            placeholder="Full address *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <select className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={state} onChange={(e) => setState(e.target.value)}>
              {ALL_STATES.map((s) => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITIES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>Easy</option>
            <option>Moderate</option>
            <option>Hard</option>
          </select>

          <textarea
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none"
            style={inputStyle}
            rows={3}
            placeholder="Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Facilities (comma-separated)" value={facilities} onChange={(e) => setFacilities(e.target.value)} />
          <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Accessibility info" value={accessibility} onChange={(e) => setAccessibility(e.target.value)} />

          {/* Required photo */}
          <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: photoData ? C.forest : C.border }}>
            <label className="flex flex-col items-center gap-2 cursor-pointer text-center">
              {photoData ? (
                <img src={photoData} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
              ) : (
                <ImageIcon size={32} style={{ color: C.textMuted }} />
              )}
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: C.forest, fontFamily: F.body }}>
                <FileUp size={16} /> {photoData ? "Change photo *" : "Upload photo * (required)"}
              </span>
              <span className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>
                JPG, PNG or WEBP · max 5MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
            {photoName && (
              <p className="text-xs mt-2 text-center" style={{ color: C.textMuted, fontFamily: F.body }}>
                {photoName}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Pill variant="filled" onClick={submit}>
              {saving ? "Submitting..." : "Submit suggestion"}
            </Pill>
            <Pill variant="outline" onClick={() => setPage("explore")}>
              Cancel
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
}
