// Shared Integration Code - used by multiple SeekMY modules/members.
// Member-specific ownership is documented in MODULE_OWNERSHIP.md.
import React, { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle, CheckCircle } from "lucide-react";
import { C, F } from "../lib/tokens";

export function Pill({ children, variant="filled", small, onClick, disabled, className="" }: {
  children:React.ReactNode; variant?:"filled"|"outline"|"ghost"|"amber"|"danger";
  small?:boolean; disabled?:boolean; onClick?:()=>void; className?:string;
}) {
  const h = small ? "h-9 px-4 text-xs" : "h-[50px] px-6 text-sm";
  const base = `inline-flex items-center gap-2 rounded-full font-bold transition-all active:scale-[0.96] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${h} ${className}`;
  const styles: React.CSSProperties =
    variant==="filled"  ? {backgroundColor:C.jungle,color:"#fff",border:`1px solid ${C.jungle}`} :
    variant==="amber"   ? {backgroundColor:C.amber,color:C.jungle,border:`1px solid ${C.amber}`} :
    variant==="danger"  ? {backgroundColor:C.error,color:"#fff",border:`1px solid ${C.error}`} :
    variant==="outline" ? {backgroundColor:"transparent",color:C.jungle,border:`1px solid ${C.jungle}`} :
                          {backgroundColor:"transparent",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.35)"};
  return <button onClick={onClick} disabled={disabled} className={base} style={{fontFamily:F.body,...styles}}>{children}</button>;
}

export function SectionHead({ title }:{title:string}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-7 rounded-full" style={{backgroundColor:C.amber}}/>
      <h2 className="text-2xl font-normal" style={{fontFamily:F.display,color:C.text}}>{title}</h2>
    </div>
  );
}

// Alert banner (success or error)
export function AlertBanner({ type, message }:{type:"success"|"error"; message:string}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4" style={{backgroundColor:type==="success"?C.successBg:C.errorBg}}>
      {type==="success"
        ? <CheckCircle size={16} style={{color:C.success,flexShrink:0,marginTop:1}}/>
        : <AlertCircle size={16} style={{color:C.error,flexShrink:0,marginTop:1}}/>}
      <p className="text-sm font-semibold" style={{color:type==="success"?C.success:C.error,fontFamily:F.body}}>{message}</p>
    </div>
  );
}

// Password input with show/hide toggle
export function PasswordInput({ value, onChange, placeholder, onFocus }: {value:string; onChange:(v:string)=>void; placeholder:string; onFocus?:()=>void}) {
  const [show,setShow] = useState(false);
  return (
    <div className="relative">
      <input value={value} onFocus={onFocus} onChange={e=>onChange(e.target.value)} type={show?"text":"password"} placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
      <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{color:C.textMuted}}>
        {show ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
  );
}
