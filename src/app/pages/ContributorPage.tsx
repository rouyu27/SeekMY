//==================== WongYueShan Part - Local Contributor Portal ====================
import { useEffect, useMemo, useState } from "react";
import { FileUp, MapPin, Check, AlertTriangle, UserRoundCheck, Pencil, X, ShieldCheck, WalletCards, Lightbulb, Phone, Globe2, Languages, CalendarClock, BarChart3, Search } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { AppUser, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";
import type { ContributorApplication, LocationSubmission } from "../lib/communityTypes";
import type { Language } from "../lib/i18n";
import { t, activityLabel } from "../lib/i18n";
import { geocodeMapLocation, reverseGeocodeLocation } from "../lib/mapGeocoding";
import "leaflet/dist/leaflet.css";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const CONTRIBUTION_AREAS = [
  "Swimming spots and water recreation",
  "Hiking trails",
  "Waterfalls and rivers",
  "Beaches and islands",
  "Camping locations",
  "Parks and nature attractions",
  "Other outdoor locations",
];
type RegistrationField = "fullName" | "phone" | "area" | "contributionArea" | "experience" | "document";
type RegistrationErrors = Partial<Record<RegistrationField, string>>;

function contributorStatusLabel(status?: ContributorApplication["status"]) {
  if (status === "approved" || status === "verified") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function parsePriceRange(minValue: string, maxValue: string): { min: number; max: number; label: string } | null {
  const minText = minValue.trim();
  const maxText = maxValue.trim();
  if (!minText && !maxText) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(minText || maxText)) return null;
  if (maxText && !/^\d+(?:\.\d{1,2})?$/.test(maxText)) return null;
  const min = Number(minText || maxText);
  const max = Number(maxText || minText);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return null;
  const format = (price: number) => Number.isInteger(price) ? String(price) : price.toFixed(2);
  return { min, max, label: min === max ? format(min) : `${format(min)}-${format(max)}` };
}

function splitPriceRange(submission: LocationSubmission) {
  const raw = String(submission.estimatedPriceRange || (typeof submission.estimatedPrice === "number" ? submission.estimatedPrice : ""));
  const [min, max] = raw.split("-");
  return { min: min || "", max: max || "" };
}

export function ContributorPage({
  user,
  setPage,
  onSignIn,
  language = "en",
}: {
  user: AppUser | null;
  setPage: (p: Page) => void;
  onSignIn: () => void;
  language?: Language;
}) {
  const [apps, setApps] = useState<ContributorApplication[]>([]);
  const [subs, setSubs] = useState<LocationSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"register" | "submit" | "mine" | "profile">("register");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const myApp = useMemo(
    () => (user ? apps.find((a) => a.userId === user.id) : undefined),
    [apps, user]
  );
  const approved = myApp?.status === "approved" || myApp?.status === "verified";
  const mySubs = useMemo(
    () => (user ? subs.filter((s) => s.contributorId === user.id) : []),
    [subs, user]
  );

  // Register form
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [contributionArea, setContributionArea] = useState("");
  const [experience, setExperience] = useState("");
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState("");
  const [registrationErrors, setRegistrationErrors] = useState<RegistrationErrors>({});

  // Location form
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locLat, setLocLat] = useState("");
  const [locLng, setLocLng] = useState("");
  const [locState, setLocState] = useState("Selangor");
  const [locActivity, setLocActivity] = useState("Hiking");
  const [locDiff, setLocDiff] = useState("Easy");
  const [locDesc, setLocDesc] = useState("");
  const [locFac, setLocFac] = useState("");
  const [locAccess, setLocAccess] = useState("");
  const [locPriceMin, setLocPriceMin] = useState("");
  const [locPriceMax, setLocPriceMax] = useState("");
  const [locSafety, setLocSafety] = useState("");
  const [locBestTime, setLocBestTime] = useState("");
  const [locTip, setLocTip] = useState("");
  const [locSourceUrl, setLocSourceUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [findingLocation, setFindingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Profile
  const [profServices, setProfServices] = useState(myApp?.contributionArea || myApp?.services || "");
  const [profPhone, setProfPhone] = useState(myApp?.phone || "");
  const [profPublicContact, setProfPublicContact] = useState(myApp?.publicContact || "phone");
  const [profAvailability, setProfAvailability] = useState(myApp?.availability || "");
  const [profLanguages, setProfLanguages] = useState(myApp?.languages || "");
  const [profDescription, setProfDescription] = useState(myApp?.serviceDescription || "");
  const [profWebsite, setProfWebsite] = useState(myApp?.websiteUrl || "");
  const priceRange = parsePriceRange(locPriceMin, locPriceMax);
  const numericPrice = priceRange?.max ?? 0;
  const budget = numericPrice <= 0 ? "Free" : numericPrice <= 20 ? "Low" : numericPrice <= 50 ? "Medium" : "High";
  const contributionStats = {
    total: mySubs.length,
    pending: mySubs.filter(s=>s.status==="pending").length,
    approved: mySubs.filter(s=>s.status==="approved").length,
    rejected: mySubs.filter(s=>s.status==="rejected").length,
  };

  useEffect(() => {
    if (!user) { setApps([]); setSubs([]); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      firebaseClient.entities.Contributor.filter({ created_by_id: user.id }),
      firebaseClient.entities.LocationSubmission.filter({ created_by_id: user.id }),
    ]).then(([a,s]: any[]) => {
      if (!cancelled) { setApps(a as ContributorApplication[]); setSubs(s as LocationSubmission[]); }
    }).catch((error:any) => { if(!cancelled) setMsg({type:"err",text:error?.message||"Unable to load contributor data from Firebase."}); })
      .finally(()=>{ if(!cancelled) setLoading(false); });
    return () => { cancelled=true; };
  }, [user?.id]);

  useEffect(() => {
    setProfServices(myApp?.contributionArea || myApp?.services || "");
    setProfPhone(myApp?.phone || "");
    setProfPublicContact(myApp?.publicContact || "phone");
    setProfAvailability(myApp?.availability || "");
    setProfLanguages(myApp?.languages || "");
    setProfDescription(myApp?.serviceDescription || "");
    setProfWebsite(myApp?.websiteUrl || "");
    if (myApp?.status === "rejected") {
      setFullName(myApp.fullName || "");
      setPhone(myApp.phone || "");
      setArea(myApp.area || "");
      setContributionArea(myApp.contributionArea || myApp.services || "");
      setExperience(myApp.localKnowledgeExperience || myApp.experience || "");
      setDocName(myApp.docName || "");
    }
  }, [myApp?.id,myApp?.status]);

  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#EAF2ED" }}
          >
            <UserRoundCheck
              size={36}
              strokeWidth={1.8}
              style={{ color: C.jungle }}
            />
          </div>

          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>
            {t(language, "contributorPortal")}
          </h1>
          <p className="text-sm mb-4" style={{ color: C.textMuted, fontFamily: F.body }}>
            {t(language, "signInContributorText")}
          </p>
          <Pill variant="filled" onClick={onSignIn}>{t(language, "signIn")}</Pill>
        </div>
      </div>
    );
  }

  function onDocChange(file?: File | null) {
    setDocError("");
    setRegistrationErrors(current => ({ ...current, document: undefined }));
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setDocError("Unsupported file format. Please upload PDF, JPG, or PNG files.");
      setDocName("");
      setDocFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setDocError("File size exceeds 5MB limit.");
      setDocName("");
      setDocFile(null);
      return;
    }
    setDocFile(file);
    setDocName(file.name);
  }

  async function submitRegistration() {
    setMsg(null);
    if (myApp && myApp.status !== "rejected") { setMsg({type:"err",text:"Your contributor application is already under review or approved."}); return; }
    const errors: RegistrationErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!/^\d{10,11}$/.test(phone.trim())) errors.phone = "Phone number must contain 10 or 11 digits.";
    if (!area) errors.area = "Please select a state.";
    if (!contributionArea) errors.contributionArea = "Please select an area of contribution.";
    if (experience.trim().length < 30) errors.experience = "Local knowledge and experience must contain at least 30 characters.";
    if (!docFile && !myApp?.docUrl) errors.document = "Please upload a supporting document.";
    if (docError) errors.document = docError;
    setRegistrationErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      const docUrl = docFile ? await firebaseClient.storage.uploadContributorDocument(docFile) : myApp!.docUrl;
      const payload = {
        userId:user!.id,userEmail:user!.email,fullName:fullName.trim(),phone:phone.trim(),area,
        contributionArea,localKnowledgeExperience:experience.trim(),
        services:contributionArea,experience:experience.trim(),docName,docUrl,status:"pending",
        rejectReason:"",createdAt:myApp?.createdAt || new Date().toISOString(),
        ...(myApp ? {resubmittedAt:new Date().toISOString()} : {}),
      };
      const saved:any = myApp
        ? await firebaseClient.entities.Contributor.update(myApp.id,payload)
        : await firebaseClient.entities.Contributor.createWithId(user!.id,payload);
      await firebaseClient.entities.Announcement.create({
        userId:user!.id,
        title:myApp ? "Contributor registration resubmitted" : "Contributor registration received",
        message:myApp
          ? "Thanks for updating your contributor registration. We received the changes and an administrator will review them soon."
          : "Thanks for registering as a SeekMY contributor. We received your application and an administrator will review it soon.",
        type:"info",
        relatedPage:"contributor",
        submissionId:saved.id,
        read:false,
        dismissed:false,
        createdAt:new Date().toISOString(),
      });
      setApps([saved as ContributorApplication]);
      setRegistrationErrors({});
      setMsg({type:"ok",text:"Your contributor registration has been submitted successfully and is awaiting administrator review."});
    } catch(error:any) { setMsg({type:"err",text:error?.message||"Unable to submit contributor registration to Firebase."}); }
    finally { setLoading(false); }
  }

  function resetLocationForm() {
    setLocName(""); setLocAddress(""); setLocLat(""); setLocLng(""); setLocState("Selangor"); setLocActivity("Hiking"); setLocDiff("Easy");
    setLocDesc(""); setLocFac(""); setLocAccess(""); setLocPriceMin(""); setLocPriceMax(""); setLocSafety(""); setLocBestTime(""); setLocTip(""); setLocSourceUrl("");
    setPhotoName(""); setPhotoFile(null); setEditingSubmissionId(null); setDetectedLocation(null); setFindingLocation(false);
  }

  function editSubmission(submission: LocationSubmission) {
    if (submission.status === "approved") { setMsg({type:"err",text:"Approved locations are already published. Please contact admin for public changes."}); return; }
    setLocName(submission.name || "");
    setLocAddress(submission.address || "");
    setLocLat(typeof submission.lat === "number" ? String(submission.lat) : "");
    setLocLng(typeof submission.lng === "number" ? String(submission.lng) : "");
    setLocState(submission.state || "Selangor");
    setLocActivity(submission.activity || "Hiking");
    setLocDiff(submission.difficulty || "Easy");
    setLocDesc(submission.description || "");
    setLocFac(submission.facilities || "");
    setLocAccess(submission.accessibility || "");
    const priceParts = splitPriceRange(submission);
    setLocPriceMin(priceParts.min);
    setLocPriceMax(priceParts.max);
    setLocSafety(submission.safetyNotes || "");
    setLocBestTime(submission.bestTime || "");
    setLocTip(submission.contributorTip || "");
    setLocSourceUrl(submission.sourceUrl || "");
    setPhotoName(submission.photoName || "");
    setPhotoFile(null);
    setEditingSubmissionId(submission.id);
    setDetectedLocation(null);
    setTab("submit");
    setMsg(null);
  }

  async function findContributorLocation() {
    if (!locName.trim()) { setMsg({type:"err",text:"Enter the location name before searching the map."}); return; }
    setFindingLocation(true);
    setDetectedLocation(null);
    setMsg(null);
    try {
      const found = await geocodeMapLocation({ name: locName.trim(), state: locState });
      if (!found) { setMsg({type:"err",text:"Place not found. Check the name and state, then try again."}); return; }
      const address = (await reverseGeocodeLocation(found.lat, found.lng)) || found.label || `${locName.trim()}, ${locState}, Malaysia`;
      setDetectedLocation({ lat: found.lat, lng: found.lng, address });
    } catch (error:any) {
      setMsg({type:"err",text:error?.message || "Unable to find this location."});
    } finally {
      setFindingLocation(false);
    }
  }

  function confirmContributorLocation() {
    if (!detectedLocation) return;
    setLocLat(String(detectedLocation.lat));
    setLocLng(String(detectedLocation.lng));
    setLocAddress(detectedLocation.address);
    setMsg({type:"ok",text:"Map location applied to the form."});
  }

  async function submitLocation() {
    setMsg(null);
    if (!approved) { setMsg({type:"err",text:"Only approved contributors can submit locations."}); return; }
    if (!locName.trim() || !locAddress.trim() || !locDesc.trim()) { setMsg({type:"err",text:"Please complete all required fields (name, address and description)."}); return; }
    const lat = Number(locLat);
    const lng = Number(locLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) { setMsg({type:"err",text:"Please find and apply the map location before submitting."}); return; }
    if (!priceRange) { setMsg({type:"err",text:"Please enter a valid estimated cost. Max RM must be the same or higher than Min RM."}); return; }
    if (locSafety.trim().length < 10) { setMsg({type:"err",text:"Please add at least one useful safety note for visitors."}); return; }
    if (subs.some(s=>s.id!==editingSubmissionId&&s.name.toLowerCase()===locName.trim().toLowerCase() && s.state===locState)) { setMsg({type:"err",text:"This location already exists in your submissions."}); return; }
    setLoading(true);
    try {
      const photoUrl = photoFile ? await firebaseClient.storage.uploadLocationPhoto(photoFile) : undefined;
      const payload = {
        contributorId:user!.id,contributorName:myApp?.fullName||user!.displayName,name:locName.trim(),address:locAddress.trim(),state:locState,activity:locActivity,difficulty:locDiff,
        lat,lng,locationConfirmed:true,description:locDesc.trim(),facilities:locFac.trim(),accessibility:locAccess.trim(),estimatedPrice:numericPrice,estimatedPriceRange:priceRange.label,budget,
        safetyNotes:locSafety.trim(),bestTime:locBestTime.trim(),contributorTip:locTip.trim(),sourceUrl:locSourceUrl.trim(),
        photoName:photoName||undefined,status:"pending",rejectReason:"",updatedAt:new Date().toISOString(),
        ...(photoUrl ? { photoUrl } : {}),
      };
      if (editingSubmissionId) {
        const current = subs.find(s=>s.id===editingSubmissionId);
        if (current?.status === "approved") { setMsg({type:"err",text:"Approved locations cannot be edited here."}); return; }
        const updated:any = await firebaseClient.entities.LocationSubmission.update(editingSubmissionId,payload);
        await firebaseClient.entities.Announcement.create({
          userId:user!.id,
          title:"Location update received",
          message:`Thanks for updating "${locName.trim()}". We received the changes and an administrator will review them soon.`,
          type:"info",
          relatedPage:"suggestions",
          submissionId:editingSubmissionId,
          read:false,
          dismissed:false,
          createdAt:new Date().toISOString(),
        });
        setSubs(items=>items.map(item=>item.id===editingSubmissionId?updated as LocationSubmission:item));
        setMsg({type:"ok",text:"Location update resubmitted successfully. Awaiting admin approval."});
      } else {
        const created:any = await firebaseClient.entities.LocationSubmission.create({...payload,createdAt:new Date().toISOString()});
        await firebaseClient.entities.Announcement.create({
          userId:user!.id,
          title:"Location suggestion received",
          message:`Thanks for suggesting "${locName.trim()}". We received it and an administrator will review it soon.`,
          type:"info",
          relatedPage:"suggestions",
          submissionId:created.id,
          read:false,
          dismissed:false,
          createdAt:new Date().toISOString(),
        });
        setSubs(current=>[created as LocationSubmission,...current]);
        setMsg({type:"ok",text:"Location submitted successfully. Awaiting admin approval."});
      }
      resetLocationForm();
    } catch(error:any) { setMsg({type:"err",text:error?.message||"Unable to submit location to Firebase."}); }
    finally { setLoading(false); }
  }

  async function saveProfile() {
    if (!myApp || !approved) return;
    if (!/^\d{10,11}$/.test(profPhone.trim())) { setMsg({type:"err",text:"Phone number must contain 10 or 11 digits."}); return; }
    if (!profServices.trim()) { setMsg({type:"err",text:"Please select your contributor service area."}); return; }
    setLoading(true);
    try {
      const updated:any = await firebaseClient.entities.Contributor.update(myApp.id,{
        phone:profPhone.trim(),
        contributionArea:profServices.trim(),
        services:profServices.trim(),
        publicContact:profPublicContact,
        availability:profAvailability.trim(),
        languages:profLanguages.trim(),
        serviceDescription:profDescription.trim(),
        websiteUrl:profWebsite.trim(),
      });
      setApps(current=>current.map(a=>a.id===myApp.id?updated:a));
      setMsg({type:"ok",text:"Profile updated successfully."});
    } catch(error:any) { setMsg({type:"err",text:error?.message||"Unable to update contributor profile."}); }
    finally { setLoading(false); }
  }

  const inputStyle = {
    borderColor: C.border,
    fontFamily: F.body,
    color: C.text,
  } as const;

  const fieldError = (field: RegistrationField) => registrationErrors[field] ? (
    <p className="text-xs mt-1" style={{ color: C.error, fontFamily: F.body }}>{registrationErrors[field]}</p>
  ) : null;

  function renderRegistrationFields() {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>{t(language, "fullName")} *</label>
          <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Carole Wong" value={fullName} onChange={(e) => {setFullName(e.target.value);setRegistrationErrors(x=>({...x,fullName:undefined}));}} />
          {fieldError("fullName")}
        </div>
        <div>
          <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>{t(language, "phoneNumber")} *</label>
          <input type="tel" inputMode="numeric" className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="0102508838" value={phone} onChange={(e) => {setPhone(e.target.value.replace(/\D/g,"").slice(0,11));setRegistrationErrors(x=>({...x,phone:undefined}));}} />
          {fieldError("phone")}
        </div>
        <div>
          <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>{t(language, "state")} *</label>
          <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={area} onChange={(e) => {setArea(e.target.value);setRegistrationErrors(x=>({...x,area:undefined}));}}>
            <option value="">{t(language, "selectState")}</option>
            {ALL_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
          </select>
          {fieldError("area")}
        </div>
        <div>
          <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>{t(language, "areaContribution")} *</label>
          <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={contributionArea} onChange={(e) => {setContributionArea(e.target.value);setRegistrationErrors(x=>({...x,contributionArea:undefined}));}}>
            <option value="">{t(language, "selectContributionArea")}</option>
            {CONTRIBUTION_AREAS.map(option=><option key={option} value={option}>{option}</option>)}
          </select>
          {fieldError("contributionArea")}
        </div>
        <div>
          <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>{t(language, "localKnowledge")} *</label>
          <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none" style={inputStyle} rows={5} placeholder={language==="zh"?"描述你对本地户外地点、安全情况和游客设施的了解。":language==="ms"?"Terangkan pengetahuan anda tentang lokasi luar tempatan, keadaan keselamatan dan kemudahan pelawat.":"Describe your familiarity with local outdoor locations, safety conditions and visitor facilities."} value={experience} onChange={(e) => {setExperience(e.target.value);setRegistrationErrors(x=>({...x,experience:undefined}));}} />
          <div className="flex justify-between gap-3">
            {fieldError("experience") || <span />}
            <span className="text-[10px]" style={{color:experience.trim().length<30?C.textMuted:C.success}}>{experience.trim().length}/30 minimum</span>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer" style={{ color: C.forest, fontFamily: F.body }}>
            <FileUp size={16} />
            {t(language, "uploadSupporting")}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onDocChange(e.target.files?.[0])} />
          </label>
          <p className="text-xs mt-1" style={{color:C.textMuted,fontFamily:F.body}}>You may upload a relevant certificate, supporting document or other non-sensitive evidence. Do not upload confidential personal information for demonstration purposes.</p>
          {docName && <p className="text-xs mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>Selected: {docName}</p>}
          {(docError || registrationErrors.document) && <p className="text-xs mt-1" style={{ color: C.error, fontFamily: F.body }}>{docError || registrationErrors.document}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen" style={{ backgroundColor: C.cream }}>
      <div className="px-5 py-6" style={{ background: `linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)` }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-normal text-white" style={{ fontFamily: F.display }}>
            {t(language, "contributorPortal")}
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)", fontFamily: F.body }}>
            {myApp
              ? `Status: ${contributorStatusLabel(myApp.status)}${myApp.rejectReason ? ` - ${myApp.rejectReason}` : ""}`
              : t(language, "registerContributorSubtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-14 z-20" style={{ borderColor: C.border }}>
        <div className="max-w-2xl mx-auto px-5 flex gap-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {(
            [
              ["register", t(language, "register")],
              ...(approved ? [["submit", t(language, "submitLocation")], ["mine", t(language, "myContributions")], ["profile", t(language, "profile")]] : []),
            ] as readonly (readonly ["register" | "submit" | "mine" | "profile", string])[]
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
            <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>{t(language, "register")} {t(language, "contributor")}</h2>
            {myApp ? (
              myApp.status === "rejected" ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{backgroundColor:C.errorBg,color:C.error}}>
                    <p className="text-sm font-bold">Application rejected</p>
                    <p className="text-xs mt-1">{myApp.rejectReason || "No rejection reason was provided. Contact the administrator for details."}</p>
                  </div>
                  <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>Update the application below and select Edit and Resubmit.</p>
                  {renderRegistrationFields()}
                  <Pill variant="filled" onClick={submitRegistration}>Edit and Resubmit</Pill>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-bold" style={{ color: approved ? C.success : C.textSub, fontFamily: F.body }}>
                    {approved ? "Your contributor registration has been approved." : "Awaiting administrator review"}
                  </p>
                  <p className="text-sm" style={{ color: C.textSub, fontFamily: F.body }}>
                    Status: {contributorStatusLabel(myApp.status)}
                    {myApp.docName && <> · Document: {myApp.docName}</>}
                  </p>
                  <p className="text-xs" style={{color:C.textMuted}}>
                    Area of contribution: {myApp.contributionArea || myApp.services || "Not provided"}
                  </p>
                </div>
              )
            ) : (
              <>
                {renderRegistrationFields()}
                <Pill variant="filled" onClick={submitRegistration}>{t(language, "submitRegistration")}</Pill>
              </>
            )}
          </div>
        )}

        {tab === "submit" && (
          <div className="bg-white rounded-[18px] p-6 space-y-5" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)` }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.muted, color: C.forest }}>
                <MapPin size={17} />
              </div>
              <div>
                <h2 className="font-bold text-sm" style={{ fontFamily: F.body, color: C.text }}>
                  {editingSubmissionId ? "Update location information" : "Submit new location"}
                </h2>
                <p className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>
                  Use the same details format as admin location management. Admin will review before publishing.
                </p>
              </div>
            </div>
            {!approved ? (
              <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>
                Your contributor registration must be approved by an administrator before submitting locations.
              </p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Location name *</label>
                  <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Example: Bukit Sawa Trail" value={locName} onChange={(e) => { setLocName(e.target.value); setLocLat(""); setLocLng(""); setDetectedLocation(null); }} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Full address *</label>
                  <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Full address, e.g. Bukit Sawa Trail, Selangor, Malaysia" value={locAddress} onChange={(e) => setLocAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>State *</label>
                    <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locState} onChange={(e) => { setLocState(e.target.value); setLocLat(""); setLocLng(""); setDetectedLocation(null); }}>
                      {ALL_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Activity *</label>
                    <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locActivity} onChange={(e) => setLocActivity(e.target.value)}>
                      {"Hiking,Diving,Cycling,Camping,Swimming,Trail Running,Jogging,Rock Climbing,Water Sports".split(",").map((a) => <option key={a} value={a}>{activityLabel(language, a)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Latitude *</label>
                    <input inputMode="decimal" className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="3.1390" value={locLat} onChange={(e) => setLocLat(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Longitude *</label>
                    <input inputMode="decimal" className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="101.6869" value={locLng} onChange={(e) => setLocLng(e.target.value)} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={findContributorLocation}
                  disabled={findingLocation}
                  className="w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: C.muted, color: C.jungle, fontFamily: F.body }}
                >
                  <Search size={15} />
                  {findingLocation ? "Finding location..." : "Find on Map"}
                </button>
                {detectedLocation && (
                  <div className="rounded-[16px] overflow-hidden border" style={{ borderColor: C.border }}>
                    <div className="p-3 bg-white">
                      <p className="text-xs font-bold" style={{ color: C.text, fontFamily: F.body }}>Detected location</p>
                      <p className="text-xs mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>{detectedLocation.address}</p>
                    </div>
                    <div className="h-56">
                      <MapContainer center={[detectedLocation.lat, detectedLocation.lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[detectedLocation.lat, detectedLocation.lng]}>
                          <Popup>{locName || "Detected location"}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    <div className="p-3 bg-white flex justify-end">
                      <Pill variant="outline" onClick={confirmContributorLocation}>Use this map location</Pill>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Difficulty *</label>
                  <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={locDiff} onChange={(e) => setLocDiff(e.target.value)}>
                    <option>Easy</option><option>Moderate</option><option>Hard</option>
                  </select>
                </div>
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.muted }}>
                  <div className="flex items-center gap-2 mb-2">
                    <WalletCards size={16} style={{ color: C.jungle }} />
                    <label className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>Estimated Entry / Activity Cost (RM) *</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Min RM</label>
                      <input inputMode="decimal" className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white" style={inputStyle} placeholder="0" value={locPriceMin} onChange={(e) => setLocPriceMin(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Max RM</label>
                      <input inputMode="decimal" className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white" style={inputStyle} placeholder="0" value={locPriceMax} onChange={(e) => setLocPriceMax(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: C.textMuted, fontFamily: F.body }}>Automatically classified</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#fff", color: C.jungle, fontFamily: F.body }}>{!locPriceMin && !locPriceMax ? "Enter price" : priceRange ? `RM ${priceRange.label} - ${budget}` : "Invalid range"}</span>
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: C.textMuted, fontFamily: F.body }}>Type numbers only. For a fixed/free price, fill one box or use the same amount.</p>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Description *</label>
                  <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none" style={inputStyle} rows={4} placeholder="Describe the place, activity, route, and visitor experience." value={locDesc} onChange={(e) => setLocDesc(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Facilities</label>
                  <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Parking, toilets, food stalls" value={locFac} onChange={(e) => setLocFac(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Accessibility information</label>
                  <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="Road condition, steps, family access, wheelchair access" value={locAccess} onChange={(e) => setLocAccess(e.target.value)} />
                </div>
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.muted }}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} style={{ color: C.jungle }} />
                    <p className="text-sm font-bold" style={{ color: C.text, fontFamily: F.body }}>Contributor verification details</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Safety notes *</label>
                    <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none bg-white" style={inputStyle} rows={3} placeholder="Trail condition, weather risk, water depth, permits, parking safety" value={locSafety} onChange={(e) => setLocSafety(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Best visiting time / season</label>
                    <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white" style={inputStyle} placeholder="Morning, dry season, avoid rainy days" value={locBestTime} onChange={(e) => setLocBestTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Local contributor tip</label>
                    <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none bg-white" style={inputStyle} rows={2} placeholder="Optional tip from local experience" value={locTip} onChange={(e) => setLocTip(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: C.textSub }}>Supporting source / official page URL</label>
                    <input className="w-full px-4 py-3 rounded-xl text-sm border outline-none bg-white" style={inputStyle} placeholder="https://..." value={locSourceUrl} onChange={(e) => setLocSourceUrl(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: C.textSub }}>Photo (optional)</label>
                  <label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold cursor-pointer bg-white" style={{ color: C.forest, borderColor: C.border, fontFamily: F.body }}>
                    <FileUp size={16} /> Upload JPG, PNG, or WEBP
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > MAX_PHOTO_BYTES) {
                        setMsg({ type: "err", text: "Photo must be JPG/PNG/WEBP under 2MB." });
                        return;
                      }
                      setPhotoFile(f);
                      setPhotoName(f.name);
                    }} />
                  </label>
                  {photoName && <p className="text-xs mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>Selected: {photoName}</p>}
                </div>
                <div className="flex gap-2">
                  <Pill variant="filled" onClick={submitLocation}>{editingSubmissionId ? "Resubmit update" : "Submit location"}</Pill>
                  {editingSubmissionId && <Pill variant="outline" onClick={resetLocationForm}><X size={13}/> Cancel edit</Pill>}
                </div>
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
                    {s.state} · {s.activity} · {s.estimatedPriceRange ? `RM ${s.estimatedPriceRange} · ` : typeof s.estimatedPrice === "number" ? `RM ${s.estimatedPrice.toFixed(2)} · ` : ""}{new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  {(s.safetyNotes || s.bestTime || s.contributorTip) && (
                    <div className="mt-3 rounded-xl p-3 space-y-1" style={{ backgroundColor: C.muted }}>
                      {s.safetyNotes && <p className="text-[11px]" style={{ color: C.textSub, fontFamily: F.body }}><ShieldCheck size={11} className="inline mr-1" />{s.safetyNotes}</p>}
                      {s.bestTime && <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}>Best time: {s.bestTime}</p>}
                      {s.contributorTip && <p className="text-[11px]" style={{ color: C.textMuted, fontFamily: F.body }}><Lightbulb size={11} className="inline mr-1" />{s.contributorTip}</p>}
                    </div>
                  )}
                  {s.rejectReason && (
                    <p className="text-[12px] mt-2" style={{ color: C.error, fontFamily: F.body }}>Reason: {s.rejectReason}</p>
                  )}
                  {s.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => editSubmission(s)}
                      className="mt-3 text-[11px] font-bold inline-flex items-center gap-1"
                      style={{ color: C.forest, fontFamily: F.body }}
                    >
                      <Pencil size={11} /> Edit and resubmit
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            {!approved ? (
              <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
                <p className="text-sm" style={{ color: C.textMuted, fontFamily: F.body }}>Available after verification.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-[18px] p-6" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>Contributor profile</h2>
                      <p className="text-xs mt-1" style={{ color: C.textMuted, fontFamily: F.body }}>
                        Verified as {myApp?.fullName || user.displayName} for {myApp?.area || "Malaysia"}.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor:C.successBg,color:C.success,fontFamily:F.body }}>Approved</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {[
                      ["Total", contributionStats.total],
                      ["Pending", contributionStats.pending],
                      ["Approved", contributionStats.approved],
                      ["Rejected", contributionStats.rejected],
                    ].map(([label,value])=>(
                      <div key={label} className="rounded-xl p-3" style={{ backgroundColor:C.muted }}>
                        <BarChart3 size={14} style={{ color:C.forest }} />
                        <p className="text-lg font-bold mt-1" style={{ color:C.text,fontFamily:F.display }}>{value}</p>
                        <p className="text-[10px] font-bold uppercase" style={{ color:C.textMuted,fontFamily:F.body }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[18px] p-6 space-y-4" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
                  <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>Public service details</h2>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Service / contribution area</label>
                    <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profServices} onChange={(e) => setProfServices(e.target.value)}>
                      {CONTRIBUTION_AREAS.map(option=><option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Short service description</label>
                    <textarea className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none" style={inputStyle} rows={3} placeholder="Example: I share safe waterfall routes, parking tips and family-friendly swimming spots around Selangor." value={profDescription} onChange={(e)=>setProfDescription(e.target.value)} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Availability</label>
                      <div className="relative">
                        <CalendarClock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.textMuted}} />
                        <input className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profAvailability} onChange={(e)=>setProfAvailability(e.target.value)} placeholder="Weekends / weekday evenings" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Languages</label>
                      <div className="relative">
                        <Languages size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.textMuted}} />
                        <input className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profLanguages} onChange={(e)=>setProfLanguages(e.target.value)} placeholder="English, BM, Mandarin" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[18px] p-6 space-y-4" style={{ boxShadow: `0 1px 3px rgba(27,67,50,0.1)` }}>
                  <h2 className="font-bold" style={{ fontFamily: F.body, color: C.text }}>Contact preferences</h2>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Phone number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.textMuted}} />
                      <input className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profPhone} onChange={(e) => setProfPhone(e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="Phone" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Show contact method</label>
                    <select className="w-full px-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profPublicContact} onChange={(e)=>setProfPublicContact(e.target.value)}>
                      <option value="phone">Show phone number to users</option>
                      <option value="request">Users contact through request/admin first</option>
                      <option value="hidden">Hide public contact</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Website / social link</label>
                    <div className="relative">
                      <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:C.textMuted}} />
                      <input className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border outline-none" style={inputStyle} value={profWebsite} onChange={(e)=>setProfWebsite(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                  <Pill variant="filled" onClick={saveProfile}>Save changes</Pill>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
//==================== WongYueShan END - Local Contributor Portal ====================

