import { useState } from "react";
import {
  Search, X, Trash2, LogOut, Users, MapPin, Shield, CheckCircle, AlertTriangle, Star,
} from "lucide-react";
import type { MockUser, Location } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill, AlertBanner } from "../components/Atoms";
import { diffStyle } from "../lib/helpers";
import { loadReviews, saveReviews, type StoredReview } from "../lib/reviewStore";
import {
  getApplications, saveApplications,
  getSubmissions, saveSubmissions,
  addAnnouncement,
  publishLocationFromSubmission,
  getPublishedLocations,
} from "../lib/contributorStore";

export function AdminPage({ users, setUsers, locations, onLogout }:{
  users:MockUser[]; setUsers:(u:MockUser[])=>void;
  locations:Location[]; onLogout:()=>void;
}) {
  type AdminTab = "dashboard"|"users"|"locations"|"pendingLocs"|"gems"|"reviews"|"contributors";
  const [tab,setTab] = useState<AdminTab>("dashboard");
  const [search,setSearch] = useState("");
  const [deleteConfirm,setDeleteConfirm] = useState<string|null>(null);
  const [toast,setToast] = useState<string|null>(null);

  function showToast(msg:string) { setToast(msg); setTimeout(()=>setToast(null),2500); }
  function removeUser(id:string) { setUsers(users.filter(u=>u.id!==id)); showToast("User removed successfully."); setDeleteConfirm(null); }

  const nonAdmins = users.filter(u=>u.role!=="admin");
  const filteredUsers = nonAdmins.filter(u=>
    !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredLocs = locations.filter(l=>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.state.toLowerCase().includes(search.toLowerCase()) || l.activity.toLowerCase().includes(search.toLowerCase())
  );

  const STATS = [
    {icon:"👥",label:"Total Users",val:nonAdmins.length,color:"#3b82f6"},
    {icon:"📍",label:"Locations",val:locations.length,color:C.jungle},
    {icon:"🗺️",label:"States Covered",val:16,color:C.forest},
    {icon:"⭐",label:"Avg Rating",val:"4.6",color:"#f59e0b"},
  ];

  const SIDEBAR: {id:AdminTab;icon:string;label:string}[] = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"users",icon:"👥",label:"User Management"},
    {id:"locations",icon:"📍",label:"Location Management"},
    {id:"pendingLocs",icon:"⏳",label:"Pending Locations"},
    {id:"gems",icon:"💎",label:"Hidden Gems"},
    {id:"reviews",icon:"⭐",label:"Review Moderation"},
    {id:"contributors",icon:"🤝",label:"Contributors"},
  ];

  type AdminReview = {
    id: string | number;
    user: string;
    location: string;
    rating: number;
    text: string;
    date: string;
    status: "approved" | "pending" | "flagged" | "rejected";
  };

  const MOCK_REVIEWS: AdminReview[] = [
    {id:1,user:"Ahmad R.",location:"Kinabalu Summit Trail",rating:5,text:"Life-changing experience. Worth every step.",date:"Jul 2026",status:"approved"},
    {id:2,user:"Priya M.",location:"Sipadan Dive Site",rating:5,text:"Best dive site I've ever visited. Book 6 months ahead!",date:"Jul 2026",status:"approved"},
    {id:3,user:"Unknown",location:"Broga Hill Trail",rating:1,text:"SPAM SPAM SPAM click here for free prizes!!!",date:"Jul 2026",status:"flagged"},
    {id:4,user:"Wilson C.",location:"Batu Caves Rock Face",rating:4,text:"Great sport climbing. Some routes need re-bolting.",date:"Jun 2026",status:"pending"},
  ];
  const [reviews,setReviews] = useState<AdminReview[]>(() => {
    const stored = loadReviews().filter((r) => r.status === "flagged" || r.status === "pending");
    if (stored.length) {
      return stored.map((r) => ({
        id: r.id,
        user: r.userName,
        location: r.locationName,
        rating: r.rating,
        text: r.comment,
        date: r.date,
        status: r.status,
      }));
    }
    return MOCK_REVIEWS;
  });

  const [apps, setApps] = useState(() => getApplications());
  const [subs, setSubs] = useState(() => getSubmissions());
  const [gemIds, setGemIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("seekmy_gem_ids") || "[10,47,41]"); } catch { return [10,47,41]; }
  });
  const [suspendId, setSuspendId] = useState<string|null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const MOCK_CONTRIBUTORS = [
    {id:"c1",name:"Kinabalu Guides Sdn Bhd",services:"Guided hiking & summit packages",area:"Sabah",status:"verified",docs:"Submitted"},
    {id:"c2",name:"Sipadan Dive Academy",services:"PADI dive courses & guided dives",area:"Sabah",status:"verified",docs:"Submitted"},
    {id:"c3",name:"Langkawi Water Sports Hub",services:"Jet ski, parasailing, water sports",area:"Kedah",status:"pending",docs:"Under review"},
    {id:"c4",name:"Endau Trek Adventures",services:"Jungle trekking & camping",area:"Pahang",status:"pending",docs:"Incomplete"},
  ];

  return (
    <div className="pt-14 min-h-screen flex" style={{backgroundColor:"#f8fafc"}}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-sm font-bold text-white flex items-center gap-2"
          style={{backgroundColor:C.jungle,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",fontFamily:F.body}}>
          <CheckCircle size={14}/> {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 min-h-screen bg-white border-r hidden md:flex flex-col" style={{borderColor:C.border}}>
        <div className="p-5 border-b" style={{borderColor:C.border}}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:C.jungle}}>
              <Shield size={16} className="text-white"/>
            </div>
            <div>
              <p className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>Admin Panel</p>
              <p className="text-[10px]" style={{color:C.textMuted,fontFamily:F.body}}>SeekMY Platform</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SIDEBAR.map(s=>(
            <button key={s.id} onClick={()=>setTab(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
              style={{backgroundColor:tab===s.id?C.muted:"transparent",color:tab===s.id?C.jungle:C.textSub,fontFamily:F.body}}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t" style={{borderColor:C.border}}>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{color:C.error,fontFamily:F.body}}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile tab strip */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex overflow-x-auto" style={{borderColor:C.border,scrollbarWidth:"none",boxShadow:"0 -2px 12px rgba(27,67,50,0.08)"}}>
        {SIDEBAR.map(s=>(
          <button key={s.id} onClick={()=>setTab(s.id)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2 text-[9px] font-bold"
            style={{color:tab===s.id?C.jungle:C.textMuted,borderBottom:tab===s.id?`2px solid ${C.amber}`:"2px solid transparent",fontFamily:F.body}}>
            <span className="text-base">{s.icon}</span>{s.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-5 md:p-8 pb-24 md:pb-8">
        {/* Search bar */}
        {tab!=="dashboard" && (
          <div className="flex items-center gap-2.5 bg-white rounded-full px-4 mb-6 border" style={{borderColor:C.border,height:44,boxShadow:`0 1px 4px rgba(27,67,50,0.06)`}}>
            <Search size={14} style={{color:C.textMuted}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}…`}
              className="flex-1 outline-none text-sm bg-transparent" style={{fontFamily:F.body,color:C.text}}/>
            {search && <button onClick={()=>setSearch("")}><X size={13} style={{color:C.textMuted}}/></button>}
          </div>
        )}

        {/* ── Dashboard ── */}
        {tab==="dashboard" && (
          <div>
            <h1 className="text-3xl font-normal mb-1" style={{fontFamily:F.display,color:C.jungle}}>Platform Overview</h1>
            <p className="text-sm mb-8" style={{color:C.textMuted,fontFamily:F.body}}>Last updated: {new Date().toLocaleDateString("en-MY",{day:"numeric",month:"long",year:"numeric"})}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {STATS.map(s=>(
                <div key={s.label} className="bg-white rounded-[18px] p-5" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
                  <span className="text-2xl mb-3 block">{s.icon}</span>
                  <p className="text-2xl font-bold mb-0.5" style={{color:s.color,fontFamily:F.display}}>{s.val}</p>
                  <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Flagged reviews */}
              <div className="bg-white rounded-[18px] p-5" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>Flagged Reviews</p>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor:C.error}}>
                    {reviews.filter(r=>r.status==="flagged").length}
                  </span>
                </div>
                {reviews.filter(r=>r.status==="flagged").map(r=>(
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl mb-2" style={{backgroundColor:"#fde8e6"}}>
                    <AlertTriangle size={14} style={{color:C.error,flexShrink:0,marginTop:2}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{color:C.text,fontFamily:F.body}}>{r.location}</p>
                      <p className="text-[11px] truncate" style={{color:C.textMuted,fontFamily:F.body}}>by {r.user} · "{r.text.slice(0,40)}…"</p>
                    </div>
                    <button onClick={()=>{
                      setReviews(reviews.filter(rv=>rv.id!==r.id));
                      saveReviews(loadReviews().filter(x=>String(x.id)!==String(r.id)));
                      showToast("Review removed successfully.");
                    }} className="text-[11px] font-bold px-2 py-1 rounded-lg"
                      style={{backgroundColor:C.error,color:"#fff",fontFamily:F.body}}>Remove</button>
                  </div>
                ))}
                {reviews.filter(r=>r.status==="flagged").length===0 && (
                  <p className="text-sm text-center py-4" style={{color:C.textMuted,fontFamily:F.body}}>No flagged reviews</p>
                )}
              </div>

              {/* Pending contributors */}
              <div className="bg-white rounded-[18px] p-5" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>Pending Contributors</p>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{backgroundColor:"#f59e0b"}}>
                    {MOCK_CONTRIBUTORS.filter(c=>c.status==="pending").length}
                  </span>
                </div>
                {MOCK_CONTRIBUTORS.filter(c=>c.status==="pending").map(c=>(
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl mb-2" style={{backgroundColor:"#fffbef"}}>
                    <Users size={14} style={{color:"#92400e",flexShrink:0,marginTop:2}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{color:C.text,fontFamily:F.body}}>{c.name}</p>
                      <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{c.area} · {c.docs}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:"#fef3c7",color:"#92400e",fontFamily:F.body}}>Pending</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── User Management ── */}
        {tab==="users" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.jungle}}>User Management</h1>
                <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>{nonAdmins.length} registered user{nonAdmins.length!==1?"s":""}</p>
              </div>
            </div>
            <div className="bg-white rounded-[18px] overflow-hidden" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
              {filteredUsers.length===0 ? (
                <div className="text-center py-12"><p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>No users found.</p></div>
              ) : filteredUsers.map((u,i)=>(
                <div key={u.id} className="flex items-center gap-4 px-5 py-4" style={{borderBottom:i<filteredUsers.length-1?`1px solid ${C.border}`:"none"}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{backgroundColor:C.forest}}>
                    {u.displayName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{color:C.text,fontFamily:F.body}}>{u.displayName}</p>
                    <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>@{u.username} · {u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>
                    <span>{u.totalKm} km</span>
                    <span>{u.checkins} check-ins</span>
                    <span>Joined {new Date(u.joinDate).getFullYear()}</span>
                  </div>
                  {deleteConfirm===u.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={()=>removeUser(u.id)} className="text-[11px] font-bold px-3 py-1 rounded-lg text-white"
                        style={{backgroundColor:C.error,fontFamily:F.body}}>Confirm</button>
                      <button onClick={()=>setDeleteConfirm(null)} className="text-[11px] font-bold px-3 py-1 rounded-lg"
                        style={{backgroundColor:C.muted,color:C.textSub,fontFamily:F.body}}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={()=>setDeleteConfirm(u.id)} className="flex-shrink-0 p-2 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 size={14} style={{color:C.error}}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Location Management ── */}
        {tab==="locations" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.jungle}}>Location Management</h1>
              <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>{locations.length} outdoor locations</p>
            </div>
            <div className="bg-white rounded-[18px] overflow-hidden" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
              {filteredLocs.map((loc,i)=>{
                const d = diffStyle(loc.difficulty);
                return (
                  <div key={loc.id} className="flex items-center gap-4 px-5 py-4" style={{borderBottom:i<filteredLocs.length-1?`1px solid ${C.border}`:"none"}}>
                    <span className="text-xl flex-shrink-0">{loc.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{color:C.text,fontFamily:F.body}}>{loc.name}</p>
                      <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.state} · {loc.activity}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor:d.bg,color:d.color,fontFamily:F.body}}>{loc.difficulty}</span>
                      <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{color:C.amber,fontFamily:F.body}}>
                        <Star size={10} fill={C.amber}/>{loc.rating}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full font-bold flex-shrink-0"
                      style={{backgroundColor:C.muted,color:C.textSub,fontFamily:F.body}}>Active</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Review Moderation ── */}
        {tab==="reviews" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.jungle}}>Review Moderation</h1>
              <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>{reviews.filter(r=>r.status==="flagged").length} flagged · {reviews.filter(r=>r.status==="pending").length} pending</p>
            </div>
            <div className="space-y-3">
              {reviews.map(r=>(
                <div key={r.id} className="bg-white rounded-[18px] p-5 flex items-start gap-4" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{backgroundColor:C.forest}}>
                    {r.user.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>{r.user}</p>
                      <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>on <strong>{r.location}</strong></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{
                        backgroundColor:r.status==="flagged"?"#fde8e6":r.status==="pending"?"#fffbef":C.successBg,
                        color:r.status==="flagged"?C.error:r.status==="pending"?"#92400e":C.success,
                        fontFamily:F.body
                      }}>{r.status.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-0.5 mb-1">{[1,2,3,4,5].map(s=><Star key={s} size={10} fill={s<=r.rating?C.amber:"none"} stroke={s<=r.rating?C.amber:C.border}/>)}</div>
                    <p className="text-sm leading-relaxed" style={{color:C.textSub,fontFamily:F.body}}>{r.text}</p>
                    <p className="text-[10px] mt-1" style={{color:C.textMuted,fontFamily:F.body}}>{r.date}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {r.status!=="approved" && (
                      <button onClick={()=>{
                      setReviews(reviews.map(rv=>rv.id===r.id?{...rv,status:"approved"}:rv));
                      const all=loadReviews();
                      saveReviews(all.map(x=>String(x.id)===String(r.id)?{...x,status:"approved"}:x));
                      showToast("Review approved.");
                    }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white"
                        style={{backgroundColor:C.forest,fontFamily:F.body}}>Approve</button>
                    )}
                    <button onClick={()=>{
                      setReviews(reviews.filter(rv=>rv.id!==r.id));
                      saveReviews(loadReviews().filter(x=>String(x.id)!==String(r.id)));
                      showToast("Review removed successfully.");
                    }}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl"
                      style={{backgroundColor:"#fde8e6",color:C.error,fontFamily:F.body}}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contributors ── */}
        
        {tab==="pendingLocs" && (
          <div>
            <h1 className="text-2xl font-normal mb-2" style={{fontFamily:F.display,color:C.jungle}}>Approve New Locations</h1>
            <p className="text-sm mb-5" style={{color:C.textMuted,fontFamily:F.body}}>{subs.filter(s=>s.status==="pending").length} pending suggestions</p>
            {subs.length===0 && <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>No location suggestions yet.</p>}
            <div className="space-y-3">
              {subs.map(s=>(
                <div key={s.id} className="bg-white rounded-[18px] p-5 border" style={{borderColor:C.border}}>
                  <div className="flex justify-between gap-2">
                    {s.photoData && (
                      <img src={s.photoData} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{color:C.text,fontFamily:F.body}}>{s.name}</p>
                      <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{s.state} · {s.activity} · by {s.contributorName}</p>
                      <p className="text-[12px] mt-2" style={{color:C.textSub,fontFamily:F.body}}>{s.description}</p>
                      <p className="text-[11px] mt-1" style={{color:C.textMuted,fontFamily:F.body}}>GPS: {s.lat}, {s.lng}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full h-fit capitalize" style={{
                      backgroundColor:s.status==="approved"?C.successBg:s.status==="rejected"?C.errorBg:"#fef3c7",
                      color:s.status==="approved"?C.success:s.status==="rejected"?C.error:"#92400e",
                      fontFamily:F.body
                    }}>{s.status}</span>
                  </div>
                  {s.status==="pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={()=>{
                        const maxId = Math.max(
                          0,
                          ...locations.map(l=>l.id),
                          ...getPublishedLocations().map((l:any)=>l.id||0)
                        );
                        const nextId = maxId + 1;
                        const published = publishLocationFromSubmission(s, nextId);
                        const next=subs.map(x=>x.id===s.id?{...x,status:"approved" as const, publishedLocationId: nextId, updatedAt: new Date().toISOString()}:x);
                        setSubs(next); saveSubmissions(next);
                        addAnnouncement({
                          userId: s.contributorId,
                          title: "Location approved",
                          message: `Your suggestion "${s.name}" was approved and is now live on Discover.`,
                          type: "approved",
                          submissionId: s.id,
                        });
                        showToast("Location approved and published to Discover.");
                        // notify parent to refresh locations if available
                        (window as any).__seekmyRefreshLocations?.(published);
                      }} className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{backgroundColor:C.forest,fontFamily:F.body}}>Approve</button>
                      <button onClick={()=>{
                        const reason=prompt("Rejection reason:")||"Does not meet guidelines";
                        const next=subs.map(x=>x.id===s.id?{...x,status:"rejected" as const,rejectReason:reason,updatedAt:new Date().toISOString()}:x);
                        setSubs(next); saveSubmissions(next);
                        addAnnouncement({
                          userId: s.contributorId,
                          title: "Location not approved",
                          message: `Your suggestion "${s.name}" was not approved. Reason: ${reason}`,
                          type: "rejected",
                          submissionId: s.id,
                        });
                        showToast("Location rejected. User notified.");
                      }} className="px-4 py-2 rounded-full text-xs font-bold" style={{backgroundColor:C.errorBg,color:C.error,fontFamily:F.body}}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="gems" && (
          <div>
            <h1 className="text-2xl font-normal mb-2" style={{fontFamily:F.display,color:C.jungle}}>Manage Hidden Gem Spotlight</h1>
            <p className="text-sm mb-5" style={{color:C.textMuted,fontFamily:F.body}}>Select up to 3 locations to feature on Home.</p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {locations.map(l=>(
                <label key={l.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border cursor-pointer" style={{borderColor:C.border}}>
                  <input type="checkbox" checked={gemIds.includes(l.id)} onChange={()=>{
                    let next = gemIds.includes(l.id) ? gemIds.filter(id=>id!==l.id) : [...gemIds, l.id].slice(-3);
                    setGemIds(next);
                    localStorage.setItem("seekmy_gem_ids", JSON.stringify(next));
                    showToast("Hidden Gem Spotlight updated successfully.");
                  }}/>
                  <span className="text-sm font-semibold" style={{fontFamily:F.body,color:C.text}}>{l.emoji} {l.name}</span>
                  <span className="text-[11px] ml-auto" style={{color:C.textMuted,fontFamily:F.body}}>{l.state}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {tab==="contributors" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.jungle}}>Contributor Verification</h1>
              <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>{MOCK_CONTRIBUTORS.filter(c=>c.status==="pending").length} pending verification</p>
            </div>
            <div className="space-y-3">
              {MOCK_CONTRIBUTORS.map(c=>(
                <div key={c.id} className="bg-white rounded-[18px] p-5 flex items-start gap-4" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:c.status==="verified"?C.successBg:"#fffbef"}}>
                    <Users size={17} style={{color:c.status==="verified"?C.success:"#92400e"}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-0.5" style={{color:C.text,fontFamily:F.body}}>{c.name}</p>
                    <p className="text-[12px] mb-1" style={{color:C.textSub,fontFamily:F.body}}>{c.services}</p>
                    <div className="flex items-center gap-3 text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>
                      <span><MapPin size={10} className="inline mr-0.5"/>{c.area}</span>
                      <span>Docs: {c.docs}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
                      backgroundColor:c.status==="verified"?C.successBg:"#fffbef",
                      color:c.status==="verified"?C.success:"#92400e",
                      fontFamily:F.body
                    }}>{c.status==="verified"?"✓ Verified":"Pending"}</span>
                    {c.status==="pending" && (
                      <button className="text-[11px] font-bold px-3 py-1 rounded-xl text-white"
                        style={{backgroundColor:C.jungle,fontFamily:F.body}}>Verify</button>
                    )}
                  </div>
                </div>
              ))}

              {apps.map(c=>(
                <div key={c.id} className="bg-white rounded-[18px] p-5 border mb-3" style={{borderColor:C.border}}>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{color:C.text,fontFamily:F.body}}>{c.fullName}</p>
                      <p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{c.area} · {c.services} · {c.userEmail}</p>
                      <p className="text-[11px] mt-1" style={{color:C.textSub,fontFamily:F.body}}>Doc: {c.docName || "No documents submitted."}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full h-fit" style={{
                      backgroundColor:c.status==="verified"?C.successBg:c.status==="rejected"?C.errorBg:"#fef3c7",
                      color:c.status==="verified"?C.success:c.status==="rejected"?C.error:"#92400e",
                      fontFamily:F.body
                    }}>{c.status}</span>
                  </div>
                  {c.status==="pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={()=>{
                        const next=apps.map(a=>a.id===c.id?{...a,status:"verified" as const}:a);
                        setApps(next); saveApplications(next); showToast("Contributor verified successfully.");
                      }} className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{backgroundColor:C.forest,fontFamily:F.body}}>Approve</button>
                      <button onClick={()=>{
                        const reason=prompt("Rejection reason:")||"Incomplete documentation";
                        const next=apps.map(a=>a.id===c.id?{...a,status:"rejected" as const,rejectReason:reason}:a);
                        setApps(next); saveApplications(next); showToast("Application rejected.");
                      }} className="px-4 py-2 rounded-full text-xs font-bold" style={{backgroundColor:C.errorBg,color:C.error,fontFamily:F.body}}>Reject</button>
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

