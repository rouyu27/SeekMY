import { useMemo, useState } from "react";
import { FileUp, MapPin, Check, AlertTriangle } from "lucide-react";
import type { MockUser, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES } from "../data/catalog";
import {
  getApplications,
  saveApplications,
  getSubmissions,
  saveSubmissions,
  type ContributorApplication,
  type LocationSubmission,
} from "../lib/contributorStore";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

export function ContributorPage({
  user,
  setPage,
}: {
  user: MockUser | null;
  setPage: (p: Page) => void;
}) {
  const [apps, setApps] = useState<ContributorApplication[]>(() => getApplications());
  const [subs, setSubs] = useState<LocationSubmission[]>(() => getSubmissions());
  const [tab, setTab] = useState<"register" | "submit" | "mine" | "profile">("register");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const myApp = useMemo(
    () => (user ? apps.find((a) => a.userId === user.id) : undefined),
    [apps, user]
  );
  const verified = myApp?.status === "verified";
  const mySubs = useMemo(
    () => (user ? subs.filter((s) => s.contributorId === user.id) : []),
    [subs, user]
  );

  // Register form
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("Sabah");
  const [services, setServices] = useState("");
  const [experience, setExperience] = useState("");
  const [docName, setDocName] = useState("");
  const [docError, setDocError] = useState("");

  // Location form
  const [locName, setLocName] = useState("");
  const [locState, setLocState] = useState("Selangor");
  const [locActivity, setLocActivity] = useState("Hiking");
  const [locDiff, setLocDiff] = useState("Easy");
  const [locDesc, setLocDesc] = useState("");
  const [locFac, setLocFac] = useState("");
  const [locAccess, setLocAccess] = useState("");
  const [locLat, setLocLat] = useState("");
  const [locLng, setLocLng] = useState("");
  const [photoName, setPhotoName] = useState("");

  // Profile
  const [profServices, setProfServices] = useState(myApp?.services || "");
  const [profPhone, setProfPhone] = useState(myApp?.phone || "");

  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>
            Local Contributor Portal
          </h1>
          <p className="text-sm mb-4" style={{ color: C.textMuted, fontFamily: F.body }}>
            Sign in to register as a verified local contributor.
          </p>
          <Pill variant="filled" onClick={() => setPage("account")}>Go to Account</Pill>
        </div>
      </div>
    );
  }

  function onDocChange(file?: File | null) {
    setDocError("");
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setDocError("Unsupported file format. Please upload PDF, JPG, or PNG files.");
      setDocName("");
      return;
    }
    if (file.size > MAX_BYTES) {
      setDocError("File size exceeds 5MB limit.");
      setDocName("");
      return;
    }
    setDocName(file.name);
  }

  function submitRegistration() {
    setMsg(null);
    if (myApp) {
      setMsg({ type: "err", text: "You are already registered as a contributor." });
      return;
    }
    if (!fullName.trim() || !phone.trim() || !services.trim() || !experience.trim()) {
      setMsg({ type: "err", text: "Please complete all required fields." });
      return;
    }
    if (!docName) {
      setMsg({ type: "err", text: "Please upload a verification document." });
      return;
    }
    const app: ContributorApplication = {
      id: `app-${Date.now()}`,
      userId: user!.id,
      userEmail: user!.email,
      fullName: fullName.trim(),
      phone: phone.trim(),
      area,
      services: services.trim(),
      experience: experience.trim(),
      docName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const next = [app, ...apps];
    setApps(next);
    saveApplications(next);
    setMsg({ type: "ok", text: "Your registration has been submitted. Please wait for admin verification." });
  }

  function submitLocation() {
    setMsg(null);
    if (!verified) {
      setMsg({ type: "err", text: "Only verified contributors can submit locations." });
      return;
    }
    if (!locName.trim() || !locDesc.trim() || !locLat.trim() || !locLng.trim()) {
      setMsg({ type: "err", text: "Please complete all required fields (name, description, GPS)." });
      return;
    }
    const dup = subs.find(
      (s) => s.name.toLowerCase() === locName.trim().toLowerCase() && s.state === locState
    );
    if (dup) {
      setMsg({ type: "err", text: "This location already exists in the system." });
      return;
    }
    const sub: LocationSubmission = {
      id: `sub-${Date.now()}`,
      contributorId: user!.id,
      contributorName: myApp?.fullName || user!.displayName,
      name: locName.trim(),
      state: locState,
      activity: locActivity,
      difficulty: locDiff,
      description: locDesc.trim(),
      facilities: locFac.trim(),
      accessibility: locAccess.trim(),
      lat: locLat.trim(),
      lng: locLng.trim(),
      photoName: photoName || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const next = [sub, ...subs];
    setSubs(next);
    saveSubmissions(next);
    setMsg({
      type: "ok",
      text: photoName
        ? "Location submitted successfully. Awaiting admin approval."
        : "Location submitted successfully. Awaiting admin approval. (Photos can be added later.)",
    });
    setLocName("");
    setLocDesc("");
  }

  function saveProfile() {
    if (!myApp || myApp.status !== "verified") return;
    if (!profPhone.trim()) {
      setMsg({ type: "err", text: "Please enter a valid phone number." });
      return;
    }
    const next = apps.map((a) =>
      a.id === myApp.id ? { ...a, phone: profPhone.trim(), services: profServices.trim() } : a
    );
    setApps(next);
    saveApplications(next);
    setMsg({ type: "ok", text: "Profile updated successfully." });
  }

  const inputStyle = {
    borderColor: C.border,
    fontFamily: F.body,
    color: C.text,
  } as const;

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="px-5 py-6" style={{ background: `linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)` }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-normal text-white" style={{ fontFamily: F.display }}>
            Local Contributor Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: F.body }}>
            {myApp
              ? `Status: ${myApp.status}${myApp.rejectReason ? ` — ${myApp.rejectReason}` : ""}`
              : "Register to share local outdoor knowledge"}
          </p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-14 z-20" style={{ borderColor: C.border }}>
        <div className="max-w-2xl mx-auto px-5 flex gap-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(
            [
              ["register", "Register"],
              ["submit", "Submit location"],
              ["mine", "My contributions"],
              ["profile", "Profile"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMsg(null); }}
              className="py-3 text-sm font-bold whitespace-nowrap"
              style={{
                color: tab === id ? C.jungle : C.textMuted,
                borderBottom: tab === id ? `2px solid ${C.amber}` : "2px solid transparent",
                fontFamily: F.body,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">
        {msg && (
          <div
            className="p-4 rounded-xl text-sm font-semibold flex gap-2"
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

        {tab === "register" && (
          <div className="bg-white rounded-[18px] p-6 space-y-3" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
            <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>Register as Contributor</h2>
            {myApp ? (
              <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                Application already submitted ({myApp.status}).
                {myApp.docName && <> Document: {myApp.docName}</>}
              </p>
            ) : (
              <>
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Full name *" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)}>
                  {ALL_STATES.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Services offered *" value={services} onChange={(e) => setServices(e.target.value)} />
                <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none" style={inputStyle} rows={3} placeholder="Experience *" value={experience} onChange={(e) => setExperience(e.target.value)} />
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer" style={{ color: C.forest, fontFamily: F.body }}>
                  <FileUp size={16} />
                  Upload verification document (PDF/JPG/PNG ≤5MB)
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onDocChange(e.target.files?.[0])} />
                </label>
                {docName && <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>Selected: {docName}</p>}
                {docError && <p className="text-xs" style={{ color: C.error, fontFamily: F.body }}>{docError}</p>}
                <Pill variant="filled" onClick={submitRegistration}>Submit registration</Pill>
              </>
            )}
          </div>
        )}

        {tab === "submit" && (
          <div className="bg-white rounded-[18px] p-6 space-y-3" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
            <h2 className="font-bold flex items-center gap-2" style={{ fontFamily: F.body, color: C.text }}>
              <MapPin size={16} /> Submit New Location
            </h2>
            {!verified ? (
              <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                Your account must be verified by an administrator before submitting locations.
              </p>
            ) : (
              <>
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Location name *" value={locName} onChange={(e) => setLocName(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locState} onChange={(e) => setLocState(e.target.value)}>
                    {ALL_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                  </select>
                  <select className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locActivity} onChange={(e) => setLocActivity(e.target.value)}>
                    {"Hiking,Diving,Cycling,Camping,Swimming,Trail Running,Jogging,Rock Climbing,Water Sports".split(",").map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locDiff} onChange={(e) => setLocDiff(e.target.value)}>
                  <option>Easy</option><option>Moderate</option><option>Hard</option>
                </select>
                <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none" style={inputStyle} rows={3} placeholder="Description *" value={locDesc} onChange={(e) => setLocDesc(e.target.value)} />
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Facilities (comma-separated)" value={locFac} onChange={(e) => setLocFac(e.target.value)} />
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Accessibility info" value={locAccess} onChange={(e) => setLocAccess(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Latitude *" value={locLat} onChange={(e) => setLocLat(e.target.value)} />
                  <input className="px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Longitude *" value={locLng} onChange={(e) => setLocLng(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer" style={{ color: C.forest, fontFamily: F.body }}>
                  <FileUp size={16} /> Photo (optional)
                  <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!["image/jpeg", "image/png"].includes(f.type) || f.size > MAX_BYTES) {
                      setMsg({ type: "err", text: "Photo must be JPG/PNG under 5MB." });
                      return;
                    }
                    setPhotoName(f.name);
                  }} />
                </label>
                {photoName && <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>{photoName}</p>}
                <Pill variant="filled" onClick={submitLocation}>Submit location</Pill>
              </>
            )}
          </div>
        )}

        {tab === "mine" && (
          <div className="space-y-3">
            {mySubs.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                You have not submitted any locations yet.
              </p>
            ) : (
              mySubs.map((s) => (
                <div key={s.id} className="bg-white rounded-[18px] p-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-sm" style={{ color: C.text, fontFamily: F.body }}>{s.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{
                      backgroundColor: s.status === "approved" ? C.successBg : s.status === "rejected" ? C.errorBg : "#fef3c7",
                      color: s.status === "approved" ? C.success : s.status === "rejected" ? C.error : "#92400e",
                      fontFamily: F.body,
                    }}>{s.status}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>
                    {s.state} · {s.activity} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  {s.rejectReason && (
                    <p className="text-[12px] mt-2" style={{ color: C.error, fontFamily: F.body }}>Reason: {s.rejectReason}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="bg-white rounded-[18px] p-6 space-y-3" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
            <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>Manage profile</h2>
            {!verified ? (
              <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>Available after verification.</p>
            ) : (
              <>
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profPhone} onChange={(e) => setProfPhone(e.target.value)} placeholder="Phone" />
                <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profServices} onChange={(e) => setProfServices(e.target.value)} placeholder="Services" />
                <Pill variant="filled" onClick={saveProfile}>Save changes</Pill>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
