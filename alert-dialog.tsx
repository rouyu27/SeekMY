import { Star, Bookmark, BookmarkCheck, MapPin } from "lucide-react";
import type { Location } from "../lib/types";
import { C, F } from "../lib/tokens";
import { diffStyle } from "../lib/helpers";

export function LocationCard({ loc, onView, bookmarked, onBookmark }:{
  loc:Location; onView:()=>void; bookmarked:boolean; onBookmark:()=>void;
}) {
  const d = diffStyle(loc.difficulty);
  return (
    <div onClick={onView} className="bg-white rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{boxShadow:`0 1px 3px rgba(27,67,50,0.12), 0 4px 12px rgba(27,67,50,0.06)`}}>
      <div className="h-36 relative flex items-end p-4" style={{backgroundColor:loc.color}}>
        <span className="text-5xl absolute top-3 right-12 opacity-15 select-none">{loc.emoji}</span>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{backgroundColor:"rgba(255,255,255,0.18)",color:"#fff",border:"1px solid rgba(255,255,255,0.35)",fontFamily:F.body}}>{loc.badge}</span>
        <button onClick={e=>{e.stopPropagation();onBookmark();}} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{backgroundColor:bookmarked?C.amber:"rgba(0,0,0,0.28)"}}>
          {bookmarked ? <BookmarkCheck size={13} style={{color:C.jungle}}/> : <Bookmark size={13} className="text-white"/>}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug mb-1" style={{color:C.text,fontFamily:F.body}}>{loc.name}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={10} style={{color:C.textMuted}}/>
          <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.state}</span>
          <span className="text-xs" style={{color:C.border}}>·</span>
          <span className="text-[11px] font-semibold" style={{color:C.forest,fontFamily:F.body}}>{loc.activity}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:d.bg,color:d.color,fontFamily:F.body}}>{loc.difficulty}</span>
          {loc.distance!=="N/A" && <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.distance}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={11} fill={C.amber} stroke={C.amber}/>
            <span className="text-[11px] font-bold" style={{color:C.text,fontFamily:F.body}}>{loc.rating}</span>
            <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>({loc.reviews})</span>
          </div>
          <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.temp}°C</span>
        </div>
      </div>
    </div>
  );
}

