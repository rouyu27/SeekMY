/** Firebase-backed data and authentication adapter for SeekMY. */
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, confirmPasswordReset, signOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit as take, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const primaryAdminEmail = "shanyuew416@gmail.com";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let services;
function firebase() {
  if (services) return services;
  if (Object.values(config).some((value) => !value)) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.");
  const app = getApps()[0] || initializeApp(config);
  services = { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  return services;
}
const clean = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
const sortQuery = (reference, sort, maximum) => {
  const clauses = [];
  if (sort) clauses.push(orderBy(sort.startsWith("-") ? sort.slice(1) : sort, sort.startsWith("-") ? "desc" : "asc"));
  if (maximum != null) clauses.push(take(maximum));
  return clauses.length ? query(reference, ...clauses) : reference;
};
const currentUser = () => firebase().auth.currentUser;

async function profile(user) {
  const { db } = firebase();
  const reference = doc(db, "User", user.uid);
  const existing = await getDoc(reference);
  if (!existing.exists()) {
    const role = user.email?.toLowerCase() === primaryAdminEmail ? "admin" : "user";
    await setDoc(reference, { email: user.email, full_name: user.displayName || user.email?.split("@")[0] || "Explorer", role, created_date: new Date().toISOString() });
  }
  return clean(await getDoc(reference));
}
function waitForUser() {
  const { auth } = firebase();
  return new Promise((resolve) => { const unsubscribe = onAuthStateChanged(auth, (user) => { unsubscribe(); resolve(user); }); });
}
function entity(name) {
  return {
    async list(sort, maximum) { const { db } = firebase(); const result = await getDocs(sortQuery(collection(db, name), sort, maximum)); return result.docs.map(clean); },
    async filter(filters = {}, sort, maximum) { const { db } = firebase(); const clauses = Object.entries(filters).filter(([, value]) => value !== undefined).map(([field, value]) => where(field, "==", value)); if (sort) clauses.push(orderBy(sort.startsWith("-") ? sort.slice(1) : sort, sort.startsWith("-") ? "desc" : "asc")); if (maximum != null) clauses.push(take(maximum)); const result = await getDocs(query(collection(db, name), ...clauses)); return result.docs.map(clean); },
    async get(id) { const { db } = firebase(); const result = await getDoc(doc(db, name, id)); if (!result.exists()) throw Object.assign(new Error("Not found"), { status: 404 }); return clean(result); },
    async create(data) { const user = currentUser(); if (!user) throw Object.assign(new Error("Please log in first"), { status: 401 }); const { db } = firebase(); const created = await addDoc(collection(db, name), { ...data, created_by: user.email, created_by_id: user.uid, created_date: new Date().toISOString(), updated_date: new Date().toISOString(), server_created_at: serverTimestamp() }); return clean(await getDoc(created)); },
    async update(id, data) { const { db } = firebase(); const reference = doc(db, name, id); await updateDoc(reference, { ...data, updated_date: new Date().toISOString() }); return clean(await getDoc(reference)); },
    async delete(id) { const { db } = firebase(); await deleteDoc(doc(db, name, id)); return { success: true }; },
  };
}

const auth = {
  async me() { const user = (await waitForUser()) || currentUser(); if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 }); return profile(user); },
  async isAuthenticated() { return Boolean((await waitForUser()) || currentUser()); },
  async loginViaEmailPassword(email, password) { const result = await signInWithEmailAndPassword(firebase().auth, email, password); return profile(result.user); },
  async register({ email, password, full_name }) { const result = await createUserWithEmailAndPassword(firebase().auth, email, password); if (full_name) await updateProfile(result.user, { displayName: full_name }); await profile(result.user); await sendEmailVerification(result.user); return { success: true, message: "Verification email sent" }; },
  async verifyOtp() { const user = currentUser(); if (!user) throw new Error("Please log in again after verifying your email."); await user.reload(); if (!user.emailVerified) throw new Error("Your email is not verified yet. Open the verification link, then try again."); return { user: await profile(user) }; },
  async resendOtp() { const user = currentUser(); if (!user) throw new Error("Please log in again to resend verification."); await sendEmailVerification(user); return { success: true }; },
  setToken() {},
  async loginWithProvider() { const result = await signInWithPopup(firebase().auth, new GoogleAuthProvider()); await profile(result.user); window.location.href = "/"; },
  async resetPasswordRequest(email) { await sendPasswordResetEmail(firebase().auth, email, { url: `${window.location.origin}/login` }); return { success: true }; },
  async resetPassword({ resetToken, newPassword }) { await confirmPasswordReset(firebase().auth, resetToken, newPassword); return { success: true }; },
  async updateProfile({ full_name }) { const user = currentUser(); if (!user) throw new Error("Please log in first."); await updateProfile(user, { displayName: full_name }); await updateDoc(doc(firebase().db, "User", user.uid), { full_name, updated_date: new Date().toISOString() }); return profile(user); },
  async changePassword({ oldPassword, newPassword }) { const user = currentUser(); if (!user?.email) throw new Error("Password changes are unavailable for this account."); await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPassword)); await updatePassword(user, newPassword); },
  async deleteAccount() { const user = currentUser(); if (!user) throw new Error("Please log in first."); await deleteDoc(doc(firebase().db, "User", user.uid)); await deleteUser(user); },
  async logout(redirectUrl) { await signOut(firebase().auth); if (redirectUrl) window.location.href = redirectUrl; },
  redirectToLogin() { window.location.href = "/login"; },
};

export const base44 = {
  entities: Object.fromEntries(["Location", "Review", "Bookmark", "ActivityLog", "Badge", "Contributor", "User"].map((name) => [name, entity(name)])), auth,
  functions: { async invoke(name, payload = {}) {
    if (name === "getWeather") {
      const key = import.meta.env.VITE_OPENWEATHER_API_KEY; if (!key) throw new Error("OpenWeatherMap is not configured. Add VITE_OPENWEATHER_API_KEY to .env.local.");
      const params = new URLSearchParams({ lat: payload.lat, lon: payload.lon, appid: key, units: "metric" });
      const [currentResponse, forecastResponse] = await Promise.all([fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`), fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`)]);
      if (!currentResponse.ok || !forecastResponse.ok) throw new Error("Unable to load weather. Check your OpenWeatherMap API key.");
      const current = await currentResponse.json(); const forecast = await forecastResponse.json();
      return { data: { current: { temp: Math.round(current.main.temp), feelsLike: Math.round(current.main.feels_like), desc: current.weather[0].main, descFull: current.weather[0].description, icon: current.weather[0].icon, humidity: current.main.humidity, wind: Math.round(current.wind.speed * 3.6), clouds: current.clouds.all, locationName: current.name }, forecast: forecast.list.slice(0, 8).map((item) => ({ time: new Date(item.dt * 1000).toISOString(), temp: Math.round(item.main.temp), desc: item.weather[0].main, icon: item.weather[0].icon })) } };
    }
    if (name === "searchGooglePlaces") { const locations = await entity("Location").list("name", 100); const term = (payload.query || "").toLowerCase(); return { data: { places: locations.filter((item) => !term || `${item.name} ${item.state} ${(item.activity_types || []).join(" ")}`.toLowerCase().includes(term)).slice(0, 15) } }; }
    throw new Error(`${name} requires a Firebase Cloud Function and has not been configured.`);
  } },
  integrations: { Core: { async InvokeLLM() { throw new Error("The chatbot requires a server-side Cloud Function. Do not place an AI API key in this browser app."); } } },
  storage: { async uploadActivityPhoto(file) { const user = currentUser(); if (!user) throw new Error("Please log in before uploading a photo."); const fileRef = ref(firebase().storage, `activity-photos/${user.uid}/${Date.now()}-${file.name}`); await uploadBytes(fileRef, file); return getDownloadURL(fileRef); } },
  connectors: { async connectAppUser() { throw new Error("Google Calendar integration requires a server-side OAuth flow."); } },
};

