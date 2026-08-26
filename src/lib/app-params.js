/** Runtime parameters retained for compatibility with the existing app shell. */
export const appParams = {
  appId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seekmy",
  token: null,
  fromUrl: typeof window !== "undefined" ? window.location.href : "",
  functionsVersion: "firebase",
  appBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
};
