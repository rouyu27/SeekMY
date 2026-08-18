// FILE PRIMARY OWNER: LOW JUN FENG | Home State Card UI
// GitHub target: feature/low-jun-feng -> Pull Request -> main
//==================== LowJunFeng Part - Home Module - State Cards ====================
import { useState } from "react";
import { FLAG_MAP } from "../components/Flags";
import { C, F } from "../lib/tokens";

const STATE_IMAGE_MAP: Record<string, string> = {
  JHR: "johor.jpg",
  KDH: "kedah.jpg",
  KTN: "kelantan.jpg",
  MLK: "melaka.jpg",
  NSN: "negeri-sembilan.jpg",
  PHG: "pahang.jpg",
  PRK: "perak.jpg",
  PLS: "perlis.jpg",
  SLG: "selangor.jpg",
  TRG: "terengganu.jpg",
  PNG: "pulau-pinang.jpg",
  SBH: "sabah.jpg",
  SWK: "sarawak.jpg",
  KL: "kuala-lumpur.jpg",
  LBN: "labuan.jpg",
  PTJ: "putrajaya.jpg",
};

export function StateFlagCard({ code, name, region, onClick, large }:{
  code:string; name:string; region:string; onClick:()=>void; large?:boolean;
}) {
  const Flag = FLAG_MAP[code];
  const [imageFailed, setImageFailed] = useState(false);
  const imageName = STATE_IMAGE_MAP[code];

  return (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-[18px] w-full group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${large?"aspect-video":"aspect-[4/3]"}`}
      style={{boxShadow:`0 2px 8px rgba(27,67,50,0.14), 0 0 0 1px rgba(27,67,50,0.06)`}}>
      {!imageFailed && imageName ? (
        <img
          src={`/state-images/${imageName}`}
          alt={`${name} state`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        Flag && <div className="absolute inset-0"><Flag /></div>
      )}
      <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(10,30,18,0.72) 0%, rgba(10,30,18,0.04) 55%, transparent 100%)"}}/>
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <p className="text-white font-bold text-sm leading-tight" style={{fontFamily:F.body,textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{name}</p>
        <p className="text-[11px] mt-0.5" style={{color:"rgba(255,255,255,0.72)",fontFamily:F.body,textShadow:"0 1px 2px rgba(0,0,0,0.4)"}}>{region}</p>
      </div>
      <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity" style={{boxShadow:`inset 0 0 0 2px ${C.amber}`}}/>
    </button>
  );
}
//==================== LowJunFeng END - Home Module - State Cards ====================
