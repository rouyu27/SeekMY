//==================== WongYueShan Part - Admin Panel ====================
import { useEffect, useState } from "react";
import { Search, X, Trash2, LogOut, Users, Shield, CheckCircle, Star, Plus, UserCog, Database, Pencil, ExternalLink } from "lucide-react";
import type { Location, AppUser } from "../lib/types";
import type { ContributorApplication, LocationSubmission, StoredReview } from "../lib/communityTypes";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { ALL_STATES } from "../lib/constants";
import { firebaseClient } from "../api/firebaseClient";
import { OutdoorImportPanel } from "../components/OutdoorImportPanel";
import { LocationImageUploader } from "./LocationImageUploader";
import { STARTER_LOCATIONS } from "../lib/seedLocations";

const TEAM_ADMIN_EMAILS = [
  "shanyuew416@gmail.com",
  "claryncreammy05@gmail.com",
  "lowjunfeng5@gmail.com",
  "lim100663@gmail.com",
  "limrouyu9@gmail.com",
  "choongsk36@gmail.com",
];

function isFixedTeamAdmin(email?: string) {
  return Boolean(email && TEAM_ADMIN_EMAILS.includes(email.toLowerCase()));
}
const ACTIVITIES = ["Hiking","Diving","Cycling","Camping","Swimming","Trail Running","Jogging","Rock Climbing","Water Sports"];
const STATE_CODE: Record<string,string> = Object.fromEntries(ALL_STATES.map(s=>[s.name,s.code]));
const emptyLocation = { name:"",address:"",lat:"",lng:"",state:"Selangor",activity:"Hiking",difficulty:"Easy",description:"",distance:"N/A",duration:"N/A",openingHours:"Hours not verified yet",officialUrl:"",facilities:"",accessibility:"",image_url:"",image_urls:[] as string[],estimatedPrice:"" };

function locationSearchQuery(form: typeof emptyLocation, suffix: string) {
  return encodeURIComponent([form.name, form.state, "Malaysia", suffix].filter(Boolean).join(" "));
}

function openAdminVerificationSearch(form: typeof emptyLocation, kind: "official" | "hours" | "maps") {
  const query =
    kind === "official"
      ? locationSearchQuery(form, "official website")
      : kind === "hours"
        ? locationSearchQuery(form, "opening hours official")
        : encodeURIComponent(`${form.lat},${form.lng}`);
  const url =
    kind === "maps"
      ? `https://www.google.com/maps/search/?api=1&query=${query}`
      : `https://www.google.com/search?q=${query}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function AdminPage({ users: parentUsers, setUsers: setParentUsers, locations: parentLocations, onLogout }:{
  users:AppUser[]; setUsers:(u:AppUser[])=>void; locations:Location[]; onLogout:()=>void;
}) {
  type AdminTab="dashboard"|"users"|"locations"|"outdoorImport"|"pendingLocs"|"reviews"|"contributors";
  const [tab,setTab]=useState<AdminTab>("dashboard");
  const [search,setSearch]=useState("");
  const [users,setUsers]=useState<AppUser[]>(parentUsers);
  const [locations,setLocations]=useState<Location[]>(parentLocations);
  const [reviews,setReviews]=useState<StoredReview[]>([]);
  const [contributors,setContributors]=useState<ContributorApplication[]>([]);
  const [submissions,setSubmissions]=useState<LocationSubmission[]>([]);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState<string|null>(null);
  const [showAdd,setShowAdd]=useState(false);
  const [editingLocation,setEditingLocation]=useState<Location|null>(null);
  const [form,setForm]=useState(emptyLocation);
  const [saving,setSaving]=useState(false);
  const [existingImages,setExistingImages]=useState<string[]>([]);
  const [imageFiles,setImageFiles]=useState<File[]>([]);
  const [uploadProgress,setUploadProgress]=useState(0);
  const [userLoadError,setUserLoadError]=useState("");
  const [gemSavingId,setGemSavingId]=useState<string|null>(null);
  const [seedingStarter,setSeedingStarter]=useState(false);

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(null),2800);}

  async function loadData(){
    setLoading(true);
    try{
      const [locationsResult, contributorsResult, reviewsResult, usersResult, submissionsResult]=await Promise.allSettled([
        firebaseClient.entities.Location.list("name"),
        firebaseClient.entities.Contributor.list("-created_date",500),
        firebaseClient.backend.getAdminReviews().then(result=>result.reviews),
        firebaseClient.entities.User.list("full_name",500),
        firebaseClient.entities.LocationSubmission.list("-created_date",500),
      ]);

      if(locationsResult.status==="fulfilled")setLocations(locationsResult.value as Location[]);
      if(contributorsResult.status==="fulfilled")setContributors(contributorsResult.value as ContributorApplication[]);
      if(reviewsResult.status==="fulfilled")setReviews(reviewsResult.value as StoredReview[]);
      if(submissionsResult.status==="fulfilled")setSubmissions(submissionsResult.value as LocationSubmission[]);

      if(usersResult.status==="fulfilled"){
        setUserLoadError("");
        const mapped=(usersResult.value as any[]).map(x=>({id:String(x.id),username:x.username||x.email?.split("@")[0]||"explorer",displayName:x.full_name||x.email||"Explorer",email:x.email||"",password:"",photoUrl:x.photo_url||x.photoUrl||"",bio:x.bio||"",joinDate:x.created_date?.slice?.(0,10)||"",totalKm:Number(x.total_km||x.totalKm||0),states:Number(x.states||0),checkins:Number(x.checkins||0),role:x.role==="admin"?"admin":"user",status:x.status})) as AppUser[];
        setUsers(mapped);setParentUsers(mapped);
      }else{
        setUserLoadError(usersResult.reason?.message||"Unable to load Firebase users.");
      }

      const failures=[locationsResult,contributorsResult,reviewsResult,usersResult,submissionsResult]
        .filter((result): result is PromiseRejectedResult=>result.status==="rejected");
      if(failures.length)showToast(failures[0].reason?.message||"Some admin data could not be loaded.");
    }catch(error:any){showToast(error?.message||"Unable to load admin data.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{loadData();},[]);
  useEffect(()=>{if(parentLocations.length)setLocations(parentLocations);},[parentLocations]);

  const pendingSubs=submissions.filter(s=>s.status==="pending");
  const pendingContributors=contributors.filter(c=>c.status==="pending");
  const flaggedReviews=reviews.filter(r=>r.status==="flagged"||r.status==="pending");
  const gemCount=locations.filter((l:any)=>l.is_hidden_gem).length;
  const filteredUsers=users.filter(u=>!search||`${u.displayName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  const filteredLocs=locations.filter(l=>!search||`${l.name} ${l.state} ${l.activity}`.toLowerCase().includes(search.toLowerCase()));

  async function roleChange(member:AppUser,role:"user"|"admin"){
    if(isFixedTeamAdmin(member.email)&&role!=="admin"){showToast("Fixed team admin cannot be demoted.");return;}
    try{await firebaseClient.entities.User.update(member.id,{role});const next=users.map(u=>u.id===member.id?{...u,role}:u);setUsers(next);setParentUsers(next);showToast("User role updated in Firebase.");}catch(e:any){showToast(e?.message||"Unable to change role.");}
  }
  async function deleteUser(member:AppUser){
    if(isFixedTeamAdmin(member.email)){showToast("Fixed team admin profile cannot be deleted here.");return;}
    if(!confirm(`Delete the Firestore profile for ${member.email}? Their Firebase login cannot be removed on the free plan.`))return;
    try{await firebaseClient.auth.adminDeleteUser(member.id);const next=users.filter(u=>u.id!==member.id);setUsers(next);setParentUsers(next);showToast("Firestore profile deleted. The Auth login remains active.");}catch(e:any){showToast(e?.message||"Unable to delete user profile.");}
  }
  async function deleteLocation(id:string|number){if(!confirm("Delete this location from Firebase?"))return;try{await firebaseClient.entities.Location.delete(String(id));setLocations(ls=>ls.filter(l=>String(l.id)!==String(id)));(window as any).__seekmyRefreshLocations?.();showToast("Location deleted from Firebase.");}catch(e:any){showToast(e?.message||"Unable to delete location.");}}
  function openEditLocation(loc:Location){
    setEditingLocation(loc);
    setForm({
      name:loc.name||"",
      address:loc.address||"",
      lat:String(loc.lat??loc.latitude??""),
      lng:String(loc.lng??loc.longitude??""),
      state:loc.state||"Selangor",
      activity:loc.activity||"Hiking",
      difficulty:loc.difficulty||"Easy",
      description:loc.description||"",
      distance:String(loc.distance??"N/A"),
      duration:String(loc.duration??"N/A"),
      openingHours:String((loc as any).openingHours||(loc as any).opening_hours||"Hours not verified yet"),
      officialUrl:String((loc as any).officialUrl||(loc as any).official_url||(loc as any).sourceUrl||""),
      facilities:Array.isArray((loc as any).facilities)?(loc as any).facilities.join(", "):String((loc as any).facilities||""),
      accessibility:String((loc as any).accessibility||""),
      image_url:String((loc as any).image_url||""),
      image_urls:Array.isArray((loc as any).image_urls)?(loc as any).image_urls:[],
      estimatedPrice:typeof (loc as any).estimatedPrice==="number"?String((loc as any).estimatedPrice):"",
    });
    const images=Array.isArray((loc as any).image_urls)&&((loc as any).image_urls as string[]).length?(loc as any).image_urls:((loc as any).image_url?[(loc as any).image_url]:[]);
    setExistingImages(images);
    setImageFiles([]);
    setShowAdd(true);
  }
  function closeLocationModal(){
    setShowAdd(false);
    setEditingLocation(null);
    setForm(emptyLocation);
    setExistingImages([]);
    setImageFiles([]);
    setUploadProgress(0);
  }
  async function saveLocation(){
    if(!form.name.trim() || !form.address.trim()){showToast("Location name and address are required.");return;}
    const lat=Number(form.lat);const lng=Number(form.lng);
    if(!Number.isFinite(lat)||lat < -90||lat > 90||!Number.isFinite(lng)||lng < -180||lng > 180){showToast("Valid latitude and longitude are required.");return;}
    const estimatedPrice=Number(form.estimatedPrice);
    if(form.estimatedPrice.trim()===""||!Number.isFinite(estimatedPrice)||estimatedPrice<0){showToast("Enter a valid estimated cost. Use 0 for a free location.");return;}
    setSaving(true);
    try{
      const uploadedImages:string[]=[];
      for(let index=0;index<imageFiles.length;index+=1){
        const url=await firebaseClient.storage.uploadLocationPhoto(imageFiles[index],percent=>setUploadProgress(Math.round(((index+percent/100)/imageFiles.length)*100)));
        uploadedImages.push(url);
      }
      const images=[...existingImages,...uploadedImages].slice(0,5);
      const data={
        name:form.name.trim(),
        address:form.address.trim(),
        lat,
        lng,
        state:form.state,
        stateCode:STATE_CODE[form.state]||"SLG",
        activity:form.activity,
        difficulty:form.difficulty,
        description:form.description.trim(),
        distance:form.distance||"N/A",
        duration:form.duration||"N/A",
        openingHours:form.openingHours||"Hours not verified yet",
        officialUrl:form.officialUrl.trim(),
        facilities:form.facilities.split(",").map(x=>x.trim()).filter(Boolean),
        accessibility:form.accessibility,
        estimatedPrice,
        budget:estimatedPrice<=0?"Free":estimatedPrice<=20?"Low":estimatedPrice<=50?"Medium":"High",
        image_url:images[0]||"",
        image_urls:images,
      };

      if(editingLocation){
        const updated:any=await firebaseClient.entities.Location.update(String(editingLocation.id),data);
        setLocations(ls=>ls.map(l=>String(l.id)===String(editingLocation.id)?updated as Location:l));
        (window as any).__seekmyRefreshLocations?.(updated);
        showToast("Location updated in Firebase.");
      }else{
        const created:any=await firebaseClient.entities.Location.create({
          ...data,
          rating:0,
          reviews:0,
          badge:"Admin",
          color:C.forest,
          emoji:"📍",
          bestMonths:"Year-round",
          tags:[form.activity],
          status:"active",
        });
        setLocations(ls=>[created as Location,...ls]);
        (window as any).__seekmyRefreshLocations?.(created);
        showToast("Location added to Firebase.");
      }

      closeLocationModal();
    }catch(e:any){
      showToast(e?.message||(editingLocation?"Unable to update location.":"Unable to add location."));
    }finally{
      setSaving(false);
    }
  }
  async function reviewAction(r:StoredReview,action:"approve"|"remove"){
    try{const result=await firebaseClient.backend.moderateReview(String(r.id),action);setReviews(rs=>rs.map(y=>String(y.id)===String(r.id)?result.review as StoredReview:y));showToast(action==="remove"?"Review removed in Supabase.":"Review approved in Supabase.");}catch(e:any){showToast(e?.message||"Unable to update review.");}
  }
  async function openContributorDocument(uri:string){
    const popup=window.open("","_blank","noopener,noreferrer");
    try{const url=uri.startsWith("supabase://")?(await firebaseClient.backend.signContributorDocument(uri)).url:uri;if(popup)popup.location.href=url;else window.open(url,"_blank","noopener,noreferrer");}
    catch(e:any){popup?.close();showToast(e?.message||"Unable to open contributor document.");}
  }
  async function contributorStatus(c:ContributorApplication,status:"approved"|"rejected"){
    const reason=status==="rejected"?prompt("Contributor rejection reason:",c.rejectReason||"")?.trim():"";
    if(status==="rejected"&&!reason){showToast("A rejection reason is required.");return;}
    try{
      const changes={status,rejectReason:status==="rejected"?reason:"",reviewedAt:new Date().toISOString()};
      const [updated]=await Promise.all([
        firebaseClient.entities.Contributor.update(c.id,changes),
        firebaseClient.entities.User.update(c.userId,{contributorStatus:status}),
      ]);
      setContributors(cs=>cs.map(y=>y.id===c.id?updated as ContributorApplication:y));
      showToast(status==="approved"?"Contributor approved.":"Contributor rejected with feedback.");
    }catch(e:any){showToast(e?.message||"Unable to update contributor.");}
  }
  function submissionToLocation(s:LocationSubmission){const price=Number(s.estimatedPrice||0);const images=s.photoUrl?[s.photoUrl]:[];const details=[s.description,s.safetyNotes?`Safety notes: ${s.safetyNotes}`:"",s.contributorTip?`Local contributor tip: ${s.contributorTip}`:""].filter(Boolean).join("\n\n");return {name:s.name,address:s.address||`${s.name}, ${s.state}, Malaysia`,lat:s.lat,lng:s.lng,locationConfirmed:Boolean(s.locationConfirmed),state:s.state,stateCode:STATE_CODE[s.state]||"SLG",activity:s.activity,difficulty:["Easy","Moderate","Hard"].includes(s.difficulty)?s.difficulty:"Easy",distance:"N/A",duration:"N/A",openingHours:"Hours not verified yet",officialUrl:s.sourceUrl||"",rating:0,reviews:0,badge:"Community",color:C.forest,emoji:"📍",description:details,facilities:s.facilities?s.facilities.split(",").map(x=>x.trim()).filter(Boolean):[],bestMonths:s.bestTime||"Year-round",accessibility:s.accessibility||"See description",tags:[s.activity,"Community suggested","Contributor verified"],estimatedPrice:price,budget:s.budget||(price<=0?"Free":price<=20?"Low":price<=50?"Medium":"High"),image_url:images[0]||"",image_urls:images,suggestedBy:s.contributorName,sourceUrl:s.sourceUrl||"",status:"active"};}
  async function approveSubmission(s:LocationSubmission){setSaving(true);try{const published:any=await firebaseClient.entities.Location.create(submissionToLocation(s));const updated:any=await firebaseClient.entities.LocationSubmission.update(s.id,{status:"approved",publishedLocationId:published.id,updatedAt:new Date().toISOString()});await firebaseClient.entities.Announcement.create({userId:s.contributorId,title:"Location approved",message:`Your suggestion "${s.name}" was approved and is now live on Discover.`,type:"approved",submissionId:s.id,read:false,createdAt:new Date().toISOString()});setSubmissions(xs=>xs.map(x=>x.id===s.id?updated:x));setLocations(ls=>[published as Location,...ls]);(window as any).__seekmyRefreshLocations?.(published);showToast("Location approved and published to Firebase.");}catch(e:any){showToast(e?.message||"Unable to approve location.");}finally{setSaving(false);}}
  async function rejectSubmission(s:LocationSubmission){const reason=prompt("Rejection reason:")||"Does not meet guidelines";try{const updated:any=await firebaseClient.entities.LocationSubmission.update(s.id,{status:"rejected",rejectReason:reason,updatedAt:new Date().toISOString()});await firebaseClient.entities.Announcement.create({userId:s.contributorId,title:"Location not approved",message:`Your suggestion "${s.name}" was not approved. Reason: ${reason}`,type:"rejected",submissionId:s.id,read:false,createdAt:new Date().toISOString()});setSubmissions(xs=>xs.map(x=>x.id===s.id?updated:x));showToast("Location rejected and user notified through Firebase.");}catch(e:any){showToast(e?.message||"Unable to reject location.");}}
  async function toggleGem(loc:Location){
    const current=Boolean((loc as any).is_hidden_gem);
    if(!current&&gemCount>=3){showToast("You can feature up to 3 hidden gems.");return;}
    setGemSavingId(String(loc.id));
    try{
      const updated:any=await firebaseClient.entities.Location.update(String(loc.id),{is_hidden_gem:!current});
      setLocations(ls=>ls.map(l=>String(l.id)===String(loc.id)?updated:l));
      (window as any).__seekmyRefreshLocations?.();
      showToast(current?"Removed from Hidden Gems.":"Marked as Hidden Gem.");
    }catch(e:any){showToast(e?.message||"Unable to update hidden gem.");}
    finally{setGemSavingId(null);}
  }
  async function addStarterPlaces(){
    setSeedingStarter(true);
    try{
      const existing=new Set(locations.map(location=>`${location.name}|${location.state}`.toLowerCase()));
      const missing=STARTER_LOCATIONS.filter(location=>!existing.has(`${location.name}|${location.state}`.toLowerCase()));
      if(!missing.length){showToast("Starter places are already in Firebase.");return;}
      const created:Location[]=[];
      for(const location of missing){
        const {id, ...data}=location;
        const row:any=await firebaseClient.entities.Location.create({
          ...data,
          source:"Starter dataset",
          badge:data.badge || "Verified",
          status:"active",
        });
        created.push(row as Location);
      }
      setLocations(ls=>[...created,...ls]);
      (window as any).__seekmyRefreshLocations?.();
      showToast(`Added ${created.length} starter places to Firebase.`);
    }catch(e:any){showToast(e?.message||"Unable to add starter places.");}
    finally{setSeedingStarter(false);}
  }

  const SIDEBAR:{id:AdminTab;icon:string;label:string}[]=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"users",icon:"👥",label:"User Management"},
    {id:"locations",icon:"📍",label:"Location Management"},
    {id:"outdoorImport",icon:"🌐",label:"Outdoor Import"},
    {id:"pendingLocs",icon:"⏳",label:"Pending Locations"},
    {id:"reviews",icon:"⭐",label:"Review Moderation"},
    {id:"contributors",icon:"🤝",label:"Contributors"},
  ];
  const DASHBOARD_CARDS:{icon:string;label:string;value:number;target:AdminTab}[]=[
    {icon:"👥",label:"Users",value:users.length,target:"users"},
    {icon:"📍",label:"Locations",value:locations.length,target:"locations"},
    {icon:"⏳",label:"Pending",value:pendingSubs.length,target:"pendingLocs"},
    {icon:"⚑",label:"Flagged",value:flaggedReviews.length,target:"reviews"},
  ];
  const card="bg-white rounded-[18px] p-4";
  return <div className="pt-14 min-h-screen flex" style={{backgroundColor:"#f8fafc"}}>
    {toast&&<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-bold text-white" style={{backgroundColor:C.jungle,fontFamily:F.body}}>{toast}</div>}
    <aside className="w-56 flex-shrink-0 min-h-screen bg-white border-r hidden md:flex flex-col" style={{borderColor:C.border}}><div className="p-5 border-b" style={{borderColor:C.border}}><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:C.jungle}}><Shield size={16} className="text-white"/></div><div><p className="text-sm font-bold">Admin Panel</p><p className="text-[10px]" style={{color:C.textMuted}}>Firebase connected</p></div></div></div><nav className="flex-1 p-3">{SIDEBAR.map(s=><button key={s.id} onClick={()=>setTab(s.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left" style={{backgroundColor:tab===s.id?C.muted:"transparent",color:tab===s.id?C.jungle:C.textSub}}><span>{s.icon}</span>{s.label}</button>)}</nav><div className="p-3 border-t"><button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold" style={{color:C.error}}><LogOut size={14}/> Sign Out</button></div></aside>
    <main className="flex-1 min-w-0 p-5 md:p-8 pb-24">
      <div className="md:hidden -mx-5 mb-5 border-b bg-white" style={{borderColor:C.border}}>
        <div className="flex gap-2 overflow-x-auto px-5 py-3" style={{scrollbarWidth:"none"}}>
          {SIDEBAR.map(s=>(
            <button
              key={s.id}
              type="button"
              onClick={()=>{setSearch("");setTab(s.id);}}
              className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold"
              style={{backgroundColor:tab===s.id?C.jungle:C.muted,color:tab===s.id?"#fff":C.textSub,fontFamily:F.body}}
            >
              <span>{s.icon}</span>{s.label.replace(" Management","").replace(" Moderation","")}
            </button>
          ))}
        </div>
      </div>
      {tab!=="dashboard"&&<div className="flex items-center gap-2 bg-white rounded-full px-4 mb-6 border" style={{borderColor:C.border,height:44}}><Search size={14} style={{color:C.textMuted}}/><input value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 outline-none text-sm bg-transparent" placeholder={`Search ${tab}…`}/>{search&&<button onClick={()=>setSearch("")}><X size={13}/></button>}</div>}
      {loading?<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-white rounded-[18px] animate-pulse"/>)}</div>:<>
        {tab==="dashboard"&&<div><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7"><div><h1 className="text-3xl font-normal" style={{fontFamily:F.display,color:C.jungle}}>Platform Overview</h1><p className="text-sm" style={{color:C.textMuted}}>Loaded directly from Firebase. Select a card to manage its records.</p></div><Pill variant="outline" small onClick={loadData}><Database size={13}/> Refresh</Pill></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{DASHBOARD_CARDS.map(card=><button type="button" key={card.label} onClick={()=>{setSearch("");setTab(card.target);}} className="bg-white rounded-[18px] p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2" style={{outlineColor:C.forest}} aria-label={`Open ${card.label} management`}><span className="text-2xl">{card.icon}</span><p className="text-2xl font-bold mt-2" style={{fontFamily:F.display,color:C.jungle}}>{card.value}</p><p className="text-xs" style={{color:C.textMuted}}>{card.label}</p></button>)}</div></div>}
        {tab==="users"&&<div className="space-y-3">
          <h1 className="text-2xl mb-3" style={{fontFamily:F.display,color:C.jungle}}>User Management</h1>
          {userLoadError&&<p className="text-sm font-semibold bg-white rounded-[18px] p-4" style={{color:C.error}}>{userLoadError}</p>}
          {!userLoadError&&filteredUsers.length===0&&<p className="text-sm bg-white rounded-[18px] p-4" style={{color:C.textMuted}}>No Firebase users found.</p>}
          {filteredUsers.map(u=><div key={u.id} className={`${card} flex items-center justify-between gap-3`}><div><p className="font-bold text-sm">{u.displayName}</p><p className="text-xs" style={{color:C.textMuted}}>{u.email}</p></div><div className="flex gap-2 items-center"><span className="text-xs">{u.role}</span>{!isFixedTeamAdmin(u.email)&&<><button onClick={()=>roleChange(u,u.role==="admin"?"user":"admin")} className="p-2 border rounded-lg"><UserCog size={15}/></button><button onClick={()=>deleteUser(u)} className="p-2" style={{color:C.error}}><Trash2 size={15}/></button></>}</div></div>)}
        </div>}
        {tab==="locations"&&<div><div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4"><div><h1 className="text-2xl" style={{fontFamily:F.display,color:C.jungle}}>Location Management</h1><p className="text-sm" style={{color:C.textMuted}}>{locations.length} Firebase locations</p></div><div className="flex flex-wrap gap-2"><Pill variant="outline" small onClick={addStarterPlaces} disabled={seedingStarter}><Database size={13}/> {seedingStarter?"Adding...":"Add starter places"}</Pill><Pill variant="filled" small onClick={()=>{setEditingLocation(null);setForm(emptyLocation);setExistingImages([]);setImageFiles([]);setUploadProgress(0);setShowAdd(true);}}><Plus size={13}/> Add Location</Pill></div></div><div className="space-y-2">{filteredLocs.map(l=><div key={l.id} className={`${card} flex items-center gap-3`}>{l.image_url?<img src={l.image_url} alt={l.name} className="w-14 h-14 rounded-xl object-cover"/>:null}<div className="flex-1"><p className="font-bold text-sm">{l.emoji} {l.name}</p><p className="text-xs" style={{color:C.textMuted}}>{l.state} · {l.activity}{typeof l.estimatedPrice==="number"?` · RM ${l.estimatedPrice.toFixed(2)}`:""}</p></div>{(l as any).is_hidden_gem&&<span>💎</span>}
<div className="flex items-center gap-2">
  <button
    onClick={()=>toggleGem(l)}
    disabled={gemSavingId===String(l.id)}
    className="p-2 border rounded-lg disabled:opacity-50"
    style={{
      borderColor:(l as any).is_hidden_gem?C.amber:C.border,
      backgroundColor:(l as any).is_hidden_gem?C.muted:"#fff",
      color:(l as any).is_hidden_gem?C.jungle:C.textMuted,
    }}
    title={(l as any).is_hidden_gem?"Remove from Hidden Gems":"Mark as Hidden Gem"}
    aria-label={`${(l as any).is_hidden_gem?"Remove":"Mark"} ${l.name} hidden gem`}
  >
    💎
  </button>
  <button
    onClick={()=>openEditLocation(l)}
    className="p-2 border rounded-lg"
    style={{borderColor:C.border,color:C.forest}}
    title="Edit location"
    aria-label={`Edit ${l.name}`}
  >
    <Pencil size={15}/>
  </button>
  <button
    onClick={()=>deleteLocation(l.id)}
    className="p-2 rounded-lg"
    style={{color:C.error}}
    title="Delete location"
    aria-label={`Delete ${l.name}`}
  >
    <Trash2 size={15}/>
  </button>
</div></div>)}</div></div>}
        {tab==="outdoorImport"&&<OutdoorImportPanel onPublished={(published)=>{setLocations(ls=>[published as Location,...ls]);(window as any).__seekmyRefreshLocations?.(published);}}/>}
        {tab==="pendingLocs"&&<div><h1 className="text-2xl" style={{fontFamily:F.display,color:C.jungle}}>Pending Locations</h1><p className="text-sm mb-4" style={{color:C.textMuted}}>{pendingSubs.length} awaiting review</p><div className="space-y-3">{submissions.map(s=><div key={s.id} className={card}><div className="flex gap-4">{s.photoUrl&&<img src={s.photoUrl} className="w-20 h-20 rounded-xl object-cover"/>}<div className="flex-1"><p className="font-bold text-sm">{s.name}</p><p className="text-xs" style={{color:C.textMuted}}>{s.state} · {s.activity} · {s.contributorName}</p><p className="text-sm mt-2" style={{color:C.textSub}}>{s.description}</p><p className="text-xs mt-1">Status: {s.status}</p>{s.status==="pending"&&<div className="flex gap-2 mt-3"><Pill variant="filled" small onClick={()=>approveSubmission(s)}>{saving?"Saving...":"Approve"}</Pill><Pill variant="danger" small onClick={()=>rejectSubmission(s)}>Reject</Pill></div>}</div></div></div>)}{!submissions.length&&<p className="text-sm" style={{color:C.textMuted}}>No submissions yet.</p>}</div></div>}
        {tab==="reviews"&&<div><h1 className="text-2xl mb-4" style={{fontFamily:F.display,color:C.jungle}}>Review Moderation</h1><div className="space-y-3">{reviews.map(r=><div key={r.id} className={card}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-bold text-sm">{r.userName||"Anonymous"} · {r.locationName}</p><div className="flex gap-0.5 my-1">{[1,2,3,4,5].map(n=><Star key={n} size={12} fill={n<=r.rating?C.amber:"none"}/>)}</div><p className="text-sm leading-relaxed" style={{color:C.textSub}}>{r.comment}</p><p className="text-xs mt-1">Status: {r.status}</p></div><div className="flex flex-row gap-2 sm:flex-col sm:items-end">{r.status!=="approved"&&r.status!=="active"&&<button onClick={()=>reviewAction(r,"approve")} className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor:C.successBg,color:C.success}} aria-label={`Approve review for ${r.locationName}`}><CheckCircle size={15}/></button>}<button onClick={()=>reviewAction(r,"remove")} className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor:C.errorBg,color:C.error}} aria-label={`Remove review for ${r.locationName}`}><Trash2 size={15}/></button></div></div></div>)}{!reviews.length&&<p className="text-sm" style={{color:C.textMuted}}>No reviews yet.</p>}</div></div>}
        {tab==="contributors"&&<div><h1 className="text-2xl" style={{fontFamily:F.display,color:C.jungle}}>Contributor Registration Review</h1><p className="text-sm mb-4" style={{color:C.textMuted}}>{pendingContributors.length} pending</p><div className="space-y-3">{contributors.map(c=>{const approved=c.status==="approved"||c.status==="verified";return <div key={c.id} className={`${card} flex gap-4`}><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:approved?C.successBg:c.status==="rejected"?C.errorBg:"#fffbef"}}><Users size={17}/></div><div className="flex-1 min-w-0"><p className="font-bold text-sm">{c.fullName}</p><p className="text-xs" style={{color:C.textMuted}}>{c.area} · {c.contributionArea||c.services||"Area not provided"}</p><p className="text-xs mt-1" style={{color:C.textSub}}>{c.localKnowledgeExperience||c.experience||"Local knowledge not provided"}</p><p className="text-xs mt-1">{c.userEmail} · {c.phone}</p>{c.rejectReason&&<p className="text-xs mt-1" style={{color:C.error}}>Rejection reason: {c.rejectReason}</p>}{c.docUrl&&<button type="button" onClick={()=>openContributorDocument(c.docUrl!)} className="text-xs font-bold block mt-1" style={{color:C.forest}}>View supporting document</button>}</div><div className="flex items-start gap-2"><span className="text-xs capitalize">{approved?"Approved":c.status}</span>{c.status==="pending"&&<><button title="Approve contributor" onClick={()=>contributorStatus(c,"approved")} className="p-2 rounded-lg" style={{backgroundColor:C.successBg,color:C.success}}><CheckCircle size={15}/></button><button title="Reject contributor" onClick={()=>contributorStatus(c,"rejected")} className="p-2 rounded-lg" style={{backgroundColor:C.errorBg,color:C.error}}><X size={15}/></button></>}</div></div>})}{!contributors.length&&<p className="text-sm" style={{color:C.textMuted}}>No contributor applications yet.</p>}</div></div>}
      </>}
    </main>
    {showAdd&&
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between mb-4">
            <div>
              <h2 className="text-xl" style={{fontFamily:F.display,color:C.jungle}}>
                {editingLocation?"Edit Firebase Location":"Add Firebase Location"}
              </h2>
              {editingLocation&&
                <p className="text-xs mt-1" style={{color:C.textMuted}}>
                  Changes will be saved directly to Firestore.
                </p>
              }
            </div>
            <button onClick={closeLocationModal} disabled={saving}><X size={18}/></button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Location name *</label>
              <input
                value={form.name}
                onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                placeholder="Location name *"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Address *</label>
              <input
                value={form.address}
                onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                placeholder="Full address, e.g. Bako National Park, Kuching, Sarawak, Malaysia"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Latitude *</label>
                <input value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} inputMode="decimal" placeholder="3.1390" className="w-full border rounded-xl px-3 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Longitude *</label>
                <input value={form.lng} onChange={e=>setForm(f=>({...f,lng:e.target.value}))} inputMode="decimal" placeholder="101.6869" className="w-full border rounded-xl px-3 py-3 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>State</label>
                <select
                  value={form.state}
                  onChange={e=>setForm(f=>({...f,state:e.target.value}))}
                  className="w-full border rounded-xl px-3 py-3 text-sm"
                >
                  {ALL_STATES.map(s=><option key={s.code}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Activity</label>
                <select
                  value={form.activity}
                  onChange={e=>setForm(f=>({...f,activity:e.target.value}))}
                  className="w-full border rounded-xl px-3 py-3 text-sm"
                >
                  {ACTIVITIES.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))}
                className="w-full border rounded-xl px-3 py-3 text-sm"
              >
                {["Easy","Moderate","Hard"].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Description</label>
              <textarea
                value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder="Description"
                rows={4}
                className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Distance</label>
                <input
                  value={form.distance}
                  onChange={e=>setForm(f=>({...f,distance:e.target.value}))}
                  placeholder="e.g. 5 km or N/A"
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Duration</label>
                <input
                  value={form.duration}
                  onChange={e=>setForm(f=>({...f,duration:e.target.value}))}
                  placeholder="e.g. 2 hours or N/A"
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Opening hours</label>
              <input
                value={form.openingHours}
                onChange={e=>setForm(f=>({...f,openingHours:e.target.value}))}
                placeholder="e.g. Daily, 8:00 AM - 6:00 PM"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={()=>openAdminVerificationSearch(form,"hours")}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
                style={{color:C.forest}}
              >
                Search official hours <ExternalLink size={11}/>
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Official website / hours source</label>
              <input
                value={form.officialUrl}
                onChange={e=>setForm(f=>({...f,officialUrl:e.target.value}))}
                placeholder="https://official-website.example"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={()=>openAdminVerificationSearch(form,"official")}
                  className="inline-flex items-center gap-1 text-xs font-bold"
                  style={{color:C.forest}}
                >
                  Search official website <ExternalLink size={11}/>
                </button>
                <button
                  type="button"
                  onClick={()=>openAdminVerificationSearch(form,"maps")}
                  className="inline-flex items-center gap-1 text-xs font-bold"
                  style={{color:C.forest}}
                >
                  Check on map <ExternalLink size={11}/>
                </button>
              </div>
              <p className="mt-2 text-[11px]" style={{color:C.textMuted}}>
                Paste the real official page here after checking. SeekMY will only display a source link when this field is saved.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Facilities</label>
              <input
                value={form.facilities}
                onChange={e=>setForm(f=>({...f,facilities:e.target.value}))}
                placeholder="Parking, Toilets, Rest Area"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Accessibility</label>
              <input
                value={form.accessibility}
                onChange={e=>setForm(f=>({...f,accessibility:e.target.value}))}
                placeholder="Accessibility information"
                className="w-full border rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{color:C.textSub}}>Estimated cost (RM) *</label>
              <input type="number" min="0" step="0.01" value={form.estimatedPrice} onChange={e=>setForm(f=>({...f,estimatedPrice:e.target.value}))} placeholder="0 if free" className="w-full border rounded-xl px-4 py-3 text-sm" />
            </div>

            <LocationImageUploader existing={existingImages} files={imageFiles} setFiles={setImageFiles} onRemoveExisting={url=>setExistingImages(existingImages.filter(image=>image!==url))} showToast={showToast}/>

            {saving&&imageFiles.length>0&&<div className="rounded-xl p-4" style={{backgroundColor:C.muted}}><div className="flex justify-between text-xs font-bold mb-2"><span>Uploading pictures...</span><span>{uploadProgress}%</span></div><div className="w-full h-2 rounded-full bg-white overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:`${uploadProgress}%`,backgroundColor:C.jungle}}/></div></div>}

            <div className="flex gap-2 pt-2">
              <Pill variant="filled" onClick={saveLocation} disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingLocation
                    ? "Save Changes"
                    : "Add Location"}
              </Pill>

              <Pill variant="outline" onClick={closeLocationModal} disabled={saving}>
                Cancel
              </Pill>
            </div>
          </div>
        </div>
      </div>
    }
  </div>;
}
//==================== WongYueShan END - Admin Panel ====================
