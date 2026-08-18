// MAIN / TEAM SHARED FOUNDATION
// GitHub target: main
// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import { C } from "./tokens";

//==================== LowJunFeng Part - Home/State Constants ====================
export const PENINSULAR = [
  {code:"JHR",name:"Johor"},{code:"KDH",name:"Kedah"},{code:"KTN",name:"Kelantan"},
  {code:"MLK",name:"Melaka"},{code:"NSN",name:"Negeri Sembilan"},{code:"PHG",name:"Pahang"},
  {code:"PRK",name:"Perak"},{code:"PLS",name:"Perlis"},{code:"SLG",name:"Selangor"},
  {code:"TRG",name:"Terengganu"},{code:"PNG",name:"Pulau Pinang"},
];
export const EAST = [{code:"SBH",name:"Sabah"},{code:"SWK",name:"Sarawak"}];
export const FED  = [{code:"KL",name:"Kuala Lumpur"},{code:"LBN",name:"Labuan"},{code:"PTJ",name:"Putrajaya"}];
export const ALL_STATES = [
  ...PENINSULAR.map(s=>({...s,region:"Peninsular Malaysia"})),
  ...EAST.map(s=>({...s,region:"East Malaysia"})),
  ...FED.map(s=>({...s,region:"Federal Territory"})),
];

export const HIDDEN_GEMS = [
  {id:1,locationId:10,name:"Fairy Cave & Wind Cave",state:"Sarawak",desc:"Stunning limestone cavern with natural skylights illuminating cathedral-like formations. Adjacent Wind Cave features narrow passages and cool air currents.",grad:`linear-gradient(135deg, ${C.sunset} 0%, #c2410c 100%)`},
  {id:2,locationId:47,name:"Tasik Cermin",state:"Terengganu",desc:"Crystal-clear freshwater lake hidden inside a limestone cave. The mirrored surface reflects the cave ceiling, creating an ethereal double landscape.",grad:`linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)`},
  {id:3,locationId:41,name:"Gunung Stong Waterfall",state:"Kelantan",desc:"Malaysia's highest waterfall cascades 305m through ancient primary rainforest inside Stong State Park. Rarely visited, true wilderness solitude.",grad:`linear-gradient(135deg, ${C.forest} 0%, ${C.jungle} 100%)`},
];

//==================== LowJunFeng END - Home/State Constants ====================
//==================== WilsonChoongWeiShan Part - Activity Filter/AI Constants ====================
export const ACTIVITY_FILTERS = [
  {id:"all",label:"All",icon:"🌿"},{id:"Hiking",label:"Hiking",icon:"🥾"},
  {id:"Trail Running",label:"Trail Running",icon:"🏃"},{id:"Jogging",label:"Jogging",icon:"👟"},
  {id:"Cycling",label:"Cycling",icon:"🚴"},{id:"Swimming",label:"Swimming",icon:"🏊"},
  {id:"Diving",label:"Diving",icon:"🤿"},{id:"Rock Climbing",label:"Rock Climbing",icon:"🧗"},
  {id:"Water Sports",label:"Water Sports",icon:"🚣"},{id:"Camping",label:"Camping",icon:"⛺"},
];

export const PRESET_FILTERS = [
  {id:"Family Friendly",label:"Family Friendly",icon:"👨‍👩‍👧"},
  {id:"Beginner",label:"Beginner",icon:"🌱"},
  {id:"Advanced",label:"Advanced",icon:"⚡"},
  {id:"Pet Friendly",label:"Pet Friendly",icon:"🐾"},
];


export const AI_RESPONSES: Record<string,string> = {
  default:"I'm your SeekMY outdoor guide 🌿 Ask me about hiking, diving, cycling, camping, gear, or any Malaysian destination!",
  hiking:"For hiking in Malaysia, start with Broga Hill (Selangor) — 4.2 km, beginner-friendly, stunning sunrise. Pack: 2L water, trail shoes, SPF 50+ sunscreen, rain jacket. Start before 7 AM.",
  diving:"Malaysia has world-class dive sites! Sipadan (Sabah) is globally top-10. Perhentian and Tioman suit beginners. Minimum: Open Water certification. Always dive with a buddy.",
  cycling:"Try the Putrajaya Lake Loop (14 km, flat) or Penang Hill backroads. Wear a helmet, carry a repair kit, ride early to avoid heat.",
  camping:"Endau-Rompin National Park (Pahang) is Malaysia's best camping — ancient rainforest, waterfalls, rare wildlife. Always use a certified guide.",
  gear:"Malaysia essentials: trail shoes, quick-dry clothing, rain poncho, 2–3L water, SPF 50+ sunscreen, DEET 30%+ repellent, headlamp, basic first aid, portable charger.",
  beginner:"Best beginner spots: 🌄 Broga Hill (easy hike) · 🚴 Putrajaya Loop (flat cycling) · 🐢 Perhentian Islands (snorkeling) · 🏊 Kenyir Lake (calm swimming).",
  sipadan:"Sipadan Island, Sabah — top-10 dive sites globally. Expect hammerhead sharks, sea turtle highways, barracuda tornadoes. Open Water cert required. Book 3–6 months ahead!",
  weather:"Malaysia has two monsoon seasons: Northeast (Nov–Feb) affects east coast. Southwest (May–Sep) affects west coast. Afternoon thunderstorms are common year-round!",
};



/** Approximate GPS for map markers (Malaysia) */

//==================== WilsonChoongWeiShan END - Activity Filter/AI Constants ====================
