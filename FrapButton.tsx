import { useState } from "react";
import { X, Mail, Lock, User as UserIcon, UserCircle, ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import type { MockUser } from "../lib/types";
import { C, F } from "../lib/tokens";
import { isValidEmail } from "../lib/helpers";
import { Pill, AlertBanner, PasswordInput } from "../components/Atoms";

const seekMyLogo = new URL("../../imports/logo.png", import.meta.url).toString();

export function AuthModal({ onClose, onLogin, users, setUsers }:{
  onClose:()=>void; onLogin:(u:MockUser, isAdmin?:boolean)=>void;
  users:MockUser[]; setUsers:(u:MockUser[])=>void;
}) {
  type AuthTab = "signin"|"register"|"forgot";
  const [tab,setTab]           = useState<AuthTab>("signin");
  const [alert,setAlert]       = useState<{type:"success"|"error";msg:string}|null>(null);

  // Sign in
  const [siEmail,setSiEmail]   = useState("");
  const [siPass,setSiPass]     = useState("");

  // Register
  const [rUsername,setRUsername] = useState("");
  const [rName,setRName]         = useState("");
  const [rEmail,setREmail]       = useState("");
  const [rPass,setRPass]         = useState("");

  // Forgot
  const [fpEmail,setFpEmail]   = useState("");

  function switchTab(t:AuthTab) { setTab(t); setAlert(null); }

  // 14.2.7 – 14.2.10: Login
  function handleSignIn() {
    setAlert(null);
    if (!siEmail || !siPass) { setAlert({type:"error",msg:"Please enter your email and password."}); return; }
    if (!isValidEmail(siEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    const found = users.find(u=>u.email.toLowerCase()===siEmail.toLowerCase() && u.password===siPass);
    if (!found) { setAlert({type:"error",msg:"Invalid email or password."}); return; }
    onLogin(found, found.role==="admin"); onClose();
  }

  // 14.2.1 – 14.2.6: Register
  function handleRegister() {
    setAlert(null);
    if (!rUsername||!rName||!rEmail||!rPass) { setAlert({type:"error",msg:"All fields are required."}); return; }
    if (rUsername.length < 3) { setAlert({type:"error",msg:"Username must be at least 3 characters."}); return; }
    if (!isValidEmail(rEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    if (rPass.length < 6) { setAlert({type:"error",msg:"Password must be at least 6 characters."}); return; }
    // 14.2.3 – 14.2.4
    if (users.find(u=>u.email.toLowerCase()===rEmail.toLowerCase())) {
      setAlert({type:"error",msg:"This email address is already registered."}); return;
    }
    // 14.2.5 – 14.2.6: create account
    const newUser: MockUser = {
      id: `u${Date.now()}`, username: rUsername, displayName: rName, email: rEmail, password: rPass,
      bio: "", joinDate: new Date().toISOString().split("T")[0], totalKm: 0, states: 0, checkins: 0,
      role: "user"
    };
    setUsers([...users, newUser]);
    setAlert({type:"success",msg:"Account registered successfully."});
    setTimeout(()=>{ onLogin(newUser, false); onClose(); }, 1200);
  }

  // 14.2.11 – 14.2.14: Forgot password
  function handleForgot() {
    setAlert(null);
    if (!fpEmail) { setAlert({type:"error",msg:"Please enter your email address."}); return; }
    if (!isValidEmail(fpEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    if (!users.find(u=>u.email.toLowerCase()===fpEmail.toLowerCase())) {
      setAlert({type:"error",msg:"Email address not found."}); return;
    }
    setAlert({type:"success",msg:"Password reset link has been sent to your email."});
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{backgroundColor:"rgba(10,30,18,0.60)"}} onClick={onClose}>
      <div className="bg-white rounded-[22px] w-full max-w-sm max-h-[90vh] overflow-y-auto" style={{boxShadow:"0 24px 64px rgba(27,67,50,0.28)"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between sticky top-0 bg-white rounded-t-[22px]" style={{borderBottom:`1px solid ${C.border}`}}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{borderColor:C.jungle}}>
              <ImageWithFallback src={seekMyLogo} alt="SeekMY" className="w-full h-full object-cover"/>
            </div>
            <div>
              <p className="font-bold text-sm" style={{fontFamily:F.display,color:C.text}}>SeekMY</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{color:C.textMuted,fontFamily:F.body}}>Outdoor Discovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-50"><X size={15} style={{color:C.textSub}}/></button>
        </div>

        <div className="p-5">
          {/* Tabs */}
          {tab !== "forgot" && (
            <div className="flex rounded-full overflow-hidden mb-5 p-0.5" style={{backgroundColor:C.muted}}>
              {(["signin","register"] as const).map(t=>(
                <button key={t} onClick={()=>switchTab(t)} className="flex-1 py-2 text-sm font-bold transition-all rounded-full"
                  style={{backgroundColor:tab===t?C.jungle:"transparent",color:tab===t?"#fff":C.textMuted,fontFamily:F.body}}>
                  {t==="signin"?"Sign In":"Register"}
                </button>
              ))}
            </div>
          )}

          {tab==="forgot" && (
            <div className="mb-4">
              <button onClick={()=>switchTab("signin")} className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{color:C.forest,fontFamily:F.body}}>
                <ChevronLeft size={14}/> Back to Sign In
              </button>
              <h2 className="text-xl font-normal mb-1" style={{fontFamily:F.display,color:C.text}}>Reset Password</h2>
              <p className="text-sm" style={{color:C.textMuted,fontFamily:F.body}}>Enter your email and we'll send you a reset link.</p>
            </div>
          )}

          {alert && <AlertBanner type={alert.type} message={alert.msg}/>}

          {/* Sign In form */}
          {tab==="signin" && (
            <div className="space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={siEmail} onChange={e=>setSiEmail(e.target.value)} placeholder="Email address" type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <PasswordInput value={siPass} onChange={setSiPass} placeholder="Password"/>
              <div className="text-right">
                <button onClick={()=>switchTab("forgot")} className="text-xs font-bold" style={{color:C.forest,fontFamily:F.body}}>Forgot password?</button>
              </div>
              <button onClick={handleSignIn} className="w-full h-[50px] rounded-full text-sm font-bold text-white active:scale-[0.96] transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                Sign In
              </button>
              <p className="text-center text-xs" style={{color:C.textMuted,fontFamily:F.body}}>
                Demo: <span className="font-semibold" style={{color:C.forest}}>demo@seekmy.my</span> / <span className="font-semibold" style={{color:C.forest}}>password123</span>
              </p>
            </div>
          )}

          {/* Register form */}
          {tab==="register" && (
            <div className="space-y-3">
              <div className="relative">
                <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={rUsername} onChange={e=>setRUsername(e.target.value)} placeholder="Username (min. 3 characters)"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <div className="relative">
                <UserCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={rName} onChange={e=>setRName(e.target.value)} placeholder="Full name"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={rEmail} onChange={e=>setREmail(e.target.value)} placeholder="Email address" type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <PasswordInput value={rPass} onChange={setRPass} placeholder="Password (min. 6 characters)"/>
              <button onClick={handleRegister} className="w-full h-[50px] rounded-full text-sm font-bold text-white active:scale-[0.96] transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                Create Account
              </button>
            </div>
          )}

          {/* Forgot password form */}
          {tab==="forgot" && (
            <div className="space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={fpEmail} onChange={e=>setFpEmail(e.target.value)} placeholder="Your registered email address" type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <button onClick={handleForgot} className="w-full h-[50px] rounded-full text-sm font-bold text-white active:scale-[0.96] transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                Send Reset Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

