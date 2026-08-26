//==================== WilsonChoongWeiShan Part - Account Module - Authentication ====================
import { useState } from "react";
import { X, Mail, Lock, User as UserIcon, UserCircle, ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import type { AppUser } from "../lib/types";
import { C, F } from "../lib/tokens";
import { isValidEmail } from "../lib/helpers";
import { Pill, AlertBanner, PasswordInput } from "../components/Atoms";
import { firebaseClient, isStrongPassword, PASSWORD_REQUIREMENT } from "../api/firebaseClient";
import type { Language } from "../lib/i18n";
import { t } from "../lib/i18n";

const seekMyLogo = new URL("../../imports/logo.png", import.meta.url).toString();
const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

function firebaseProfileToAppUser(profile: any, fallbackEmail = ""): AppUser {
  const email = profile?.email || fallbackEmail;
  const displayName = profile?.full_name || profile?.displayName || email.split("@")[0] || "Explorer";
  return {
    id: profile?.id || profile?.uid || `firebase-${Date.now()}`,
    username: profile?.username || email.split("@")[0] || "explorer",
    displayName,
    email,
    password: "",
    photoUrl: profile?.photo_url || profile?.photoURL || "",
    bio: profile?.bio || "",
    joinDate: profile?.created_date?.slice?.(0, 10) || new Date().toISOString().split("T")[0],
    totalKm: Number(profile?.totalKm || profile?.total_km || 0),
    states: Number(profile?.states || 0),
    checkins: Number(profile?.checkins || 0),
    role: profile?.role === "admin" ? "admin" : "user",
    status: profile?.status,
  };
}


export function AuthModal({ onClose, onLogin, language = "en" }:{
  onClose:()=>void; onLogin:(u:AppUser, isAdmin?:boolean)=>void; language?:Language;
}) {
  type AuthTab = "signin"|"register"|"forgot";
  const [tab,setTab]           = useState<AuthTab>("signin");
  const [alert,setAlert]       = useState<{type:"success"|"error";msg:string}|null>(null);
  const [googleLoading,setGoogleLoading] = useState(false);
  const [canResendVerification,setCanResendVerification] = useState(false);
  const [resendingVerification,setResendingVerification] = useState(false);

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

  function switchTab(t:AuthTab) { setTab(t); setAlert(null); setCanResendVerification(false); }

  // 14.2.7 – 14.2.10: Login
  async function handleSignIn() {
    setAlert(null);
    setCanResendVerification(false);
    if (!siEmail || !siPass) { setAlert({type:"error",msg:"Please enter your email and password."}); return; }
    if (!isValidEmail(siEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    if (firebaseConfigured) {
      try {
        const profile = await firebaseClient.auth.loginViaEmailPassword(siEmail, siPass);
        const loggedIn = firebaseProfileToAppUser(profile, siEmail);
        onLogin(loggedIn, loggedIn.role === "admin");
        onClose();
      } catch (error: any) {
        const message = error?.message?.replace(/^Firebase:\s*/i, "") || "Unable to sign in with Firebase.";
        setCanResendVerification(/verify your email/i.test(message));
        setAlert({type:"error",msg:message});
      }
      return;
    }
    setAlert({type:"error",msg:"Firebase is not configured. Add your Firebase values to .env.local."});
  }

  async function handleGoogleSignIn() {
    setAlert(null);
    if (!firebaseConfigured) {
      setAlert({type:"error",msg:"Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local first."});
      return;
    }
    setGoogleLoading(true);
    try {
      const profile = await firebaseClient.auth.loginWithProvider();
      const loggedIn = firebaseProfileToAppUser(profile, profile?.email || "");
      onLogin(loggedIn, loggedIn.role === "admin");
      onClose();
    } catch (error: any) {
      const code = error?.code || "";
      let message = error?.message?.replace(/^Firebase:\s*/i, "") || "Unable to sign in with Google.";
      if (code === "auth/popup-closed-by-user") message = "Google sign-in was cancelled.";
      if (code === "auth/popup-blocked") message = "Your browser blocked the Google sign-in popup. Please allow popups and try again.";
      if (code === "auth/unauthorized-domain") message = "This domain is not authorized in Firebase Authentication settings.";
      if (code === "auth/operation-not-allowed") message = "Google sign-in is not enabled in Firebase Authentication.";
      setAlert({type:"error",msg:message});
    } finally {
      setGoogleLoading(false);
    }
  }

  // 14.2.1 – 14.2.6: Register
  async function handleRegister() {
    setAlert(null);
    setCanResendVerification(false);
    if (!rUsername||!rName||!rEmail||!rPass) { setAlert({type:"error",msg:"All fields are required."}); return; }
    if (rUsername.length < 3) { setAlert({type:"error",msg:"Username must be at least 3 characters."}); return; }
    if (!isValidEmail(rEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    if (!isStrongPassword(rPass)) { setAlert({type:"error",msg:PASSWORD_REQUIREMENT}); return; }
    if (firebaseConfigured) {
      try {
        await firebaseClient.auth.register({ email: rEmail, password: rPass, full_name: rName, username: rUsername });
        setAlert({type:"success",msg:"Account created. We sent a verification link to your email. Open that link before signing in."});
        setSiEmail(rEmail);
        setSiPass("");
        setRPass("");
        setTab("signin");
      } catch (error: any) {
        setAlert({type:"error",msg:error?.message?.replace(/^Firebase:\s*/i, "") || "Unable to create your Firebase account."});
      }
      return;
    }
    setAlert({type:"error",msg:"Firebase is not configured. Add your Firebase values to .env.local."});
  }

  async function handleResendVerification() {
    setAlert(null);
    if (!siEmail || !siPass) {
      setAlert({type:"error",msg:"Enter your email and password first, then resend verification."});
      return;
    }
    setResendingVerification(true);
    try {
      await firebaseClient.auth.resendVerificationEmail(siEmail, siPass);
      setAlert({type:"success",msg:"Verification email sent again. Open the link from your inbox or spam folder before signing in."});
      setCanResendVerification(false);
    } catch (error:any) {
      setAlert({type:"error",msg:error?.message?.replace(/^Firebase:\s*/i, "") || "Unable to resend verification email."});
    } finally {
      setResendingVerification(false);
    }
  }

  // 14.2.11 – 14.2.14: Forgot password
  async function handleForgot() {
    setAlert(null);
    if (!fpEmail) { setAlert({type:"error",msg:"Please enter your email address."}); return; }
    if (!isValidEmail(fpEmail)) { setAlert({type:"error",msg:"Please enter a valid email address."}); return; }
    if (firebaseConfigured) {
      try {
        await firebaseClient.auth.resetPasswordRequest(fpEmail);
        setAlert({type:"success",msg:"Firebase sent a password reset link to your email."});
      } catch (error: any) {
        setAlert({type:"error",msg:error?.message?.replace(/^Firebase:\s*/i, "") || "Unable to send the reset email."});
      }
      return;
    }
    setAlert({type:"error",msg:"Firebase is not configured. Add your Firebase values to .env.local."});
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
              {(["signin","register"] as const).map(authTab=>(
                <button key={authTab} onClick={()=>switchTab(authTab)} className="flex-1 py-2 text-sm font-bold transition-all rounded-full"
                  style={{backgroundColor:tab===authTab?C.jungle:"transparent",color:tab===authTab?"#fff":C.textMuted,fontFamily:F.body}}>
                  {authTab==="signin"?t(language, "signIn"):t(language, "register")}
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
          {tab==="signin" && canResendVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="mb-3 w-full rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-60"
              style={{backgroundColor:C.muted,color:C.forest,fontFamily:F.body}}
            >
              {resendingVerification ? "Sending verification email..." : "Resend verification email"}
            </button>
          )}

          {/* Sign In form */}
          {tab==="signin" && (
            <div className="space-y-3">
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{color:C.textMuted}}/>
                <input value={siEmail} onChange={e=>setSiEmail(e.target.value)} placeholder={t(language, "emailAddress")} type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <PasswordInput value={siPass} onChange={setSiPass} placeholder={t(language, "password")}/>
              <div className="text-right">
                <button onClick={()=>switchTab("forgot")} className="text-xs font-bold" style={{color:C.forest,fontFamily:F.body}}>{t(language, "forgotPassword")}</button>
              </div>
              <button onClick={handleSignIn} className="w-full h-[50px] rounded-full text-sm font-bold text-white active:scale-[0.96] transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                {t(language, "signIn")}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{backgroundColor:C.border}} />
                <span className="text-[11px] font-semibold" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "or")}</span>
                <div className="h-px flex-1" style={{backgroundColor:C.border}} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-[50px] rounded-full text-sm font-bold bg-white border flex items-center justify-center gap-3 active:scale-[0.96] transition-all disabled:opacity-60"
                style={{borderColor:C.border,color:C.text,fontFamily:F.body}}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.39l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"/>
                  <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.93v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.53l3.35-2.6Z"/>
                  <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.6C7.18 7.7 9.39 5.94 12 5.94Z"/>
                </svg>
                {googleLoading ? "Connecting to Google..." : t(language, "continueGoogle")}
              </button>
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
                <input value={rEmail} onChange={e=>setREmail(e.target.value)} placeholder={t(language, "emailAddress")} type="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none border" style={{borderColor:C.border,fontFamily:F.body,color:C.text}}/>
              </div>
              <PasswordInput value={rPass} onChange={setRPass} placeholder="Strong password"/>
              <button onClick={handleRegister} className="w-full h-[50px] rounded-full text-sm font-bold text-white active:scale-[0.96] transition-all" style={{backgroundColor:C.jungle,fontFamily:F.body}}>
                Create Account
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{backgroundColor:C.border}} />
                <span className="text-[11px] font-semibold" style={{color:C.textMuted,fontFamily:F.body}}>{t(language, "or")}</span>
                <div className="h-px flex-1" style={{backgroundColor:C.border}} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-[50px] rounded-full text-sm font-bold bg-white border flex items-center justify-center gap-3 active:scale-[0.96] transition-all disabled:opacity-60"
                style={{borderColor:C.border,color:C.text,fontFamily:F.body}}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.39l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"/>
                  <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.93v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.13 1.04 4.53l3.35-2.6Z"/>
                  <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.6C7.18 7.7 9.39 5.94 12 5.94Z"/>
                </svg>
                {googleLoading ? "Connecting to Google..." : t(language, "continueGoogle")}
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
//==================== WilsonChoongWeiShan END - Account Module - Authentication ====================
