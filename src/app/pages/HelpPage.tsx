import { useState } from "react";
import { ChevronDown, CircleHelp, CloudSun, MessageCircle, PlayCircle, ShieldCheck } from "lucide-react";
import { C, F } from "../lib/tokens";
import type { Page } from "../lib/types";
import type { Language } from "../lib/i18n";
import { t } from "../lib/i18n";

const FAQS: Record<Language, [string, string][]> = {
  en: [
    ["How do I find outdoor activities?", "Use Explore, Map, or choose a Malaysian state from Home. Filters help narrow results by activity, difficulty, budget and accessibility."],
    ["How do I log an activity?", "Open Activity Log, add the location, activity type, distance, duration and notes. Your progress is reflected in Insights and badges."],
    ["How do bookmarks work?", "Save any location from its card or detail page. Saved locations stay in the Saved page and can be organised with notes and folders."],
    ["Where do I check weather?", "Open Discover Locations, choose a location, then select the Weather tab. SeekMY combines OpenWeather conditions with official Malaysia weather data where available."],
    ["What does the AI Guide do?", "The AI Guide provides Malaysia-specific recommendations, gear checklists and safety guidance through the app interface."],
    ["What can contributors do?", "Users can submit a local contributor profile and suggest outdoor locations. Administrators can review contributor and location submissions."],
  ],
  ms: [
    ["Bagaimana saya mencari aktiviti luar?", "Gunakan Teroka, Peta, atau pilih negeri Malaysia daripada Laman Utama. Penapis membantu mengecilkan keputusan mengikut aktiviti, kesukaran, bajet dan akses."],
    ["Bagaimana saya merekod aktiviti?", "Buka Log Aktiviti, tambah lokasi, jenis aktiviti, jarak, tempoh dan nota. Kemajuan anda akan dipaparkan dalam Statistik dan lencana."],
    ["Bagaimana penanda buku berfungsi?", "Simpan mana-mana lokasi daripada kad atau halaman butiran. Lokasi disimpan berada dalam halaman Disimpan dan boleh disusun dengan nota serta folder."],
    ["Di mana saya menyemak cuaca?", "Buka Teroka Lokasi, pilih lokasi, kemudian pilih tab Cuaca. SeekMY menggabungkan keadaan OpenWeather dengan data cuaca Malaysia jika tersedia."],
    ["Apakah fungsi Panduan AI?", "Panduan AI memberi cadangan khusus Malaysia, senarai peralatan dan panduan keselamatan melalui antara muka aplikasi."],
    ["Apakah yang boleh dibuat penyumbang?", "Pengguna boleh menghantar profil penyumbang tempatan dan mencadangkan lokasi luar. Pentadbir boleh menyemak sumbangan penyumbang dan lokasi."],
  ],
  zh: [
    ["如何寻找户外活动？", "使用探索、地图，或从首页选择马来西亚州属。筛选器可按活动、难度、预算和无障碍条件缩小结果。"],
    ["如何记录活动？", "打开活动记录，添加地点、活动类型、距离、时长和备注。你的进度会显示在统计和徽章中。"],
    ["书签如何使用？", "你可以从地点卡片或详情页保存地点。已保存地点会出现在收藏页，并可用备注和文件夹整理。"],
    ["在哪里查看天气？", "打开探索地点，选择一个地点，然后进入天气标签。SeekMY 会结合 OpenWeather 条件和可用的马来西亚天气数据。"],
    ["AI 指南有什么功能？", "AI 指南会在应用内提供马来西亚地点推荐、装备清单和安全建议。"],
    ["贡献者可以做什么？", "用户可以提交本地贡献者资料并建议户外地点。管理员可以审核贡献者和地点提交。"],
  ],
};

export function HelpPage({
  setPage,
  onStartTour,
  language = "en",
}: {
  setPage: (p: Page) => void;
  onStartTour: () => void;
  language?: Language;
}) {
  const [open,setOpen]=useState(0);
  return <div className="pt-14 min-h-screen" style={{backgroundColor:C.cream}}><div className="max-w-3xl mx-auto px-5 py-8">
    <div className="rounded-[24px] p-6 md:p-8 mb-6 text-white" style={{background:`linear-gradient(135deg, ${C.jungle}, ${C.forest})`}}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CircleHelp size={30}/>
          <div>
            <h1 className="text-3xl font-normal" style={{fontFamily:F.display}}>{t(language, "help")}</h1>
            <p className="text-sm opacity-75 mt-1" style={{fontFamily:F.body}}>SeekMY · {t(language, "outdoorDiscovery")}</p>
          </div>
        </div>
        <button type="button" onClick={onStartTour} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold transition-all active:scale-95" style={{color:C.jungle,fontFamily:F.body}}>
          <PlayCircle size={16}/> {t(language, "startGuidedTour")}
        </button>
      </div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3 mb-6">{[
      {icon:<CloudSun size={18}/>,title:t(language, "weather"),text:t(language, "helpWeatherText"),page:"map" as Page},
      {icon:<MessageCircle size={18}/>,title:t(language, "aiGuide"),text:language==="ms"?"Keselamatan, peralatan dan bantuan lokasi":language==="zh"?"安全、装备和地点帮助":"Safety, gear and location help",page:"ai" as Page},
      {icon:<ShieldCheck size={18}/>,title:t(language, "contributors"),text:language==="ms"?"Sumbangan lokasi komuniti":language==="zh"?"社区地点提交":"Community location submissions",page:"contributor" as Page},
    ].map(c=><button key={c.title} onClick={()=>setPage(c.page)} className="bg-white rounded-[18px] p-4 text-left" style={{border:`1px solid ${C.border}`}}><span style={{color:C.jungle}}>{c.icon}</span><div className="text-sm font-bold mt-2" style={{color:C.text,fontFamily:F.body}}>{c.title}</div><div className="text-[11px] mt-1" style={{color:C.textMuted}}>{c.text}</div></button>)}</div>
    <div className="space-y-3">{FAQS[language].map(([q,a],i)=><div key={q} className="bg-white rounded-[18px] overflow-hidden" style={{border:`1px solid ${C.border}`}}><button onClick={()=>setOpen(open===i?-1:i)} className="w-full p-4 flex items-center justify-between gap-4 text-left"><span className="text-sm font-bold" style={{color:C.text,fontFamily:F.body}}>{q}</span><ChevronDown size={16} style={{color:C.textMuted,transform:open===i?"rotate(180deg)":"none",transition:"transform .2s"}}/></button>{open===i&&<p className="px-4 pb-4 text-sm leading-6" style={{color:C.textSub,fontFamily:F.body}}>{a}</p>}</div>)}</div>
  </div></div>;
}
