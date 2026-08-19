//==================== FongXinTong Part - Community Leaderboard & Ranking Module ====================
import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { C, F } from "../lib/tokens";
import { firebaseClient } from "../api/firebaseClient";

export function LeaderboardPage() {
  const [period,setPeriod] = useState<"weekly"|"monthly">("weekly");
  const [sortBy,setSortBy] = useState<"km"|"checkins"|"states">("km");
  const [entries,setEntries] = useState<any[]>([]);
  const [badges,setBadges] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(()=>{
    setLoading(true);
    setError("");
    firebaseClient.backend.getLeaderboard(period)
      .then((result)=>{setEntries(result.entries);setBadges(result.badges||[]);})
      .catch((err:any)=>{setEntries([]);setBadges([]);setError(err?.message||"Unable to load leaderboard from Supabase.");})
      .finally(()=>setLoading(false));
  },[period]);

  const sorted = useMemo(()=>entries
    .sort((a,b)=>b[sortBy]-a[sortBy])
    .map((u,i)=>({...u,rank:i+1,medal:i===0?"🥇":i===1?"🥈":i===2?"🥉":""})),[entries,sortBy]);

  return (
    <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-6"><Trophy size={24} style={{color:C.amber}}/><h1 className="text-3xl font-normal" style={{color:C.jungle,fontFamily:F.display}}>Leaderboard</h1></div>
        <div className="flex rounded-full overflow-hidden mb-5 w-fit p-0.5" style={{backgroundColor:C.muted}}>
          {(["weekly","monthly"] as const).map(p=><button key={p} onClick={()=>setPeriod(p)} className="px-5 h-9 text-sm font-bold capitalize transition-all rounded-full" style={{backgroundColor:period===p?C.jungle:"transparent",color:period===p?"#fff":C.textMuted,fontFamily:F.body}}>{p}</button>)}
        </div>
        <div className="flex gap-2 mb-5">
          {[{key:"km" as const,label:"Distance"},{key:"checkins" as const,label:"Check-ins"},{key:"states" as const,label:"States"}].map(({key,label})=>(
            <button key={key} onClick={()=>setSortBy(key)} className="px-3 h-8 rounded-full text-[12px] font-bold" style={{backgroundColor:sortBy===key?C.jungle:"#fff",color:sortBy===key?"#fff":C.textSub,border:sortBy===key?"none":`1px solid ${C.border}`,fontFamily:F.body}}>{label}</button>
          ))}
        </div>
        <div className="bg-white rounded-[18px] overflow-hidden mb-8" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.10), 0 4px 12px rgba(27,67,50,0.06)`}}>
          {error && <p className="text-sm text-center py-10 px-5 font-semibold" style={{color:C.error,fontFamily:F.body}}>{error}</p>}
          {!error && sorted.length===0 && <p className="text-sm text-center py-10" style={{color:C.textMuted,fontFamily:F.body}}>{loading?"Loading leaderboard…":`No activity logged in this ${period==="weekly"?"week":"month"} yet.`}</p>}
          {sorted.map((u,i)=>(
            <div key={`${u.name}-${i}`} className="flex items-center gap-4 px-5 py-4" style={{borderBottom:i<sorted.length-1?`1px solid ${C.border}`:"none",backgroundColor:i===0?"#fffbef":"transparent"}}>
              <span className="text-xl w-7 text-center">{u.medal||<span className="text-sm font-bold" style={{color:C.textMuted}}>{u.rank}</span>}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{backgroundColor:i===0?C.amber:i===1?"#9ca3af":i===2?"#a16207":C.muted,color:i<3?C.jungle:C.forest}}>{u.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}</div>
              <div className="flex-1"><p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{u.name}</p><p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{u.states} states · {u.checkins} check-ins</p></div>
              <p className="text-sm font-bold" style={{color:C.jungle,fontFamily:F.body}}>{u[sortBy]}{sortBy==="km"?" km":""}</p>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-normal mb-5" style={{color:C.jungle,fontFamily:F.display}}>Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.length===0 && <p className="col-span-2 text-sm text-center py-8" style={{color:C.textMuted,fontFamily:F.body}}>No Firebase badge data yet.</p>}
          {badges.map((b:any)=>(
            <div key={b.id} className="bg-white rounded-[18px] p-4 flex gap-3 items-start" style={{boxShadow:`0 1px 3px rgba(27,67,50,0.08), 0 4px 12px rgba(27,67,50,0.05)`}}>
              <span className="text-2xl">{b.icon||"🏅"}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold" style={{fontFamily:F.body,color:C.text}}>{b.name||"Badge"}</p><p className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{b.desc||b.description||"Achievement"}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
//==================== FongXinTong END - Community Leaderboard & Ranking Module ====================
