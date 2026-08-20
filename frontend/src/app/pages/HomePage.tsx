//==================== LowJunFeng Part - Home Module ====================
import { useEffect, useState, useMemo } from "react";
import {
  Search, X, Sparkles, MessageCircle, ArrowRight, ChevronRight,
  ChevronLeft, Pause, Play,
} from "lucide-react";
import type { Location, Page } from "../lib/types";
import { C, F } from "../lib/tokens";
import {
  ALL_STATES, PENINSULAR, EAST, FED,
  ACTIVITY_FILTERS,
} from "../lib/constants";
import { StateFlagCard } from "../components/StateFlagCard";
import { LocationCard } from "../components/LocationCard";
import { Pill, SectionHead } from "../components/Atoms";

const heroPhotos = [
  {
    src: new URL("../../assets/hero/mount-kinabalu.jpg", import.meta.url).toString(),
    alt: "Mount Kinabalu hiking trail above the clouds",
  },
  {
    src: new URL("../../assets/hero/rainforest-trail.jpg", import.meta.url).toString(),
    alt: "Misty rainforest hiking trail",
  },
  {
    src: new URL("../../assets/hero/snorkeling.jpg", import.meta.url).toString(),
    alt: "Snorkeling in clear Malaysian water",
  },
  {
    src: new URL("../../assets/hero/city-park.jpg", import.meta.url).toString(),
    alt: "City park walking path",
  },
  {
    src: new URL("../../assets/hero/park-lake.jpg", import.meta.url).toString(),
    alt: "Park lake walking path",
  },
  {
    src: new URL("../../assets/hero/aquatic-centre.jpg", import.meta.url).toString(),
    alt: "Outdoor aquatic centre swimming pool",
  },
];

export function HomePage({ setPage, setSelectedLocation, setSelectedState, bookmarks, onBookmark, locations }:{
  setPage:(p:Page)=>void; setSelectedLocation:(l:Location)=>void;
  setSelectedState:(c:string)=>void; bookmarks:(number|string)[]; onBookmark:(id:number|string)=>void;
  locations: Location[];
}) {
  const [query,setQuery]         = useState("");
  const [activeAct,setActiveAct] = useState("all");
  const [gemIndex,setGemIndex]   = useState(0);
  const [heroIndex,setHeroIndex] = useState(0);
  const [heroPaused,setHeroPaused] = useState(false);

  useEffect(() => {
    if (heroPaused) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroPhotos.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroPaused]);

  const searchResults = useMemo(()=>{
    if (!query) return null;
    const q = query.toLowerCase();
    return {
      locs:locations.filter(l=>l.name.toLowerCase().includes(q)||l.state.toLowerCase().includes(q)||l.activity.toLowerCase().includes(q)),
      states:ALL_STATES.filter(s=>s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q)),
    };
  },[query]);

  const hiddenGems = useMemo(() => locations.filter((l:any) => l.is_hidden_gem).slice(0,3), [locations]);
  const gem = hiddenGems[gemIndex] ?? hiddenGems[0] ?? locations[0];

  function goState(code:string){
    // Open the normal Discover page first.
    // App.tsx clears previous Discover filters, then this state becomes
    // the new state filter selected by the user.
    setPage("explore");
    setSelectedState(code);
  }

  function openGem() {
    if (gem) {
      setSelectedLocation(gem as Location);
      setPage("location");
    }
  }

  function moveHero(direction: -1 | 1) {
    setHeroIndex((current) => (current + direction + heroPhotos.length) % heroPhotos.length);
  }

  return (
    <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}>
      <section className="relative overflow-hidden" style={{backgroundColor:C.jungle,minHeight:310}}>
        <div className="absolute inset-0 scale-[1.04]" aria-hidden="true">
          {heroPhotos.map((photo, index) => (
            <img
              key={photo.src}
              src={photo.src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
              style={{
                opacity: index === heroIndex ? 1 : 0,
                filter: "blur(1.2px) saturate(1.05)",
                transform: "scale(1.025)",
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0" style={{background:"linear-gradient(135deg, rgba(27,67,50,0.72) 0%, rgba(18,52,42,0.62) 48%, rgba(10,35,24,0.74) 100%)"}} />
        {[...Array(20)].map((_,i)=>(
          <div key={i} className="absolute rounded-full opacity-10 bg-white" style={{width:4+(i%3)*5,height:4+(i%3)*5,left:`${(i*13+4)%100}%`,top:`${(i*19+7)%100}%`}}/>
        ))}
        <button
          type="button"
          onClick={() => moveHero(-1)}
          aria-label="Previous hero photo"
          className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur-sm transition-all hover:bg-white/20 md:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => moveHero(1)}
          aria-label="Next hero photo"
          className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur-sm transition-all hover:bg-white/20 md:flex"
        >
          <ChevronRight size={18} />
        </button>
        <div className="relative max-w-4xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-bold tracking-wide" style={{backgroundColor:"rgba(255,255,255,0.10)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.18)",fontFamily:F.body}}>
            🇲🇾 Visit Malaysia 2026 · VM2026
          </div>
          <h1 className="text-[2.8rem] md:text-5xl font-normal leading-[1.1] text-white mb-2" style={{fontFamily:F.display}}>Discover Malaysia's</h1>
          <h1 className="text-[2.8rem] md:text-5xl font-normal leading-[1.1] mb-6" style={{fontFamily:F.display,color:C.amber}}>Outdoor Adventures</h1>
          <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{color:"rgba(255,255,255,0.62)",fontFamily:F.body}}>
            Explore hiking trails, dive sites, cycling routes and more across all 16 states and territories.
          </p>
          <div className="max-w-lg mx-auto mb-8">
            <div className="flex items-center bg-white rounded-full" style={{boxShadow:"0 4px 24px rgba(0,0,0,0.24)",height:46}}>
              <div className="flex items-center gap-2.5 px-5 flex-1">
                <Search size={15} style={{color:C.textMuted,flexShrink:0}}/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search states, activities, locations…" className="flex-1 outline-none text-sm bg-transparent" style={{color:C.text,fontFamily:F.body}}/>
                {query && <button onClick={()=>setQuery("")}><X size={13} style={{color:C.textMuted}}/></button>}
              </div>
              <button className="m-1 px-5 h-9 rounded-full text-sm font-bold text-white active:scale-95 transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>Search</button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-14">
            {[{val:"16",label:"States"},{val:"9+",label:"Activities"},{val:"30+",label:"Locations"}].map(({val,label})=>(
              <div key={label}>
                <p className="text-2xl font-bold text-white" style={{fontFamily:F.display}}>{val}</p>
                <p className="text-[11px] font-semibold" style={{color:"rgba(255,255,255,0.50)",fontFamily:F.body}}>{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => moveHero(-1)}
              aria-label="Previous hero photo"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm md:hidden"
            >
              <ChevronLeft size={15} />
            </button>
            {heroPhotos.map((photo, index) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => setHeroIndex(index)}
                aria-label={`Show ${photo.alt}`}
                className="h-2 rounded-full transition-all"
                style={{
                  width: index === heroIndex ? 24 : 8,
                  backgroundColor: index === heroIndex ? C.amber : "rgba(255,255,255,0.42)",
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => moveHero(1)}
              aria-label="Next hero photo"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm md:hidden"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => setHeroPaused((paused) => !paused)}
              aria-label={heroPaused ? "Play hero slideshow" : "Pause hero slideshow"}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm"
            >
              {heroPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          </div>
        </div>
      </section>

      <div className="bg-white border-b sticky top-14 z-30" style={{borderColor:C.border}}>
        <div className="flex gap-2 px-5 py-2.5 overflow-x-auto" style={{scrollbarWidth:"none"}}>
          {ACTIVITY_FILTERS.map(({id,label,icon})=>(
            <button key={id} onClick={()=>setActiveAct(id)} className="flex items-center gap-1.5 px-4 h-9 rounded-full text-[12px] font-bold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{backgroundColor:activeAct===id?C.jungle:C.muted,color:activeAct===id?"#fff":C.textSub,fontFamily:F.body}}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {searchResults && (
        <div className="max-w-5xl mx-auto px-5 py-8">
          {searchResults.states.length>0 && (
            <><p className="text-xs font-bold uppercase tracking-wide mb-3" style={{color:C.textMuted,fontFamily:F.body}}>States</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">{searchResults.states.map(s=><StateFlagCard key={s.code} code={s.code} name={s.name} region={s.region} onClick={()=>goState(s.code)}/>)}</div></>
          )}
          {searchResults.locs.length>0 && (
            <><p className="text-xs font-bold uppercase tracking-wide mb-3" style={{color:C.textMuted,fontFamily:F.body}}>Locations ({searchResults.locs.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{searchResults.locs.map(loc=><LocationCard key={loc.id} loc={loc} bookmarked={bookmarks.includes(loc.id)} onBookmark={()=>onBookmark(loc.id)} onView={()=>{setSelectedLocation(loc);setPage("location");}}/>)}</div></>
          )}
          {!searchResults.locs.length && !searchResults.states.length && (
            <p className="text-center py-14 text-sm" style={{color:C.textMuted,fontFamily:F.body}}>
              {/hiking|diving|cycling|camping|swimming|climbing|jogging|running|trail/i.test(query)
                ? `No matching activity type found for "${query}". Try another keyword.`
                : `Location not found for "${query}". Try another keyword.`}
            </p>
          )}
        </div>
      )}

      {!searchResults && (
        <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">
          {/* Hidden Gem */}
          <div>
            <div className="flex items-center gap-2.5 mb-5"><Sparkles size={18} style={{color:C.amber}}/><h2 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.text}}>Hidden Gem Spotlight</h2></div>
            <div
              role="button"
              tabIndex={0}
              onClick={openGem}
              onKeyDown={(e)=>{ if(e.key==="Enter") openGem(); }}
              className="rounded-[22px] overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 duration-200"
              style={{background:`linear-gradient(135deg, ${(gem as any)?.color || C.forest} 0%, ${C.jungle} 100%)`,boxShadow:`0 4px 20px rgba(27,67,50,0.18)`}}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:"rgba(255,255,255,0.20)"}}><Sparkles size={22} className="text-white"/></div>
                    <div>
                      <h3 className="text-lg font-normal text-white mb-0.5" style={{fontFamily:F.display}}>{gem?.name || "No hidden gem selected"}</h3>
                      <p className="text-xs mb-3" style={{color:"rgba(255,255,255,0.72)",fontFamily:F.body}}>📍 {gem?.state || ""}</p>
                      <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,0.78)",fontFamily:F.body,maxWidth:400}}>{(gem as any)?.description || "Ask an admin to mark Firebase locations as hidden gems."}</p>
                      <p className="text-xs mt-3 font-bold" style={{color:"rgba(255,255,255,0.9)",fontFamily:F.body}}>Tap to view details →</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-bold px-3 py-1 rounded-full" style={{backgroundColor:"rgba(255,255,255,0.20)",color:"#fff",border:"1px solid rgba(255,255,255,0.32)",fontFamily:F.body}}>✦ Hidden Gem</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-6 pb-5" onClick={e=>e.stopPropagation()}>
                {hiddenGems.map((_,i)=>(
                  <button key={i} onClick={e=>{e.stopPropagation();setGemIndex(i);}} className="rounded-full transition-all duration-200" style={{width:gemIndex===i?20:6,height:6,backgroundColor:gemIndex===i?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.36)"}}/>
                ))}
              </div>
            </div>
          </div>
          {/* State sections */}
          <div><SectionHead title="Peninsular Malaysia"/><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{PENINSULAR.map(s=><StateFlagCard key={s.code} code={s.code} name={s.name} region="Peninsular Malaysia" onClick={()=>goState(s.code)}/>)}</div></div>
          <div><SectionHead title="East Malaysia"/><div className="grid grid-cols-2 gap-4">{EAST.map(s=><StateFlagCard key={s.code} code={s.code} name={s.name} region="East Malaysia" onClick={()=>goState(s.code)} large/>)}</div></div>
          <div><SectionHead title="Federal Territories"/><div className="grid grid-cols-3 gap-3">{FED.map(s=><StateFlagCard key={s.code} code={s.code} name={s.name} region="Federal Territory" onClick={()=>goState(s.code)}/>)}</div></div>
          {/* Featured locations */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <SectionHead title="Featured Locations"/>
              <button onClick={()=>{setSelectedState("");setPage("explore");}} className="flex items-center gap-1 text-sm font-bold mb-5" style={{color:C.forest,fontFamily:F.body}}>View all <ChevronRight size={14}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.filter(l => activeAct==="all" || l.activity===activeAct).slice(0,3).map(loc=><LocationCard key={loc.id} loc={loc} bookmarked={bookmarks.includes(loc.id)} onBookmark={()=>onBookmark(loc.id)} onView={()=>{setSelectedLocation(loc);setPage("location");}}/>)}
            </div>
          </div>
          {/* AI CTA */}
          <div className="rounded-[22px] overflow-hidden" style={{background:`linear-gradient(135deg, ${C.jungle} 0%, #0a2318 100%)`}}>
            <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-[11px] font-bold" style={{backgroundColor:"rgba(255,255,255,0.10)",color:"rgba(255,255,255,0.82)",fontFamily:F.body}}>
                  <MessageCircle size={11}/> AI Outdoor Assistant
                </div>
                <h3 className="text-2xl font-normal text-white mb-2" style={{fontFamily:F.display}}>Ask anything about Malaysia's outdoors</h3>
                <p className="text-sm" style={{color:"rgba(255,255,255,0.58)",fontFamily:F.body}}>Gear tips, trail conditions, beginner guides — instant answers.</p>
              </div>
              <Pill variant="amber" onClick={()=>setPage("ai")}>Open AI Guide <ArrowRight size={14}/></Pill>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//==================== LowJunFeng END - Home Module ====================
