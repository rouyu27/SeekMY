// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import { useState } from "react";
import {
  X, Home, Compass, Map, MessageCircle, Trophy, Activity,
  Bookmark, UserCircle, ChevronDown, LogOut, Users, BarChart3, CircleHelp,
} from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";
const seekMyLogo = new URL("../../imports/logo.png", import.meta.url).toString();
import type { Page, AppUser } from "../lib/types";
import { C, F } from "../lib/tokens";

const NAV_PRIMARY = [
  {label:"Home",     page:"home"        as Page, icon:<Home size={15}/>},
  {label:"Explore",  page:"explore"     as Page, icon:<Compass size={15}/>},
  {label:"Map",      page:"map"         as Page, icon:<Map size={15}/>},
  {label:"AI Guide", page:"ai"          as Page, icon:<MessageCircle size={15}/>},
];
const NAV_MORE = [
  {label:"Activity Log",  page:"log"         as Page, icon:<Activity size={14}/>},
  {label:"Leaderboard",   page:"leaderboard" as Page, icon:<Trophy size={14}/>},
  {label:"Saved",         page:"bookmarks"   as Page, icon:<Bookmark size={14}/>},
  {label:"Contributor",   page:"contributor" as Page, icon:<Users size={14}/>},
  {label:"Insights",      page:"insights"    as Page, icon:<BarChart3 size={14}/>},
  {label:"Help & FAQ",    page:"help"        as Page, icon:<CircleHelp size={14}/>},
];

export function NavBar({ page, setPage, mobileOpen, setMobileOpen, user, onAuthClick }:{
  page:Page; setPage:(p:Page)=>void; mobileOpen:boolean; setMobileOpen:(v:boolean)=>void;
  user:AppUser|null; onAuthClick:()=>void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreInPage = NAV_MORE.some(n=>n.page===page);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1200] bg-white" style={{boxShadow:`0 1px 0 ${C.border}, 0 2px 8px rgba(27,67,50,0.06)`}}>
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-3">

        {/* Logo */}
        <button onClick={()=>setPage("home")} className="flex items-center gap-2.5 flex-shrink-0 mr-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0" style={{borderColor:C.jungle}}>
            <ImageWithFallback src={seekMyLogo} alt="SeekMY" className="w-full h-full object-cover"/>
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm leading-tight" style={{color:C.text,fontFamily:F.display}}>SeekMY</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{color:C.textMuted,fontFamily:F.body}}>Outdoor Discovery</p>
          </div>
        </button>

        {/* Primary nav — desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_PRIMARY.map(({label,page:p,icon})=>(
            <button key={label} onClick={()=>setPage(p)}
              className="flex items-center gap-1.5 px-3.5 h-8 rounded-xl text-[13px] font-semibold transition-all"
              style={{backgroundColor:page===p?C.muted:"transparent",color:page===p?C.jungle:C.textSub,fontFamily:F.body}}>
              <span style={{color:page===p?C.jungle:C.textMuted}}>{icon}</span>{label}
            </button>
          ))}

          {/* More dropdown */}
          <div className="relative">
            <button onClick={()=>setMoreOpen(v=>!v)}
              className="flex items-center gap-1.5 px-3.5 h-8 rounded-xl text-[13px] font-semibold transition-all"
              style={{backgroundColor:moreInPage||moreOpen?C.muted:"transparent",color:moreInPage||moreOpen?C.jungle:C.textSub,fontFamily:F.body}}>
              More <ChevronDown size={13} style={{transform:moreOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}/>
            </button>
            {moreOpen && (
              <div className="absolute top-10 left-0 w-52 bg-white rounded-2xl py-2 z-[1210]"
                style={{boxShadow:`0 8px 32px rgba(27,67,50,0.18)`,border:`1px solid ${C.border}`}}>
                {NAV_MORE.map(({label,page:p,icon})=>(
                  <button key={label} onClick={()=>{setPage(p);setMoreOpen(false);}}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors text-left"
                    style={{backgroundColor:page===p?C.muted:"transparent",color:page===p?C.jungle:C.textSub,fontFamily:F.body}}>
                    <span style={{color:page===p?C.jungle:C.textMuted}}>{icon}</span>{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"/>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={()=>setPage("account")} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{backgroundColor:C.jungle}}>
                {user.displayName.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <span className="hidden md:block text-xs font-bold" style={{color:C.text,fontFamily:F.body}}>{user.displayName.split(" ")[0]}</span>
            </button>
          ) : (
            <button onClick={onAuthClick} className="hidden md:flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold text-white transition-all active:scale-95" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
              Sign In
            </button>
          )}
          {/* Hamburger — mobile only */}
          <button onClick={()=>setMobileOpen(!mobileOpen)} className="md:hidden w-9 h-9 rounded-xl border flex items-center justify-center" style={{borderColor:C.border}}>
            {mobileOpen ? <X size={16} style={{color:C.text}}/> : <div className="flex flex-col gap-[5px]">{[0,1,2].map(i=><div key={i} className="w-4 h-0.5 rounded" style={{backgroundColor:C.text}}/>)}</div>}
          </button>
        </div>
      </div>

      {/* Mobile slide-down drawer */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white z-[1210] border-t" style={{borderColor:C.border,boxShadow:`0 12px 40px rgba(27,67,50,0.18)`}}>
          <div className="p-4 grid grid-cols-2 gap-1">
            {[...NAV_PRIMARY,...NAV_MORE].map(({label,page:p,icon})=>(
              <button key={label} onClick={()=>{setPage(p);setMobileOpen(false);}}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-left transition-colors"
                style={{backgroundColor:page===p?C.muted:"transparent",color:page===p?C.jungle:C.textSub,fontFamily:F.body}}>
                <span style={{color:page===p?C.jungle:C.textMuted}}>{icon}</span>{label}
              </button>
            ))}
            <button onClick={()=>{setPage("account");setMobileOpen(false);}}
              className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-left"
              style={{backgroundColor:page==="account"?C.muted:"transparent",color:page==="account"?C.jungle:C.textSub,fontFamily:F.body}}>
              <UserCircle size={14}/> Profile
            </button>
          </div>
          <div className="border-t px-4 py-3" style={{borderColor:C.border}}>
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>{user.displayName}</span>
                <button onClick={()=>setMobileOpen(false)} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{color:C.error,fontFamily:F.body}}>
                  <LogOut size={12} className="inline mr-1"/>Sign out
                </button>
              </div>
            ) : (
              <button onClick={()=>{onAuthClick();setMobileOpen(false);}} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
