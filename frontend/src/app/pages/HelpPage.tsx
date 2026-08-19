import { useState } from "react";
import { ChevronDown, CircleHelp, CloudSun, MessageCircle, ShieldCheck } from "lucide-react";
import { C, F } from "../lib/tokens";
import type { Page } from "../lib/types";

const FAQS = [
  ["How do I find outdoor activities?", "Use Explore, Map, or choose a Malaysian state from Home. Filters help narrow results by activity, difficulty, budget and accessibility."],
  ["How do I log an activity?", "Open Activity Log, add the location, activity type, distance, duration and notes. Your progress is reflected in Insights and badges."],
  ["How do bookmarks work?", "Save any location from its card or detail page. Saved locations stay in the Saved page and can be organised with notes and folders."],
  ["Is the weather data live?", "Yes. SeekMY loads current conditions and forecasts through a secure Supabase Edge Function, using each location's coordinates when available."],
  ["What does the AI Guide do?", "The AI Guide provides Malaysia-specific recommendations, gear checklists and safety guidance through the app interface."],
  ["What can contributors do?", "Users can submit a local contributor profile and suggest outdoor locations. Administrators can review contributor and location submissions."],
];
export function HelpPage({setPage}:{setPage:(p:Page)=>void}) {
  const [open,setOpen]=useState(0);
  return <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}><div className="max-w-3xl mx-auto px-5 py-8">
    <div className="rounded-[24px] p-6 md:p-8 mb-6 text-white" style={{background:`linear-gradient(135deg, ${C.jungle}, ${C.forest})`}}><div className="flex items-center gap-3"><CircleHelp size={30}/><div><h1 className="text-3xl font-normal" style={{fontFamily:F.display}}>Help & FAQ</h1><p className="text-sm opacity-75 mt-1" style={{fontFamily:F.body}}>SeekMY · Malaysia Outdoor Discovery</p></div></div></div>
    <div className="grid sm:grid-cols-3 gap-3 mb-6">{[
      {icon:<CloudSun size={18}/>,title:"Weather",text:"Live OpenWeather API with fallback",page:"explore" as Page},
      {icon:<MessageCircle size={18}/>,title:"AI Guide",text:"Safety, gear and location help",page:"ai" as Page},
      {icon:<ShieldCheck size={18}/>,title:"Contributors",text:"Community location submissions",page:"contributor" as Page},
    ].map(c=><button key={c.title} onClick={()=>setPage(c.page)} className="bg-white rounded-[18px] p-4 text-left" style={{border:`1px solid ${C.border}`}}><span style={{color:C.jungle}}>{c.icon}</span><div className="text-sm font-bold mt-2" style={{color:C.text,fontFamily:F.body}}>{c.title}</div><div className="text-[11px] mt-1" style={{color:C.textMuted}}>{c.text}</div></button>)}</div>
    <div className="space-y-3">{FAQS.map(([q,a],i)=><div key={q} className="bg-white rounded-[18px] overflow-hidden" style={{border:`1px solid ${C.border}`}}><button onClick={()=>setOpen(open===i?-1:i)} className="w-full p-4 flex items-center justify-between gap-4 text-left"><span className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>{q}</span><ChevronDown size={16} style={{color:C.textMuted,transform:open===i?"rotate(180deg)":"none",transition:"transform .2s"}}/></button>{open===i&&<p className="px-4 pb-4 text-sm leading-6" style={{color:C.textSub,fontFamily:F.body}}>{a}</p>}</div>)}</div>
  </div></div>;
}
