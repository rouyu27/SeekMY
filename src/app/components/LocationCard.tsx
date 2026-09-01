// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import { useState } from "react";
import { Star, Bookmark, BookmarkCheck, MapPin } from "lucide-react";
import type { Location } from "../lib/types";
import { C, F } from "../lib/tokens";
import { diffStyle } from "../lib/helpers";
import type { Language } from "../lib/i18n";
import { activityLabel, t } from "../lib/i18n";

export function LocationCard({ loc, onView, bookmarked, onBookmark, language = "en" }:{
  loc:Location; onView:()=>void; bookmarked:boolean; onBookmark:()=>void; language?:Language;
}) {
  const d = diffStyle(loc.difficulty);
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(loc.image_url && !imageFailed);
  return (
    <div onClick={onView} className="bg-white rounded-[18px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{boxShadow:`0 1px 3px rgba(27,67,50,0.12), 0 4px 12px rgba(27,67,50,0.06)`}}>
      <div className="h-36 relative flex items-end overflow-hidden p-4" style={{backgroundColor:loc.color}}>
        {showPhoto ? (
          <>
            <img src={loc.image_url} alt={loc.name} className="absolute inset-0 h-full w-full object-cover" onError={() => setImageFailed(true)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/12 to-black/8" />
          </>
        ) : (
          <span className="text-5xl absolute top-3 right-12 opacity-15 select-none">{loc.emoji}</span>
        )}
        <span className="relative z-10 text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{backgroundColor:"rgba(255,255,255,0.18)",color:"#fff",border:"1px solid rgba(255,255,255,0.35)",fontFamily:F.body}}>{loc.badge}</span>
        {/* ==================== LimTzeXin Part - Bookmark Module ==================== */}
        <button onClick={e=>{e.stopPropagation();onBookmark();}} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{backgroundColor:bookmarked?C.amber:"rgba(0,0,0,0.28)"}}>
          {bookmarked ? <BookmarkCheck size={13} style={{color:C.jungle}}/> : <Bookmark size={13} className="text-white"/>}
        </button>
        {/* ==================== LimTzeXin END - Bookmark Module ==================== */}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug mb-1" style={{color:C.text,fontFamily:F.body}}>{loc.name}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={10} style={{color:C.textMuted}}/>
          <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.state}</span>
          <span className="text-xs" style={{color:C.border}}>·</span>
          <span className="text-[11px] font-semibold" style={{color:C.forest,fontFamily:F.body}}>{activityLabel(language, loc.activity)}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{backgroundColor:d.bg,color:d.color,fontFamily:F.body}}>{loc.difficulty}</span>
          {loc.distance!=="N/A" && <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{loc.distance}</span>}
        </div>
        <div className="flex items-center justify-between">
          {/* ==================== LimTzeXin Part - User Review & Rating Module ==================== */}
          <div className="flex items-center gap-1">
            <Star size={11} fill={C.amber} stroke={C.amber}/>
            <span className="text-[11px] font-bold" style={{color:C.text,fontFamily:F.body}}>{loc.rating}</span>
            <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>({loc.reviews})</span>
          </div>
          {/* ==================== LimTzeXin END - User Review & Rating Module ==================== */}
          <span className="text-[11px]" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "viewDetails")}</span>
        </div>
      </div>
    </div>
  );
}
