//==================== FongXinTong Part - Personal Stats Dashboard ====================
import { Activity, BarChart3, Bookmark, MapPin, Route, Trophy } from "lucide-react";
import { C, F } from "../lib/tokens";
import type { ActivityLog, Location, AppUser } from "../lib/types";
import type { BookmarkEntry } from "../lib/types";
import { Pill } from "../components/Atoms";

export function InsightsPage({
  user,
  locations,
  logs,
  bookmarks,
  onSignIn,
}: {
  user: AppUser | null;
  locations: Location[];
  logs: ActivityLog[];
  bookmarks: BookmarkEntry[];
  onSignIn: () => void;
}) {
  if (!user) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: C.cream }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: C.muted }}>
            <BarChart3 size={30} style={{ color: C.jungle }} />
          </div>
          <h1 className="text-2xl font-normal mb-2" style={{ fontFamily: F.display, color: C.text }}>Outdoor Insights</h1>
          <p className="text-sm mb-5" style={{ color: C.textMuted, fontFamily: F.body }}>
            Sign in to view your personal activity and exploration insights.
          </p>
          <Pill variant="filled" onClick={onSignIn}>Sign In</Pill>
        </div>
      </div>
    );
  }

  const totalKm = logs.reduce((sum, log) => sum + Number(log.distance || 0), 0);
  const states = new Set(logs.map(l => l.state).filter(Boolean)).size;
  const activities = Object.entries(logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.activity] = (acc[l.activity] || 0) + 1;
    return acc;
  }, {})).sort((a,b)=>b[1]-a[1]);
  const stateCounts = Object.entries(logs.reduce<Record<string, number>>((acc, l) => {
    if (l.state) acc[l.state] = (acc[l.state] || 0) + 1;
    return acc;
  }, {})).sort((a,b)=>b[1]-a[1]);
  const maxActivity = Math.max(1, ...activities.map(([,v])=>v));
  const maxState = Math.max(1, ...stateCounts.map(([,v])=>v));
  const savedLocations = bookmarks.map(b => locations.find(l=>String(l.id)===String(b.locationId))).filter(Boolean) as Location[];

  const stats = [
    { icon:<Route size={18}/>, label:"Distance logged", value:`${totalKm.toFixed(1)} km` },
    { icon:<Activity size={18}/>, label:"Activities", value:String(logs.length) },
    { icon:<MapPin size={18}/>, label:"States explored", value:String(states) },
    { icon:<Bookmark size={18}/>, label:"Saved places", value:String(bookmarks.length) },
  ];

  return <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}>
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-2"><BarChart3 size={25} style={{color:C.jungle}}/><h1 className="text-3xl font-normal" style={{color:C.jungle,fontFamily:F.display}}>Outdoor Insights</h1></div>
      <p className="text-sm mb-7" style={{color:C.textMuted,fontFamily:F.body}}>A simple view of your SeekMY activity, saved places and exploration progress.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">{stats.map(s=><div key={s.label} className="bg-white rounded-[18px] p-4" style={{border:`1px solid ${C.border}`}}><div className="mb-3" style={{color:C.jungle}}>{s.icon}</div><div className="text-2xl font-bold" style={{color:C.text,fontFamily:F.display}}>{s.value}</div><div className="text-[11px] mt-1" style={{color:C.textMuted,fontFamily:F.body}}>{s.label}</div></div>)}</div>
      <div className="grid md:grid-cols-2 gap-5">
        <section className="bg-white rounded-[20px] p-5" style={{border:`1px solid ${C.border}`}}><h2 className="text-xl mb-4" style={{color:C.text,fontFamily:F.display}}>Activity mix</h2>{activities.length ? <div className="space-y-4">{activities.map(([name,count])=><div key={name}><div className="flex justify-between text-xs font-bold mb-1" style={{fontFamily:F.body,color:C.textSub}}><span>{name}</span><span>{count}</span></div><div className="h-2 rounded-full" style={{backgroundColor:C.muted}}><div className="h-2 rounded-full" style={{backgroundColor:C.jungle,width:`${(count/maxActivity)*100}%`}}/></div></div>)}</div>:<p className="text-sm" style={{color:C.textMuted}}>Log an activity to see your activity mix.</p>}</section>
        <section className="bg-white rounded-[20px] p-5" style={{border:`1px solid ${C.border}`}}><h2 className="text-xl mb-4" style={{color:C.text,fontFamily:F.display}}>States visited</h2>{stateCounts.length ? <div className="space-y-4">{stateCounts.map(([name,count])=><div key={name}><div className="flex justify-between text-xs font-bold mb-1" style={{fontFamily:F.body,color:C.textSub}}><span>{name}</span><span>{count} activities</span></div><div className="h-2 rounded-full" style={{backgroundColor:C.muted}}><div className="h-2 rounded-full" style={{backgroundColor:C.forest,width:`${(count/maxState)*100}%`}}/></div></div>)}</div>:<p className="text-sm" style={{color:C.textMuted}}>Your explored states will appear here.</p>}</section>
      </div>
      <section className="bg-white rounded-[20px] p-5 mt-5" style={{border:`1px solid ${C.border}`}}><div className="flex items-center gap-2 mb-4"><Trophy size={18} style={{color:C.amber}}/><h2 className="text-xl" style={{color:C.text,fontFamily:F.display}}>Saved-location snapshot</h2></div>{savedLocations.length?<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{savedLocations.slice(0,6).map(l=><div key={l.id} className="rounded-2xl p-4" style={{backgroundColor:C.cream}}><div className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>{l.name}</div><div className="text-[11px] mt-1" style={{color:C.textMuted}}>{l.state} · {l.activity} · {l.difficulty}</div></div>)}</div>:<p className="text-sm" style={{color:C.textMuted}}>Bookmark locations to build your personal exploration shortlist.</p>}</section>
    </div>
  </div>;
}
//==================== FongXinTong END - Personal Stats Dashboard ====================
