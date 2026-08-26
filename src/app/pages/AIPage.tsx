//==================== WilsonChoongWeiShan Part - AI Outdoor Assistant Chatbot ====================
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, MessageCircle, Send, Sparkles, Star, X } from "lucide-react";
import type { Location } from "../lib/types";
import { C, F } from "../lib/tokens";
import { firebaseClient } from "../api/firebaseClient";
import type { Language, TranslationKey } from "../lib/i18n";
import { activityLabel, difficultyLabel, t } from "../lib/i18n";

type MsgType = "text" | "locations" | "checklist" | "safety" | "error";
interface AIMessage {
  id: number;
  from: "user" | "bot";
  type: MsgType;
  text?: string;
  locations?: Location[];
  checklist?: { category: string; items: string[] }[];
  safetyTips?: { icon: string; title: string; tips: string[] }[];
  time: string;
}

const quickActions: { label: string; key: TranslationKey; icon: string }[] = [
  { label: "Recommend hiking spots", key: "recommendHiking", icon: "🥾" },
  { label: "Camping gear checklist", key: "campingChecklist", icon: "⛺" },
  { label: "Diving safety tips", key: "divingSafety", icon: "🤿" },
  { label: "Beginner cycling locations", key: "beginnerCycling", icon: "🚴" },
  { label: "Trail running near Selangor", key: "trailRunningSelangor", icon: "🏃" },
  { label: "Water sports recommendations", key: "waterSportsRecommendations", icon: "🚣" },
];

const checklistItems: Record<string, { category: string; items: string[] }[]> = {
  Hiking: [
    { category: "Hydration & Food", items: ["2-3L water per person", "Energy bars or trail mix", "Electrolyte sachets", "Light packed lunch"] },
    { category: "Safety", items: ["Fully charged phone", "Offline maps", "Whistle", "First aid kit", "Emergency contact plan"] },
  ],
  Camping: [
    { category: "Shelter", items: ["Tent with footprint", "Sleeping bag", "Sleeping mat", "Rain tarp"] },
    { category: "Essentials", items: ["Headlamp", "Power bank", "Insect repellent", "Waste bags", "First aid kit"] },
  ],
  Diving: [
    { category: "Documents", items: ["Dive certification card", "Dive logbook", "Insurance with dive cover"] },
    { category: "Safety", items: ["Certified operator", "Buddy check", "Dive computer", "Signal device", "Emergency plan"] },
  ],
  Cycling: [
    { category: "Bike & Safety", items: ["Helmet", "Front and rear lights", "Bell", "Repair kit", "Spare tube"] },
    { category: "Hydration", items: ["Two water bottles", "Electrolytes", "Small snacks"] },
  ],
  "Trail Running": [
    { category: "Running Gear", items: ["Trail shoes", "Running vest", "2L water capacity", "Energy gels"] },
    { category: "Safety", items: ["GPS app", "Charged phone", "Whistle", "Tell someone your route"] },
  ],
  "Water Sports": [
    { category: "Essential Safety", items: ["Life jacket", "Weather check", "Dry bag", "Whistle", "Know currents and tides"] },
  ],
};

const safetyTips = [
  { icon: "SOS", title: "Emergency Preparation", tips: ["Tell someone your route and return time", "Download offline maps", "Carry a charged power bank", "Malaysia emergency number: 999"] },
  { icon: "SUN", title: "Heat & Sun Safety", tips: ["Start before peak heat", "Drink water often", "Use SPF 50+ sunscreen", "Rest if dizzy or nauseous"] },
  { icon: "RAIN", title: "Weather Safety", tips: ["Check weather before departure", "Avoid river crossings after rain", "Carry a rain cover", "Turn back if conditions worsen"] },
];

function translatedChecklist(activity: string, language: Language) {
  if (language === "en") return checklistItems[activity] || checklistItems.Hiking;
  const zh: Record<string, { category: string; items: string[] }[]> = {
    Hiking: [
      { category: "饮水与食物", items: ["每人 2-3L 水", "能量棒或坚果", "电解质粉", "轻便午餐"] },
      { category: "安全", items: ["手机充满电", "离线地图", "哨子", "急救包", "紧急联系人计划"] },
    ],
    Camping: [
      { category: "营地装备", items: ["帐篷和地布", "睡袋", "睡垫", "防雨天幕"] },
      { category: "必备物品", items: ["头灯", "充电宝", "驱虫剂", "垃圾袋", "急救包"] },
    ],
    Diving: [
      { category: "证件", items: ["潜水证", "潜水日志", "包含潜水保障的保险"] },
      { category: "安全", items: ["认证潜水运营商", "伙伴检查", "潜水电脑", "信号设备", "紧急计划"] },
    ],
    Cycling: [
      { category: "自行车与安全", items: ["头盔", "前后车灯", "铃铛", "维修工具", "备用内胎"] },
      { category: "补水", items: ["两个水壶", "电解质", "小零食"] },
    ],
    "Trail Running": [
      { category: "跑步装备", items: ["越野跑鞋", "跑步背心", "2L 水容量", "能量胶"] },
      { category: "安全", items: ["GPS 应用", "手机充满电", "哨子", "告诉他人你的路线"] },
    ],
    "Water Sports": [
      { category: "基本安全", items: ["救生衣", "检查天气", "防水袋", "哨子", "了解水流和潮汐"] },
    ],
  };
  const ms: Record<string, { category: string; items: string[] }[]> = {
    Hiking: [
      { category: "Air & Makanan", items: ["2-3L air setiap orang", "Bar tenaga atau kacang", "Elektrolit", "Makan tengah hari ringan"] },
      { category: "Keselamatan", items: ["Telefon penuh bateri", "Peta luar talian", "Wisel", "Kit pertolongan cemas", "Pelan kontak kecemasan"] },
    ],
    Camping: [
      { category: "Tempat Berlindung", items: ["Khemah dengan alas", "Beg tidur", "Alas tidur", "Tarp hujan"] },
      { category: "Keperluan", items: ["Lampu kepala", "Power bank", "Penghalau serangga", "Beg sampah", "Kit pertolongan cemas"] },
    ],
    Diving: [
      { category: "Dokumen", items: ["Kad sijil menyelam", "Buku log menyelam", "Insurans dengan perlindungan menyelam"] },
      { category: "Keselamatan", items: ["Operator bertauliah", "Pemeriksaan buddy", "Komputer menyelam", "Alat isyarat", "Pelan kecemasan"] },
    ],
    Cycling: [
      { category: "Basikal & Keselamatan", items: ["Helmet", "Lampu depan dan belakang", "Loceng", "Kit baik pulih", "Tiub gantian"] },
      { category: "Hidrasi", items: ["Dua botol air", "Elektrolit", "Snek kecil"] },
    ],
    "Trail Running": [
      { category: "Peralatan Larian", items: ["Kasut trail", "Vest larian", "Kapasiti air 2L", "Gel tenaga"] },
      { category: "Keselamatan", items: ["Aplikasi GPS", "Telefon penuh bateri", "Wisel", "Maklumkan laluan kepada seseorang"] },
    ],
    "Water Sports": [
      { category: "Keselamatan Asas", items: ["Jaket keselamatan", "Semak cuaca", "Beg kalis air", "Wisel", "Fahami arus dan pasang surut"] },
    ],
  };
  return (language === "zh" ? zh : ms)[activity] || (language === "zh" ? zh.Hiking : ms.Hiking);
}

function translatedSafetyTips(language: Language) {
  if (language === "zh") return [
    { icon: "SOS", title: "紧急准备", tips: ["告诉他人你的路线和返回时间", "下载离线地图", "携带充满电的充电宝", "马来西亚紧急号码：999"] },
    { icon: "☀️", title: "高温与防晒安全", tips: ["避开最热时段", "经常补水", "使用 SPF 50+ 防晒", "头晕或恶心时立即休息"] },
    { icon: "🌧️", title: "天气安全", tips: ["出发前查看天气", "雨后避免过河", "携带防雨装备", "天气变差就折返"] },
  ];
  if (language === "ms") return [
    { icon: "SOS", title: "Persediaan Kecemasan", tips: ["Maklumkan laluan dan masa pulang", "Muat turun peta luar talian", "Bawa power bank penuh", "Nombor kecemasan Malaysia: 999"] },
    { icon: "☀️", title: "Keselamatan Panas & Matahari", tips: ["Elak waktu paling panas", "Minum air dengan kerap", "Gunakan SPF 50+", "Berehat jika pening atau loya"] },
    { icon: "🌧️", title: "Keselamatan Cuaca", tips: ["Semak cuaca sebelum bergerak", "Elak menyeberang sungai selepas hujan", "Bawa perlindungan hujan", "Berpatah balik jika cuaca semakin buruk"] },
  ];
  return safetyTips;
}

function now() {
  return new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

function localCopy(language: Language, key: "noLocations" | "locationsIntro" | "checklistIntro" | "safetyIntro" | "cleared" | "default", value = "") {
  const copy = {
    en: {
      noLocations: "No suitable outdoor locations found. Try a broader activity, state, or difficulty.",
      locationsIntro: `Here are ${value} matching your request:`,
      checklistIntro: `${value} equipment checklist:`,
      safetyIntro: "Here are essential safety guidelines:",
      cleared: "Chat cleared. How can I help you explore Malaysia's outdoors?",
      default: "I can help with Malaysian outdoor locations, gear checklists, safety advice and trip planning.",
    },
    ms: {
      noLocations: "Tiada lokasi luar yang sesuai ditemui. Cuba aktiviti, negeri atau tahap kesukaran yang lebih umum.",
      locationsIntro: `Ini ${value} yang sepadan dengan permintaan anda:`,
      checklistIntro: `Senarai peralatan ${value}:`,
      safetyIntro: "Berikut ialah panduan keselamatan penting:",
      cleared: "Perbualan dikosongkan. Bagaimana saya boleh bantu anda meneroka aktiviti luar Malaysia?",
      default: "Saya boleh bantu dengan lokasi luar Malaysia, senarai peralatan, nasihat keselamatan dan perancangan perjalanan.",
    },
    zh: {
      noLocations: "没有找到符合条件的户外地点。请尝试更宽泛的活动、州属或难度。",
      locationsIntro: `这里有 ${value} 个符合你要求的地点：`,
      checklistIntro: `${value}装备清单：`,
      safetyIntro: "以下是重要安全指南：",
      cleared: "聊天已清除。需要我怎样帮你探索马来西亚户外地点？",
      default: "我可以帮你查找马来西亚户外地点、准备装备清单、提供安全建议和规划行程。",
    },
  };
  return copy[language][key];
}

function detectActivity(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("camp") || text.includes("露营") || lower.includes("berkhemah")) return "Camping";
  if (lower.includes("div") || text.includes("潜水") || lower.includes("menyelam")) return "Diving";
  if (lower.includes("cycl") || lower.includes("bike") || text.includes("骑行") || lower.includes("berbasikal")) return "Cycling";
  if (lower.includes("trail run") || text.includes("越野跑") || lower.includes("larian denai")) return "Trail Running";
  if (lower.includes("water sport") || text.includes("水上") || lower.includes("sukan air")) return "Water Sports";
  if (lower.includes("hik") || text.includes("徒步") || lower.includes("mendaki")) return "Hiking";
  return "";
}

function buildAIResponse(text: string, locations: Location[], language: Language): Omit<AIMessage, "id" | "from" | "time"> {
  const activity = detectActivity(text);
  const wantsLocation = /(recommend|suggest|where|location|spot|place|trail|near|推荐|地点|cadang|lokasi)/i.test(text);
  const wantsChecklist = /(gear|equipment|checklist|pack|bring|装备|清单|peralatan|senarai)/i.test(text);
  const wantsSafety = /(safe|safety|danger|risk|warning|安全|危险|keselamatan|bahaya)/i.test(text);

  if (wantsChecklist) {
    const act = activity || "Hiking";
    return { type: "checklist", checklist: translatedChecklist(act, language), text: localCopy(language, "checklistIntro", activityLabel(language, act)) };
  }

  if (wantsSafety) {
    return { type: "safety", safetyTips: translatedSafetyTips(language), text: localCopy(language, "safetyIntro") };
  }

  if (wantsLocation || activity) {
    const matches = locations.filter((loc) => !activity || loc.activity === activity).slice(0, 4);
    if (!matches.length) return { type: "error", text: localCopy(language, "noLocations") };
    return { type: "locations", locations: matches, text: localCopy(language, "locationsIntro", String(matches.length)) };
  }

  return { type: "text", text: localCopy(language, "default") };
}

function FormattedAIText({ text }: { text: string }) {
  return <div className="whitespace-pre-line leading-6">{text}</div>;
}

export function AIPage({ locations, language = "en" }: { locations: Location[]; language?: Language }) {
  const [messages, setMessages] = useState<AIMessage[]>([{ id: 0, from: "bot", type: "text", time: now(), text: t(language, "aiGreeting") }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((current) => current.length === 1 && current[0].from === "bot" ? [{ ...current[0], text: t(language, "aiGreeting") }] : current);
  }, [language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(message?: string) {
    const clean = (message || input).trim();
    if (!clean || loading) return;
    setMessages((items) => [...items, { id: Date.now(), from: "user", type: "text", text: clean, time: now() }]);
    setInput("");
    setLoading(true);

    const localResponse = buildAIResponse(clean, locations, language);
    try {
      const aiText = await firebaseClient.integrations.Core.InvokeLLM({
        message: `${clean}\n\nReply in ${language === "ms" ? "Bahasa Malaysia" : language === "zh" ? "Chinese" : "English"}.`,
        history: messages.slice(-10).map((item) => ({ role: item.from === "user" ? "user" : "assistant", content: item.text || "" })),
        locations: locations.slice(0, 50).map((location) => ({ name: location.name, state: location.state, activity: location.activity, difficulty: location.difficulty })),
      });
      setMessages((items) => [...items, { id: Date.now() + 1, from: "bot", ...localResponse, text: aiText, time: now() }]);
    } catch {
      setMessages((items) => [...items, { id: Date.now() + 1, from: "bot", ...localResponse, time: now() }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ id: 0, from: "bot", type: "text", time: now(), text: localCopy(language, "cleared") }]);
  }

  return (
    <div className="pt-14 h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${C.jungle} 0%, #12342a 55%, #0a2318 100%)` }}>
      <div className="max-w-2xl mx-auto w-full px-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 py-5 flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center relative" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
            <MessageCircle size={20} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a2318]" style={{ backgroundColor: "#4ade80" }} />
          </div>
          <div>
            <h1 className="text-xl font-normal text-white" style={{ fontFamily: F.display }}>{t(language, "aiGuide")}</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.50)", fontFamily: F.body }}>{t(language, "aiSubtitle")}</p>
          </div>
          <button onClick={clearChat} className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold transition-all active:scale-95" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.65)", fontFamily: F.body }}>
            <X size={10} /> {t(language, "clear")}
          </button>
        </div>

        {messages.length === 1 && (
          <div className="flex-shrink-0 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: F.body }}>{t(language, "quickActions")}</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button key={action.label} onClick={() => send(t(language, action.key))} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left text-xs font-semibold transition-all active:scale-95" style={{ backgroundColor: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)", fontFamily: F.body, border: "1px solid rgba(255,255,255,0.10)" }}>
                  <span className="text-base w-10 flex-shrink-0">{action.icon}</span>
                  <span className="leading-tight">{t(language, action.key)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4" style={{ scrollbarWidth: "none" }}>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {message.from === "bot" && <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{ backgroundColor: "rgba(233,196,106,0.20)" }}><Sparkles size={13} style={{ color: C.amber }} /></div>}
              <div className={`flex flex-col gap-2 ${message.from === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                <span className="text-[10px] px-2" style={{ color: "rgba(255,255,255,0.30)", fontFamily: F.body }}>{message.time}</span>

                {(message.type === "text" || message.type === "error") && message.text && (
                  <div className="px-4 py-3 text-sm leading-relaxed" style={{ backgroundColor: message.type === "error" ? "rgba(192,57,43,0.25)" : message.from === "user" ? C.forest : "rgba(255,255,255,0.12)", color: "#fff", borderRadius: message.from === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", fontFamily: F.body }}>
                    {message.type === "error" && <AlertCircle size={15} className="inline mr-2" />}
                    <FormattedAIText text={message.text} />
                  </div>
                )}

                {message.type === "locations" && (
                  <div className="w-full max-w-sm">
                    {message.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", fontFamily: F.body }}><FormattedAIText text={message.text} /></div>}
                    <div className="flex flex-col gap-2">
                      {message.locations?.map((loc) => (
                        <div key={loc.id} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          <p className="text-sm font-bold text-white truncate" style={{ fontFamily: F.body }}>{loc.name}</p>
                          <p className="text-[11px] mb-1.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: F.body }}>{loc.state} · {activityLabel(language, loc.activity)}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(45,106,79,0.5)", color: "#fff", fontFamily: F.body }}>{difficultyLabel(language, loc.difficulty)}</span>
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.amber, fontFamily: F.body }}><Star size={9} fill={C.amber} />{loc.rating}</span>
                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)", fontFamily: F.body }}>{loc.distance} · {loc.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.type === "checklist" && (
                  <div className="w-full max-w-sm">
                    {message.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", fontFamily: F.body }}><FormattedAIText text={message.text} /></div>}
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {message.checklist?.map((cat) => (
                        <div key={cat.category} className="border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <p className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: C.amber, fontFamily: F.body }}>{cat.category}</p>
                          <div className="px-4 pb-3 flex flex-col gap-1.5">
                            {cat.items.map((item) => <span key={item} className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.80)", fontFamily: F.body }}><Check size={10} className="inline mr-2" />{item}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {message.type === "safety" && (
                  <div className="w-full max-w-sm">
                    {message.text && <div className="px-4 py-3 mb-3 text-sm rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", fontFamily: F.body }}><FormattedAIText text={message.text} /></div>}
                    <div className="flex flex-col gap-2">
                      {message.safetyTips?.map((tip) => (
                        <div key={tip.title} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                          <p className="text-sm font-bold text-white mb-2" style={{ fontFamily: F.body }}><span className="mr-2 text-[11px]" style={{ color: C.amber }}>{tip.icon}</span>{tip.title}</p>
                          {tip.tips.map((item) => <p key={item} className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontFamily: F.body }}>- {item}</p>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="px-4 py-3 rounded-2xl text-sm w-fit" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff", fontFamily: F.body }}>...</div>}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 pb-6 pt-2">
          <div className="flex gap-2 bg-white rounded-full overflow-hidden p-1.5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.30)" }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && send()} placeholder={language === "ms" ? "Tanya tentang denai, peralatan, keselamatan..." : language === "zh" ? "询问路线、装备、安全..." : "Ask about trails, gear, safety..."} className="flex-1 text-sm px-4 py-2 outline-none bg-transparent" style={{ fontFamily: F.body, color: C.text }} />
            <button onClick={() => send()} disabled={!input.trim() || loading} className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40" style={{ backgroundColor: C.jungle }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
//==================== WilsonChoongWeiShan END - AI Outdoor Assistant Chatbot ====================
