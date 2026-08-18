// FILE PRIMARY OWNER: WILSON CHOONG WEI SHAN | AI Outdoor Assistant Chatbot
// GitHub target: feature/wilson-choong-wei-shan -> Pull Request -> main
//==================== WilsonChoongWeiShan Part - AI Outdoor Assistant Chatbot ====================
import { useState, useRef, useEffect } from "react";
import {
  Send, MessageCircle, MapPin, AlertCircle, Check, Sparkles, Star,
  X,
} from "lucide-react";
import type { Location } from "../lib/types";
import { C, F } from "../lib/tokens";
import { Pill } from "../components/Atoms";
import { getAIReply } from "../lib/helpers";

type MsgType = "text"|"locations"|"checklist"|"safety"|"error";
interface AIMessage {
  id: number;
  from: "user"|"bot";
  type: MsgType;
  text?: string;
  locations?: Location[];
  checklist?: {category:string; items:string[]}[];
  safetyTips?: {icon:string; title:string; tips:string[]}[];
  errorCode?: "service"|"no_locations"|"no_safety"|"no_checklist";
  time: string;
}

const CHECKLISTS: Record<string, {category:string; items:string[]}[]> = {
  Hiking: [
    {category:"Hydration & Food",items:["2–3L water per person","Energy bars / trail mix","Electrolyte sachets","Light packed lunch"]},
    {category:"Clothing",items:["Moisture-wicking shirt","Quick-dry pants or shorts","Waterproof jacket / rain poncho","Hat with UV protection","Warm layer for summits"]},
    {category:"Footwear",items:["Trail shoes or hiking boots","Thick moisture-wicking socks","Gaiters (for muddy trails)"]},
    {category:"Safety & Navigation",items:["Fully charged phone","Offline maps downloaded","Whistle","First aid kit","Emergency contact plan"]},
    {category:"Essentials",items:["Headlamp + spare batteries","Sunscreen SPF 50+","DEET insect repellent 30%+","Trekking poles (optional)","Dry bags for electronics"]},
  ],
  "Trail Running": [
    {category:"Running Gear",items:["Trail running shoes","Moisture-wicking top & shorts","Running vest / hydration pack","2L minimum water capacity"]},
    {category:"Nutrition",items:["Energy gels (every 45 min)","Salt tablets for long runs","Banana / dates for quick energy"]},
    {category:"Safety",items:["GPS watch or app","Charged phone","Whistle","Run with a buddy on remote trails","Inform someone of your route"]},
    {category:"Recovery",items:["Foam roller","Blister plasters","Compression socks for after"]},
  ],
  Jogging: [
    {category:"Clothing",items:["Breathable running shirt","Running shorts or tights","Running shoes (road or trail)","Reflective gear if running at dawn/dusk"]},
    {category:"Hydration",items:["500ml–1L water bottle or belt","Electrolyte drink for runs over 45 min"]},
    {category:"Safety",items:["Phone with GPS","ID / emergency contact info","Headphones (one ear only)"]},
  ],
  Cycling: [
    {category:"Bike & Safety",items:["Certified helmet (non-negotiable)","Front & rear lights","Bell","Hi-vis jacket for roads"]},
    {category:"Tools & Spares",items:["Puncture repair kit","Spare inner tube","Mini pump","Multi-tool","Chain lube"]},
    {category:"Hydration",items:["Minimum 2 water bottles","Electrolyte tabs for rides over 2 hrs"]},
    {category:"Nutrition",items:["Energy bars or gels","Banana or rice balls","Small snacks every 45 min"]},
    {category:"Clothing",items:["Padded cycling shorts","Cycling gloves","Sunglasses","Sunscreen SPF 50+"]},
  ],
  Swimming: [
    {category:"Water Safety",items:["Check conditions before entering","Swim with a buddy","Know the depth","Watch for currents or undertow"]},
    {category:"Gear",items:["Goggles","Rash guard / swim shirt","Waterproof sunscreen SPF 50+","Flip-flops for rocky entries"]},
    {category:"After Swim",items:["Fresh water rinse (saltwater sites)","Dry towel","Change of clothes","Rehydration drink"]},
  ],
  Diving: [
    {category:"Certification & Docs",items:["Valid dive certification card","Dive logbook","Travel insurance with dive cover","Medical fitness declaration"]},
    {category:"Equipment Check",items:["BCD — inflation/deflation OK","Regulator — breathes smoothly","Tank — pressure full","Wetsuit/drysuit — sealed","Mask — no fog, no leaks","Fins — buckles secure","Dive computer — charged"]},
    {category:"Safety",items:["Dive with certified operator","Never dive alone","Signal device (DSMB)","Dive knife or cutter","Know emergency procedures"]},
    {category:"Dive Plan",items:["Max depth agreed","Bottom time agreed","No-decompression limits known","Entry/exit points checked","Emergency contacts informed"]},
  ],
  "Rock Climbing": [
    {category:"Hardware",items:["Harness — correctly fitted","Helmet — always","Belay device + locking carabiner","Quickdraws (sport) or full rack (trad)","Rope — appropriate length","Anchor materials"]},
    {category:"Clothing & Footwear",items:["Climbing shoes — snug fit","Comfortable movement-friendly clothing","Chalk bag + chalk"]},
    {category:"Safety Protocol",items:["Partner check before every climb","Communication signals agreed","Know how to fall safely","Top-rope for beginners","Never climb alone on remote crags"]},
  ],
  "Water Sports": [
    {category:"Essential Safety",items:["Certified life jacket / PFD","Weather check before heading out","Inform someone of your plan","Know local currents and tides"]},
    {category:"Kayaking / Paddleboarding",items:["Paddle leash","Dry bag for phone & valuables","Whistle","UV-protective clothing","Waterproof sunscreen"]},
    {category:"Jet Ski / Motorised",items:["Valid licence where required","Safety briefing from operator","Helmet and wetsuit if provided","Stay within designated zones"]},
  ],
  Camping: [
    {category:"Shelter",items:["Tent (with footprint)","Sleeping bag (appropriate rating)","Sleeping mat or pad","Tarp for extra rain cover"]},
    {category:"Cooking",items:["Camp stove + fuel","Lighter + waterproof matches","Cooking pot & utensils","Biodegradable soap","Bear canister or hang bag for food"]},
    {category:"Safety & Navigation",items:["Detailed map + compass","GPS device or app","Emergency whistle","First aid kit (comprehensive)","Emergency shelter (bivouac bag)"]},
    {category:"Leave No Trace",items:["Waste bags for all rubbish","Trowel (for cat holes)","Biodegradable toiletries","Leave site cleaner than found"]},
    {category:"Personal",items:["Headlamp + extra batteries","Warm layers for night","Waterproof everything","Insect repellent","Sunscreen"]},
  ],
};

const SAFETY_DATA: Record<string,{icon:string;title:string;tips:string[]}[]> = {
  general:[
    {icon:"🆘",title:"Emergency Preparation",tips:["Always tell someone your route and expected return time","Download offline maps before leaving mobile coverage","Carry a charged power bank","Know the nearest hospital to your activity site","Malaysia emergency: 999 · RESCUE: 1800-88-5050"]},
    {icon:"☀️",title:"Heat & Sun Safety",tips:["Start activities before 8 AM to avoid peak heat (11 AM–3 PM)","Drink 500ml water before heading out, then 200ml every 20 min","Wear UV-protective long sleeves and SPF 50+ sunscreen","Know signs of heat exhaustion: dizziness, nausea, rapid heartbeat","Find shade immediately if feeling overheated"]},
    {icon:"🐍",title:"Wildlife Precautions",tips:["Stay on marked trails — snakes rest in leaf litter off-path","Never disturb or feed wildlife","Wear long trousers in jungle environments","Check boots and clothing before putting them on","Learn to identify the common Malaysian pit vipers"]},
    {icon:"🌧️",title:"Monsoon & Weather",tips:["Check Malaysia MetMalaysia weather before departure","Afternoon thunderstorms are common — descend before 2 PM","Flash floods can occur rapidly in gorges and valleys","Never cross swollen rivers — wait for levels to drop","Carry a waterproof poncho in your pack year-round"]},
  ],
  water:[
    {icon:"🌊",title:"Water Activity Safety",tips:["Always swim with a buddy — never alone","Check water conditions: currents, depth, visibility","Wear a life jacket for open-water activities","Know local rip current escape: swim parallel to shore","Check with local operators for area-specific hazards"]},
    {icon:"🤿",title:"Diving Safety",tips:["Never dive beyond your certification level","Perform full buddy check before every dive","Ascend slowly — 9m/min max, 3-min safety stop at 5m","Never hold your breath while ascending","Know the location of the nearest hyperbaric chamber"]},
  ],
  hiking:[
    {icon:"⛰️",title:"Trail Safety",tips:["Start with easier trails and build experience gradually","Never hike alone on remote or jungle trails","Turn back if weather deteriorates — summit can wait","Stay on marked paths — getting lost is the #1 cause of rescues","Register with park rangers for remote treks"]},
    {icon:"💧",title:"Hydration in the Jungle",tips:["Jungle humidity accelerates dehydration rapidly","Carry 500ml per hour of activity minimum","Never drink from streams without filtration or purification","Watch for signs of dehydration: dark urine, headache, fatigue","Oral rehydration salts are essential for multi-day treks"]},
  ],
  climbing:[
    {icon:"🧗",title:"Climbing Safety",tips:["Always perform a BARK check: Buckle, Attachment, Rope, Knot","Wear a helmet — rockfall is a primary hazard","Communicate clearly with your belayer at all times","Inspect fixed bolts and anchors before trusting them","Know and practice self-rescue techniques"]},
  ],
};

function buildAIResponse(text:string, locations: Location[]): Omit<AIMessage,"id"|"from"|"time"> {
  const l = text.toLowerCase();
  const now = new Date().toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"});

  // ── Location recommendation intent ──
  const wantsLocation = /\b(recommend|suggest|where|best place|good spot|find|looking for|plan|going to|visit|near)\b/.test(l);
  if (wantsLocation || /\b(location|spot|place|site|trail|park|island)\b/.test(l)) {
    const actKeywords: Record<string,string> = {
      "hik":"Hiking","trail run":"Trail Running","jog":"Jogging","run":"Trail Running",
      "cycl":"Cycling","bike":"Cycling","swim":"Swimming","div":"Diving","snorkel":"Diving",
      "climb":"Rock Climbing","boulder":"Rock Climbing","kayak":"Water Sports","water sport":"Water Sports",
      "camp":"Camping","jungle":"Camping",
    };
    let matchActivity = "";
    for (const [kw,act] of Object.entries(actKeywords)) {
      if (l.includes(kw)) { matchActivity = act; break; }
    }
    const stateKeywords: Record<string,string> = {
      "sabah":"SBH","sarawak":"SWK","selangor":"SLG","kuala lumpur":"KL","kl ":"KL",
      "pahang":"PHG","terengganu":"TRG","perak":"PRK","penang":"PNG","johor":"JHR",
      "kelantan":"KTN","kedah":"KDH","negeri sembilan":"NSN","melaka":"MLK",
      "labuan":"LBN","putrajaya":"PTJ","perlis":"PLS",
    };
    let matchState = "";
    for (const [kw,code] of Object.entries(stateKeywords)) {
      if (l.includes(kw)) { matchState = code; break; }
    }
    const difficulty = l.includes("beginner")||l.includes("easy") ? "Easy"
      : l.includes("hard")||l.includes("advanced")||l.includes("challenge") ? "Hard"
      : l.includes("moderate") ? "Moderate" : "";

    let locs = locations.filter(loc=>{
      if (matchActivity && loc.activity!==matchActivity) return false;
      if (matchState && loc.stateCode!==matchState) return false;
      if (difficulty && loc.difficulty!==difficulty) return false;
      return true;
    });
    if (!matchActivity && !matchState && !difficulty) locs = [];

    if (locs.length===0 && (matchActivity||matchState||difficulty)) {
      return {type:"error",errorCode:"no_locations",text:"No suitable outdoor locations found for your criteria. Try broadening your search — remove the state or difficulty filter, or explore a different activity type."};
    }
    if (locs.length>0) {
      const top = locs.slice(0,4);
      return {type:"locations",locations:top,text:`Here are ${top.length} location${top.length>1?"s":""} matching your request:`};
    }
  }

  // ── Equipment / gear / checklist intent ──
  if (/\b(gear|equipment|checklist|pack|bring|prepare|what.*(need|take|bring|carry)|kit)\b/.test(l)) {
    const actMap: Record<string,string> = {
      "hik":"Hiking","trail run":"Trail Running","jog":"Jogging","run":"Trail Running",
      "cycl":"Cycling","bike":"Cycling","swim":"Swimming","div":"Diving","snorkel":"Diving",
      "climb":"Rock Climbing","water sport":"Water Sports","kayak":"Water Sports","camp":"Camping","jungle":"Camping",
    };
    let act = "";
    for (const [kw,a] of Object.entries(actMap)) { if (l.includes(kw)) { act=a; break; } }
    if (!act) act = "Hiking"; // default
    const list = CHECKLISTS[act];
    if (!list) return {type:"error",errorCode:"no_checklist",text:"Equipment checklist is currently unavailable. Please try again later."};
    return {type:"checklist",checklist:list,text:`${act} equipment checklist — everything you need:`};
  }

  // ── Safety intent ──
  if (/\b(safe|safety|danger|dangerous|risk|precaution|warning|careful|avoid|emergency|first.?aid|rescue|injury|accident)\b/.test(l)) {
    let tips: {icon:string;title:string;tips:string[]}[] = SAFETY_DATA.general;
    if (/\b(swim|div|water|ocean|sea|lake|river)\b/.test(l)) tips = [...SAFETY_DATA.water,...SAFETY_DATA.general.slice(0,2)];
    else if (/\b(hik|trail|mountain|jungle|summit)\b/.test(l)) tips = [...SAFETY_DATA.hiking,...SAFETY_DATA.general.slice(0,2)];
    else if (/\b(climb|boulder|crag)\b/.test(l)) tips = [...SAFETY_DATA.climbing,...SAFETY_DATA.general.slice(0,2)];
    if (!tips) return {type:"error",errorCode:"no_safety",text:"Unable to provide safety advice at this time. Please consult a certified instructor or local authorities."};
    return {type:"safety",safetyTips:tips,text:"Here are essential safety guidelines:"};
  }

  // ── General text response ──
  return {type:"text",text:getAIReply(text)};
}

// ─── AI chat ──────────────────────────────────────────────────────────────────
export function AIPage({ locations }: { locations: Location[] }) {
  const initTime = new Date().toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"});
  const [messages,setMessages] = useState<AIMessage[]>([{
    id:0,from:"bot",type:"text",time:initTime,
    text:"Hi! I'm your SeekMY AI Outdoor Assistant 🌿 I can recommend locations, generate equipment checklists, and share safety advice for any outdoor activity in Malaysia. What would you like to explore?",
  }]);
  const [input,setInput]   = useState("");
  const [loading,setLoading] = useState(false);
  const [serviceDown] = useState(false); // simulate AI service status
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const QUICK_ACTIONS = [
    {label:"Recommend hiking spots",icon:"🥾"},
    {label:"Camping gear checklist",icon:"⛺"},
    {label:"Diving safety tips",icon:"🤿"},
    {label:"Beginner cycling locations",icon:"🚴"},
    {label:"Trail running near Selangor",icon:"🏃"},
    {label:"Water sports recommendations",icon:"🚣"},
  ];

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages,loading]);

  function send(msg?:string) {
    const text = (msg||input).trim(); if (!text||loading) return;
    const now = new Date().toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"});
    const userMsg: AIMessage = {id:Date.now(),from:"user",type:"text",text,time:now};
    setMessages(m=>[...m,userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(()=>{
      if (serviceDown) {
        setMessages(m=>[...m,{id:Date.now()+1,from:"bot",type:"error",errorCode:"service",time:now,text:"AI service is currently unavailable. Please try again later."}]);
      } else {
        const resp = buildAIResponse(text, locations);
        setMessages(m=>[...m,{id:Date.now()+1,from:"bot",...resp,time:now}]);
      }
      setLoading(false);
    }, 850 + Math.random()*400);
  }

  function clearChat() {
    const now = new Date().toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"});
    setMessages([{id:0,from:"bot",type:"text",time:now,text:"Chat cleared. How can I help you explore Malaysia's outdoors?"}]);
  }

  return (
    <div className="pt-14 h-screen flex flex-col" style={{background:`linear-gradient(160deg, ${C.jungle} 0%, #12342a 55%, #0a2318 100%)`}}>
      <div className="max-w-2xl mx-auto w-full px-4 flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 py-5 flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center relative" style={{backgroundColor:"rgba(255,255,255,0.14)"}}>
            <MessageCircle size={20} className="text-white"/>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a2318]" style={{backgroundColor:"#4ade80"}}/>
          </div>
          <div>
            <h1 className="text-xl font-normal text-white" style={{fontFamily:F.display}}>SeekMY AI Guide</h1>
            <p className="text-[11px]" style={{color:"rgba(255,255,255,0.50)",fontFamily:F.body}}>Outdoor expert · Malaysia locations · Safety & gear</p>
          </div>
          <button onClick={clearChat} className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all active:scale-95"
            style={{border:"1px solid rgba(255,255,255,0.18)",color:"rgba(255,255,255,0.65)",fontFamily:F.body}}>
            <X size={10}/> Clear
          </button>
        </div>

        {/* Quick actions — shown before first user message */}
        {messages.length===1 && (
          <div className="flex-shrink-0 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{color:"rgba(255,255,255,0.35)",fontFamily:F.body}}>Quick actions</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(q=>(
                <button key={q.label} onClick={()=>send(q.label)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left text-xs font-semibold transition-all active:scale-95"
                  style={{backgroundColor:"rgba(255,255,255,0.09)",color:"rgba(255,255,255,0.85)",fontFamily:F.body,border:"1px solid rgba(255,255,255,0.10)"}}>
                  <span className="text-base flex-shrink-0">{q.icon}</span>
                  <span className="leading-tight">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4" style={{scrollbarWidth:"none"}}>
          {messages.map((m)=>(
            <div key={m.id} className={`flex ${m.from==="user"?"justify-end":"justify-start"} gap-2`}>
              {m.from==="bot" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{backgroundColor:"rgba(233,196,106,0.20)"}}>
                  <Sparkles size={13} style={{color:C.amber}}/>
                </div>
              )}
              <div className={`flex flex-col gap-2 ${m.from==="user"?"items-end":"items-start"} max-w-[85%]`}>
                {/* Timestamp */}
                <span className="text-[10px] px-2" style={{color:"rgba(255,255,255,0.30)",fontFamily:F.body}}>{m.time}</span>

                {/* Text bubble */}
                {m.type==="text" && m.text && (
                  <div className="px-4 py-3 text-sm leading-relaxed"
                    style={{backgroundColor:m.from==="user"?C.forest:"rgba(255,255,255,0.12)",color:"#fff",
                      borderRadius:m.from==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",fontFamily:F.body}}>
                    {m.text}
                  </div>
                )}

                {/* Error bubble */}
                {m.type==="error" && (
                  <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed flex items-start gap-2.5"
                    style={{backgroundColor:"rgba(192,57,43,0.25)",color:"#ffb3ae",fontFamily:F.body,border:"1px solid rgba(192,57,43,0.35)"}}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{color:"#ff8a80"}}/>
                    <span>{m.text}</span>
                  </div>
                )}

                {/* Location recommendation cards */}
                {m.type==="locations" && (
                  <div className="w-full max-w-sm">
                    {m.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{backgroundColor:"rgba(255,255,255,0.12)",color:"#fff",fontFamily:F.body}}>{m.text}</div>}
                    <div className="flex flex-col gap-2">
                      {m.locations?.map(loc=>(
                        <div key={loc.id} className="rounded-2xl p-4 flex items-start gap-3" style={{backgroundColor:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.12)"}}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{backgroundColor:"rgba(0,0,0,0.25)"}}>{loc.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate" style={{fontFamily:F.body}}>{loc.name}</p>
                            <p className="text-[11px] mb-1.5" style={{color:"rgba(255,255,255,0.55)",fontFamily:F.body}}>{loc.state} · {loc.activity}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{backgroundColor:loc.difficulty==="Easy"?"rgba(45,106,79,0.5)":loc.difficulty==="Moderate"?"rgba(146,64,14,0.4)":"rgba(192,57,43,0.4)",
                                  color:"#fff",fontFamily:F.body}}>{loc.difficulty}</span>
                              <span className="flex items-center gap-1 text-[10px]" style={{color:C.amber,fontFamily:F.body}}>
                                <Star size={9} fill={C.amber}/>{loc.rating}
                              </span>
                              <span className="text-[10px]" style={{color:"rgba(255,255,255,0.45)",fontFamily:F.body}}>{loc.distance} · {loc.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment checklist */}
                {m.type==="checklist" && (
                  <div className="w-full max-w-sm">
                    {m.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{backgroundColor:"rgba(255,255,255,0.12)",color:"#fff",fontFamily:F.body}}>{m.text}</div>}
                    <div className="rounded-2xl overflow-hidden" style={{backgroundColor:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)"}}>
                      {m.checklist?.map((cat,ci)=>(
                        <div key={ci} className={ci>0?"border-t":""} style={{borderColor:"rgba(255,255,255,0.08)"}}>
                          <div className="px-4 py-2.5" style={{backgroundColor:"rgba(233,196,106,0.12)"}}>
                            <p className="text-[11px] font-bold uppercase tracking-wide" style={{color:C.amber,fontFamily:F.body}}>{cat.category}</p>
                          </div>
                          <div className="px-4 py-2 flex flex-col gap-1.5">
                            {cat.items.map((item,ii)=>(
                              <div key={ii} className="flex items-start gap-2.5">
                                <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center" style={{border:"1.5px solid rgba(233,196,106,0.50)"}}>
                                  <Check size={9} style={{color:C.amber}}/>
                                </div>
                                <span className="text-[12px] leading-relaxed" style={{color:"rgba(255,255,255,0.80)",fontFamily:F.body}}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety advice cards */}
                {m.type==="safety" && (
                  <div className="w-full max-w-sm">
                    {m.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{backgroundColor:"rgba(255,255,255,0.12)",color:"#fff",fontFamily:F.body}}>{m.text}</div>}
                    <div className="flex flex-col gap-2">
                      {m.safetyTips?.slice(0,3).map((tip,ti)=>(
                        <div key={ti} className="rounded-2xl p-4" style={{backgroundColor:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.10)"}}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-xl">{tip.icon}</span>
                            <p className="text-sm font-bold text-white" style={{fontFamily:F.body}}>{tip.title}</p>
                          </div>
                          <ul className="flex flex-col gap-1.5">
                            {tip.tips.map((t,i)=>(
                              <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed" style={{color:"rgba(255,255,255,0.75)",fontFamily:F.body}}>
                                <span className="text-[10px] mt-1 flex-shrink-0" style={{color:C.amber}}>▸</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{backgroundColor:"rgba(233,196,106,0.20)"}}>
                <Sparkles size={13} style={{color:C.amber}}/>
              </div>
              <div className="px-4 py-3.5 rounded-2xl flex items-center gap-1.5" style={{backgroundColor:"rgba(255,255,255,0.12)"}}>
                {[0,1,2].map(i=>(
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:"rgba(255,255,255,0.50)",animation:`bounce 1.2s ${i*0.2}s infinite`}}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 pb-6 pt-2">
          <div className="flex gap-2 bg-white rounded-full overflow-hidden p-1.5" style={{boxShadow:"0 4px 24px rgba(0,0,0,0.30)"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder="Ask about trails, gear, safety…"
              className="flex-1 text-sm px-4 py-2 outline-none bg-transparent"
              style={{fontFamily:F.body,color:C.text}}/>
            <button onClick={()=>send()} disabled={!input.trim()||loading}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
              style={{backgroundColor:C.jungle}}>
              <Send size={15}/>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)}
        }
      `}</style>
    </div>
  );
}
//==================== WilsonChoongWeiShan END - AI Outdoor Assistant Chatbot ====================
