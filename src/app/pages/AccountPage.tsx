//==================== WilsonChoongWeiShan Part - Account Module ====================
import { useEffect, useState } from "react";
import {
  LogOut, Edit3, Check, X, Lock, Trash2, UserCircle, Trophy,
  Activity, Bookmark, Award, ChevronRight, Mail, AlertTriangle,
  User as UserIcon, Camera, Bell, CheckCheck,
} from "lucide-react";
import type { AppUser, ActivityLog, Page } from "../lib/types";
import { firebaseClient } from "../api/firebaseClient";
import { isStrongPassword, PASSWORD_REQUIREMENT } from "../api/firebaseClient";
import type { LocationSubmission, UserAnnouncement } from "../lib/communityTypes";
import { C, F } from "../lib/tokens";
import { evaluateBadges, shareBadge } from "../lib/badges";
import { Pill, AlertBanner, PasswordInput, SectionHead } from "../components/Atoms";
import type { Language } from "../lib/i18n";
import { t } from "../lib/i18n";

export function AccountPage({ user, setUser, onLogout, logs, bookmarks, setPage, users, setUsers, earnedBadgeIds = [], onAnnouncementsChanged, language = "en" }:{
  user:AppUser; setUser:(u:AppUser)=>void; onLogout:()=>void;
  logs:ActivityLog[]; bookmarks:(string|number)[]; setPage:(p:Page)=>void;
  users:AppUser[]; setUsers:(u:AppUser[])=>void; earnedBadgeIds?: string[];
  onAnnouncementsChanged?:(count:number)=>void;
  language?:Language;
}) {
  type AccTab = "profile"|"suggestions"|"announcements"|"badges"|"security"|"danger";
  const [activeTab,setActiveTab] = useState<AccTab>("profile");

  // Profile edit state
  const [editing,setEditing]       = useState(false);
  const [dName,setDName]           = useState(user.displayName);
  const [dUsername,setDUsername]   = useState(user.username);
  const [dBio,setDBio]             = useState(user.bio);
  const [uploadingPhoto,setUploadingPhoto] = useState(false);
  const [profileAlert,setProfileAlert] = useState<{type:"success"|"error";msg:string}|null>(null);
  const [mySubs,setMySubs]=useState<LocationSubmission[]>([]);
  const [announcements,setAnnouncements]=useState<UserAnnouncement[]>([]);
  const [selectedAnnouncement,setSelectedAnnouncement]=useState<UserAnnouncement|null>(null);
  async function refreshMine(){
    try{
      const [subs,ownAnns]=await Promise.all([
        firebaseClient.entities.LocationSubmission.filter({created_by_id:user.id}),
        firebaseClient.entities.Announcement.filter({userId:user.id}),
      ]);
      const globalAnns = await firebaseClient.entities.Announcement.filter({userId:"all"}).catch(()=>[]);
      setMySubs((subs as LocationSubmission[]).sort((a,b)=>String(b.created_date||b.createdAt||"").localeCompare(String(a.created_date||a.createdAt||""))));
      const seen = new Set<string>();
      const nextAnnouncements = ([...(ownAnns as UserAnnouncement[]), ...(globalAnns as UserAnnouncement[])])
        .filter(a=>!a.dismissed && !seen.has(a.id) && seen.add(a.id))
        .sort((a,b)=>String(b.created_date||b.createdAt||"").localeCompare(String(a.created_date||a.createdAt||"")));
      setAnnouncements(nextAnnouncements);
      onAnnouncementsChanged?.(nextAnnouncements.filter(a=>!a.read).length);
    }catch(error:any){setProfileAlert({type:"error",msg:error?.message||"Unable to load your Firebase account data."});}
  }
  useEffect(()=>{refreshMine();},[user.id]);

  // Password change state
  const [curPass,setCurPass]       = useState("");
  const [newPass,setNewPass]       = useState("");
  const [confPass,setConfPass]     = useState("");
  const [passAlert,setPassAlert]   = useState<{type:"success"|"error";msg:string}|null>(null);
  const [showPasswordRequirements,setShowPasswordRequirements] = useState(false);

  // Delete account state
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText,setDeleteConfirmText] = useState("");

  const totalKm     = logs.reduce((s,l)=>s+l.distance,user.totalKm);
  const uniqueStates = new Set(logs.map(l=>l.state)).size + user.states;
  const badges = evaluateBadges(logs, 0, earnedBadgeIds);
  const earnedCount = badges.filter(b => b.earned).length;
  const passwordConditionCount = [
    /[a-z]/.test(newPass),
    /[A-Z]/.test(newPass),
    /\d/.test(newPass),
    /[^A-Za-z0-9]/.test(newPass),
  ].filter(Boolean).length;
  const passwordRequirements = [
    { label: "Different from current password", met: Boolean(newPass && curPass && newPass !== curPass) },
    { label: "At least 8 characters", met: newPass.length >= 8 },
    { label: "Meet all 4 conditions", met: passwordConditionCount === 4 },
    { label: "At least one lowercase letter", met: /[a-z]/.test(newPass) },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(newPass) },
    { label: "At least one number", met: /\d/.test(newPass) },
    { label: "At least one special character", met: /[^A-Za-z0-9]/.test(newPass) },
  ];

  const initials = user.displayName.split(" ").map(n=>n[0]).join("").slice(0,2);

  async function uploadProfilePhoto(file?: File) {
    setProfileAlert(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileAlert({type:"error",msg:"Please upload a JPG, PNG, or WEBP image."});
      return;
    }
    try {
      setUploadingPhoto(true);
      const photoUrl = await firebaseClient.storage.uploadProfilePhoto(file);
      await firebaseClient.auth.updateProfile({ photo_url: photoUrl });
      const updated = { ...user, photoUrl };
      setUser(updated);
      setUsers(users.map(u=>u.id===user.id?updated:u));
      setProfileAlert({type:"success",msg:"Profile picture updated successfully."});
    } catch (error:any) {
      setProfileAlert({type:"error",msg:error?.message||"Unable to upload your profile picture."});
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveProfile(){
    setProfileAlert(null);
    if(!dName.trim()||!dUsername.trim()){setProfileAlert({type:"error",msg:"Name and username are required."});return;}
    if(dUsername.length<3){setProfileAlert({type:"error",msg:"Username must be at least 3 characters."});return;}
    try{
      await firebaseClient.auth.updateProfile({full_name:dName.trim()});
      await firebaseClient.entities.User.update(user.id,{username:dUsername.trim(),bio:dBio.trim(),role:user.role});
      const updated={...user,displayName:dName.trim(),username:dUsername.trim(),bio:dBio.trim()}; setUser(updated); setUsers(users.map(u=>u.id===user.id?updated:u)); setEditing(false);
      setProfileAlert({type:"success",msg:"Profile updated successfully in Firebase."});
    }catch(error:any){setProfileAlert({type:"error",msg:error?.message||"Unable to update your Firebase profile."});}
  }

  async function changePassword(){
    setPassAlert(null);
    if(!curPass||!newPass||!confPass){setPassAlert({type:"error",msg:"All password fields are required."});return;}
    if(newPass===curPass){setPassAlert({type:"error",msg:"New password must be different from your current password."});return;}
    if(!isStrongPassword(newPass)){setPassAlert({type:"error",msg:PASSWORD_REQUIREMENT});return;}
    if(newPass!==confPass){setPassAlert({type:"error",msg:"New passwords do not match."});return;}
    try{await firebaseClient.auth.changePassword({oldPassword:curPass,newPassword:newPass});setCurPass("");setNewPass("");setConfPass("");setShowPasswordRequirements(false);setPassAlert({type:"success",msg:"Password changed successfully in Firebase Authentication."});}
    catch(error:any){setPassAlert({type:"error",msg:error?.message||"Unable to change password."});}
  }

  async function deleteAccount(){
    if(deleteConfirmText!=="DELETE")return;
    try{await firebaseClient.auth.deleteAccount();setUsers(users.filter(u=>u.id!==user.id));onLogout();}
    catch(error:any){setProfileAlert({type:"error",msg:error?.message||"Unable to delete account."});}
  }

  async function openAnnouncement(announcement: UserAnnouncement) {
    setSelectedAnnouncement(announcement);
    if (!announcement.read) {
      await firebaseClient.entities.Announcement.update(announcement.id,{read:true});
      setAnnouncements(items=>items.map(item=>item.id===announcement.id?{...item,read:true}:item));
      onAnnouncementsChanged?.(Math.max(announcements.filter(item=>!item.read).length-1,0));
    }
  }
  async function dismissAnnouncement(announcement: UserAnnouncement) {
    await firebaseClient.entities.Announcement.update(announcement.id,{dismissed:true,read:true});
    const next = announcements.filter(item=>item.id!==announcement.id);
    setAnnouncements(next);
    if (selectedAnnouncement?.id === announcement.id) setSelectedAnnouncement(null);
    onAnnouncementsChanged?.(next.filter(item=>!item.read).length);
  }
  async function markAllAnnouncementsRead() {
    await Promise.all(announcements.filter(a=>!a.read).map(a=>firebaseClient.entities.Announcement.update(a.id,{read:true})));
    setAnnouncements(items=>items.map(item=>({...item,read:true})));
    onAnnouncementsChanged?.(0);
  }
  async function clearReadAnnouncements() {
    const readItems = announcements.filter(a=>a.read);
    await Promise.all(readItems.map(a=>firebaseClient.entities.Announcement.update(a.id,{dismissed:true})));
    const next = announcements.filter(a=>!a.read);
    setAnnouncements(next);
    onAnnouncementsChanged?.(next.length);
  }
  function announcementTone(type: UserAnnouncement["type"]) {
    if (type === "rejected") return { label:language==="zh"?"需要处理":language==="ms"?"Perlu perhatian":"Needs attention", bg:C.errorBg, color:C.error, border:C.error };
    if (type === "approved") return { label:language==="zh"?"已批准":language==="ms"?"Diluluskan":"Approved", bg:C.successBg, color:C.success, border:C.success };
    if (type === "achievement") return { label:t(language, "achievements"), bg:"#fff7dc", color:C.jungle, border:C.amber };
    if (type === "notice") return { label:language==="zh"?"通知":language==="ms"?"Notis":"Notice", bg:C.muted, color:C.forest, border:C.forest };
    return { label:language==="zh"?"更新":language==="ms"?"Kemas kini":"Update", bg:C.muted, color:C.textMuted, border:C.forest };
  }
  function goToAnnouncementRelated(announcement: UserAnnouncement) {
    setSelectedAnnouncement(null);
    if (announcement.relatedPage === "badges") setActiveTab("badges");
    else if (announcement.relatedPage === "suggestions") setActiveTab("suggestions");
    else if (announcement.relatedPage === "contributor") setPage("contributor");
  }

  function displayAnnouncement(announcement: UserAnnouncement) {
    if (language === "en") return { title: announcement.title, message: announcement.message };
    if (/Location not approved/i.test(announcement.title)) {
      const match = announcement.message.match(/Your suggestion "([^"]+)".*Reason:\s*(.*)$/i);
      const name = match?.[1] || "";
      const reason = match?.[2] || "";
      return language === "zh"
        ? { title: "地点未批准", message: `你的建议 "${name}" 未获批准。原因：${reason}` }
        : { title: "Lokasi tidak diluluskan", message: `Cadangan anda "${name}" tidak diluluskan. Sebab: ${reason}` };
    }
    return { title: announcement.title, message: announcement.message };
  }

  function badgeCopy(name: string, desc: string) {
    const names: Record<string, Record<Language, string>> = {
      "First Footstep": { en: "First Footstep", ms: "Langkah Pertama", zh: "第一步" },
      "State Explorer": { en: "State Explorer", ms: "Penjelajah Negeri", zh: "州属探索者" },
      "Malaysia Wanderer": { en: "Malaysia Wanderer", ms: "Pengembara Malaysia", zh: "马来西亚漫游者" },
      "Hidden Gem Hunter": { en: "Hidden Gem Hunter", ms: "Pemburu Permata Tersembunyi", zh: "隐藏宝藏猎人" },
      "First Contribution": { en: "First Contribution", ms: "Sumbangan Pertama", zh: "首次贡献" },
      "Local Storyteller": { en: "Local Storyteller", ms: "Pencerita Tempatan", zh: "本地故事分享者" },
      "Trusted Contributor": { en: "Trusted Contributor", ms: "Penyumbang Dipercayai", zh: "可信贡献者" },
      "Community Favourite": { en: "Community Favourite", ms: "Kegemaran Komuniti", zh: "社区最爱" },
      "Malaysia Insider": { en: "Malaysia Insider", ms: "Orang Dalam Malaysia", zh: "马来西亚达人" },
    };
    const descs: Record<string, Record<Language, string>> = {
      "Log your first outdoor activity": { en: desc, ms: "Rekod aktiviti luar pertama anda", zh: "记录你的第一次户外活动" },
      "Visit 3 different Malaysian states": { en: desc, ms: "Lawati 3 negeri Malaysia berbeza", zh: "到访 3 个不同的马来西亚州属" },
      "Visit 5 different Malaysian states": { en: desc, ms: "Lawati 5 negeri Malaysia berbeza", zh: "到访 5 个不同的马来西亚州属" },
      "Visit 3 hidden-gem locations": { en: desc, ms: "Lawati 3 lokasi permata tersembunyi", zh: "到访 3 个隐藏宝藏地点" },
      "Write your first community review": { en: desc, ms: "Tulis ulasan komuniti pertama anda", zh: "写下你的第一条社区评价" },
      "Write 3 community reviews": { en: desc, ms: "Tulis 3 ulasan komuniti", zh: "写下 3 条社区评价" },
      "Write 5 community reviews": { en: desc, ms: "Tulis 5 ulasan komuniti", zh: "写下 5 条社区评价" },
      "Write 10 community reviews": { en: desc, ms: "Tulis 10 ulasan komuniti", zh: "写下 10 条社区评价" },
      "Log 100 km of outdoor activities": { en: desc, ms: "Rekod 100 km aktiviti luar", zh: "记录 100 公里户外活动" },
    };
    return { name: names[name]?.[language] || name, desc: descs[desc]?.[language] || desc };
  }

  function badgeUnlockHint(id: string) {
    if (id !== "hidden-gem-hunter") return "";
    if (language === "zh") return "如何解锁：在活动日志中记录 3 个带有 Hidden Gem 标记的地点。";
    if (language === "ms") return "Cara buka: rekod 3 lokasi bertanda Hidden Gem dalam Log Aktiviti.";
    return "How to unlock: log activities at 3 locations marked Hidden Gem.";
  }

  const tabStyle = (t:AccTab): React.CSSProperties => ({
    color:activeTab===t?C.jungle:C.textMuted,
    borderBottom:activeTab===t?`2px solid ${C.amber}`:"2px solid transparent",
    fontFamily:F.body,
    fontWeight:700,
  });

  return (
    <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}>
      <div style={{background:`linear-gradient(135deg, ${C.jungle} 0%, ${C.forest} 100%)`}}>
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-0">
          <div className="flex items-end gap-4">
            <div className="relative mb-0 flex-shrink-0">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.displayName} className="h-20 w-20 rounded-full border-4 border-white object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white" style={{backgroundColor:C.forest}}>
                  {initials}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-lg transition-all active:scale-95" style={{backgroundColor:C.amber,color:C.jungle}}>
                <Camera size={15}/>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event)=>uploadProfilePhoto(event.target.files?.[0])}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div className="pb-4">
              <h1 className="text-2xl font-normal text-white" style={{fontFamily:F.display}}>{user.displayName}</h1>
              <p className="text-sm" style={{color:"rgba(255,255,255,0.65)",fontFamily:F.body}}>@{user.username} · {t(language, "memberSince")} {user.joinDate}</p>
              {uploadingPhoto && <p className="mt-1 text-xs font-bold" style={{color:"rgba(255,255,255,0.82)",fontFamily:F.body}}>Uploading profile picture...</p>}
            </div>
          </div>
          <div className="flex gap-8 mt-3 pb-4 pt-2">
            {[{val:`${totalKm.toFixed(0)} km`,label:t(language,"distance")},{val:uniqueStates,label:t(language,"states")},{val:logs.length+user.checkins,label:t(language,"checkins")},{val:earnedCount,label:t(language,"badges")}].map(({val,label})=>(
              <div key={label}>
                <p className="text-xl font-bold text-white" style={{fontFamily:F.display}}>{val}</p>
                <p className="text-[11px]" style={{color:"rgba(255,255,255,0.55)",fontFamily:F.body}}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-14 z-30" style={{borderColor:C.border}}>
        <div className="max-w-2xl mx-auto px-5 flex gap-6 overflow-x-auto" style={{scrollbarWidth:"none"}}>
          {([["profile",t(language,"profile")],["suggestions",t(language,"mySuggestions")],["announcements",t(language,"announcements")],["badges",t(language,"badges")],["security",t(language,"security")],["danger",t(language,"dangerZone")]] as [AccTab,string][]) .map(([tabId,label])=>(
            <button key={tabId} onClick={()=>{ setActiveTab(tabId); if(tabId==="suggestions"||tabId==="announcements") refreshMine(); }} className="py-4 text-sm transition-all whitespace-nowrap" style={tabStyle(tabId)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">

        {activeTab==="profile" && (
          <div className="space-y-4">
            {profileAlert && <AlertBanner type={profileAlert.type} message={profileAlert.msg}/>}

            <div className="bg-white rounded-[18px] p-6" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>{t(language,"profileInformation")}</h2>
                {!editing && (
                  <button onClick={()=>{setEditing(true);setProfileAlert(null);}} className="flex items-center gap-1.5 text-sm font-bold" style={{color:C.forest,fontFamily:F.body}}>
                    <Edit3 size={14}/> {t(language,"edit")}
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language,"fullName")}</label>
                    <div className="relative">
                      <UserCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                      <input value={dName} onChange={e=>setDName(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language,"username")}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{color:C.textMuted}}>@</span>
                      <input value={dUsername} onChange={e=>setDUsername(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language,"bio")}</label>
                    <textarea value={dBio} onChange={e=>setDBio(e.target.value)} rows={3} placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Pill variant="filled" small onClick={saveProfile}><Check size={13}/> {t(language,"saveChanges")}</Pill>
                    <Pill variant="outline" small onClick={()=>{setEditing(false);setDName(user.displayName);setDUsername(user.username);setDBio(user.bio);setProfileAlert(null);}}>{t(language,"cancel")}</Pill>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[{label:t(language,"fullName"),val:user.displayName,icon:<UserCircle size={14}/>},{label:t(language,"username"),val:`@${user.username}`,icon:<UserIcon size={14}/>},{label:t(language,"emailAddress"),val:user.email,icon:<Mail size={14}/>},{label:t(language,"memberSince"),val:user.joinDate,icon:<Award size={14}/>}].map(({label,val,icon})=>(
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:C.muted,color:C.forest}}>{icon}</div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{color:C.textMuted,fontFamily:F.body}}>{label}</p>
                        <p className="text-sm font-semibold" style={{color:C.text,fontFamily:F.body}}>{val}</p>
                      </div>
                    </div>
                  ))}
                  {user.bio && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:C.muted,color:C.forest}}><Edit3 size={14}/></div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{color:C.textMuted,fontFamily:F.body}}>{t(language,"bio")}</p>
                        <p className="text-sm" style={{color:C.textSub,fontFamily:F.body}}>{user.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {[
                {label:t(language,"myBookmarks"),icon:<Bookmark size={15}/>,action:()=>setPage("bookmarks")},
                {label:t(language,"activityLogTitle"),icon:<Activity size={15}/>,action:()=>setPage("log")},
                {label:t(language,"achievements"),icon:<Award size={15}/>,action:()=>setActiveTab("badges")},
              ].map(({label,icon,action})=>(
                <button key={label} onClick={action} className="w-full bg-white rounded-[18px] px-5 py-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 2px 6px rgba(27,67,50,0.04)`}}>
                  <span style={{color:C.jungle}}>{icon}</span>
                  <span className="text-sm font-semibold flex-1 text-left" style={{fontFamily:F.body,color:C.text}}>{label}</span>
                  <ChevronRight size={14} style={{color:C.textMuted}}/>
                </button>
              ))}
              <button onClick={onLogout} className="w-full bg-white rounded-[18px] px-5 py-4 flex items-center gap-3 hover:bg-red-50 active:scale-[0.99] transition-all" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 2px 6px rgba(27,67,50,0.04)`}}>
                <LogOut size={15} style={{color:C.error}}/>
                <span className="text-sm font-semibold" style={{color:C.error,fontFamily:F.body}}>{t(language,"signOut")}</span>
              </button>
            </div>
          </div>
        )}

        
        {activeTab==="suggestions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{fontFamily:F.body,color:C.text}}>{t(language, "mySuggestions")}</h2>
              <button type="button" onClick={refreshMine} className="text-xs font-bold" style={{color:C.forest,fontFamily:F.body}}>{language==="zh"?"同步最新":language==="ms"?"Segerak terkini":"Sync latest"}</button>
            </div>
            {mySubs.length===0 ? (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
                <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>{language==="zh"?"你还没有建议任何地点。":language==="ms"?"Anda belum mencadangkan sebarang lokasi.":"You have not suggested any locations yet."}</p>
                <button type="button" onClick={()=>setPage("suggest")} className="mt-3 text-sm font-bold" style={{color:C.jungle,fontFamily:F.body}}>{language==="zh"?"建议地点":language==="ms"?"Cadangkan lokasi":"Suggest a location"} {">"}</button>
              </div>
            ) : mySubs.map(s=>(
              <div key={s.id} className="bg-white rounded-[18px] p-4 flex gap-3" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
                {s.photoUrl ? (
                  <img src={s.photoUrl} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl flex-shrink-0" style={{backgroundColor:C.muted}} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{s.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{
                      backgroundColor:s.status==="approved"?C.successBg:s.status==="rejected"?C.errorBg:"#fef3c7",
                      color:s.status==="approved"?C.success:s.status==="rejected"?C.error:"#92400e",
                      fontFamily:F.body
                    }}>{s.status}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{color:C.textMuted,fontFamily:F.body}}>{s.state} · {s.activity}</p>
                  <p className="text-[12px] mt-1 line-clamp-2" style={{color:C.textSub,fontFamily:F.body}}>{s.description}</p>
                  {s.rejectReason && (
                    <p className="text-[11px] mt-1" style={{color:C.error,fontFamily:F.body}}>Reason: {s.rejectReason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab==="announcements" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold" style={{fontFamily:F.body,color:C.text}}>{t(language, "announcements")}</h2>
                <p className="text-xs" style={{color:C.textMuted,fontFamily:F.body}}>{language==="zh"?"审核结果、拒绝反馈、成就和管理员通知都会显示在这里。":language==="ms"?"Keputusan kelulusan, maklum balas penolakan, pencapaian dan notis admin dipaparkan di sini.":"Approval results, rejection feedback, achievements, and admin notices stay here."}</p>
              </div>
              <div className="flex gap-2">
                {announcements.some(a=>!a.read) && (
                  <button type="button" onClick={markAllAnnouncementsRead} className="text-xs font-bold px-3 py-2 rounded-full" style={{color:C.forest,backgroundColor:C.muted,fontFamily:F.body}}><CheckCheck size={13} className="inline mr-1"/>{language==="zh"?"全部已读":language==="ms"?"Baca semua":"Read all"}</button>
                )}
                {announcements.some(a=>a.read) && (
                  <button type="button" onClick={clearReadAnnouncements} className="text-xs font-bold px-3 py-2 rounded-full" style={{color:C.textMuted,backgroundColor:"#fff",border:`1px solid ${C.border}`,fontFamily:F.body}}>{language==="zh"?"清除已读":language==="ms"?"Kosongkan dibaca":"Clear read"}</button>
                )}
              </div>
            </div>
            {announcements.length===0 ? (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
                <Bell size={24} className="mx-auto mb-3" style={{color:C.textMuted}}/>
                <p className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>No announcements yet.</p>
                <p className="text-xs mt-1" style={{color:C.textMuted,fontFamily:F.body}}>When admin reviews your submissions or you earn a badge, the notice will appear here.</p>
              </div>
            ) : announcements.map(a=>{
              const tone = announcementTone(a.type);
              const display = displayAnnouncement(a);
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-[18px] p-4"
                  style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`,borderLeft:`4px solid ${a.read ? "transparent" : tone.border}`}}
                >
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={()=>openAnnouncement(a)} className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{display.title}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:tone.bg,color:tone.color,fontFamily:F.body}}>{tone.label}</span>
                        {!a.read && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:C.amber,color:C.jungle,fontFamily:F.body}}>NEW</span>}
                      </div>
                      {a.photoUrl && <img src={a.photoUrl} alt={`Poster for ${display.title}`} className="mt-3 max-h-44 w-full rounded-xl object-cover" />}
                      <p className="text-[12px] mt-1 line-clamp-2" style={{color:C.textSub,fontFamily:F.body}}>{display.message}</p>
                      <p className="text-[10px] mt-2" style={{color:C.textMuted,fontFamily:F.body}}>{new Date(a.createdAt || a.created_date || "").toLocaleString()}</p>
                    </button>
                    <button type="button" onClick={()=>dismissAnnouncement(a)} className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:C.muted,color:C.textMuted}} aria-label={`Dismiss ${a.title}`}>
                      <X size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

{activeTab==="badges" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-normal mb-1" style={{fontFamily:F.display,color:C.text}}>{language==="zh"?"徽章收藏":language==="ms"?"Koleksi lencana":"Badge collection"}</h2>
              <p className="text-sm mb-2" style={{color:C.textMuted,fontFamily:F.body}}>
                {earnedCount} {language==="zh"?"已获得":language==="ms"?"diperoleh":"earned"} · {badges.length - earnedCount} {language==="zh"?"未解锁":language==="ms"?"terkunci":"locked"}
              </p>
            </div>
            {badges.map((b) => {
              const pct = Math.round((b.progress / b.requirement) * 100);
              const translated = badgeCopy(b.name, b.desc);
              const unlockHint = badgeUnlockHint(b.id);
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-[18px] p-5"
                  style={{
                    boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`,
                    opacity: b.earned ? 1 : 0.88,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={b.image}
                      alt={`${b.name} badge`}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-contain"
                      style={{filter: b.earned ? "none" : "grayscale(1)", opacity: b.earned ? 1 : 0.42}}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{translated.name}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: b.earned ? C.successBg : C.muted,
                            color: b.earned ? C.success : C.textMuted,
                            fontFamily:F.body,
                          }}
                        >
                          {b.earned ? (language==="zh"?"已获得":language==="ms"?"Diperoleh":"Earned") : (language==="zh"?"未解锁":language==="ms"?"Terkunci":"Locked")}
                        </span>
                      </div>
                      <p className="text-[12px] mt-0.5" style={{color:C.textSub,fontFamily:F.body}}>{translated.desc}</p>
                      {unlockHint && (
                        <p className="text-[11px] mt-1 font-semibold" style={{color:C.forest,fontFamily:F.body}}>{unlockHint}</p>
                      )}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1" style={{fontFamily:F.body,color:C.textMuted}}>
                          <span>{b.progress} / {b.requirement}</span>
                          <span>{Math.min(pct, 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:C.muted}}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width:`${Math.min(pct,100)}%`,
                              backgroundColor: b.earned ? C.amber : C.forest,
                            }}
                          />
                        </div>
                      </div>
                      {b.earned && (
                        <button
                          type="button"
                          onClick={() => shareBadge(b)}
                          className="mt-3 text-[12px] font-bold px-3 py-1.5 rounded-full"
                          style={{backgroundColor:C.jungle,color:"#fff",fontFamily:F.body}}
                        >
                          Share badge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="security" && (
          <div className="space-y-4">
            {passAlert && <AlertBanner type={passAlert.type} message={passAlert.msg}/>}

            <div className="bg-white rounded-[18px] p-6" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
              <div className="flex items-center gap-2 mb-5">
                <Lock size={18} style={{color:C.jungle}}/>
                <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>{t(language, "changePassword")}</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "currentPassword")}</label>
                  <PasswordInput value={curPass} onChange={setCurPass} placeholder={t(language, "currentPassword")}/>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "newPassword")}</label>
                  <PasswordInput value={newPass} onFocus={()=>setShowPasswordRequirements(true)} onChange={setNewPass} placeholder="Strong password"/>
                  {showPasswordRequirements && (
                    <div className="mt-3 rounded-2xl border p-4" style={{borderColor:C.border}}>
                      <p className="mb-3 text-xs font-bold" style={{color:C.text,fontFamily:F.body}}>Password Requirements</p>
                      <div className="space-y-2.5">
                        {passwordRequirements.map((requirement) => (
                          <div key={requirement.label} className="flex items-center gap-2.5">
                            <span
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                              style={{
                                backgroundColor: requirement.met ? C.successBg : C.muted,
                                color: requirement.met ? C.success : C.textMuted,
                              }}
                            >
                              {requirement.met ? <Check size={13}/> : <span className="h-2 w-2 rounded-full" style={{backgroundColor:C.textMuted}}/>}
                            </span>
                            <span className="text-xs" style={{color:C.textSub,fontFamily:F.body}}>{requirement.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "confirmNewPassword")}</label>
                  <PasswordInput value={confPass} onChange={setConfPass} placeholder={t(language, "confirmNewPassword")}/>
                </div>
                <div className="pt-1">
                  <Pill variant="filled" onClick={changePassword}><Lock size={14}/> {t(language, "updatePassword")}</Pill>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[18px] p-5" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
              <h2 className="font-bold text-sm mb-3" style={{fontFamily:F.body,color:C.text}}>{language==="zh"?"登录会话":language==="ms"?"Sesi Log Masuk":"Login Sessions"}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{fontFamily:F.body,color:C.text}}>{language==="zh"?"当前会话":language==="ms"?"Sesi semasa":"Current session"}</p>
                  <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>SeekMY Web App · Malaysia · {language==="zh"?"刚刚":language==="ms"?"Sebentar tadi":"Just now"}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{backgroundColor:C.successBg,color:C.success,fontFamily:F.body}}>{language==="zh"?"活跃":language==="ms"?"Aktif":"Active"}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab==="danger" && (
          <div className="space-y-4">
            <div className="bg-white rounded-[18px] p-6 border" style={{borderColor:"rgba(192,57,43,0.20)",boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:C.errorBg}}>
                  <Trash2 size={18} style={{color:C.error}}/>
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>{t(language, "deleteAccount")}</h2>
                  <p className="text-sm mt-1 leading-relaxed" style={{color:C.textSub,fontFamily:F.body}}>
                    {language==="zh"?"此操作是永久性的，无法撤销。你的个人资料、活动记录和收藏会立即被删除。":language==="ms"?"Tindakan ini kekal dan tidak boleh dibuat asal. Semua data profil, log aktiviti dan penanda buku anda akan dipadam serta-merta.":"This action is permanent and cannot be undone. All your profile data, activity logs, and bookmarks will be removed immediately."}
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button onClick={()=>setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-5 h-[50px] rounded-full text-sm font-bold text-white transition-all active:scale-[0.96]"
                  style={{backgroundColor:C.error,fontFamily:F.body}}>
                  <Trash2 size={14}/> {t(language, "deleteMyAccount")}
                </button>
              ) : (
                <div className="rounded-[14px] p-5 border" style={{backgroundColor:C.errorBg,borderColor:"rgba(192,57,43,0.25)"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{color:C.error}}/>
                    <p className="text-sm font-bold" style={{color:C.error,fontFamily:F.body}}>Are you absolutely sure?</p>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed" style={{color:C.textSub,fontFamily:F.body}}>
                    Type <strong>DELETE</strong> to confirm permanent deletion of your account <strong>{user.email}</strong>.
                  </p>
                  <input value={deleteConfirmText} onChange={e=>setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border mb-4 font-bold" style={{borderColor:"rgba(192,57,43,0.30)",fontFamily:F.body,color:C.error,backgroundColor:"#fff"}}/>
                  <div className="flex gap-3">
                    <button onClick={()=>{setShowDeleteConfirm(false);setDeleteConfirmText("");}}
                      className="flex-1 h-[50px] rounded-full text-sm font-bold border transition-all active:scale-[0.96]"
                      style={{backgroundColor:"#fff",color:C.text,borderColor:C.border,fontFamily:F.body}}>
                      {t(language, "cancel")}
                    </button>
                    <button onClick={deleteAccount} disabled={deleteConfirmText!=="DELETE"}
                      className="flex-1 h-[50px] rounded-full text-sm font-bold text-white transition-all active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{backgroundColor:C.error,fontFamily:F.body}}>
                      {t(language, "deleteAccount")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onClick={()=>setSelectedAnnouncement(null)}>
          <div className="w-full max-w-lg rounded-[20px] bg-white p-5 shadow-2xl" onClick={event=>event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:announcementTone(selectedAnnouncement.type).bg,color:announcementTone(selectedAnnouncement.type).color,fontFamily:F.body}}>
                  {announcementTone(selectedAnnouncement.type).label}
                </span>
                <h3 className="mt-3 text-xl font-normal" style={{fontFamily:F.display,color:C.text}}>{selectedAnnouncement.title}</h3>
                <p className="text-xs mt-1" style={{color:C.textMuted,fontFamily:F.body}}>{new Date(selectedAnnouncement.createdAt || selectedAnnouncement.created_date || "").toLocaleString()}</p>
              </div>
              <button type="button" onClick={()=>setSelectedAnnouncement(null)} className="h-9 w-9 rounded-full flex items-center justify-center" style={{backgroundColor:C.muted,color:C.textMuted}} aria-label="Close announcement">
                <X size={15}/>
              </button>
            </div>
            {selectedAnnouncement.photoUrl && <img src={selectedAnnouncement.photoUrl} alt={`Poster for ${selectedAnnouncement.title}`} className="mt-4 max-h-72 w-full rounded-xl object-cover" />}
            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line" style={{color:C.textSub,fontFamily:F.body}}>{selectedAnnouncement.message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedAnnouncement.relatedPage && <Pill variant="filled" small onClick={()=>goToAnnouncementRelated(selectedAnnouncement)}>View related</Pill>}
              <Pill variant="outline" small onClick={()=>dismissAnnouncement(selectedAnnouncement)}>Dismiss</Pill>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//==================== WilsonChoongWeiShan END - Account Module ====================
