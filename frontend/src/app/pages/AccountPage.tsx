//==================== WilsonChoongWeiShan Part - Account Module ====================
import { useEffect, useState } from "react";
import {
  LogOut, Edit3, Check, X, Lock, Trash2, UserCircle, Trophy,
  Activity, Bookmark, Award, ChevronRight, Mail, AlertTriangle,
  User as UserIcon, Camera,
} from "lucide-react";
import type { AppUser, ActivityLog, Page } from "../lib/types";
import { firebaseClient } from "../api/firebaseClient";
import type { LocationSubmission, UserAnnouncement } from "../lib/communityTypes";
import { C, F } from "../lib/tokens";
import { evaluateBadges, shareBadge } from "../lib/badges";
import { Pill, AlertBanner, PasswordInput, SectionHead } from "../components/Atoms";

export function AccountPage({ user, setUser, onLogout, logs, bookmarks, setPage, users, setUsers, earnedBadgeIds = [] }:{
  user:AppUser; setUser:(u:AppUser)=>void; onLogout:()=>void;
  logs:ActivityLog[]; bookmarks:(string|number)[]; setPage:(p:Page)=>void;
  users:AppUser[]; setUsers:(u:AppUser[])=>void; earnedBadgeIds?: string[];
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
  async function refreshMine(){
    try{
      const [subs,anns]=await Promise.all([
        firebaseClient.entities.LocationSubmission.filter({created_by_id:user.id}),
        firebaseClient.entities.Announcement.filter({userId:user.id}),
      ]);
      setMySubs((subs as LocationSubmission[]).sort((a,b)=>String(b.created_date||b.createdAt||"").localeCompare(String(a.created_date||a.createdAt||""))));
      setAnnouncements((anns as UserAnnouncement[]).sort((a,b)=>String(b.created_date||b.createdAt||"").localeCompare(String(a.created_date||a.createdAt||""))));
    }catch(error:any){setProfileAlert({type:"error",msg:error?.message||"Unable to load your Firebase account data."});}
  }
  useEffect(()=>{refreshMine();},[user.id]);

  // Password change state
  const [curPass,setCurPass]       = useState("");
  const [newPass,setNewPass]       = useState("");
  const [confPass,setConfPass]     = useState("");
  const [passAlert,setPassAlert]   = useState<{type:"success"|"error";msg:string}|null>(null);

  // Delete account state
  const [showDeleteConfirm,setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText,setDeleteConfirmText] = useState("");

  const totalKm     = logs.reduce((s,l)=>s+l.distance,user.totalKm);
  const uniqueStates = new Set(logs.map(l=>l.state)).size + user.states;
  const badges = evaluateBadges(logs, 0, earnedBadgeIds);
  const earnedCount = badges.filter(b => b.earned).length;

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
    if(newPass.length<6){setPassAlert({type:"error",msg:"New password must be at least 6 characters."});return;}
    if(newPass!==confPass){setPassAlert({type:"error",msg:"New passwords do not match."});return;}
    try{await firebaseClient.auth.changePassword({oldPassword:curPass,newPassword:newPass});setCurPass("");setNewPass("");setConfPass("");setPassAlert({type:"success",msg:"Password changed successfully in Firebase Authentication."});}
    catch(error:any){setPassAlert({type:"error",msg:error?.message||"Unable to change password."});}
  }

  async function deleteAccount(){
    if(deleteConfirmText!=="DELETE")return;
    try{await firebaseClient.auth.deleteAccount();setUsers(users.filter(u=>u.id!==user.id));onLogout();}
    catch(error:any){setProfileAlert({type:"error",msg:error?.message||"Unable to delete account."});}
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
              <p className="text-sm" style={{color:"rgba(255,255,255,0.65)",fontFamily:F.body}}>@{user.username} · Member since {user.joinDate}</p>
              {uploadingPhoto && <p className="mt-1 text-xs font-bold" style={{color:"rgba(255,255,255,0.82)",fontFamily:F.body}}>Uploading profile picture...</p>}
            </div>
          </div>
          <div className="flex gap-8 mt-3 pb-4 pt-2">
            {[{val:`${totalKm.toFixed(0)} km`,label:"Distance"},{val:uniqueStates,label:"States"},{val:logs.length+user.checkins,label:"Check-ins"},{val:earnedCount,label:"Badges"}].map(({val,label})=>(
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
          {([["profile","Profile"],["suggestions","My Suggestions"],["announcements","Announcements"],["badges","Badges"],["security","Security"],["danger","Danger Zone"]] as [AccTab,string][]).map(([t,label])=>(
            <button key={t} onClick={()=>{ setActiveTab(t); if(t==="suggestions"||t==="announcements") refreshMine(); }} className="py-4 text-sm transition-all whitespace-nowrap" style={tabStyle(t)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8">

        {activeTab==="profile" && (
          <div className="space-y-4">
            {profileAlert && <AlertBanner type={profileAlert.type} message={profileAlert.msg}/>}

            <div className="bg-white rounded-[18px] p-6" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>Profile Information</h2>
                {!editing && (
                  <button onClick={()=>{setEditing(true);setProfileAlert(null);}} className="flex items-center gap-1.5 text-sm font-bold" style={{color:C.forest,fontFamily:F.body}}>
                    <Edit3 size={14}/> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>Full Name</label>
                    <div className="relative">
                      <UserCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                      <input value={dName} onChange={e=>setDName(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{color:C.textMuted}}>@</span>
                      <input value={dUsername} onChange={e=>setDUsername(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>Bio</label>
                    <textarea value={dBio} onChange={e=>setDBio(e.target.value)} rows={3} placeholder="Tell us about yourself…"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Pill variant="filled" small onClick={saveProfile}><Check size={13}/> Save changes</Pill>
                    <Pill variant="outline" small onClick={()=>{setEditing(false);setDName(user.displayName);setDUsername(user.username);setDBio(user.bio);setProfileAlert(null);}}>Cancel</Pill>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[{label:"Full Name",val:user.displayName,icon:<UserCircle size={14}/>},{label:"Username",val:`@${user.username}`,icon:<UserIcon size={14}/>},{label:"Email Address",val:user.email,icon:<Mail size={14}/>},{label:"Member Since",val:user.joinDate,icon:<Award size={14}/>}].map(({label,val,icon})=>(
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
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{color:C.textMuted,fontFamily:F.body}}>Bio</p>
                        <p className="text-sm" style={{color:C.textSub,fontFamily:F.body}}>{user.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {[
                {label:"My Bookmarks",icon:<Bookmark size={15}/>,action:()=>setPage("bookmarks")},
                {label:"Activity Log",icon:<Activity size={15}/>,action:()=>setPage("log")},
                {label:"Achievements",icon:<Award size={15}/>,action:()=>setActiveTab("badges")},
              ].map(({label,icon,action})=>(
                <button key={label} onClick={action} className="w-full bg-white rounded-[18px] px-5 py-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 2px 6px rgba(27,67,50,0.04)`}}>
                  <span style={{color:C.jungle}}>{icon}</span>
                  <span className="text-sm font-semibold flex-1 text-left" style={{fontFamily:F.body,color:C.text}}>{label}</span>
                  <ChevronRight size={14} style={{color:C.textMuted}}/>
                </button>
              ))}
              <button onClick={onLogout} className="w-full bg-white rounded-[18px] px-5 py-4 flex items-center gap-3 hover:bg-red-50 active:scale-[0.99] transition-all" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 2px 6px rgba(27,67,50,0.04)`}}>
                <LogOut size={15} style={{color:C.error}}/>
                <span className="text-sm font-semibold" style={{color:C.error,fontFamily:F.body}}>Sign out</span>
              </button>
            </div>
          </div>
        )}

        
        {activeTab==="suggestions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{fontFamily:F.body,color:C.text}}>My Suggestions</h2>
              <button type="button" onClick={refreshMine} className="text-xs font-bold" style={{color:C.forest,fontFamily:F.body}}>Refresh</button>
            </div>
            {mySubs.length===0 ? (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
                <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>You have not suggested any locations yet.</p>
                <button type="button" onClick={()=>setPage("suggest")} className="mt-3 text-sm font-bold" style={{color:C.jungle,fontFamily:F.body}}>Suggest a location →</button>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{fontFamily:F.body,color:C.text}}>Announcements</h2>
              {announcements.some(a=>!a.read) && (
                <button type="button" onClick={async()=>{await Promise.all(announcements.filter(a=>!a.read).map(a=>firebaseClient.entities.Announcement.update(a.id,{read:true})));await refreshMine();}} className="text-xs font-bold" style={{color:C.forest,fontFamily:F.body}}>Mark all read</button>
              )}
            </div>
            {announcements.length===0 ? (
              <div className="bg-white rounded-[18px] p-8 text-center" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08)`}}>
                <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>No announcements yet.</p>
              </div>
            ) : announcements.map(a=>(
              <button
                key={a.id}
                type="button"
                onClick={async()=>{await firebaseClient.entities.Announcement.update(a.id,{read:true});await refreshMine();}}
                className="w-full text-left bg-white rounded-[18px] p-4"
                style={{
                  boxShadow:`0 1px 3px rgba(27,67,50,0.08)`,
                  borderLeft: a.read ? "4px solid transparent" : `4px solid ${a.type==="rejected"?C.error:C.forest}`,
                }}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{a.title}</p>
                  {!a.read && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:C.amber,color:C.jungle,fontFamily:F.body}}>NEW</span>}
                </div>
                <p className="text-[12px] mt-1" style={{color:C.textSub,fontFamily:F.body}}>{a.message}</p>
                <p className="text-[10px] mt-2" style={{color:C.textMuted,fontFamily:F.body}}>{new Date(a.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}

{activeTab==="badges" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-normal mb-1" style={{fontFamily:F.display,color:C.text}}>Badge collection</h2>
              <p className="text-sm mb-2" style={{color:C.textMuted,fontFamily:F.body}}>
                {earnedCount} earned · {badges.length - earnedCount} locked
              </p>
            </div>
            {badges.map((b) => {
              const pct = Math.round((b.progress / b.requirement) * 100);
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
                        <p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{b.name}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: b.earned ? C.successBg : C.muted,
                            color: b.earned ? C.success : C.textMuted,
                            fontFamily:F.body,
                          }}
                        >
                          {b.earned ? "Earned" : "Locked"}
                        </span>
                      </div>
                      <p className="text-[12px] mt-0.5" style={{color:C.textSub,fontFamily:F.body}}>{b.desc}</p>
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
                <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>Change Password</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>Current Password</label>
                  <PasswordInput value={curPass} onChange={setCurPass} placeholder="Enter your current password"/>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>New Password</label>
                  <PasswordInput value={newPass} onChange={setNewPass} placeholder="Minimum 6 characters"/>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{color:C.textMuted,fontFamily:F.body}}>Confirm New Password</label>
                  <PasswordInput value={confPass} onChange={setConfPass} placeholder="Re-enter new password"/>
                </div>
                <div className="pt-1">
                  <Pill variant="filled" onClick={changePassword}><Lock size={14}/> Update Password</Pill>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[18px] p-5" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
              <h2 className="font-bold text-sm mb-3" style={{fontFamily:F.body,color:C.text}}>Login Sessions</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{fontFamily:F.body,color:C.text}}>Current session</p>
                  <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>SeekMY Web App · Malaysia · Just now</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{backgroundColor:C.successBg,color:C.success,fontFamily:F.body}}>Active</span>
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
                  <h2 className="font-bold text-base" style={{fontFamily:F.body,color:C.text}}>Delete Account</h2>
                  <p className="text-sm mt-1 leading-relaxed" style={{color:C.textSub,fontFamily:F.body}}>
                    This action is permanent and cannot be undone. All your profile data, activity logs, and bookmarks will be removed immediately.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button onClick={()=>setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-5 h-[50px] rounded-full text-sm font-bold text-white transition-all active:scale-[0.96]"
                  style={{backgroundColor:C.error,fontFamily:F.body}}>
                  <Trash2 size={14}/> Delete My Account
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
                      Cancel
                    </button>
                    <button onClick={deleteAccount} disabled={deleteConfirmText!=="DELETE"}
                      className="flex-1 h-[50px] rounded-full text-sm font-bold text-white transition-all active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{backgroundColor:C.error,fontFamily:F.body}}>
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
//==================== WilsonChoongWeiShan END - Account Module ====================
